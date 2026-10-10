from datetime import datetime
from sqlalchemy import Column, Integer, String, ForeignKey, Time, Date, DateTime
from sqlalchemy.orm import relationship
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    time_entries = relationship("TimeEntry", back_populates="user")
    api_tokens = relationship(
        "ApiToken", back_populates="user", cascade="all, delete-orphan"
    )


class TimeEntry(Base):
    __tablename__ = "time_entries"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"))

    user = relationship("User", back_populates="time_entries")


class ApiToken(Base):
    """Long-lived, revocable token for programmatic API access.

    Only the SHA-256 hash of the token is stored; the plaintext is shown once.
    """

    __tablename__ = "api_tokens"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    token_hash = Column(String, unique=True, index=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    last_used_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="api_tokens")
