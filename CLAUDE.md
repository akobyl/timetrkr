# CLAUDE.md

This file provides comprehensive guidance to Claude Code (claude.ai/code) when working with the TimeTrkr codebase.

## Project Overview

TimeTrkr is a modern time tracking application featuring:
- **Frontend**: Vue.js 3 with Composition API, Vite build tool, Bootstrap 5 UI
- **Backend**: FastAPI with SQLAlchemy ORM, JWT authentication
- **Database**: SQLite with Alembic migrations
- **Architecture**: Single Page Application (SPA) with RESTful API

## Quick Start Commands

### Development Setup
```bash
# Initial setup
./dev-setup.sh              # One-time setup script
pip install -e .             # Install backend dependencies
cd frontend && npm install   # Install frontend dependencies

# Start development servers
./start-dev.sh               # Start both frontend (5173) and backend (8000)
```

### Development Commands

#### Frontend Development
```bash
cd frontend && npm run dev    # Start Vite dev server (http://localhost:5173)
cd frontend && npm run build  # Build for production
cd frontend && npm run preview # Preview production build
```

#### Backend Development
```bash
python -m uvicorn app.main:app --reload  # Start FastAPI server (http://localhost:8000)
python -m uvicorn app.main:app --reload --port 8080  # Custom port
```

#### Full Stack Operations
```bash
./start-dev.sh               # Start both servers in development mode
./build.sh                   # Build frontend and prepare for production
./run-prod.sh                # Run production server (single process)
```

#### Testing
```bash
pytest                       # Run all backend tests
pytest tests/test_database.py    # Run database tests
pytest tests/test_validation.py  # Run validation tests
pytest -v                   # Verbose test output
pytest -k "test_name"       # Run specific test
```

#### Database Operations
```bash
alembic upgrade head         # Apply all migrations
alembic revision --autogenerate -m "description"  # Create new migration
alembic downgrade -1         # Rollback one migration
alembic history              # View migration history
```

## Custom Claude Code Commands

Create these as custom slash commands in your Claude Code settings for faster development workflows:

### `/start-dev`
```markdown
Start the TimeTrkr development environment by running both frontend and backend servers. Check if they're already running first, then execute ./start-dev.sh if needed.
```

### `/quick-test`
```markdown
Run the TimeTrkr test suite with the following priority:
1. Run pytest for backend tests
2. If tests fail, show the errors and suggest fixes
3. If tests pass, confirm all tests are working
```

### `/db-migrate`
```markdown
Help with TimeTrkr database migrations:
1. Check current migration status with `alembic current`
2. If changes detected, create migration with `alembic revision --autogenerate -m "description"`  
3. Apply migrations with `alembic upgrade head`
4. Verify database schema is up to date
```

### `/full-build`
```markdown
Build TimeTrkr for production:
1. Run frontend build: `cd frontend && npm run build`
2. Execute build script: `./build.sh`
3. Verify static files are generated in /static/dist/
4. Run basic smoke tests if available
```

### `/debug-api`
```markdown
Debug TimeTrkr API issues:
1. Check if backend server is running on port 8000
2. Test authentication endpoints
3. Verify database connectivity
4. Check recent log entries for errors
```

### `/check-deps`
```markdown
Verify TimeTrkr dependencies are up to date:
1. Check backend dependencies in pyproject.toml
2. Check frontend dependencies in frontend/package.json
3. Look for any security vulnerabilities
4. Suggest updates if needed
```

## Architecture

### Project Structure
```
timetrkr/
├── app/                     # FastAPI backend application
│   ├── main.py             # FastAPI app entry point
│   ├── models.py           # SQLAlchemy database models
│   ├── crud.py             # Database CRUD operations
│   ├── schemas.py          # Pydantic request/response models
│   ├── auth.py             # JWT authentication logic
│   ├── database.py         # Database connection and session
│   ├── routers/            # API route modules
│   │   ├── auth.py         # Authentication routes
│   │   ├── time_entries.py # Time entry CRUD routes
│   │   └── users.py        # User management routes
│   └── services/           # Business logic layer
│       ├── time_entry_service.py
│       └── user_service.py
├── frontend/               # Vue.js 3 frontend application
│   ├── src/
│   │   ├── components/     # Reusable Vue components
│   │   ├── views/          # Page-level components
│   │   ├── stores/         # Pinia state management
│   │   ├── services/       # API client and utilities
│   │   ├── router/         # Vue Router configuration
│   │   └── utils/          # Helper functions
│   ├── package.json        # Frontend dependencies
│   └── vite.config.js      # Vite build configuration
├── db/                     # Database files
├── migrations/             # Alembic database migrations
├── tests/                  # Backend test files
├── static/                 # Static assets and built frontend
└── k8s/                    # Kubernetes deployment manifests
```

### Frontend (Vue.js 3)
- **Framework**: Vue 3 with Composition API and `<script setup>` syntax
- **Build Tool**: Vite for fast development and optimized builds
- **UI Framework**: Bootstrap 5 with Bootstrap Icons
- **State Management**: Pinia stores for reactive state management
  - `auth.js`: User authentication, JWT token management
  - `timeEntries.js`: Time entry data, CRUD operations
  - `theme.js`: Dark/light mode theme management
  - `timeEntryForm.js`: Form state for time entry creation/editing
- **Key Views**:
  - `DashboardView.vue`: Main time tracking interface with start/stop functionality
  - `HistoryView.vue`: Historical time entries with filtering and editing
  - `AnalysisView.vue`: Time tracking analytics with Chart.js visualizations
  - `ProfileView.vue`: User profile and settings management
  - `LoginView.vue`: Authentication interface
