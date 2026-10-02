# Hierarchical Attendance Management System (AttendEase)

A full-stack, hierarchical attendance tracking solution built with **FastAPI**, **SQLAlchemy**, **SQLite**, and **React (Vite + Tailwind CSS)**.

---

## 🌟 Key Features

1. **Role-Based Organizational Hierarchy**:
   - **Self-referencing `manager_id`** on the `users` table models an arbitrary N-tier corporate hierarchy (`Admin` &rarr; `Manager` &rarr; `Team Lead` &rarr; `Employee`).
   - **Recursive Downline Subordinates**: Managers supervise their entire reporting downline (both direct and indirect reports) by default, with an instant toggle for direct reports only.
   - **Cycle Prevention**: Intelligent cycle detection blocks circular reporting structures (a manager cannot report to their own direct or indirect subordinate).

2. **Attendance & Punch Management**:
   - Real-time digital clock widget with **Clock In** and **Clock Out**.
   - Automatic duration and shift calculation (`work_hours`).
   - Status tracking: `PRESENT`, `HALF_DAY`, `ABSENT`.
   - Shift notes and remarks.

3. **Subordinate Oversight & Regularization**:
   - Managers and Admins can view downline attendance history with filters for date ranges, statuses, and specific employees.
   - Managerial regularization modal to adjust check-in/out times or update status with audit reasons.

4. **Interactive Organization Chart**:
   - Visual hierarchy tree with collapsible nodes, role badges, and subordinate counts.

5. **Ready-to-Use Demo Accounts**:
   - One-click demo login buttons directly on the sign-in screen.

---

## 👥 Demo Accounts (Seeded)

| Role | Name | Email | Password | Reports To |
|---|---|---|---|---|
| **Admin** | Bhaskar Jyoti Baruah | `admin@assamtech.in` | `admin123` | *None (Top Level)* |
| **Manager (Tech Head)** | Gitashree Saikia | `gitashree.mgr@assamtech.in` | `password123` | Bhaskar Jyoti Baruah |
| **Manager (Operations)** | Partha Pratim Borah | `partha.sales@assamtech.in` | `password123` | Bhaskar Jyoti Baruah |
| **Team Lead (Sub-Manager)** | Kaushik Hazarika | `kaushik.lead@assamtech.in` | `password123` | Gitashree Saikia |
| **Sr Developer (Employee)** | Ananya Phukan | `ananya.dev@assamtech.in` | `password123` | Kaushik Hazarika |
| **Jr Developer (Employee)** | Debabrata Kalita | `debabrata.dev@assamtech.in` | `password123` | Kaushik Hazarika |
| **Field Exec (Employee)** | Rupali Deka | `rupali.exec@assamtech.in` | `password123` | Partha Pratim Borah |

---

## 📁 Project Structure

```text
hierarchical-attendance/
├── backend/
│   ├── app/
│   │   ├── api/v1/
│   │   │   ├── endpoints/
│   │   │   │   ├── auth.py         # Login & JWT authentication (/login, /me)
│   │   │   │   ├── users.py        # Hierarchy tree, subordinates, user CRUD
│   │   │   │   └── attendance.py   # Clock in/out, team attendance, regularization
│   │   │   └── router.py
│   │   ├── core/
│   │   │   ├── config.py           # Application settings
│   │   │   ├── database.py         # SQLite engine & SessionLocal
│   │   │   └── security.py         # Bcrypt hashing & PyJWT token utilities
│   │   ├── models/
│   │   │   ├── user.py             # User model with self-referential manager_id
│   │   │   └── attendance.py       # Attendance record model (unique per user + date)
│   │   ├── schemas/                # Pydantic v2 schemas
│   │   ├── services/
│   │   │   ├── user_service.py     # BFS recursive subordinate traversal & cycle check
│   │   │   └── attendance_service.py # Punch logic, hour calculations & summaries
│   │   ├── deps.py                 # RBAC dependencies (Admin, Manager, Employee)
│   │   ├── initial_data.py         # Database seeding script with realistic data
│   │   └── main.py                 # FastAPI application entry point
│   ├── tests/                      # Pytest automated test suite
│   ├── requirements.txt
│   └── venv/
├── frontend/
│   ├── src/
│   │   ├── api/client.js           # Axios instance with auth interceptor
│   │   ├── context/AuthContext.jsx # Global auth state
│   │   ├── components/
│   │   │   ├── ClockWidget.jsx     # Live clock punch in/out component
│   │   │   ├── AttendanceTable.jsx # Attendance ledger with regularization modal
│   │   │   ├── OrgHierarchyTree.jsx # Visual organization tree chart
│   │   │   └── Navbar.jsx          # Header with role badges & navigation
│   │   ├── pages/
│   │   │   ├── Login.jsx           # Sign in page with 1-click demo accounts
│   │   │   ├── EmployeeDashboard.jsx # Self-service employee dashboard
│   │   │   ├── TeamDashboard.jsx   # Downline subordinate attendance viewer
│   │   │   └── AdminDashboard.jsx  # Org hierarchy editor & user administration
│   │   ├── App.jsx
│   │   └── index.css
│   ├── vite.config.js              # Configured with proxy to backend /api
│   └── package.json
└── README.md
```

---

## 🚀 Getting Started

### 1. Backend Setup & Run

In a terminal, navigate to `backend`:

```powershell
# Activate Python virtual environment
.\backend\venv\Scripts\Activate.ps1

# (Optional) Seed the database with demo users & attendance records
$env:PYTHONPATH="backend"
python backend\app\initial_data.py

# Run the FastAPI server
python -m uvicorn app.main:app --app-dir backend --reload --port 8000
```

- API Base URL: `http://localhost:8000`
- Interactive Swagger UI: `http://localhost:8000/docs`

---

### 2. Frontend Setup & Run

In a separate terminal, navigate to `frontend`:

```powershell
cd frontend
npm install
npm run dev
```

- Web UI: `http://localhost:5173`

---

## 🧪 Running Automated Tests

Run backend unit and integration tests with `pytest`:

```powershell
$env:PYTHONPATH="backend"
.\backend\venv\Scripts\pytest.exe backend\tests -v
```

All 5 test suites verify:
- Daily Clock-In and Clock-Out flow and hour calculation
- Preventing double check-in and invalid check-out
- Recursive downline subordinate traversal (direct vs downline)
- Prevention of circular reporting hierarchies
- Manager & Admin role permissions
