# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TimeTrkr is a time tracking application with a Vue.js 3 frontend and FastAPI backend. The application follows a modern SPA architecture with component-based UI, state management via Pinia, and JWT authentication.

## Development Commands

### Frontend Development
```bash
cd frontend && npm install    # Install frontend dependencies
cd frontend && npm run dev    # Start frontend dev server (port 5173)
cd frontend && npm run build  # Build frontend for production
```

### Backend Development
```bash
pip install -e .             # Install backend dependencies (uses pyproject.toml)
python -m uvicorn app.main:app --reload  # Start backend dev server (port 8000)
```

### Full Development Stack
```bash
./start-dev.sh               # Start both frontend and backend dev servers
./build.sh                   # Build frontend and prepare for production
./run-prod.sh                # Run production server
```

### Testing
```bash
pytest                       # Run backend tests
pytest tests/test_database.py  # Run specific test file
```

## Architecture

### Frontend (Vue.js 3)
- **Location**: `/frontend/src/`
- **State Management**: Pinia stores in `/frontend/src/stores/`
  - `auth.js`: Authentication state and JWT token management
  - `timeEntries.js`: Time entry data and CRUD operations
- **Views**: Page-level components in `/frontend/src/views/`
- **Components**: Reusable components in `/frontend/src/components/`
- **API Service**: Axios-based API client in `/frontend/src/services/api.js`

### Backend (FastAPI)
- **Location**: `/app/`
- **Main Application**: `app/main.py` - FastAPI app with CORS and static file serving
- **Database**: SQLAlchemy models in `app/models.py`, CRUD operations in `app/crud.py`
- **Authentication**: JWT-based auth in `app/auth.py`
- **Schemas**: Pydantic models in `app/schemas.py`
- **Database**: SQLite database with Alembic migrations

### Database
- **Type**: SQLite (`db/timetrkr.db`)
- **Migrations**: Alembic-based migrations in `/migrations/`
- **Schema**: Users and TimeEntries with foreign key relationships

## Key Integration Points

### Development Mode
- Frontend dev server (Vite) runs on port 5173
- Backend runs on port 8000
- Vite proxy configuration handles API requests to backend

### Production Mode
- Vue app builds to `/static/dist/`
- FastAPI serves built frontend files directly
- Single server handles both frontend and API routes

### Authentication Flow
1. Login via `/token` endpoint with username/password
2. JWT token stored in localStorage
3. Axios interceptor adds Authorization header to requests
4. Backend validates JWT on protected routes
5. Auto-redirect to login on 401 responses

## File Structure Notes

- Frontend package.json is in `/frontend/` subdirectory
- Backend dependencies managed via `pyproject.toml` in root
- Static files served from `/static/` directory
- Built frontend assets placed in `/static/dist/`
- Database file located at `/db/timetrkr.db`

## Development Workflow

1. Use `./start-dev.sh` for development - starts both servers
2. Frontend changes hot-reload automatically
3. Backend changes require server restart (use --reload flag)
4. Database schema changes require Alembic migrations
5. Use `./build.sh` before production deployment