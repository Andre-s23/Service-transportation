from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Trailer
from app.schemas import TrailerCreate, TrailerUpdate, TrailerResponse
from app.dependencies import require_role, RoleEnum, Employee


router = APIRouter(prefix="/trailers", tags=["Прицепы"])

@router.get("/", response_model=list[TrailerResponse])
def list_trailers(search: str = Query(""), serviceable_only: bool = Query(False), db: Session = Depends(get_db), _: Employee = Depends(require_role(RoleEnum.admin, RoleEnum.manager, RoleEnum.client))):
    q = db.query(Trailer)
    if search: q = q.filter(Trailer.brand.ilike(f"%{search}%") | Trailer.license_plate.ilike(f"%{search}%"))
    if serviceable_only: q = q.filter(Trailer.is_serviceable == True)
    return q.all()

@router.get("/{tid}", response_model=TrailerResponse)
def get_trailer(tid: int, db: Session = Depends(get_db), _: Employee = Depends(require_role(RoleEnum.admin, RoleEnum.manager, RoleEnum.client))):
    t = db.query(Trailer).filter(Trailer.id == tid).first()
    if not t: raise HTTPException(404, "Прицеп не найден")
    return t

@router.post("/", response_model=TrailerResponse, status_code=201)
def create_trailer(trailer: TrailerCreate, db: Session = Depends(get_db), _: Employee = Depends(require_role(RoleEnum.admin, RoleEnum.manager))):
    if db.query(Trailer).filter(Trailer.license_plate == trailer.license_plate).first():
        raise HTTPException(400, "Госномер уже занят")
    new_t = Trailer(**trailer.model_dump())
    db.add(new_t); db.commit(); db.refresh(new_t)
    return new_t

@router.put("/{tid}", response_model=TrailerResponse)
def update_trailer(tid: int, trailer: TrailerUpdate, db: Session = Depends(get_db), _: Employee = Depends(require_role(RoleEnum.admin, RoleEnum.manager))):
    obj = db.query(Trailer).filter(Trailer.id == tid).first()
    if not obj: raise HTTPException(404, "Прицеп не найден")
    for k, v in trailer.model_dump(exclude_unset=True).items(): setattr(obj, k, v)
    db.commit(); db.refresh(obj)
    return obj

@router.delete("/{tid}")
def delete_trailer(tid: int, db: Session = Depends(get_db), _: Employee = Depends(require_role(RoleEnum.admin))):
    obj = db.query(Trailer).filter(Trailer.id == tid).first()
    if not obj: raise HTTPException(404, "Прицеп не найден")
    db.delete(obj); db.commit()
    return {"message": "Удалено"}

