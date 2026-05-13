from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Employee, Driver, RoleEnum as ModelRoleEnum
from app.schemas import EmployeeCreate, EmployeeUpdate, EmployeeResponse
from app.dependencies import require_role, verify_password, get_password_hash, get_current_user, Employee as CurrentEmployee




router = APIRouter(prefix="/employees", tags=["Сотрудники"])


@router.get("/", response_model=list[EmployeeResponse])
def list_employees(search: str = Query(""), role: str = Query(None), db: Session = Depends(get_db), _: CurrentEmployee = Depends(require_role(ModelRoleEnum.admin, ModelRoleEnum.manager))):
    q = db.query(Employee)
    if search: q = q.filter(Employee.full_name.ilike(f"%{search}%") | Employee.login.ilike(f"%{search}%"))
    if role: q = q.filter(Employee.role == role)
    result = []
    for e in q.all():
        result.append(EmployeeResponse(
            id=e.id, full_name=e.full_name, login=e.login, role=e.role,
            phone=e.phone, birth_date=e.birth_date, hire_date=e.hire_date,
            is_driver=bool(e.driver_profile), driver_profile=e.driver_profile
        ))
    return result


@router.get("/{eid}", response_model=EmployeeResponse)
def get_employee(eid: int, db: Session = Depends(get_db), _: CurrentEmployee = Depends(require_role(ModelRoleEnum.admin, ModelRoleEnum.manager))):
    e = db.query(Employee).filter(Employee.id == eid).first()
    if not e: raise HTTPException(404, "Сотрудник не найден")
    return EmployeeResponse(
        id=e.id, full_name=e.full_name, login=e.login, role=e.role,
        phone=e.phone, birth_date=e.birth_date, hire_date=e.hire_date,
        is_driver=bool(e.driver_profile), driver_profile=e.driver_profile
    )


@router.post("/", response_model=EmployeeResponse, status_code=201)
def create_employee(emp: EmployeeCreate, db: Session = Depends(get_db),
                    _: CurrentEmployee = Depends(require_role(ModelRoleEnum.admin))):
    if db.query(Employee).filter(Employee.login == emp.login).first():
        raise HTTPException(400, "Логин уже занят")

    new_emp = Employee(
        full_name=emp.full_name, login=emp.login,
        password_hash=get_password_hash(emp.password), role=emp.role,
        phone=emp.phone, birth_date=emp.birth_date, hire_date=emp.hire_date
    )
    db.add(new_emp);
    db.flush()

    if emp.license_number:
        db.add(Driver(employee_id=new_emp.id, license_number=emp.license_number,
                      driving_experience=emp.driving_experience or 0))

    db.commit();
    db.refresh(new_emp)
    return EmployeeResponse(
        id=new_emp.id, full_name=new_emp.full_name, login=new_emp.login, role=new_emp.role,
        phone=new_emp.phone, birth_date=new_emp.birth_date, hire_date=new_emp.hire_date,
        is_driver=bool(new_emp.driver_profile)
    )


@router.put("/{eid}", response_model=EmployeeResponse)
def update_employee(eid: int, emp: EmployeeUpdate, db: Session = Depends(get_db),
                    current_user: CurrentEmployee = Depends(get_current_user)):
    obj = db.query(Employee).filter(Employee.id == eid).first()
    if not obj: raise HTTPException(404, "Сотрудник не найден")
    if current_user.role != ModelRoleEnum.admin and current_user.id != obj.id:
        raise HTTPException(403, "Нет прав для редактирования чужого профиля")

    update_data = emp.model_dump(exclude_unset=True)
    if "new_password" in update_data:
        if not update_data.get("old_password"):
            raise HTTPException(400, "Необходимо указать текущий пароль")
        if not verify_password(update_data["old_password"], obj.password_hash):
            raise HTTPException(401, "Неверный текущий пароль")

        obj.password_hash = get_password_hash(update_data["new_password"])
        update_data.pop("new_password", None)
        update_data.pop("old_password", None)

    for k, v in emp.model_dump(exclude_unset=True).items():
        if k == "license_number" and obj.driver_profile:
            obj.driver_profile.license_number = v
        elif k == "driving_experience" and obj.driver_profile:
            obj.driver_profile.driving_experience = v
        elif k not in ["license_number", "driving_experience"]:
            setattr(obj, k, v)

    db.commit();
    db.refresh(obj)
    return EmployeeResponse(
        id=obj.id, full_name=obj.full_name, login=obj.login, role=obj.role,
        phone=obj.phone, birth_date=obj.birth_date, hire_date=obj.hire_date,
        is_driver=bool(obj.driver_profile)
    )


@router.delete("/{eid}")
def delete_employee(eid: int, db: Session = Depends(get_db), _: CurrentEmployee = Depends(require_role(ModelRoleEnum.admin))):
    obj = db.query(Employee).filter(Employee.id == eid).first()
    if not obj: raise HTTPException(404, "Сотрудник не найден")
    db.delete(obj); db.commit()
    return {"message": "Удалено"}



