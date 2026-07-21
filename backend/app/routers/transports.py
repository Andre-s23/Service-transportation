from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session, joinedload
from app.database import get_db
from app.models import Transportation, TransportationDetail, Employee, Detail, Plant, Vehicle, Trailer
from app.schemas import TransportationCreate, TransportationUpdate, TransportationResponse
from app.dependencies import require_role, RoleEnum, Employee as CurrentEmployee, get_current_user
from datetime import date
from typing import Optional


def check_vehicle_driver_conflict(db: Session, vehicle_id: int, driver_id: int,
                                  assign_date: date, completion_date: Optional[date],
                                  exclude_transport_id: Optional[int] = None) -> Optional[str]:
    end_date = completion_date or assign_date

    q = db.query(Transportation).filter(
        ((Transportation.vehicle_id == vehicle_id) |
         (Transportation.driver_id == driver_id)),

        (Transportation.id != exclude_transport_id) if exclude_transport_id else True,
        Transportation.assign_date <= end_date,
        (Transportation.completion_date >= assign_date) | (Transportation.completion_date == None)
    )

    conflict = q.first()
    if conflict:
        if conflict.vehicle_id == vehicle_id and conflict.driver_id == driver_id:
            return f"Автомобиль и водитель уже заняты в рейсе"
        elif conflict.vehicle_id == vehicle_id:
            return f"Автомобиль уже занят в рейсе"
        else:
            return f"Водитель уже занят в рейсе"

    return None


def check_detail_min_quantity(db: Session, details_list) -> Optional[str]:
    for item in details_list:
        detail = db.query(Detail).filter(Detail.id == item.detail_id).first()
        if not detail:
            return f"Деталь ID {item.detail_id} не найдена в справочнике"
        if detail.current_stock - detail.min_stock <= 0:
            return f"Деталь «{detail.name}»: запасы меньше минимального остатка"
        if item.quantity > detail.current_stock - detail.min_stock:
            return f"Деталь «{detail.name}»: недостаточное количество на складе"
    return None


router = APIRouter(prefix="/transports", tags=["Транспортировки"])


@router.get("/")
def list_transports(search: str = Query(""),
                    db: Session = Depends(get_db),
                    current_user: Employee = Depends(get_current_user)):
    q = db.query(Transportation).options(
        joinedload(Transportation.plant),
        joinedload(Transportation.vehicle),
        joinedload(Transportation.trailer),
        joinedload(Transportation.driver),
        joinedload(Transportation.details)
        .joinedload(TransportationDetail.detail)
        .joinedload(Detail.warehouse)
    )

    if current_user.role == RoleEnum.driver:
        q = q.filter(Transportation.driver_id == current_user.id)

    if search:
        q = q.join(Vehicle).filter(Vehicle.license_plate.ilike(f"%{search}%"))

    result = []
    for t in q.all():
        details_list = []
        for td in t.details:
            wh = td.detail.warehouse
            details_list.append({
                "detail_id": td.detail.id,
                "detail_name": td.detail.name,
                "base_price": td.detail.base_price,
                "quantity": td.quantity,
                "shipping_cost": td.shipping_cost or 0,
                "warehouse_name": wh.name if wh else None
            })


        first_wh = details_list[0]["warehouse_name"] if details_list else None

        total_items = sum(d["quantity"] for d in details_list)
        total_cost = sum(d["shipping_cost"] for d in details_list)

        result.append(TransportationResponse(
            id=t.id, assign_date=t.assign_date, completion_date=t.completion_date,
            plant_id=t.plant_id, vehicle_id=t.vehicle_id, trailer_id=t.trailer_id, driver_id=t.driver_id,
            plant_name=t.plant.name, vehicle_plate=t.vehicle.license_plate,
            trailer_plate=t.trailer.license_plate if t.trailer else None,
            driver_name=t.driver.full_name, total_items=total_items, total_cost=total_cost,
            details=details_list,
            warehouse_name=first_wh,
            warehouse_address=None,
            warehouse_phone=None
        ))
    return result


@router.get("/{tid}", response_model=TransportationResponse)
def get_transport(tid: int, db: Session = Depends(get_db),
                  _: CurrentEmployee = Depends(require_role(RoleEnum.admin, RoleEnum.manager))):
    t = db.query(Transportation).options(
        joinedload(Transportation.plant), joinedload(Transportation.vehicle),
        joinedload(Transportation.trailer), joinedload(Transportation.driver),
        joinedload(Transportation.details)
        .joinedload(TransportationDetail.detail)
        .joinedload(Detail.warehouse)
    ).filter(Transportation.id == tid).first()

    if not t: raise HTTPException(404, "Транспортировка не найдена")

    details_list = []
    for td in t.details:
        wh = td.detail.warehouse
        details_list.append({
            "detail_id": td.detail.id,
            "detail_name": td.detail.name,
            "base_price": td.detail.base_price,
            "quantity": td.quantity,
            "shipping_cost": td.shipping_cost or 0,
            "warehouse_name": wh.name if wh else None
        })

    first_wh = details_list[0]["warehouse_name"] if details_list else None
    total_items = sum(d["quantity"] for d in details_list)
    total_cost = sum(d["shipping_cost"] for d in details_list)

    return TransportationResponse(
        id=t.id, assign_date=t.assign_date, completion_date=t.completion_date,
        plant_id=t.plant_id, vehicle_id=t.vehicle_id, trailer_id=t.trailer_id, driver_id=t.driver_id,
        plant_name=t.plant.name, vehicle_plate=t.vehicle.license_plate,
        trailer_plate=t.trailer.license_plate if t.trailer else None,
        driver_name=t.driver.full_name, total_items=total_items, total_cost=total_cost,
        details=details_list,
        warehouse_name=first_wh,
        warehouse_address=None,
        warehouse_phone=None
    )


