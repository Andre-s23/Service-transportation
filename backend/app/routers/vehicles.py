from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Vehicle
from app.schemas import VehicleCreate, VehicleUpdate, VehicleResponse
from app.dependencies import require_role, RoleEnum, Employee


router = APIRouter(prefix="/vehicles", tags=["Автомобили"])


@router.get("/", response_model=list[VehicleResponse])
def list_vehicles(search: str = Query(""), serviceable_only: bool = Query(False), db: Session = Depends(get_db), _: Employee = Depends(require_role(RoleEnum.admin, RoleEnum.manager))):
    q = db.query(Vehicle)
    if search: q = q.filter(Vehicle.brand.ilike(f"%{search}%") | Vehicle.license_plate.ilike(f"%{search}%"))
    if serviceable_only: q = q.filter(Vehicle.is_serviceable == True)
    return q.all()

@router.get("/{vid}", response_model=VehicleResponse)
def get_vehicle(vid: int, db: Session = Depends(get_db), _: Employee = Depends(require_role(RoleEnum.admin, RoleEnum.manager))):
    v = db.query(Vehicle).filter(Vehicle.id == vid).first()
    if not v: raise HTTPException(404, "Автомобиль не найден")
    return v

@router.post("/", response_model=VehicleResponse, status_code=201)
def create_vehicle(vehicle: VehicleCreate, db: Session = Depends(get_db), _: Employee = Depends(require_role(RoleEnum.admin, RoleEnum.manager))):
    if db.query(Vehicle).filter(Vehicle.license_plate == vehicle.license_plate).first():
        raise HTTPException(400, "Госномер уже занят")
    new_v = Vehicle(**vehicle.model_dump())
    db.add(new_v); db.commit(); db.refresh(new_v)
    return new_v

@router.put("/{vid}", response_model=VehicleResponse)
def update_vehicle(vid: int, vehicle: VehicleUpdate, db: Session = Depends(get_db), _: Employee = Depends(require_role(RoleEnum.admin, RoleEnum.manager))):
    obj = db.query(Vehicle).filter(Vehicle.id == vid).first()
    if not obj: raise HTTPException(404, "Автомобиль не найден")
    for k, v in vehicle.model_dump(exclude_unset=True).items(): setattr(obj, k, v)
    db.commit(); db.refresh(obj)
    return obj

@router.delete("/{vid}")
def delete_vehicle(vid: int, db: Session = Depends(get_db), _: Employee = Depends(require_role(RoleEnum.admin))):
    obj = db.query(Vehicle).filter(Vehicle.id == vid).first()
    if not obj: raise HTTPException(404, "Автомобиль не найден")
    db.delete(obj); db.commit()
    return {"message": "Удалено"}


