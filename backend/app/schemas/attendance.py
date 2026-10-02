from datetime import datetime, date
from typing import Optional
from pydantic import BaseModel, ConfigDict
from app.models.attendance import AttendanceStatus
from app.schemas.user import UserBrief

class AttendanceBase(BaseModel):
    date: date
    status: AttendanceStatus = AttendanceStatus.PRESENT
    notes: Optional[str] = None

class AttendanceCreate(AttendanceBase):
    user_id: int
    check_in: Optional[datetime] = None
    check_out: Optional[datetime] = None

class AttendanceUpdate(BaseModel):
    check_in: Optional[datetime] = None
    check_out: Optional[datetime] = None
    status: Optional[AttendanceStatus] = None
    notes: Optional[str] = None

class AttendanceResponse(AttendanceBase):
    id: int
    user_id: int
    check_in: Optional[datetime] = None
    check_out: Optional[datetime] = None
    work_hours: float
    created_at: datetime
    updated_at: datetime
    user: Optional[UserBrief] = None

    model_config = ConfigDict(from_attributes=True)

class TodayAttendanceStatus(BaseModel):
    is_checked_in: bool
    is_checked_out: bool
    attendance: Optional[AttendanceResponse] = None

class AttendanceSummary(BaseModel):
    total_records: int
    present_days: int
    half_days: int
    absent_days: int
    total_hours: float
    average_hours: float
