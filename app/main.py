from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date, timedelta
import os

from app import models, schemas, crud, auth
from app.database import get_db

FRONTEND_DIR = os.path.join(os.path.dirname(__file__), "..", "static")

app = FastAPI(title="TimeTrkr")


if os.path.exists("static"):
    app.mount("/static", StaticFiles(directory="static"), name="static")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files
if os.path.exists("static"):
    app.mount("/static", StaticFiles(directory="static"), name="static")


@app.post("/token", response_model=schemas.Token)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)
):
    user = auth.authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


@app.post("/users/", response_model=schemas.User)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_username(db, username=user.username)
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    return crud.create_user(db=db, user=user)


@app.get("/users/me/", response_model=schemas.User)
def read_users_me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user


@app.post("/time-entries/", response_model=schemas.TimeEntry)
def create_time_entry(
    time_entry: schemas.TimeEntryCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    return crud.create_time_entry(db=db, time_entry=time_entry, user_id=current_user.id)


@app.get("/time-entries/", response_model=List[schemas.TimeEntry])
def read_time_entries(
    entry_date: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    print(f"Getting time entries for user {current_user.id}, date filter: {entry_date}")
    entries = crud.get_time_entries(db=db, user_id=current_user.id, entry_date=entry_date)
    print(f"Found {len(entries)} entries")
    for entry in entries:
        print(f"Entry: id={entry.id}, date={entry.date}, start={entry.start_time}, end={entry.end_time}")
    return entries


@app.put("/time-entries/{time_entry_id}", response_model=schemas.TimeEntry)
def update_time_entry(
    time_entry_id: int,
    time_entry: schemas.TimeEntryCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    db_time_entry = crud.update_time_entry(
        db=db,
        time_entry_id=time_entry_id,
        user_id=current_user.id,
        time_entry_update=time_entry,
    )
    if db_time_entry is None:
        raise HTTPException(status_code=404, detail="Time entry not found")
    return db_time_entry


@app.delete("/time-entries/{time_entry_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_time_entry(
    time_entry_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    success = crud.delete_time_entry(
        db=db, time_entry_id=time_entry_id, user_id=current_user.id
    )
    if not success:
        raise HTTPException(status_code=404, detail="Time entry not found")
    return None


@app.get("/time-summary/", response_model=schemas.TimeSummary)
def get_time_summary(
    start_date: date,
    end_date: date,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    """
    Get a summary of time entries within a date range.
    Returns total minutes, entry count, and days with entries.
    """
    print(f"Getting time summary for user {current_user.id}, date range: {start_date} to {end_date}")
    
    if start_date > end_date:
        raise HTTPException(
            status_code=400, 
            detail="Start date cannot be after end date"
        )
    
    summary = crud.get_time_summary(
        db=db, 
        user_id=current_user.id, 
        start_date=start_date, 
        end_date=end_date
    )
    
    print(f"Time summary results: {summary}")
    return summary


@app.get("/api/hello")
async def root():
    return {"message": "Welcome to the TimeTrkr API"}


@app.get("/{full_path:path}", include_in_schema=False)
async def serve_frontend_app(full_path: str):
    index_path = os.path.join(FRONTEND_DIR, "index.html")

    if os.path.exists(index_path):
        return FileResponse(index_path)

    else:
        return HTTPException(status_code=500, detail="index file not found")
