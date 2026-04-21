from app.database import engine, SessionLocal, Base
from app.models import Employee, RoleEnum
from app.dependencies import get_password_hash


db = SessionLocal()

# Создаём админа, если нет
if not db.query(Employee).filter(Employee.login == "admin").first():
    admin = Employee(
        login="admin",
        password_hash=get_password_hash("admin123"),
        full_name="Администратор",
        role=RoleEnum.admin,
        hire_date="2024-01-01"
    )
    db.add(admin)
    db.commit()
    print("✅ Админ создан: admin / admin123")
else:
    print("ℹ️ Админ уже существует")

db.close()