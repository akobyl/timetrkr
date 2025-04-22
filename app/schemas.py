from pydantic import BaseModel
from datetime import date, time
from typing import Optional, List


class TimeEntryBase(BaseModel):
    date: date
    start_time: time
    end_time: time


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
