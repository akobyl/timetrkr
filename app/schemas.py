from pydantic import BaseModel, validator
from datetime import date, time
from typing import Optional, List


class TimeEntryBase(BaseModel):
    date: date
    start_time: time
    end_time: time
    
    # Validators to ensure time is always without seconds
    @validator('start_time', 'end_time')
    def format_time_without_seconds(cls, v):
        if isinstance(v, time):
            # Create a new time object with seconds and microseconds set to zero
            return time(hour=v.hour, minute=v.minute)
        return v


class TimeEntryCreate(TimeEntryBase):
    pass


class TimeEntry(TimeEntryBase):
    id: int
    user_id: int

    class Config:
        orm_mode = True


class UserBase(BaseModel):
    username: str


class UserCreate(UserBase):
    password: str


class User(UserBase):
    id: int
    time_entries: List[TimeEntry] = []

    class Config:
        orm_mode = True


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
