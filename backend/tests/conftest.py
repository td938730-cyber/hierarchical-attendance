import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import Base
from app.deps import get_db
from app.main import app
from app.models.user import User, UserRole
from app.core.security import get_password_hash, create_access_token

TEST_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def db_session():
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    
    yield session
    
    session.close()
    transaction.rollback()
    connection.close()

@pytest.fixture
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()

@pytest.fixture
def seed_test_hierarchy(db_session):
    """Creates a 3-tier test hierarchy: Admin -> Manager1 -> Lead -> Employee."""
    pwd = get_password_hash("password123")
    
    admin = User(email="testadmin@company.com", full_name="Test Admin", hashed_password=pwd, role=UserRole.ADMIN)
    db_session.add(admin)
    db_session.commit()
    db_session.refresh(admin)

    manager = User(email="testmgr@company.com", full_name="Test Manager", hashed_password=pwd, role=UserRole.MANAGER, manager_id=admin.id)
    db_session.add(manager)
    db_session.commit()
    db_session.refresh(manager)

    lead = User(email="testlead@company.com", full_name="Test Lead", hashed_password=pwd, role=UserRole.MANAGER, manager_id=manager.id)
    db_session.add(lead)
    db_session.commit()
    db_session.refresh(lead)

    emp = User(email="testemp@company.com", full_name="Test Emp", hashed_password=pwd, role=UserRole.EMPLOYEE, manager_id=lead.id)
    db_session.add(emp)
    db_session.commit()
    db_session.refresh(emp)

    return {
        "admin": admin,
        "manager": manager,
        "lead": lead,
        "emp": emp
    }

def get_auth_headers(user: User) -> dict:
    token = create_access_token(subject=user.id)
    return {"Authorization": f"Bearer {token}"}
