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


def get_time_entries(db: Session, user_id: int, entry_date: date = None, month_filter: str = None):
    query = db.query(models.TimeEntry).filter(models.TimeEntry.user_id == user_id)
    
    # Filter by specific date if provided
    if entry_date:
        query = query.filter(models.TimeEntry.date == entry_date)
    # If month_filter provided (in YYYY-MM format), filter by month
    elif month_filter:
        query = query.filter(models.TimeEntry.date.like(f"{month_filter}%"))
        
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


def get_time_summary(db: Session, user_id: int, start_date: date, end_date: date):
    """
    Calculate a summary of time entries for a user within a specified date range.
    Returns total minutes worked, count of entries, and count of unique days with entries.
    """
    # Get all entries in the date range
    entries = (
        db.query(models.TimeEntry)
        .filter(
            models.TimeEntry.user_id == user_id,
            models.TimeEntry.date >= start_date,
            models.TimeEntry.date <= end_date
        )
        .all()
    )
    
    if not entries:
        return {
            "start_date": start_date,
            "end_date": end_date,
            "total_minutes": 0,
            "entries_count": 0,
            "days_with_entries": 0
        }
    
    # Calculate total minutes
    total_minutes = 0
    unique_days = set()
    
    for entry in entries:
        # Convert start and end times to minutes
        start_minutes = entry.start_time.hour * 60 + entry.start_time.minute
        end_minutes = entry.end_time.hour * 60 + entry.end_time.minute
        
        # Handle overnight entries
        if end_minutes < start_minutes:
            end_minutes += 24 * 60
        
        # Add duration to total
        total_minutes += end_minutes - start_minutes
        
        # Track unique days
        unique_days.add(entry.date)
    
    return {
        "start_date": start_date,
        "end_date": end_date,
        "total_minutes": total_minutes,
        "entries_count": len(entries),
        "days_with_entries": len(unique_days)
    }
