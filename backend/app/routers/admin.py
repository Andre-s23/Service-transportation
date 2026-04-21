from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Employee, Driver, RoleEnum
from app.schemas import UserCreate, UserResponse
from app.dependencies import require_role, get_password_hash

router = APIRouter(prefix="/admin", tags=["Администрирование"])


@router.post("/users", response_model=UserResponse)
def create_user(data: UserCreate, db: Session = Depends(get_db), _: Employee = Depends(require_role(RoleEnum.admin))):
    if db.query(Employee).filter(Employee.login == data.login).first():
        raise Exception("Логин уже занят")

    new_user = Employee(
        full_name=data.full_name, login=data.login,
        password_hash=get_password_hash(data.password), role=data.role,
        phone=data.phone, birth_date=data.birth_date, hire_date=data.hire_date
    )
    db.add(new_user);
    db.flush()
    if data.license_number:
        db.add(Driver(employee_id=new_user.id, license_number=data.license_number,
                      driving_experience=data.driving_experience or 0))
    db.commit();
    db.refresh(new_user)
    return new_user


@router.get("/users", response_model=list[UserResponse])
def list_users(search: str = Query(""), db: Session = Depends(get_db),
               _: Employee = Depends(require_role(RoleEnum.admin, RoleEnum.manager))):
    q = db.query(Employee)
    if search: q = q.filter(Employee.full_name.ilike(f"%{search}%") | Employee.login.ilike(f"%{search}%"))
    return q.all()