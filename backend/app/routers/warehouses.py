from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Warehouse
from app.schemas import WarehouseCreate, WarehouseUpdate, WarehouseResponse
from app.dependencies import require_role, RoleEnum, Employee


router = APIRouter(prefix="/warehouses", tags=["Склады"])

@router.get("/", response_model=list[WarehouseResponse])
def list_warehouses(search: str = Query(""), db: Session = Depends(get_db), _: Employee = Depends(require_role(RoleEnum.admin, RoleEnum.manager, RoleEnum.client))):
    q = db.query(Warehouse)
    if search: q = q.filter(Warehouse.name.ilike(f"%{search}%") | Warehouse.region.ilike(f"%{search}%"))
    return q.all()

@router.get("/{wid}", response_model=WarehouseResponse)
def get_warehouse(wid: int, db: Session = Depends(get_db), _: Employee = Depends(require_role(RoleEnum.admin, RoleEnum.manager, RoleEnum.client))):
    wh = db.query(Warehouse).filter(Warehouse.id == wid).first()
    if not wh: raise HTTPException(404, "Склад не найден")
    return wh

@router.post("/", response_model=WarehouseResponse, status_code=201)
def create_warehouse(wh: WarehouseCreate, db: Session = Depends(get_db), _: Employee = Depends(require_role(RoleEnum.admin, RoleEnum.manager))):
    new_wh = Warehouse(**wh.model_dump())
    db.add(new_wh); db.commit(); db.refresh(new_wh)
    return new_wh

@router.put("/{wid}", response_model=WarehouseResponse)
def update_warehouse(wid: int, wh: WarehouseUpdate, db: Session = Depends(get_db), _: Employee = Depends(require_role(RoleEnum.admin, RoleEnum.manager))):
    obj = db.query(Warehouse).filter(Warehouse.id == wid).first()
    if not obj: raise HTTPException(404, "Склад не найден")
    for k, v in wh.model_dump(exclude_unset=True).items(): setattr(obj, k, v)
    db.commit(); db.refresh(obj)
    return obj

@router.delete("/{wid}")
def delete_warehouse(wid: int, db: Session = Depends(get_db), _: Employee = Depends(require_role(RoleEnum.admin))):
    obj = db.query(Warehouse).filter(Warehouse.id == wid).first()
    if not obj: raise HTTPException(404, "Склад не найден")
    db.delete(obj); db.commit()
    return {"message": "Удалено"}

