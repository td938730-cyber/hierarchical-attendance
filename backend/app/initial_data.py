from datetime import datetime, date, timedelta, timezone
from app.core.database import SessionLocal, Base, engine
from app.models.user import User, UserRole
from app.models.attendance import Attendance, AttendanceStatus
from app.core.security import get_password_hash

def seed_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # Check if already seeded with Assamese admin
        admin_check = db.query(User).filter(User.email.in_(["admin@assamtech.in", "bhaskar.admin@assamtech.in"])).first()
        if admin_check:
            print("Database already seeded with Assamese users.")
            return

        print("Seeding Assamese hierarchical users...")
        pwd_hash = get_password_hash("password123")
        admin_hash = get_password_hash("admin123")

        # 1. Admin (Top of hierarchy) - Mukhya Bebosthapak
        admin = User(
            email="admin@assamtech.in",
            full_name="Bhaskar Jyoti Baruah (Mukhya Bebosthapak / Admin)",
            hashed_password=admin_hash,
            role=UserRole.ADMIN,
            is_active=True,
            manager_id=None
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)

        # 2. Level 1 Managers (Reporting to Admin)
        gitashree_mgr = User(
            email="gitashree.mgr@assamtech.in",
            full_name="Gitashree Saikia (Bibhagio Mukhyo / Tech Head)",
            hashed_password=pwd_hash,
            role=UserRole.MANAGER,
            is_active=True,
            manager_id=admin.id
        )
        partha_mgr = User(
            email="partha.sales@assamtech.in",
            full_name="Partha Pratim Borah (Mondol Bebosthapak / Operations)",
            hashed_password=pwd_hash,
            role=UserRole.MANAGER,
            is_active=True,
            manager_id=admin.id
        )
        db.add_all([gitashree_mgr, partha_mgr])
        db.commit()
        db.refresh(gitashree_mgr)
        db.refresh(partha_mgr)

        # 3. Level 2 Manager (Sub-manager under Gitashree - Team Lead)
        kaushik_lead = User(
            email="kaushik.lead@assamtech.in",
            full_name="Kaushik Hazarika (Dol-Mukhyo / Tech Lead)",
            hashed_password=pwd_hash,
            role=UserRole.MANAGER,
            is_active=True,
            manager_id=gitashree_mgr.id
        )
        db.add(kaushik_lead)
        db.commit()
        db.refresh(kaushik_lead)

        # 4. Level 3 Employees
        ananya = User(
            email="ananya.dev@assamtech.in",
            full_name="Ananya Phukan (Kormochari / Sr Developer)",
            hashed_password=pwd_hash,
            role=UserRole.EMPLOYEE,
            is_active=True,
            manager_id=kaushik_lead.id
        )
        debabrata = User(
            email="debabrata.dev@assamtech.in",
            full_name="Debabrata Kalita (Sahayak Developer / Jr Dev)",
            hashed_password=pwd_hash,
            role=UserRole.EMPLOYEE,
            is_active=True,
            manager_id=kaushik_lead.id
        )
        rupali = User(
            email="rupali.exec@assamtech.in",
            full_name="Rupali Deka (Field Sahayak / Operations Exec)",
            hashed_password=pwd_hash,
            role=UserRole.EMPLOYEE,
            is_active=True,
            manager_id=partha_mgr.id
        )
        db.add_all([ananya, debabrata, rupali])
        db.commit()
        db.refresh(ananya)
        db.refresh(debabrata)
        db.refresh(rupali)

        print("Hierarchy created:")
        print(f"  {admin.full_name} (Admin)")
        print(f"   |-- {gitashree_mgr.full_name} (Manager)")
        print(f"   |    \\-- {kaushik_lead.full_name} (Team Lead)")
        print(f"   |         |-- {ananya.full_name}")
        print(f"   |         \\-- {debabrata.full_name}")
        print(f"   \\-- {partha_mgr.full_name} (Manager)")
        print(f"        \\-- {rupali.full_name}")

        # Seed past 7 days of attendance
        print("Seeding past attendance logs...")
        all_staff = [gitashree_mgr, partha_mgr, kaushik_lead, ananya, debabrata, rupali]
        today = date.today()

        for days_ago in range(6, 0, -1):
            day = today - timedelta(days=days_ago)
            # Skip weekends (5=Saturday, 6=Sunday)
            if day.weekday() >= 5:
                continue

            for staff in all_staff:
                # Normal 8.5 hour day (9:30 AM to 6:00 PM standard shift)
                c_in = datetime(day.year, day.month, day.day, 9, 30, 0, tzinfo=timezone.utc)
                c_out = datetime(day.year, day.month, day.day, 18, 0, 0, tzinfo=timezone.utc)
                
                # Introduce slight variation
                if staff.id == debabrata.id and days_ago == 2:
                    # Half day
                    c_out = datetime(day.year, day.month, day.day, 13, 45, 0, tzinfo=timezone.utc)
                    status = AttendanceStatus.HALF_DAY
                    hours = 4.25
                    notes = "অৰ্ধেক দিন ছুটি / Approved Half-Day"
                else:
                    status = AttendanceStatus.PRESENT
                    hours = 8.5
                    notes = "নিয়মীয়া উপস্থিতি / Standard shift"

                att = Attendance(
                    user_id=staff.id,
                    date=day,
                    check_in=c_in,
                    check_out=c_out,
                    work_hours=hours,
                    status=status,
                    notes=notes
                )
                db.add(att)

        db.commit()
        print("Assamese initial data seeded successfully!")
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
