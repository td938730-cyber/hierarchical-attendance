import pytest
from datetime import datetime, timezone, timedelta
from app.models.attendance import Attendance, AttendanceStatus
from tests.conftest import get_auth_headers

def test_check_in_and_check_out_flow(client, seed_test_hierarchy):
    data = seed_test_hierarchy
    emp = data["emp"]
    headers = get_auth_headers(emp)

    # 1. Initial today status should be neither checked in nor out
    res = client.get("/api/v1/attendance/today", headers=headers)
    assert res.status_code == 200
    today_status = res.json()
    assert today_status["is_checked_in"] is False
    assert today_status["is_checked_out"] is False

    # 2. Check in
    res_in = client.post("/api/v1/attendance/check-in", json={"notes": "Starting shift"}, headers=headers)
    assert res_in.status_code == 200
    att = res_in.json()
    assert att["status"] == "PRESENT"
    assert att["check_in"] is not None
    assert att["check_out"] is None

    # 3. Check in again should fail with 400
    res_double_in = client.post("/api/v1/attendance/check-in", headers=headers)
    assert res_double_in.status_code == 400
    assert "already checked in" in res_double_in.json()["detail"].lower()

    # 4. Today status now shows checked in
    res = client.get("/api/v1/attendance/today", headers=headers)
    assert res.json()["is_checked_in"] is True
    assert res.json()["is_checked_out"] is False

    # 5. Check out
    res_out = client.post("/api/v1/attendance/check-out", json={"notes": "Finished work"}, headers=headers)
    assert res_out.status_code == 200
    att_out = res_out.json()
    assert att_out["check_out"] is not None
    assert att_out["work_hours"] >= 0.0

    # 6. Check out again should fail
    res_double_out = client.post("/api/v1/attendance/check-out", headers=headers)
    assert res_double_out.status_code == 400

def test_manager_team_attendance_visibility(client, seed_test_hierarchy, db_session):
    data = seed_test_hierarchy
    mgr = data["manager"]
    emp = data["emp"]
    
    # Create attendance record for employee
    att_emp = Attendance(
        user_id=emp.id,
        check_in=datetime.now(timezone.utc) - timedelta(hours=8),
        check_out=datetime.now(timezone.utc),
        work_hours=8.0,
        status=AttendanceStatus.PRESENT
    )
    db_session.add(att_emp)
    db_session.commit()

    # Manager queries team attendance (downline)
    mgr_headers = get_auth_headers(mgr)
    res_team = client.get("/api/v1/attendance/team", headers=mgr_headers)
    assert res_team.status_code == 200
    records = res_team.json()
    assert any(r["user_id"] == emp.id for r in records)

    # Employee attempting to access team attendance should be forbidden
    emp_headers = get_auth_headers(emp)
    res_forbidden = client.get("/api/v1/attendance/team", headers=emp_headers)
    assert res_forbidden.status_code == 403
