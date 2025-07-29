# TimeTrkr

A modern, lightweight time tracking application designed for freelancers, remote workers, and teams who need accurate time management without complexity.

## Overview

TimeTrkr provides a clean, intuitive interface for tracking work hours with features designed around real-world usage patterns. Built with modern web technologies, it offers both simplicity for basic time tracking and depth for detailed analysis.

## Features

### Core Functionality
- **Dashboard**: Real-time overview of daily and weekly time entries
- **Time Entry Management**: Create, edit, and delete time entries with validation
- **Historical Data**: Comprehensive history view with filtering and sorting capabilities
- **Analytics**: Time tracking insights and productivity metrics
- **User Management**: Secure authentication and profile management

### User Experience
- **Smart Time Controls**: Increment/decrement buttons for 5 and 15-minute adjustments
- **Current Time Integration**: "Now" button sets current time rounded to nearest 5 minutes
- **Persistent Sessions**: 7-day authentication persistence for seamless usage
- **Responsive Design**: Optimized for desktop and mobile devices
- **Dark Mode Support**: Theme switching for comfortable usage

### Data Management
- **Automatic Validation**: Time entries validated for logical consistency
- **Overnight Tracking**: Support for entries spanning midnight
- **Export Capabilities**: CSV export functionality for external analysis
- **Real-time Updates**: Automatic refresh and synchronization

## Technical Architecture

### Frontend
- **Framework**: Vue.js 3 with Composition API
- **State Management**: Pinia stores with modular architecture
- **Routing**: Vue Router with authentication guards
- **Styling**: Bootstrap 5 with custom CSS variables
- **Build Tool**: Vite for fast development and optimized builds
- **HTTP Client**: Axios with request/response interceptors

### Backend
- **Framework**: FastAPI with automatic API documentation
- **Database**: SQLAlchemy ORM with SQLite database
- **Authentication**: JWT-based authentication system
- **Validation**: Pydantic schemas for request/response validation
- **Architecture**: Service layer pattern with separated concerns
- **API Design**: RESTful endpoints with consistent error handling

### Development Tools
- **Package Management**: UV for Python dependencies
- **Testing**: Pytest for backend testing
- **Code Quality**: Structured with linting and validation
- **Deployment**: Docker support with Kubernetes manifests

## Installation

### Prerequisites
- Python 3.12+
- Node.js 18+
- UV package manager (recommended) or pip

### Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd timetrkr
   ```

2. **Backend setup**
   ```bash
   # Using UV (recommended)
   uv sync
   
   # Or using pip
   pip install -e .
   ```

3. **Frontend setup**
   ```bash
   cd frontend
   npm install
   ```

4. **Database initialization**
   ```bash
   # Database migrations are handled automatically on first run
   ```

### Running the Application

#### Development Mode
```bash
# Start both frontend and backend
./start-dev.sh

# Or start individually:
# Backend: uv run uvicorn app.main:app --reload
# Frontend: cd frontend && npm run dev
```

#### Production Build
```bash
# Build frontend assets
./build.sh

# Run production server
./run-prod.sh
```

The application will be available at:
- Development: `http://localhost:5173` (frontend) + `http://localhost:8000` (API)
- Production: `http://localhost:8000`

## Usage

### Getting Started
1. Create a user account through the registration interface
2. Log in to access the time tracking dashboard
3. Create your first time entry using the entry form
4. View daily and weekly summaries in the dashboard
5. Access detailed history and analytics through the navigation menu

### Time Entry Management
- **Creating Entries**: Use the dashboard form with date, start time, and end time
- **Time Validation**: All times are automatically rounded to 5-minute increments
- **Editing**: Click any entry to modify details inline
- **Overnight Entries**: Supported for entries ending before 6:00 AM the next day

### Data Analysis
- **Daily Summaries**: Automatic calculation of daily totals
- **Weekly Views**: Monday-Sunday week summaries with expandable daily details
- **Historical Analysis**: Filter and sort entries by date ranges
- **Export Options**: CSV export for external analysis tools

## API Documentation

When running the application, interactive API documentation is available at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

### Key Endpoints
- `POST /token` - Authentication
- `GET /users/me` - Current user profile
- `GET /time-entries/` - List time entries (with optional filtering)
- `POST /time-entries/` - Create new time entry
- `PUT /time-entries/{id}` - Update existing entry
- `DELETE /time-entries/{id}` - Delete entry
- `GET /time-summary/` - Time summary for date range

## Deployment

### Docker Deployment
```bash
docker build -t timetrkr .
docker run -p 8000:8000 timetrkr
```

### Kubernetes Deployment
```bash
kubectl apply -f k8s/
```

## Testing

### Backend Tests
```bash
uv run pytest -v
```

### Frontend Tests
```bash
cd frontend
npm run test
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Commit your changes (`git commit -am 'Add new feature'`)
4. Push to the branch (`git push origin feature/new-feature`)
5. Create a Pull Request

### Development Guidelines
- Follow the existing code style and architecture patterns
- Write tests for new functionality
- Update documentation for API changes
- Ensure all tests pass before submitting PRs

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues, feature requests, or questions:
- Create an issue in the repository
- Check existing documentation and API references
- Review the development setup guide for common problems

---

**TimeTrkr** - Professional time tracking made simple.
