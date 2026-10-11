import hashlib
import secrets
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
import app.models as models
import app.schemas as schemas
from .database import get_db

# to get a string like this run:
# openssl rand -hex 32
SECRET_KEY = "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 24 * 60 * 7  # 7 days

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")


def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password):
    return pwd_context.hash(password)


API_TOKEN_PREFIX = "ttk_"


def hash_api_token(token: str) -> str:
    # Tokens are high-entropy random strings, so a fast hash is sufficient.
    return hashlib.sha256(token.encode()).hexdigest()


def generate_api_token() -> str:
    return API_TOKEN_PREFIX + secrets.token_urlsafe(32)


def get_user(db: Session, username: str):
    return db.query(models.User).filter(models.User.username == username).first()


def authenticate_user(db: Session, username: str, password: str):
    user = get_user(db, username)
    if not user:
        return False
    if not verify_password(password, user.hashed_password):
        return False
    return user


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def _credentials_exception():
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )


def _user_from_api_token(db: Session, token: str):
    api_token = (
        db.query(models.ApiToken)
        .filter(models.ApiToken.token_hash == hash_api_token(token))
        .first()
    )
    if api_token is None:
        raise _credentials_exception()
    api_token.last_used_at = datetime.utcnow()
    db.commit()
    return api_token.user


def get_session_user(
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
):
    """Authenticate with a login (JWT) token only."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise _credentials_exception()
        token_data = schemas.TokenData(username=username)
    except JWTError:
        raise _credentials_exception()
    user = get_user(db, username=token_data.username)
    if user is None:
        raise _credentials_exception()
    return user


def get_current_user(
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
):
    """Authenticate with either an API token or a login (JWT) token."""
    if token.startswith(API_TOKEN_PREFIX):
        return _user_from_api_token(db, token)
    return get_session_user(token, db)
