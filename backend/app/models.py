from sqlalchemy import Column, Integer, String, Float, Boolean, Date, ForeignKey, Enum as SAEnum, text
from sqlalchemy.orm import relationship
from app.database import Base
import enum

class RoleEnum(str, enum.Enum):
    client = "client"
    manager = "manager"
    admin = "admin"
    driver = "driver"



class Warehouse(Base):
    __tablename__ = "warehouses"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    region = Column(String)
    address = Column(String)
    phone = Column(String)
    manager_name = Column(String)
    details = relationship("Detail", back_populates="warehouse")

class Detail(Base):
    __tablename__ = "details"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    base_price = Column(Float)
    min_stock = Column(Integer)
    is_fragile = Column(Boolean, default=False)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"))
    warehouse = relationship("Warehouse", back_populates="details")
    transport_links = relationship("TransportationDetail", back_populates="detail")
    current_stock = Column(Integer, nullable=False, server_default=text("0"), default=0)

class Plant(Base):
    __tablename__ = "plants"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    region = Column(String)
    address = Column(String)
    phone = Column(String)
    manager_name = Column(String)
    workshop_count = Column(Integer)
    transports = relationship("Transportation", back_populates="plant")

class Vehicle(Base):
    __tablename__ = "vehicles"
    id = Column(Integer, primary_key=True, index=True)
    brand = Column(String)
    license_plate = Column(String, unique=True)
    tonnage = Column(Float)
    release_date = Column(Date)
    is_serviceable = Column(Boolean, default=True)
    transports = relationship("Transportation", back_populates="vehicle")

class Trailer(Base):
    __tablename__ = "trailers"
    id = Column(Integer, primary_key=True, index=True)
    brand = Column(String)
    license_plate = Column(String, unique=True)
    tonnage = Column(Float)
    release_date = Column(Date)
    volume = Column(Float)
    is_serviceable = Column(Boolean, default=True)
    transports = relationship("Transportation", back_populates="trailer")

class Employee(Base):
    __tablename__ = "employees"
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    login = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    role = Column(SAEnum(RoleEnum), default=RoleEnum.client, nullable=False)
    phone = Column(String)
    birth_date = Column(Date)
    hire_date = Column(Date)
    driver_profile = relationship("Driver", back_populates="employee", uselist=False, cascade="all, delete-orphan")
    assigned_transports = relationship("Transportation", back_populates="driver")

class Driver(Base):
    __tablename__ = "drivers"
    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), unique=True, nullable=False)
    license_number = Column(String)
    driving_experience = Column(Integer)
    employee = relationship("Employee", back_populates="driver_profile")

class Transportation(Base):
    __tablename__ = "transportations"
    id = Column(Integer, primary_key=True, index=True)
    assign_date = Column(Date, nullable=False)
    completion_date = Column(Date)
    plant_id = Column(Integer, ForeignKey("plants.id"), nullable=False)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    trailer_id = Column(Integer, ForeignKey("trailers.id"), nullable=True)
    driver_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    plant = relationship("Plant", back_populates="transports")
    vehicle = relationship("Vehicle", back_populates="transports")
    trailer = relationship("Trailer", back_populates="transports")
    driver = relationship("Employee", back_populates="assigned_transports")
    details = relationship("TransportationDetail", back_populates="transportation", cascade="all, delete-orphan")

class TransportationDetail(Base):
    __tablename__ = "transportation_details"
    transportation_id = Column(Integer, ForeignKey("transportations.id"), primary_key=True)
    detail_id = Column(Integer, ForeignKey("details.id"), primary_key=True)
    quantity = Column(Integer, nullable=False)
    shipping_cost = Column(Float)
    transportation = relationship("Transportation", back_populates="details")
    detail = relationship("Detail", back_populates="transport_links")