@router.post("/", response_model=TransportationResponse, status_code=201)
def create_transport(transport: TransportationCreate, db: Session = Depends(get_db),
                     _: CurrentEmployee = Depends(require_role(RoleEnum.admin, RoleEnum.manager))):


    if not db.query(Plant).filter(Plant.id == transport.plant_id).first():
        raise HTTPException(404, "Завод не найден")
    if not db.query(Vehicle).filter(Vehicle.id == transport.vehicle_id).first():
        raise HTTPException(404, "Автомобиль не найден")
    if not db.query(Employee).filter(Employee.id == transport.driver_id).first():
        raise HTTPException(404, "Водитель не найден")
    if transport.trailer_id and not db.query(Trailer).filter(Trailer.id == transport.trailer_id).first():
        raise HTTPException(404, "Прицеп не найден")

    conflict = check_vehicle_driver_conflict(
        db, transport.vehicle_id, transport.driver_id,
        transport.assign_date, transport.completion_date
    )
    if conflict:
        raise HTTPException(409, conflict)

    stock_error = check_detail_min_quantity(db, transport.details)
    if stock_error:
        raise HTTPException(400, stock_error)

    new_t = Transportation(
        assign_date=transport.assign_date, completion_date=transport.completion_date,
        plant_id=transport.plant_id, vehicle_id=transport.vehicle_id,
        trailer_id=transport.trailer_id, driver_id=transport.driver_id
    )
    db.add(new_t);
    db.flush()

    for item in transport.details:
        if not db.query(Detail).filter(Detail.id == item.detail_id).first():
            raise HTTPException(404, f"Деталь {item.detail_id} не найдена")
        db.add(TransportationDetail(
            transportation_id=new_t.id, detail_id=item.detail_id,
            quantity=item.quantity, shipping_cost=item.shipping_cost
        ))

    db.commit();
    db.refresh(new_t)
    return get_transport(new_t.id, db, _)


@router.put("/{tid}", response_model=TransportationResponse)
def update_transport(tid: int, transport: TransportationUpdate, db: Session = Depends(get_db),
                     _: CurrentEmployee = Depends(require_role(RoleEnum.admin, RoleEnum.manager))):
    obj = db.query(Transportation).filter(Transportation.id == tid).first()
    if not obj:
        raise HTTPException(404, "Транспортировка не найдена")

    update_data = transport.model_dump(exclude_unset=True)
    update_data = transport.model_dump(exclude_unset=True)
    if any(k in update_data for k in ["vehicle_id", "driver_id", "assign_date", "completion_date"]):
        conflict = check_vehicle_driver_conflict(
            db=db,
            vehicle_id=getattr(transport, "vehicle_id", obj.vehicle_id),
            driver_id=getattr(transport, "driver_id", obj.driver_id),
            assign_date=getattr(transport, "assign_date", obj.assign_date),
            completion_date=getattr(transport, "completion_date", obj.completion_date),
            exclude_transport_id=tid
        )
        if conflict:
            raise HTTPException(409, conflict)


    for k, v in update_data.items():
        if k != "details":
            setattr(obj, k, v)
    if "details" in update_data and transport.details is not None:

        stock_error = check_detail_min_quantity(db, transport.details)
        if stock_error:
            raise HTTPException(400, stock_error)

        db.query(TransportationDetail).filter(
            TransportationDetail.transportation_id == obj.id
        ).delete()

        for item in transport.details:
            if not db.query(Detail).filter(Detail.id == item.detail_id).first():
                raise HTTPException(404, f"Деталь {item.detail_id} не найдена")

            db.add(TransportationDetail(
                transportation_id=obj.id,
                detail_id=item.detail_id,
                quantity=item.quantity,
                shipping_cost=item.shipping_cost
            ))

    db.commit()
    db.refresh(obj)
    return get_transport(obj.id, db, _)


@router.delete("/{tid}")
def delete_transport(tid: int, db: Session = Depends(get_db),
                     _: CurrentEmployee = Depends(require_role(RoleEnum.admin))):
    obj = db.query(Transportation).filter(Transportation.id == tid).first()
    if not obj: raise HTTPException(404, "Транспортировка не найдена")
    db.query(TransportationDetail).filter(
        TransportationDetail.transportation_id == tid
    ).delete()

    db.delete(obj);
    db.commit()
    return {"message": "Удалено"}
