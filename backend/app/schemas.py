from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import date
from app.models import RoleEnum

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

class TransportationCreate(BaseModel):
    assign_date: date
    completion_date: Optional[date] = None
    plant_id: int
    vehicle_id: int
    trailer_id: Optional[int] = None
    driver_id: int
    details: List[dict] = Field(..., examples=[{"detail_id": 1, "quantity": 10, "shipping_cost": 500.0}])