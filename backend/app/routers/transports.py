from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session, joinedload
from app.database import get_db
from app.models import Transportation, TransportationDetail, Employee, Detail, Plant, Vehicle, Trailer
from app.schemas import TransportationCreate, TransportationUpdate, TransportationResponse
from app.dependencies import require_role, RoleEnum, Employee as CurrentEmployee, get_current_user

router = APIRouter(prefix="/transports", tags=["Транспортировки"])

@router.get("/")
def list_transports(search: str = Query(""),
                    db: Session = Depends(get_db),
                    current_user: Employee = Depends(get_current_user)):
    q = db.query(Transportation).options(joinedload(Transportation.plant),
                                         joinedload(Transportation.vehicle),
        joinedload(Transportation.trailer),
                                         joinedload(Transportation.driver),
        joinedload(Transportation.details).joinedload(TransportationDetail.detail))

    if current_user.role == RoleEnum.driver:
        q = q.filter(Transportation.driver_id == current_user.id)
    elif current_user.role == RoleEnum.client:
        pass



    if search: q = q.join(Transportation.vehicle).filter(Transportation.vehicle.license_plate.ilike(f"%{search}%"))


    result = []
    for t in q.all():
        total_items = sum(td.quantity for td in t.details)
        total_cost = sum(td.shipping_cost or 0 for td in t.details)
        result.append(TransportationResponse(
            id=t.id, assign_date=t.assign_date, completion_date=t.completion_date,
            plant_id=t.plant_id, vehicle_id=t.vehicle_id, trailer_id=t.trailer_id, driver_id=t.driver_id,
            plant_name=t.plant.name, vehicle_plate=t.vehicle.license_plate,
            trailer_plate=t.trailer.license_plate if t.trailer else None,
            driver_name=t.driver.full_name, total_items=total_items, total_cost=total_cost
        ))
    return result


@router.get("/{tid}", response_model=TransportationResponse)
def get_transport(tid: int, db: Session = Depends(get_db),
                  _: CurrentEmployee = Depends(require_role(RoleEnum.admin, RoleEnum.manager, RoleEnum.client))):
    t = db.query(Transportation).options(
        joinedload(Transportation.plant), joinedload(Transportation.vehicle),
        joinedload(Transportation.trailer), joinedload(Transportation.driver),
        joinedload(Transportation.details).joinedload(TransportationDetail.detail)
    ).filter(Transportation.id == tid).first()
    if not t: raise HTTPException(404, "Транспортировка не найдена")

    total_items = sum(td.quantity for td in t.details)
    total_cost = sum(td.shipping_cost or 0 for td in t.details)
    return TransportationResponse(
        id=t.id, assign_date=t.assign_date, completion_date=t.completion_date,
        plant_id=t.plant_id, vehicle_id=t.vehicle_id, trailer_id=t.trailer_id, driver_id=t.driver_id,
        plant_name=t.plant.name, vehicle_plate=t.vehicle.license_plate,
        trailer_plate=t.trailer.license_plate if t.trailer else None,
        driver_name=t.driver.full_name, total_items=total_items, total_cost=total_cost
    )


@router.post("/", response_model=TransportationResponse, status_code=201)
def create_transport(transport: TransportationCreate, db: Session = Depends(get_db),
                     _: CurrentEmployee = Depends(require_role(RoleEnum.admin, RoleEnum.manager))):
    # # Проверка существования связанных записей
    # for check_id, model, name in [
    #     (transport.plant_id, "Plant", "Завод"),
    #     (transport.vehicle_id, "Vehicle", "Автомобиль"),
    #     (transport.driver_id, "Employee", "Водитель")
    # ]:
    #     if not db.query(eval(model)).filter(eval(model).id == check_id).first():
    #         raise HTTPException(404, f"{name} не найден")

    # if transport.trailer_id and not db.query("Trailer").filter(id=transport.trailer_id).first():
    #     raise HTTPException(404, "Прицеп не найден")

    if not db.query(Plant).filter(Plant.id == transport.plant_id).first():
        raise HTTPException(404, "Завод не найден")
    if not db.query(Vehicle).filter(Vehicle.id == transport.vehicle_id).first():
        raise HTTPException(404, "Автомобиль не найден")
    if not db.query(Employee).filter(Employee.id == transport.driver_id).first():
        raise HTTPException(404, "Водитель не найден")
    if transport.trailer_id and not db.query(Trailer).filter(Trailer.id == transport.trailer_id).first():
        raise HTTPException(404, "Прицеп не найден")



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
    if not obj: raise HTTPException(404, "Транспортировка не найдена")

    for k, v in transport.model_dump(exclude_unset=True).items():
        setattr(obj, k, v)

    db.commit();
    db.refresh(obj)
    return get_transport(obj.id, db, _)


@router.delete("/{tid}")
def delete_transport(tid: int, db: Session = Depends(get_db),
                     _: CurrentEmployee = Depends(require_role(RoleEnum.admin))):
    obj = db.query(Transportation).filter(Transportation.id == tid).first()
    if not obj: raise HTTPException(404, "Транспортировка не найдена")
    db.delete(obj);
    db.commit()
    return {"message": "Удалено"}