def test_signup_success(client):
    response = client.post("/auth/signup", json={
        "email": "newuser@example.com",
        "password": "StrongPass123",
        "full_name": "New User"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "newuser@example.com"
    assert data["role"] == "user"
    assert "hashed_password" not in data


def test_signup_duplicate_email_rejected(client, test_user):
    response = client.post("/auth/signup", json={
        "email": test_user["email"],
        "password": "AnotherPass123",
    })
    assert response.status_code == 400


def test_signup_weak_password_rejected(client):
    response = client.post("/auth/signup", json={
        "email": "weak@example.com",
        "password": "weak",
    })
    assert response.status_code == 422


def test_login_success(client, test_user):
    response = client.post("/auth/login", json={
        "email": test_user["email"],
        "password": "TestPass123",
    })
    assert response.status_code == 200
    assert "access_token" in response.json()


def test_login_wrong_password_rejected(client, test_user):
    response = client.post("/auth/login", json={
        "email": test_user["email"],
        "password": "WrongPassword123",
    })
    assert response.status_code == 401


def test_me_requires_authentication(client):
    response = client.get("/auth/me")
    assert response.status_code == 401


def test_me_returns_current_user(client, auth_headers, test_user):
    response = client.get("/auth/me", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["email"] == test_user["email"]


def test_admin_endpoint_blocks_regular_user(client, auth_headers):
    response = client.get("/admin/analytics", headers=auth_headers)
    assert response.status_code == 403