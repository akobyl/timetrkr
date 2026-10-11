import asyncio

import pytest

from app import auth


@pytest.mark.parametrize(
    "operation, method, url, use_api_token",
    [
        ("verify_password", "post", "/token", False),
        ("get_user", "get", "/users/me/", False),
        ("get_user", "get", "/api-tokens/", False),
        ("_user_from_api_token", "get", "/users/me/", True),
    ],
    ids=["login", "jwt-auth", "session-auth", "api-token-auth"],
)
def test_blocking_auth_runs_off_event_loop(
    client, session_headers, monkeypatch, operation, method, url, use_api_token
):
    headers = session_headers
    if use_api_token:
        token = client.post(
            "/api-tokens/", json={"name": "test"}, headers=session_headers
        ).json()["token"]
        headers = {"Authorization": f"Bearer {token}"}

    original = getattr(auth, operation)
    calls = []

    def check_worker_thread(*args, **kwargs):
        # Blocking auth must execute in FastAPI's worker pool, off the event loop.
        with pytest.raises(RuntimeError, match="no running event loop"):
            asyncio.get_running_loop()
        calls.append(operation)
        return original(*args, **kwargs)

    monkeypatch.setattr(auth, operation, check_worker_thread)
    response = client.request(
        method,
        url,
        headers=headers,
        data={"username": "alice", "password": "secret"} if url == "/token" else None,
    )

    assert response.status_code == 200
    assert calls == [operation]


@pytest.mark.parametrize("username,password", [("alice", "wrong"), ("missing", "secret")])
def test_invalid_login_rejected(client, session_headers, username, password):
    response = client.post("/token", data={"username": username, "password": password})

    assert response.status_code == 401
    assert response.json()["detail"] == "Incorrect username or password"
    assert response.headers["WWW-Authenticate"] == "Bearer"
