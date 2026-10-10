ENTRY = {"date": "2024-01-01", "start_time": "09:00", "end_time": "10:00"}


def create_token(client, headers, name="cli"):
    response = client.post("/api-tokens/", json={"name": name}, headers=headers)
    assert response.status_code == 201
    return response.json()


def bearer(token):
    return {"Authorization": f"Bearer {token['token']}"}


def test_api_token_can_post_and_read_data(client, session_headers):
    headers = bearer(create_token(client, session_headers))

    created = client.post("/time-entries/", json=ENTRY, headers=headers)
    assert created.status_code == 200

    entries = client.get("/time-entries/", headers=headers).json()
    assert [e["id"] for e in entries] == [created.json()["id"]]
    assert client.get("/users/me/", headers=headers).json()["username"] == "alice"


def test_listing_never_exposes_token_value(client, session_headers):
    token = create_token(client, session_headers)

    listed = client.get("/api-tokens/", headers=session_headers).json()
    assert len(listed) == 1
    assert "token" not in listed[0]
    assert token["token"].startswith("ttk_")


def test_last_used_is_recorded(client, session_headers):
    token = create_token(client, session_headers)
    assert token["last_used_at"] is None

    client.get("/time-entries/", headers=bearer(token))

    listed = client.get("/api-tokens/", headers=session_headers).json()
    assert listed[0]["last_used_at"] is not None


def test_revoked_token_stops_working(client, session_headers):
    token = create_token(client, session_headers)

    response = client.delete(f"/api-tokens/{token['id']}", headers=session_headers)
    assert response.status_code == 204
    assert client.get("/time-entries/", headers=bearer(token)).status_code == 401


def test_invalid_token_rejected(client):
    headers = {"Authorization": "Bearer ttk_notarealtoken"}
    assert client.get("/time-entries/", headers=headers).status_code == 401


def test_api_token_cannot_manage_tokens(client, session_headers):
    headers = bearer(create_token(client, session_headers))

    assert client.get("/api-tokens/", headers=headers).status_code == 401
    assert (
        client.post("/api-tokens/", json={"name": "x"}, headers=headers).status_code
        == 401
    )


def test_cannot_revoke_another_users_token(client, session_headers):
    token = create_token(client, session_headers)
    other = {"username": "bob", "password": "pw"}
    client.post("/users/", json=other)
    bob_jwt = client.post("/token", data=other).json()["access_token"]

    response = client.delete(
        f"/api-tokens/{token['id']}", headers={"Authorization": f"Bearer {bob_jwt}"}
    )
    assert response.status_code == 404
    assert client.get("/time-entries/", headers=bearer(token)).status_code == 200
