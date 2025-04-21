from sqlalchemy.orm import Session
import app.models as models
import app.schemas as schemas
import app.auth as auth
from datetime import date, time


def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = auth.get_password_hash(user.password)
    db_user = models.User(username=user.username, hashed_password=hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def get_user(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id == user_id).first()


def get_user_by_username(db: Session, username: str):
    return db.query(models.User).filter(models.User.username == username).first()


def create_time_entry(db: Session, time_entry: schemas.TimeEntryCreate, user_id: int):
    db_time_entry = models.TimeEntry(**time_entry.dict(), user_id=user_id)
    db.add(db_time_entry)
    db.commit()
    db.refresh(db_time_entry)
    return db_time_entry


def get_time_entries(db: Session, user_id: int, entry_date: date = None):
    query = db.query(models.TimeEntry).filter(models.TimeEntry.user_id == user_id)
    if entry_date:
        query = query.filter(models.TimeEntry.date == entry_date)
    return query.all()


def get_time_entry(db: Session, time_entry_id: int, user_id: int):
    return (
        db.query(models.TimeEntry)
        .filter(
            models.TimeEntry.id == time_entry_id, models.TimeEntry.user_id == user_id
        )
        .first()
    )


def update_time_entry(
    db: Session,
    time_entry_id: int,
    user_id: int,
    time_entry_update: schemas.TimeEntryCreate,
):
    db_time_entry = get_time_entry(db, time_entry_id, user_id)
    if db_time_entry:
        for key, value in time_entry_update.dict().items():
            setattr(db_time_entry, key, value)
        db.commit()
        db.refresh(db_time_entry)
    return db_time_entry


def delete_time_entry(db: Session, time_entry_id: int, user_id: int):
    db_time_entry = get_time_entry(db, time_entry_id, user_id)
    if db_time_entry:
        db.delete(db_time_entry)
        db.commit()
        return True
    return False
