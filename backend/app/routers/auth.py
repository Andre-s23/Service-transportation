from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Employee
from app.schemas import LoginRequest
from app.dependencies import verify_password, get_current_user

router = APIRouter(prefix="/auth", tags=["Аутентификация"])

@router.post("/login")
def login(data: LoginRequest, request: Request, db: Session = Depends(get_db)):
    user = db.query(Employee).filter(Employee.login == data.login).first()
    if not user or not verify_password(data.password, user.password_hash):
        raise Exception("Неверный логин или пароль")
    request.session["user_id"] = user.id
    return {"status": "ok", "role": user.role}

@router.post("/logout")
def logout(request: Request, user: Employee = Depends(get_current_user)):
    request.session.clear()
    return {"status": "ok"}

@router.get("/me")
def get_me(user: Employee = Depends(get_current_user)):
    return {"id": user.id, "login": user.login, "full_name": user.full_name, "role": user.role}