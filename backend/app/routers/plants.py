from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Plant
from app.schemas import PlantCreate, PlantUpdate, PlantResponse
from app.dependencies import require_role, RoleEnum, Employee

router = APIRouter(prefix="/plants", tags=["Заводы"])



@router.get("/", response_model=list[PlantResponse])
def list_plants(search: str = Query(""), db: Session = Depends(get_db), _: Employee = Depends(require_role(RoleEnum.admin, RoleEnum.manager, RoleEnum.client))):
    q = db.query(Plant)
    if search: q = q.filter(Plant.name.ilike(f"%{search}%") | Plant.region.ilike(f"%{search}%"))
    return q.all()

@router.get("/{pid}", response_model=PlantResponse)
def get_plant(pid: int, db: Session = Depends(get_db), _: Employee = Depends(require_role(RoleEnum.admin, RoleEnum.manager, RoleEnum.client))):
    p = db.query(Plant).filter(Plant.id == pid).first()
    if not p: raise HTTPException(404, "Завод не найден")
    return p

@router.post("/", response_model=PlantResponse, status_code=201)
def create_plant(plant: PlantCreate, db: Session = Depends(get_db), _: Employee = Depends(require_role(RoleEnum.admin, RoleEnum.manager))):
    new_p = Plant(**plant.model_dump())
    db.add(new_p); db.commit(); db.refresh(new_p)
    return new_p

@router.put("/{pid}", response_model=PlantResponse)
def update_plant(pid: int, plant: PlantUpdate, db: Session = Depends(get_db), _: Employee = Depends(require_role(RoleEnum.admin, RoleEnum.manager))):
    obj = db.query(Plant).filter(Plant.id == pid).first()
    if not obj: raise HTTPException(404, "Завод не найден")
    for k, v in plant.model_dump(exclude_unset=True).items(): setattr(obj, k, v)
    db.commit(); db.refresh(obj)
    return obj

@router.delete("/{pid}")
def delete_plant(pid: int, db: Session = Depends(get_db), _: Employee = Depends(require_role(RoleEnum.admin))):
    obj = db.query(Plant).filter(Plant.id == pid).first()
    if not obj: raise HTTPException(404, "Завод не найден")
    db.delete(obj); db.commit()
    return {"message": "Удалено"}


