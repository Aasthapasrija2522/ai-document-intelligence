import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.core.database import get_db, Base

TEST_DATABASE_URL = "postgresql://postgres:aastha22@localhost:5432/document_intelligence_test"

engine = create_engine(TEST_DATABASE_URL)
TestSessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


def override_get_db():
    db = TestSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(autouse=True)
def clean_database():
    yield
    with engine.connect() as connection:
        for table in reversed(Base.metadata.sorted_tables):
            connection.execute(table.delete())
        connection.commit()


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def test_user(client):
    signup = client.post(
        "/auth/signup",
        json={
            "email": "testuser@example.com",
            "password": "TestPass123",
            "full_name": "Test User",
        },
    )

    print("\n========== SIGNUP ==========")
    print("Status Code:", signup.status_code)
    print("Response:", signup.json())

    login = client.post(
        "/auth/login",
        json={
            "email": "testuser@example.com",
            "password": "TestPass123",
        },
    )

    print("\n========== LOGIN ==========")
    print("Status Code:", login.status_code)
    print("Response:", login.json())

    assert login.status_code == 200, (
        f"Login failed!\n"
        f"Status: {login.status_code}\n"
        f"Response: {login.json()}"
    )

    token = login.json()["access_token"]

    return {
        "token": token,
        "email": "testuser@example.com",
    }


@pytest.fixture
def auth_headers(test_user):
    return {
        "Authorization": f"Bearer {test_user['token']}"
    }