from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import get_db
from app.models import Employee
from app.dependencies import require_role, RoleEnum

router = APIRouter(prefix="/reports", tags=["Отчеты и аналитика"])

@router.get("/table-report")
def table_report(db: Session = Depends(get_db), _: Employee = Depends(require_role(RoleEnum.admin, RoleEnum.manager))):
    return db.execute(text("SELECT id, brand, license_plate, tonnage FROM vehicles WHERE is_serviceable = true ORDER BY id")).mappings().all()

@router.get("/parameterized-report")
def parameterized_report(warehouse_id: int = Query(...), db: Session = Depends(get_db)):
    res = db.execute(text("SELECT d.id, d.name, d.base_price FROM details d WHERE d.warehouse_id = :wid ORDER BY d.name"), {"wid": warehouse_id}).mappings().all()
    return {"message": "Данных нет"} if not res else res

@router.get("/dashboard")
def dashboard(db: Session = Depends(get_db), _: Employee = Depends(require_role(RoleEnum.admin, RoleEnum.manager))):
    q1 = text("SELECT DISTINCT ON (p.name) p.name, COUNT(t.id) as cnt FROM plants p JOIN transportations t ON p.id = t.plant_id GROUP BY p.name, t.id ORDER BY p.name, cnt DESC LIMIT 5")
    q2 = text("SELECT v.license_plate, SUM(td.quantity) as total FROM vehicles v JOIN transportations t ON v.id = t.vehicle_id JOIN transportation_details td ON t.id = td.transportation_id GROUP BY v.license_plate ORDER BY total DESC LIMIT 10 OFFSET 0")
    q3 = text("SELECT e.full_name, COUNT(t.id) as trips FROM employees e JOIN transportations t ON e.id = t.driver_id WHERE e.role = 'manager' GROUP BY e.full_name ORDER BY trips DESC LIMIT 3 OFFSET 0")
    return {"top_plants": db.execute(q1).mappings().all(), "load": db.execute(q2).mappings().all(), "managers": db.execute(q3).mappings().all()}

@router.get("/chart-data")
def chart_data(db: Session = Depends(get_db)):
    return db.execute(text("SELECT EXTRACT(MONTH FROM assign_date)::int as month, COUNT(*) as cnt FROM transportations GROUP BY month ORDER BY month")).mappings().all()