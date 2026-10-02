from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict
from app.models.user import UserRole

class UserBrief(BaseModel):
    id: int
    email: str
    full_name: str
    role: UserRole

    model_config = ConfigDict(from_attributes=True)

class UserBase(BaseModel):
    email: str
    full_name: str
    role: UserRole = UserRole.EMPLOYEE
    is_active: bool = True
    manager_id: Optional[int] = None

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    email: Optional[str] = None
    full_name: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None
    manager_id: Optional[int] = None
    password: Optional[str] = None

class UserResponse(UserBase):
    id: int
    created_at: datetime
    updated_at: datetime
    manager: Optional[UserBrief] = None

    model_config = ConfigDict(from_attributes=True)

class HierarchyNode(BaseModel):
    id: int
    email: str
    full_name: str
    role: UserRole
    manager_id: Optional[int] = None
    subordinates: List["HierarchyNode"] = []

    model_config = ConfigDict(from_attributes=True)

HierarchyNode.model_rebuild()
