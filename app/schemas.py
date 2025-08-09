from pydantic import BaseModel, field_validator, model_validator
from datetime import date, time
from typing import Optional, List


class TimeEntryBase(BaseModel):
    date: date
    start_time: time
    end_time: time

    # Validators to ensure time is always without seconds and on 5-minute increments
    @field_validator("start_time", "end_time")
    @classmethod
    def format_time_without_seconds(cls, v):
        if isinstance(v, time):
            # Create a new time object with seconds and microseconds set to zero
            return time(hour=v.hour, minute=v.minute)
        return v

    @field_validator("start_time", "end_time")
    @classmethod
    def validate_five_minute_increment(cls, v):
        if isinstance(v, time):
            if v.minute % 5 != 0:
                raise ValueError(
                    "Time must be on 5-minute increments (e.g., 9:00, 9:05, 9:10)"
                )
        return v

    @model_validator(mode="after")
    def validate_start_before_end(self):
        start_time = self.start_time
        end_time = self.end_time

        if start_time and end_time:
            # Convert times to minutes for easy comparison
            start_minutes = start_time.hour * 60 + start_time.minute
            end_minutes = end_time.hour * 60 + end_time.minute

            # Handle overnight entries (end time next day)
            if end_minutes <= start_minutes:
                # Only allow overnight if end_time is reasonably early (before 6 AM)
                if end_time.hour >= 6:
                    raise ValueError(
                        "Start time must be before end time. For overnight entries, end time must be before 6:00 AM"
                    )

        return self


class TimeEntryCreate(TimeEntryBase):
    pass


class TimeEntryResponse(BaseModel):
    """Schema for reading time entries - no validation applied"""

    id: int
    date: date
    start_time: time
    end_time: time
    user_id: int

    class Config:
        from_attributes = True


class TimeEntry(TimeEntryBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True


class UserBase(BaseModel):
    username: str


class UserCreate(UserBase):
    password: str


class User(UserBase):
    id: int
    time_entries: List[TimeEntryResponse] = []

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    username: Optional[str] = None


class TimeSummary(BaseModel):
    start_date: date
    end_date: date
    total_minutes: int
    entries_count: int
    days_with_entries: int
