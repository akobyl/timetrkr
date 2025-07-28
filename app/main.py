from fastapi import FastAPI, HTTPException, Depends
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import date
import os

from app import models, schemas, auth
from app.database import get_db
from app.routers import auth as auth_router, users, time_entries

# Define static directories
STATIC_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "static")
DIST_DIR = os.path.join(STATIC_DIR, "dist")

app = FastAPI(title="TimeTrkr")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "*",
    ],  # Add Vite dev server origins
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD", "PATCH"],
    allow_headers=[
        "Authorization",
        "Content-Type",
        "Accept",
        "Origin",
        "X-Requested-With",
    ],
    expose_headers=["Content-Length"],
    max_age=600,  # Cache preflight requests for 10 minutes
)

# Mount static directories
if os.path.exists(STATIC_DIR):
    app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

# Mount built Vue app if it exists
if os.path.exists(DIST_DIR):
    app.mount(
        "/assets",
        StaticFiles(directory=os.path.join(DIST_DIR, "assets")),
        name="assets",
    )

# Include routers
app.include_router(auth_router.router)
app.include_router(users.router)
app.include_router(time_entries.router)

# Keep time-summary endpoint in main for backward compatibility
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
    from app.services.time_entry_service import TimeEntryService
    service = TimeEntryService(db)
    return service.get_time_summary(current_user.id, start_date, end_date)


@app.get("/api/hello")
async def root():
    return {"message": "Welcome to the TimeTrkr API"}


@app.get("/{full_path:path}", include_in_schema=False)
async def serve_frontend_app(full_path: str):
    # First try to serve from the Vue dist directory
    if os.path.exists(DIST_DIR):
        index_path = os.path.join(DIST_DIR, "index.html")
        if os.path.exists(index_path):
            return FileResponse(index_path)

    # Fall back to the original static directory
    index_path = os.path.join(STATIC_DIR, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)

    # If neither exists, return an error
    raise HTTPException(status_code=500, detail="Frontend app not found")
