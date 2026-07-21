from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import date
from app.models import RoleEnum


class LoginRequest(BaseModel):
    login: str
    password: str
class UserCreate(BaseModel):
    login: str
    password: str
    full_name: str
    role: RoleEnum
    phone: Optional[str] = None
    birth_date: Optional[date] = None
    hire_date: Optional[date] = None
    license_number: Optional[str] = None
    driving_experience: Optional[int] = None

class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    login: str
    full_name: str
    role: RoleEnum


class WarehouseBase(BaseModel):   # склад
    name: str
    region: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    manager_name: Optional[str] = None

class WarehouseCreate(WarehouseBase): pass
class WarehouseUpdate(WarehouseBase): pass
class WarehouseResponse(WarehouseBase):
    model_config = ConfigDict(from_attributes=True)
    id: int

class DetailBase(BaseModel):      # деталь
    name: str
    base_price: Optional[float] = None
    min_stock: Optional[int] = None
    is_fragile: Optional[bool] = False
    warehouse_id: int
    current_stock: int

class DetailCreate(DetailBase): pass
class DetailUpdate(BaseModel):
    name: Optional[str] = None
    base_price: Optional[float] = None
    min_stock: Optional[int] = None
    is_fragile: Optional[bool] = None
    warehouse_id: Optional[int] = None
    current_stock: int

class DetailResponse(DetailBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    warehouse_name: Optional[str] = None
    current_stock: int



class PlantBase(BaseModel):
    name: str
    region: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    manager_name: Optional[str] = None
    workshop_count: Optional[int] = None

class PlantCreate(PlantBase): pass
class PlantUpdate(PlantBase): pass
class PlantResponse(PlantBase):
    model_config = ConfigDict(from_attributes=True)
    id: int


class VehicleBase(BaseModel):       # автомобиль
    brand: Optional[str] = None
    license_plate: str
    tonnage: Optional[float] = None
    release_date: Optional[date] = None
    is_serviceable: Optional[bool] = True

class VehicleCreate(VehicleBase): pass
class VehicleUpdate(BaseModel):
    brand: Optional[str] = None
    tonnage: Optional[float] = None
    release_date: Optional[date] = None
    is_serviceable: Optional[bool] = None

class VehicleResponse(VehicleBase):
    model_config = ConfigDict(from_attributes=True)
    id: int


class TrailerBase(BaseModel):    # прицеп
    brand: Optional[str] = None
    license_plate: str
    tonnage: Optional[float] = None
    release_date: Optional[date] = None
    volume: Optional[float] = None
    is_serviceable: Optional[bool] = True

class TrailerCreate(TrailerBase): pass
class TrailerUpdate(BaseModel):
    brand: Optional[str] = None
    tonnage: Optional[float] = None
    release_date: Optional[date] = None
    volume: Optional[float] = None
    is_serviceable: Optional[bool] = None

class TrailerResponse(TrailerBase):
    model_config = ConfigDict(from_attributes=True)
    id: int



class EmployeeBase(BaseModel): # сотрудник
    full_name: str
    login: str
    role: RoleEnum
    phone: Optional[str] = None
    birth_date: Optional[date] = None
    hire_date: Optional[date] = None


class DriverProfileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    license_number: str
    driving_experience: int

class EmployeeCreate(EmployeeBase):
    password: str
    license_number: Optional[str] = None
    driving_experience: Optional[int] = None

class EmployeeUpdate(BaseModel):
    full_name: Optional[str] = None
    role: Optional[RoleEnum] = None
    phone: Optional[str] = None
    birth_date: Optional[date] = None
    hire_date: Optional[date] = None
    license_number: Optional[str] = None
    driving_experience: Optional[int] = None
    old_password: Optional[str] = None
    new_password: Optional[str] = None

class EmployeeResponse(EmployeeBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    is_driver: bool = False
    driver_profile: Optional[DriverProfileResponse] = None



class TransportDetailItemCreate(BaseModel):
    detail_id: int
    quantity: int
    shipping_cost: float = 0
class TransportDetailItem(BaseModel):  # транспортировка
    model_config = ConfigDict(from_attributes=True)
    detail_id: int
    detail_name: str
    base_price: float
    quantity: int
    shipping_cost: float
    warehouse_name: Optional[str] = None

class TransportationBase(BaseModel):
    assign_date: date
    completion_date: Optional[date] = None
    plant_id: int
    vehicle_id: int
    trailer_id: Optional[int] = None
    driver_id: int

class TransportationCreate(TransportationBase):
    details: List[TransportDetailItemCreate] = Field(default_factory=list)


class TransportationUpdate(BaseModel):
    assign_date: Optional[date] = None
    completion_date: Optional[date] = None
    plant_id: Optional[int] = None
    vehicle_id: Optional[int] = None
    trailer_id: Optional[int] = None
    driver_id: Optional[int] = None
    details: Optional[List[TransportDetailItemCreate]] = None
class TransportationResponse(TransportationBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    assign_date: date
    completion_date: Optional[date] = None
    plant_id: int
    vehicle_id: int
    trailer_id: Optional[int] = None
    driver_id: int

    # Denormalized fields
    plant_name: str
    vehicle_plate: str
    trailer_plate: Optional[str] = None
    driver_name: str
    total_items: int
    total_cost: float

    details: List[TransportDetailItem] = []
    warehouse_name: Optional[str] = None
    warehouse_address: Optional[str] = None
    warehouse_phone: Optional[str] = None