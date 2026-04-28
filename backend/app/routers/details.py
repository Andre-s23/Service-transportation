from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session, joinedload
from app.database import get_db
from app.models import Detail, Warehouse
from app.schemas import DetailCreate, DetailUpdate, DetailResponse
from app.dependencies import require_role, RoleEnum, Employee



router = APIRouter(prefix="/details", tags=["Детали"])

@router.get("/", response_model=list[DetailResponse])
def list_details(search: str = Query(""), warehouse_id: int = Query(None), db: Session = Depends(get_db), _: Employee = Depends(require_role(RoleEnum.admin, RoleEnum.manager, RoleEnum.client))):
    q = db.query(Detail).join(Detail.warehouse).options(joinedload(Detail.warehouse))
    if search: q = q.filter(Detail.name.ilike(f"%{search}%"))
    if warehouse_id: q = q.filter(Detail.warehouse_id == warehouse_id)
    result = []
    for d in q.all():
        result.append(DetailResponse(
            id=d.id, name=d.name, base_price=d.base_price, min_stock=d.min_stock,
            is_fragile=d.is_fragile, warehouse_id=d.warehouse_id, warehouse_name=d.warehouse.name
        ))
    return result


@router.get("/{did}", response_model=DetailResponse)
def get_detail(did: int, db: Session = Depends(get_db), _: Employee = Depends(require_role(RoleEnum.admin, RoleEnum.manager, RoleEnum.client))):
    d = db.query(Detail).filter(Detail.id == did).first()
    if not d: raise HTTPException(404, "Деталь не найдена")
    return DetailResponse(**d.__dict__, warehouse_name=d.warehouse.name)

@router.post("/", response_model=DetailResponse, status_code=201)
def create_detail(detail: DetailCreate, db: Session = Depends(get_db), _: Employee = Depends(require_role(RoleEnum.admin, RoleEnum.manager))):
    if not db.query(Warehouse).filter(Warehouse.id == detail.warehouse_id).first():
        raise HTTPException(404, "Склад не найден")
    new_d = Detail(**detail.model_dump())
    db.add(new_d); db.commit(); db.refresh(new_d)
    return DetailResponse(**new_d.__dict__, warehouse_name=new_d.warehouse.name)

@router.put("/{did}", response_model=DetailResponse)
def update_detail(did: int, detail: DetailUpdate, db: Session = Depends(get_db), _: Employee = Depends(require_role(RoleEnum.admin, RoleEnum.manager))):
    obj = db.query(Detail).filter(Detail.id == did).first()
    if not obj: raise HTTPException(404, "Деталь не найдена")
    for k, v in detail.model_dump(exclude_unset=True).items(): setattr(obj, k, v)
    db.commit(); db.refresh(obj)
    return DetailResponse(**obj.__dict__, warehouse_name=obj.warehouse.name)

@router.delete("/{did}")
def delete_detail(did: int, db: Session = Depends(get_db), _: Employee = Depends(require_role(RoleEnum.admin))):
    obj = db.query(Detail).filter(Detail.id == did).first()
    if not obj: raise HTTPException(404, "Деталь не найдена")
    db.delete(obj); db.commit()
    return {"message": "Удалено"}