from typing import Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app import models, schemas, crud


class UserService:
    """Service layer for user-related business logic"""

    def __init__(self, db: Session):
        self.db = db

    def create_user(self, user: schemas.UserCreate) -> models.User:
        """Create a new user, checking for existing username"""
        existing_user = crud.get_user_by_username(self.db, user.username)
        if existing_user:
            raise HTTPException(status_code=400, detail="Username already registered")

        return crud.create_user(self.db, user)

    def get_user_by_username(self, username: str) -> Optional[models.User]:
        """Get user by username"""
        return crud.get_user_by_username(self.db, username)

    def get_user_by_id(self, user_id: int) -> Optional[models.User]:
        """Get user by ID"""
        return crud.get_user(self.db, user_id)
