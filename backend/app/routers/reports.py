from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import get_db
from app.dependencies import require_role, RoleEnum, Employee as CurrentEmployee

router = APIRouter(prefix="/reports", tags=["Отчеты и аналитика"])



@router.get("/low-stock")
def low_stock_report(db: Session = Depends(get_db), _: CurrentEmployee = Depends(require_role(RoleEnum.admin, RoleEnum.manager))):
    query = text("""
        SELECT id, name, current_stock, min_stock, warehouse_id
        FROM details
        WHERE current_stock < min_stock
          AND warehouse_id IN (
            SELECT id FROM warehouses ORDER BY name LIMIT 3 OFFSET 0
          )
        ORDER BY current_stock ASC
    """)
    return db.execute(query).mappings().all()


@router.get("/delivery-by-month")
def delivery_by_month(start_date: str = Query(None), end_date: str = Query(None), db: Session = Depends(get_db)):
    where_clause, params = "", {}
    if start_date: where_clause += " AND t.assign_date >= :start_date"; params["start_date"] = start_date
    if end_date:   where_clause += " AND t.assign_date <= :end_date";   params["end_date"] = end_date

    query = text(f"""
        SELECT
            EXTRACT(MONTH FROM t.assign_date)::int as month,
            SUM(td.quantity * td.shipping_cost) as total_delivery_cost
        FROM transportations t
        JOIN transportation_details td ON t.id = td.transportation_id
        WHERE 1=1 {where_clause}
          AND EXTRACT(MONTH FROM t.assign_date) IN (
            SELECT EXTRACT(MONTH FROM assign_date)
            FROM transportations
            GROUP BY EXTRACT(MONTH FROM assign_date)
            ORDER BY COUNT(*) DESC
            LIMIT 5 OFFSET 0
          )
        GROUP BY month
        ORDER BY total_delivery_cost DESC
    """)

    res = db.execute(query, params).mappings().all()
    return res


@router.get("/dashboard")
def dashboard(db: Session = Depends(get_db),
              _: CurrentEmployee = Depends(require_role(RoleEnum.admin, RoleEnum.manager))):
    q1 = text("""
        SELECT DISTINCT p.name, COUNT(t.id) as trips
        FROM plants p
        JOIN transportations t ON p.id = t.plant_id
        GROUP BY p.id, p.name
        ORDER BY trips DESC
        LIMIT 5
    """)
    res = db.execute(q1).mappings().all()
    return res





@router.get("/trips-by-month")
def trips_by_month(start_date: str = Query(None), end_date: str = Query(None), db: Session = Depends(get_db)):
    where_clause, params = "", {}
    if start_date: where_clause += " AND assign_date >= :start_date"; params["start_date"] = start_date
    if end_date:   where_clause += " AND assign_date <= :end_date";   params["end_date"] = end_date

    query = text(f"""
        SELECT 
            EXTRACT(MONTH FROM assign_date)::int as month,
            COUNT(*) as trip_count
        FROM transportations
        WHERE 1=1 {where_clause}
        GROUP BY month
        ORDER BY month
    """)
    return db.execute(query, params).mappings().all()



@router.get("/top-drivers")
def top_drivers(start_date: str = Query(None), end_date: str = Query(None), db: Session = Depends(get_db)):
    where_clause, params = "", {}
    if start_date: where_clause += " AND t.assign_date >= :start_date"; params["start_date"] = start_date
    if end_date:   where_clause += " AND t.assign_date <= :end_date";   params["end_date"] = end_date

    query = text(f"""
        SELECT e.full_name, COUNT(t.id) as trip_count
        FROM employees e
        JOIN transportations t ON e.id = t.driver_id
        WHERE e.role = 'driver' {where_clause}
        GROUP BY e.id, e.full_name
        ORDER BY trip_count DESC
    """)
    return db.execute(query, params).mappings().all()