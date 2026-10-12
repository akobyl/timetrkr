from concurrent.futures import ThreadPoolExecutor
from datetime import date, time
from threading import Barrier

from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app import crud, models, schemas
from app.database import Base


def entry(day, start, end):
    return {"date": day, "start_time": start, "end_time": end}


def summary(client, headers, start, end):
    response = client.get(
        "/time-summary/",
        params={"start_date": start, "end_date": end},
        headers=headers,
    )
    assert response.status_code == 200
    return response.json()


def test_effective_summary_preserves_overlaps(client, session_headers):
    entries = [
        entry("2026-10-10", "09:00", "10:00"),
        entry("2026-10-10", "09:30", "10:30"),
        entry("2026-10-10", "09:30", "10:30"),
        entry("2026-10-10", "10:30", "11:00"),
    ]
    for row in entries:
        response = client.post("/time-entries/", json=row, headers=session_headers)
        assert response.status_code == 200
    result = summary(client, session_headers, "2026-10-10", "2026-10-10")
    assert result["total_minutes"] == 120
    assert result["entries_count"] == 4
    assert len(client.get("/time-entries/", headers=session_headers).json()) == 4


def test_summary_clips_overnight_and_includes_previous_day(client, session_headers):
    for row in [
        entry("2026-10-10", "23:00", "02:00"),
        entry("2026-10-11", "01:00", "03:00"),
    ]:
        client.post("/time-entries/", json=row, headers=session_headers)
    for start, end, expected in [
        ("2026-10-10", "2026-10-10", 60),
        ("2026-10-11", "2026-10-11", 180),
        ("2026-10-10", "2026-10-11", 240),
        ("2026-10-12", "2026-10-12", 0),
    ]:
        assert summary(client, session_headers, start, end)["total_minutes"] == expected


def test_import_skips_duplicates_and_is_user_scoped(client, session_headers):
    row = entry("2026-10-10", "09:00", "10:00")
    client.post("/time-entries/", json=row, headers=session_headers)
    batch = {"entries": [row, entry("2026-10-10", "09:30", "10:30")] * 2}
    response = client.post("/time-entries/import", json=batch, headers=session_headers)
    assert response.json() == {"imported": 1, "skipped": 3}
    retry = client.post("/time-entries/import", json=batch, headers=session_headers)
    assert retry.json() == {"imported": 0, "skipped": 4}

    creds = {"username": "bob", "password": "secret"}
    client.post("/users/", json=creds)
    token = client.post("/token", data=creds).json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    response = client.post("/time-entries/import", json={"entries": [row]}, headers=headers)
    assert response.json() == {"imported": 1, "skipped": 0}
    assert summary(client, headers, row["date"], row["date"])["total_minutes"] == 60


def test_invalid_batch_writes_nothing(client, session_headers):
    batch = {"entries": [
        entry("2026-10-10", "09:00", "10:00"),
        entry("2026-10-10", "09:03", "10:00"),
    ]}
    response = client.post("/time-entries/import", json=batch, headers=session_headers)
    assert response.status_code == 422
    assert client.get("/time-entries/", headers=session_headers).json() == []


def test_concurrent_imports_are_serialized(tmp_path):
    engine = create_engine(f'sqlite:///{tmp_path / "import.db"}')
    Base.metadata.create_all(engine)
    barrier = Barrier(2)
    batch = [schemas.TimeEntryCreate(
        date=date(2026, 10, 10), start_time=time(9), end_time=time(10),
    )]

    def run(_):
        with Session(engine) as db:
            barrier.wait()
            return crud.import_time_entries(db, batch, 1)

    with ThreadPoolExecutor(max_workers=2) as pool:
        results = list(pool.map(run, range(2)))
    assert sorted(result["imported"] for result in results) == [0, 1]
    with Session(engine) as db:
        assert db.query(models.TimeEntry).count() == 1
    engine.dispose()
