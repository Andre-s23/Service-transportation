from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session, joinedload
from app.database import get_db
from app.models import Transportation, TransportationDetail, Employee
from app.schemas import TransportationCreate
from app.dependencies import require_role, RoleEnum

router = APIRouter(prefix="/transports", tags=["Транспортировки"])

@router.get("/")
def list_transports(search: str = Query(""), db: Session = Depends(get_db), _: Employee = Depends(require_role(RoleEnum.admin, RoleEnum.manager, RoleEnum.client))):
    q = db.query(Transportation).options(joinedload(Transportation.plant), joinedload(Transportation.vehicle), joinedload(Transportation.driver))
    if search: q = q.join(Transportation.vehicle).filter(Transportation.vehicle.license_plate.ilike(f"%{search}%"))
    return [{"id": t.id, "date": t.assign_date, "plant": t.plant.name, "vehicle": t.vehicle.license_plate, "driver": t.driver.full_name} for t in q.all()]

@router.post("/", status_code=201)
def create_transport(data: TransportationCreate, db: Session = Depends(get_db), _: Employee = Depends(require_role(RoleEnum.admin, RoleEnum.manager))):
    t = Transportation(assign_date=data.assign_date, completion_date=data.completion_date, plant_id=data.plant_id, vehicle_id=data.vehicle_id, trailer_id=data.trailer_id, driver_id=data.driver_id)
    db.add(t); db.flush()
    for d in data.details: db.add(TransportationDetail(transportation_id=t.id, **d))
    db.commit()
    return {"id": t.id, "message": "Создано"}

@router.delete("/{tid}")
def delete_transport(tid: int, db: Session = Depends(get_db), _: Employee = Depends(require_role(RoleEnum.admin))):
    t = db.query(Transportation).filter(Transportation.id == tid).first()
    if not t: raise HTTPException(404, "Не найдено")
    db.delete(t); db.commit()
    return {"message": "Удалено"}