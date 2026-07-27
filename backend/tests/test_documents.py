import io


def test_upload_requires_authentication(client):
    files = {"file": ("test.txt", io.BytesIO(b"hello world"), "text/plain")}
    response = client.post("/documents/upload", files=files)
    assert response.status_code == 401


def test_upload_and_list_document(client, auth_headers):
    files = {"file": ("test.txt", io.BytesIO(b"This is a test document about Python."), "text/plain")}
    upload_response = client.post("/documents/upload", files=files, headers=auth_headers)
    assert upload_response.status_code == 200
    assert upload_response.json()["status"] in ("ready", "failed")

    list_response = client.get("/documents/", headers=auth_headers)
    assert list_response.status_code == 200
    assert len(list_response.json()) == 1


def test_rejects_unsupported_file_type(client, auth_headers):
    files = {"file": ("malware.exe", io.BytesIO(b"fake binary content"), "application/octet-stream")}
    response = client.post("/documents/upload", files=files, headers=auth_headers)
    assert response.status_code == 400


def test_cross_user_download_blocked(client, auth_headers):
    files = {"file": ("private.txt", io.BytesIO(b"Owner's private content"), "text/plain")}
    upload_response = client.post("/documents/upload", files=files, headers=auth_headers)
    document_id = upload_response.json()["id"]

    client.post("/auth/signup", json={"email": "attacker@example.com", "password": "AttackPass123"})
    login_response = client.post("/auth/login", json={"email": "attacker@example.com", "password": "AttackPass123"})
    attacker_headers = {"Authorization": f"Bearer {login_response.json()['access_token']}"}

    response = client.get(f"/documents/{document_id}/download", headers=attacker_headers)
    assert response.status_code == 404