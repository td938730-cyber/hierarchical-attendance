from datetime import date
from typing import Any, List, Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.deps import get_db, get_current_active_user, require_roles
from app.models.user import User, UserRole
from app.models.attendance import AttendanceStatus
from app.schemas.attendance import (
    AttendanceResponse,
    AttendanceUpdate,
    TodayAttendanceStatus,
    AttendanceSummary
)
from app.services import attendance_service, user_service

router = APIRouter()

class CheckInRequest(BaseModel):
    notes: Optional[str] = None

class CheckOutRequest(BaseModel):
    notes: Optional[str] = None

@router.post("/check-in", response_model=AttendanceResponse)
def punch_in(
    data: Optional[CheckInRequest] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """Record clock-in timestamp for current user today."""
    try:
        notes = data.notes if data else None
        return attendance_service.check_in(db, user_id=current_user.id, notes=notes)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.post("/check-out", response_model=AttendanceResponse)
def punch_out(
    data: Optional[CheckOutRequest] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """Record clock-out timestamp for current user today and compute work hours."""
    try:
        notes = data.notes if data else None
        return attendance_service.check_out(db, user_id=current_user.id, notes=notes)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.get("/today", response_model=TodayAttendanceStatus)
def read_today_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """Check whether the current user has clocked in or clocked out today."""
    return attendance_service.get_today_status(db, user_id=current_user.id)

@router.get("/my", response_model=List[AttendanceResponse])
def read_my_attendance(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """Get the current authenticated user's attendance log."""
    return attendance_service.get_user_attendance(
        db, user_id=current_user.id, start_date=start_date, end_date=end_date, skip=skip, limit=limit
    )

@router.get("/team", response_model=List[AttendanceResponse])
def read_team_attendance(
    direct_only: bool = Query(False, description="Filter to direct reports only; defaults to all downline reports"),
    user_id: Optional[int] = Query(None, description="Filter for specific subordinate"),
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    status_filter: Optional[AttendanceStatus] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.MANAGER))
) -> Any:
    """
    Get attendance logs for subordinate team members.
    Defaults to all downline reports across the managerial tree.
    """
    if current_user.role == UserRole.ADMIN and not direct_only and user_id is None:
        # Admin can view all or downline
        return attendance_service.get_all_attendance(
            db, start_date=start_date, end_date=end_date, filter_user_id=user_id, status=status_filter, skip=skip, limit=limit
        )

    subordinate_ids = user_service.get_subordinate_ids(
        db, manager_id=current_user.id, include_self=False, direct_only=direct_only
    )
    if not subordinate_ids:
        return []

    return attendance_service.get_team_attendance(
        db,
        subordinate_ids=subordinate_ids,
        start_date=start_date,
        end_date=end_date,
        filter_user_id=user_id,
        status=status_filter,
        skip=skip,
        limit=limit
    )

@router.get("/all", response_model=List[AttendanceResponse])
def read_all_attendance(
    user_id: Optional[int] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    status_filter: Optional[AttendanceStatus] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN))
) -> Any:
    """Company-wide attendance log. Admin only."""
    return attendance_service.get_all_attendance(
        db, start_date=start_date, end_date=end_date, filter_user_id=user_id, status=status_filter, skip=skip, limit=limit
    )

@router.put("/{attendance_id}", response_model=AttendanceResponse)
def update_attendance(
    attendance_id: int,
    update_in: AttendanceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.MANAGER))
) -> Any:
    """Regularize/adjust an attendance record. Admin or reporting Manager."""
    record = attendance_service.get_today_record(db, user_id=current_user.id) # checking existence
    target_record = db.get(attendance_service.Attendance, attendance_id)
    if not target_record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Attendance record not found")

    # If manager, check if target record belongs to a subordinate
    if current_user.role != UserRole.ADMIN:
        sub_ids = user_service.get_subordinate_ids(db, manager_id=current_user.id, direct_only=False)
        if target_record.user_id not in sub_ids:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot edit records for employees outside your reporting hierarchy")

    updated = attendance_service.update_attendance_record(db, attendance_id=attendance_id, update_in=update_in)
    return updated

@router.get("/summary", response_model=AttendanceSummary)
def read_attendance_summary(
    scope: str = Query("my", pattern="^(my|team|all)$"),
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """Get aggregated metrics (present, half-day, absent, total hours, avg hours)."""
    if scope == "team":
        if current_user.role not in [UserRole.ADMIN, UserRole.MANAGER]:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
        target_ids = user_service.get_subordinate_ids(db, manager_id=current_user.id, direct_only=False)
    elif scope == "all":
        if current_user.role != UserRole.ADMIN:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin role required")
        users = user_service.get_users(db, limit=1000)
        target_ids = [u.id for u in users]
    else:
        target_ids = [current_user.id]

    return attendance_service.get_summary_stats(
        db, user_ids=target_ids, start_date=start_date, end_date=end_date
    )
