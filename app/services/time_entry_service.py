from typing import List, Optional
from datetime import date
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app import models, schemas, crud


class TimeEntryService:
    """Service layer for time entry business logic"""

    def __init__(self, db: Session):
        self.db = db

    def create_time_entry(
        self, time_entry: schemas.TimeEntryCreate, user_id: int
    ) -> models.TimeEntry:
        """Create a new time entry for a user"""
        return crud.create_time_entry(self.db, time_entry, user_id)

    def get_time_entries(
        self,
        user_id: int,
        entry_date: Optional[date] = None,
        month_filter: Optional[str] = None,
    ) -> List[models.TimeEntry]:
        """Get time entries for a user with optional filters"""
        return crud.get_time_entries(self.db, user_id, entry_date, month_filter)

    def get_time_entry(self, time_entry_id: int, user_id: int) -> models.TimeEntry:
        """Get a specific time entry by ID, ensuring it belongs to the user"""
        entry = crud.get_time_entry(self.db, time_entry_id, user_id)
        if not entry:
            raise HTTPException(status_code=404, detail="Time entry not found")
        return entry

    def update_time_entry(
        self,
        time_entry_id: int,
        user_id: int,
        time_entry_update: schemas.TimeEntryCreate,
    ) -> models.TimeEntry:
        """Update a time entry"""
        updated_entry = crud.update_time_entry(
            self.db, time_entry_id, user_id, time_entry_update
        )
        if not updated_entry:
            raise HTTPException(status_code=404, detail="Time entry not found")
        return updated_entry

    def delete_time_entry(self, time_entry_id: int, user_id: int) -> None:
        """Delete a time entry"""
        success = crud.delete_time_entry(self.db, time_entry_id, user_id)
        if not success:
            raise HTTPException(status_code=404, detail="Time entry not found")

    def get_time_summary(
        self, user_id: int, start_date: date, end_date: date
    ) -> schemas.TimeSummary:
        """Get time summary for a date range"""
        if start_date > end_date:
            raise HTTPException(
                status_code=400, detail="Start date cannot be after end date"
            )

        return crud.get_time_summary(self.db, user_id, start_date, end_date)
