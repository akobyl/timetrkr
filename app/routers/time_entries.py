from typing import List, Optional
from datetime import date
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app import models, schemas, auth
from app.database import get_db
from app.services.time_entry_service import TimeEntryService

router = APIRouter(prefix="/time-entries", tags=["time-entries"])


@router.post("/", response_model=schemas.TimeEntry)
def create_time_entry(
    time_entry: schemas.TimeEntryCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    """Create a new time entry"""
    service = TimeEntryService(db)
    return service.create_time_entry(time_entry, current_user.id)


@router.get("/", response_model=List[schemas.TimeEntryResponse])
def read_time_entries(
    entry_date: Optional[date] = None,
    month_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    """Get time entries with optional date or month filtering"""
    service = TimeEntryService(db)
    return service.get_time_entries(current_user.id, entry_date, month_filter)


@router.put("/{time_entry_id}", response_model=schemas.TimeEntryResponse)
def update_time_entry(
    time_entry_id: int,
    time_entry: schemas.TimeEntryCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    """Update a time entry"""
    service = TimeEntryService(db)
    return service.update_time_entry(time_entry_id, current_user.id, time_entry)


@router.delete("/{time_entry_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_time_entry(
    time_entry_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    """Delete a time entry"""
    service = TimeEntryService(db)
    service.delete_time_entry(time_entry_id, current_user.id)
    return None


@router.get("/summary", response_model=schemas.TimeSummary)
def get_time_summary(
    start_date: date,
    end_date: date,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    """Get a summary of time entries within a date range"""
    service = TimeEntryService(db)
    return service.get_time_summary(current_user.id, start_date, end_date)