- **Core Components**:
  - `EditTimeEntryModal.vue`: Modal for editing existing time entries
  - `TimeEntryForm.vue`: Reusable form for time entry creation/editing
  - `TodayTimePanel.vu`: Today's time summary with visual indicators
  - `WeekTimePanel.vue`: Weekly time tracking overview
  - `LastTimeEntryEdit.vue`: Quick edit panel for the most recent entry
  - `NavBar.vue`: Navigation with user menu and theme toggle
- **Services**: Axios-based API client with request/response interceptors

### Backend (FastAPI)
- **Framework**: FastAPI with automatic OpenAPI documentation
- **Database**: SQLAlchemy ORM with SQLite database
- **Authentication**: JWT tokens with bcrypt password hashing
- **API Structure**:
  - Modular router design for better organization
  - Pydantic schemas for request/response validation
  - Service layer for business logic separation
  - CRUD operations abstracted into reusable functions
- **Key Models**:
  - `User`: User accounts with hashed passwords
  - `TimeEntry`: Time tracking records with start/end times, descriptions
- **Security**: CORS configuration, password hashing, JWT token validation

### Database
- **Type**: SQLite for simplicity and portability (`db/timetrkr.db`)
- **Migrations**: Alembic for schema versioning and updates
- **Schema**: 
  - Users table with authentication data
  - Time entries table with foreign key to users
  - Indexes on frequently queried columns (user_id, date ranges)

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

## Deployment

### Docker Deployment
- `Dockerfile` provided for containerized deployment
- Kubernetes manifests available in `/k8s/` directory
- Production build script: `./run-prod.sh`

### Frontend Technologies
- **Vue 3**: Progressive JavaScript framework
- **Vite**: Build tool and dev server
- **Bootstrap 5**: CSS framework with Bootstrap Icons
- **Chart.js**: Data visualization library
- **Pinia**: State management
- **Vue Router**: Client-side routing
- **Axios**: HTTP client

### Backend Technologies
- **FastAPI**: Modern Python web framework with automatic API documentation
- **SQLAlchemy**: Python SQL toolkit and ORM for database operations
- **Alembic**: Database migration tool for schema versioning
- **Pydantic**: Data validation using Python type annotations
- **Python-JOSE**: JWT token handling for authentication
- **Passlib**: Password hashing library with bcrypt support
- **Pytest**: Testing framework for backend unit and integration tests

## Troubleshooting & Common Issues

### Development Server Issues

#### Frontend server won't start (port 5173)
```bash
# Check if port is in use
lsof -i :5173
# Kill process if needed
kill -9 <PID>
# Clear npm cache and reinstall
cd frontend && rm -rf node_modules package-lock.json && npm install
```

#### Backend server won't start (port 8000)
```bash
# Check if port is in use
lsof -i :8000
# Check if virtual environment is activated
which python
# Reinstall dependencies
pip install -e .
```

### Database Issues

#### Migration errors
```bash
# Check current migration status
alembic current
# Reset to specific revision
alembic downgrade <revision_id>
# Delete migration files and recreate
rm migrations/versions/*.py
alembic revision --autogenerate -m "fresh start"
```

#### Database locked errors
```bash
# Check for hanging connections
ps aux | grep python
# Remove database file and recreate (DEVELOPMENT ONLY)
rm db/timetrkr.db
alembic upgrade head
```

### Authentication Issues

#### JWT token problems
- Check token expiration in browser localStorage
- Verify JWT_SECRET in environment variables
- Clear browser localStorage and login again

#### CORS errors
- Ensure frontend is running on localhost:5173
- Check CORS settings in `app/main.py`
- Verify API base URL in frontend configuration

### Build and Deployment Issues

#### Frontend build fails
```bash
cd frontend
npm run build -- --verbose  # Debug build issues
rm -rf dist node_modules && npm install  # Clean reinstall
```

#### Static files not serving
- Check `/static/dist/` directory exists after build
- Verify FastAPI static file configuration in `app/main.py`
- Ensure build script completed successfully

### Performance Issues

#### Slow database queries
- Check indexes on frequently queried columns
- Review N+1 query patterns in API endpoints
- Enable SQLAlchemy query logging for debugging

#### Frontend performance
- Check for unnecessary re-renders in Vue components
- Optimize API calls with proper loading states
- Review bundle size and consider code splitting

### Development Workflow Tips

#### Quick fixes for common problems
1. **Clear all caches**: `./dev-setup.sh` (runs cleanup and reinstall)
2. **Reset development environment**: Stop servers, clear caches, restart
3. **Database fresh start**: Delete DB file, run migrations, create test user
4. **Frontend issues**: Clear browser cache, check Network tab for API errors
5. **Backend issues**: Check FastAPI docs at http://localhost:8000/docs

#### Debugging API calls
- Use FastAPI interactive docs: http://localhost:8000/docs
- Check browser Network tab for request/response details
- Enable verbose logging in development mode
- Use `console.log` in frontend services for API debugging

## Development Best Practices

### Code Organization
- Follow existing patterns in the codebase
- Use composition API syntax for new Vue components
- Keep business logic in service layers
- Write tests for new features and bug fixes

### Git Workflow
- Create feature branches from main
- Use descriptive commit messages
- Test changes locally before committing
- Keep commits focused and atomic

### Security Guidelines
- Never commit sensitive data (tokens, passwords)
- Use environment variables for configuration
- Validate all user inputs on both frontend and backend
- Keep dependencies updated for security patches