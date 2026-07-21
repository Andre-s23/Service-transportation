from datetime import date
from app.database import engine, SessionLocal, Base
from app.models import (
    Warehouse, Detail, Plant, Vehicle, Trailer,
    Employee, Driver, Transportation, TransportationDetail, RoleEnum
)
from app.dependencies import get_password_hash


Base.metadata.create_all(bind=engine)
db = SessionLocal()

try:

    if db.query(Warehouse).count() < 6:
        warehouses = [
            Warehouse(
                name="Центральный склад комплектующих",
                region="Московская область",
                address="г. Химки, ул. Заводская, 15",
                phone="+74950001111",
                manager_name="Петров А.А."
            ),
            Warehouse(
                name="Склад двигателей и трансмиссий",
                region="Московская область",
                address="г. Подольск, ш. Симферопольское, 8",
                phone="+74950002222",
                manager_name="Сидоров В.В."
            ),
            Warehouse(
                name="Склад кузовных деталей",
                region="Тверская область",
                address="г. Тверь, ул. Промышленная, 45",
                phone="+74820003333",
                manager_name="Козлов И.И."
            )
        ]
        db.add_all(warehouses)
        db.flush()
        print(" Добавлено 3 склада")


    if db.query(Plant).count() < 6:
        plants = [
            Plant(
                name='Завод "Двигательстроительный"',
                region="Московская область",
                address="г. Балашиха, ул. Заводская, 1",
                phone="+74951112233",
                manager_name="Иванов П.П.",
                workshop_count=5
            ),
            Plant(
                name='Завод "Кузовной"',
                region="Тверская область",
                address="г. Ржев, ш. Волоколамское, 45",
                phone="+74821113344",
                manager_name="Смирнов Д.Д.",
                workshop_count=3
            ),
            Plant(
                name='Головной завод "Центральный"',
                region="Московская область",
                address="г. Москва, ул. Автомобильная, 78",
                phone="+74951114455",
                manager_name="Волков С.С.",
                workshop_count=4
            )
        ]
        db.add_all(plants)
        db.flush()
        print(" Добавлено 3 завода")


    if db.query(Vehicle).count() < 6:
        vehicles = [
            Vehicle(
                brand="КАМАЗ",
                license_plate="А123БВ777",
                tonnage=10.0,
                release_date=date(2020, 5, 15),
                is_serviceable=True
            ),
            Vehicle(
                brand="ГАЗель NEXT",
                license_plate="В456ГД50",
                tonnage=1.5,
                release_date=date(2021, 8, 20),
                is_serviceable=True
            ),
            Vehicle(
                brand="MAN TGX",
                license_plate="Е789ЖЗ69",
                tonnage=20.0,
                release_date=date(2019, 3, 10),
                is_serviceable=True
            )
        ]
        db.add_all(vehicles)
        db.flush()
        print(" Добавлено 3 автомобиля")


    if db.query(Trailer).count() < 6:
        trailers = [
            Trailer(brand="Schmitz", license_plate="Т111УФ77", tonnage=15.0, release_date=date(2021, 1, 10),
                    volume=40.0, is_serviceable=True),
            Trailer(brand="Krone", license_plate="Х222ЦЧ77", tonnage=12.0, release_date=date(2022, 6, 5), volume=35.0,
                    is_serviceable=True),
            Trailer(brand="Тонар", license_plate="О333ПР77", tonnage=18.0, release_date=date(2020, 11, 20), volume=45.0,
                    is_serviceable=True)
        ]
        db.add_all(trailers)
        db.flush()
        print(" Добавлено 3 прицепа")


    if db.query(Detail).count() < 6:
        wh1, wh2, wh3 = db.query(Warehouse).order_by(Warehouse.id).all()
        details = [
            Detail(
                name="Кронштейн подвески передний",
                base_price=1250.00,
                min_stock=50,
                is_fragile=False,
                warehouse_id=wh1.id
            ),
            Detail(
                name="Фильтр воздушный двигателя",
                base_price=890.00,
                min_stock=120,
                is_fragile=True,
                warehouse_id=wh1.id
            ),
            Detail(
                name="Тормозная колодка комплект",
                base_price=2450.00,
                min_stock=30,
                is_fragile=False,
                warehouse_id=wh2.id
            )
        ]
        db.add_all(details)
        db.flush()
        print(" Добавлено 3 детали")


    if db.query(Employee).filter(Employee.login == "admin").first() is None:

        admin = Employee(
            login="admin",
            password_hash=get_password_hash("admin123"),
            full_name="Смирнов Алексей Петрович",
            role=RoleEnum.admin,
            phone="+79160001122",
            birth_date=date(1982, 3, 15),
            hire_date=date(2019, 1, 10)
        )
        db.add(admin);
        db.flush()


        manager = Employee(
            login="manager",
            password_hash=get_password_hash("manager123"),
            full_name="Иванова Мария Сергеевна",
            role=RoleEnum.manager,
            phone="+79160003344",
            birth_date=date(1988, 7, 22),
            hire_date=date(2021, 5, 15)
        )
        db.add(manager);
        db.flush()


        driver_emp = Employee(
            login="driver",
            password_hash=get_password_hash("driver123"),
            full_name="Кузнецов Дмитрий Владимирович",
            role=RoleEnum.driver,
            phone="+79160005566",
            birth_date=date(1990, 11, 5),
            hire_date=date(2022, 8, 20)
        )
        db.add(driver_emp);
        db.flush()


        db.add(Driver(
            employee_id=driver_emp.id,
            license_number="77УА123456",
            driving_experience=12
        ))
        db.flush()
        print(" Добавлено 3 сотрудника и профиль водителя")


    if db.query(Transportation).count() < 6:
        plant1, plant2, plant3 = db.query(Plant).order_by(Plant.id).all()
        veh1, veh2, veh3 = db.query(Vehicle).order_by(Vehicle.id).all()
        trl1, trl2, trl3 = db.query(Trailer).order_by(Trailer.id).all()
        driver = db.query(Employee).filter(Employee.login == "vai").first()
        d1, d2, d3 = db.query(Detail).order_by(Detail.id).all()


        t1 = Transportation(
            assign_date=date(2026, 5, 10),
            completion_date=None,  # В пути
            plant_id=plant1.id,
            vehicle_id=veh1.id,
            trailer_id=trl1.id,
            driver_id=driver.id
        )
        db.add(t1);
        db.flush()
        db.add_all([
            TransportationDetail(transportation_id=t1.id, detail_id=d1.id, quantity=40, shipping_cost=150.00),
            TransportationDetail(transportation_id=t1.id, detail_id=d2.id, quantity=100, shipping_cost=80.00)
        ])


        t2 = Transportation(
            assign_date=date(2026, 5, 1),
            completion_date=date(2026, 5, 3),  # Доставлено
            plant_id=plant2.id,
            vehicle_id=veh2.id,
            trailer_id=None,
            driver_id=driver.id
        )
        db.add(t2);
        db.flush()
        db.add(TransportationDetail(
            transportation_id=t2.id,
            detail_id=d3.id,
            quantity=25,
            shipping_cost=300.00
        ))


        t3 = Transportation(
            assign_date=date(2026, 5, 12),
            completion_date=None,
            plant_id=plant3.id,
            vehicle_id=veh3.id,
            trailer_id=trl2.id,
            driver_id=driver.id
        )
        db.add(t3);
        db.flush()
        db.add_all([
            TransportationDetail(transportation_id=t3.id, detail_id=d1.id, quantity=15, shipping_cost=200.00),
            TransportationDetail(transportation_id=t3.id, detail_id=d2.id, quantity=60, shipping_cost=90.00),
            TransportationDetail(transportation_id=t3.id, detail_id=d3.id, quantity=10, shipping_cost=350.00)
        ])
        print(" Добавлено 3 перевозки с грузами")


    db.commit()
    print("\n База данных успешно заполнена тестовыми данными!")


