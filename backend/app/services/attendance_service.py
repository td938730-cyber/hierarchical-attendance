from datetime import datetime, date, timezone
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import select, and_, func
from app.models.attendance import Attendance, AttendanceStatus
from app.models.user import User
from app.schemas.attendance import AttendanceUpdate, TodayAttendanceStatus, AttendanceSummary

def to_naive_utc(dt: Optional[datetime]) -> Optional[datetime]:
    if dt is None:
        return None
    if dt.tzinfo is not None:
        return dt.astimezone(timezone.utc).replace(tzinfo=None)
    return dt

def calculate_hours(check_in: Optional[datetime], check_out: Optional[datetime]) -> float:
    c_in = to_naive_utc(check_in)
    c_out = to_naive_utc(check_out)
    if c_in and c_out and c_out > c_in:
        seconds = (c_out - c_in).total_seconds()
        return round(seconds / 3600.0, 2)
    return 0.0

def determine_status(work_hours: float) -> AttendanceStatus:
    if work_hours >= 7.0:
        return AttendanceStatus.PRESENT
    elif work_hours >= 3.5:
        return AttendanceStatus.HALF_DAY
    else:
        return AttendanceStatus.HALF_DAY

def get_today_record(db: Session, user_id: int) -> Optional[Attendance]:
    today = date.today()
    return db.execute(
        select(Attendance)
        .options(joinedload(Attendance.user))
        .where(and_(Attendance.user_id == user_id, Attendance.date == today))
    ).scalar_one_or_none()

def check_in(db: Session, user_id: int, notes: Optional[str] = None) -> Attendance:
    today = date.today()
    record = get_today_record(db, user_id)
    now = datetime.now(timezone.utc).replace(tzinfo=None)

    if record:
        if record.check_in is not None:
            raise ValueError("User has already checked in today.")
        record.check_in = now
        record.status = AttendanceStatus.PRESENT
        if notes:
            record.notes = notes
    else:
        record = Attendance(
            user_id=user_id,
            date=today,
            check_in=now,
            status=AttendanceStatus.PRESENT,
            notes=notes,
            work_hours=0.0
        )
        db.add(record)

    db.commit()
    db.refresh(record)
    return record

def check_out(db: Session, user_id: int, notes: Optional[str] = None) -> Attendance:
    record = get_today_record(db, user_id)
    if not record or not record.check_in:
        raise ValueError("Cannot check out without an active check-in today.")
    
    if record.check_out is not None:
        raise ValueError("User has already checked out today.")

    now = datetime.now(timezone.utc).replace(tzinfo=None)
    record.check_out = now
    record.work_hours = calculate_hours(record.check_in, record.check_out)
    record.status = determine_status(record.work_hours)
    
    if notes:
        record.notes = f"{record.notes or ''}\n{notes}".strip()

    db.add(record)
    db.commit()
    db.refresh(record)
    return record

def get_today_status(db: Session, user_id: int) -> TodayAttendanceStatus:
    record = get_today_record(db, user_id)
    is_in = bool(record and record.check_in is not None)
    is_out = bool(record and record.check_out is not None)
    return TodayAttendanceStatus(
        is_checked_in=is_in,
        is_checked_out=is_out,
        attendance=record
    )

def get_user_attendance(
    db: Session,
    user_id: int,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    skip: int = 0,
    limit: int = 100
) -> List[Attendance]:
    query = select(Attendance).options(joinedload(Attendance.user)).where(Attendance.user_id == user_id)
    if start_date:
        query = query.where(Attendance.date >= start_date)
    if end_date:
        query = query.where(Attendance.date <= end_date)
    query = query.order_by(Attendance.date.desc()).offset(skip).limit(limit)
    return list(db.scalars(query).all())

def get_team_attendance(
    db: Session,
    subordinate_ids: List[int],
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    filter_user_id: Optional[int] = None,
    status: Optional[AttendanceStatus] = None,
    skip: int = 0,
    limit: int = 100
) -> List[Attendance]:
    if not subordinate_ids:
        return []
    
    query = select(Attendance).options(joinedload(Attendance.user))
    if filter_user_id:
        if filter_user_id not in subordinate_ids:
            return []
        query = query.where(Attendance.user_id == filter_user_id)
    else:
        query = query.where(Attendance.user_id.in_(subordinate_ids))

    if start_date:
        query = query.where(Attendance.date >= start_date)
    if end_date:
        query = query.where(Attendance.date <= end_date)
    if status:
        query = query.where(Attendance.status == status)

    query = query.order_by(Attendance.date.desc(), Attendance.id.desc()).offset(skip).limit(limit)
    return list(db.scalars(query).all())

def get_all_attendance(
    db: Session,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    filter_user_id: Optional[int] = None,
    status: Optional[AttendanceStatus] = None,
    skip: int = 0,
    limit: int = 100
) -> List[Attendance]:
    query = select(Attendance).options(joinedload(Attendance.user))
    if filter_user_id:
        query = query.where(Attendance.user_id == filter_user_id)
    if start_date:
        query = query.where(Attendance.date >= start_date)
    if end_date:
        query = query.where(Attendance.date <= end_date)
    if status:
        query = query.where(Attendance.status == status)

    query = query.order_by(Attendance.date.desc(), Attendance.id.desc()).offset(skip).limit(limit)
    return list(db.scalars(query).all())

def update_attendance_record(
    db: Session,
    attendance_id: int,
    update_in: AttendanceUpdate
) -> Optional[Attendance]:
    record = db.get(Attendance, attendance_id)
    if not record:
        return None

    update_data = update_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(record, field, value)

    if record.check_in and record.check_out:
        record.work_hours = calculate_hours(record.check_in, record.check_out)
        if "status" not in update_data:
            record.status = determine_status(record.work_hours)

    db.add(record)
    db.commit()
    db.refresh(record)
    return record

def get_summary_stats(
    db: Session,
    user_ids: List[int],
    start_date: Optional[date] = None,
    end_date: Optional[date] = None
) -> AttendanceSummary:
    if not user_ids:
        return AttendanceSummary(
            total_records=0,
            present_days=0,
            half_days=0,
            absent_days=0,
            total_hours=0.0,
            average_hours=0.0
        )

    query = select(Attendance).where(Attendance.user_id.in_(user_ids))
    if start_date:
        query = query.where(Attendance.date >= start_date)
    if end_date:
        query = query.where(Attendance.date <= end_date)

    records = list(db.scalars(query).all())
    total = len(records)
    present = sum(1 for r in records if r.status == AttendanceStatus.PRESENT)
    half = sum(1 for r in records if r.status == AttendanceStatus.HALF_DAY)
    absent = sum(1 for r in records if r.status == AttendanceStatus.ABSENT)
    hours = round(sum(r.work_hours for r in records), 2)
    avg_hours = round(hours / total, 2) if total > 0 else 0.0

    return AttendanceSummary(
        total_records=total,
        present_days=present,
        half_days=half,
        absent_days=absent,
        total_hours=hours,
        average_hours=avg_hours
    )