except Exception as e:
    db.rollback()
    print(f" Ошибка при заполнении БД: {e}")
    raise
finally:
    db.close()




#
#
# from datetime import date
# from app.database import engine, SessionLocal, Base
# from app.models import (
#     Warehouse, Detail, Plant, Vehicle, Trailer,
#     Employee, Driver, Transportation, TransportationDetail, RoleEnum
# )
#
# db = SessionLocal()
#
# try:
#     # 👇 Порядок важен из-за внешних ключей (сначала дочерние, потом родительские)
#
#     # 1. Очищаем таблицу связей перевозок (самая дочерняя)
#     db.query(TransportationDetail).delete()
#     print("✅ Очищена таблица TransportationDetail")
#
#     # 2. Очищаем перевозки
#     db.query(Transportation).delete()
#     print("✅ Очищена таблица Transportation")
#
#     # 3. Очищаем детали
#     db.query(Detail).delete()
#     print("✅ Очищена таблица Detail")
#
#     # 4. Очищаем прицепы
#     db.query(Trailer).delete()
#     print("✅ Очищена таблица Trailer")
#
#     # 5. Очищаем автомобили
#     db.query(Vehicle).delete()
#     print("✅ Очищена таблица Vehicle")
#
#     # 6. Очищаем склады
#     db.query(Warehouse).delete()
#     print("✅ Очищена таблица Warehouse")
#
#     # 7. Очищаем заводы
#     db.query(Plant).delete()
#     print("✅ Очищена таблица Plant")
#
#     # ⚠️ Таблицы Employee и Driver НЕ трогаем
#
#     # Фиксируем изменения
#     db.commit()
#     print("\n🎉 Все таблицы (кроме Employee и Driver) успешно очищены!")
#     print("📊 Сотрудники остались нетронутыми")
#
#     # Проверка: сколько сотрудников осталось
#     employee_count = db.query(Employee).count()
#     driver_count = db.query(Driver).count()
#     print(f"👥 Осталось сотрудников: {employee_count}")
#     print(f"🚛 Осталось профилей водителей: {driver_count}")
#
# except Exception as e:
#     db.rollback()
#     print(f"❌ Ошибка при очистке БД: {e}")
#     raise
# finally:
#     db.close()