# TimeTrkr Architecture

This document explains the architecture of the TimeTrkr application after refactoring to a modern component-based structure.

## Overview

TimeTrkr has been refactored into a modern Vue.js Single Page Application (SPA) with modular components, leveraging the latest best practices:

1. **Component-Based UI**: Using Vue 3's Composition API
2. **State Management**: Using Pinia for reactive state management
3. **Routing**: Using Vue Router for navigation between views
4. **API Services**: Using Axios for API calls with interceptors
5. **Build Tool**: Using Vite for fast development and optimized builds

The application follows a clear separation of concerns with the following structure:

## Directory Structure

```
frontend/
├── public/            # Static files that don't need processing
├── src/               # Application source code
│   ├── assets/        # Static assets like images, fonts, etc.
│   ├── components/    # Reusable Vue components
│   ├── router/        # Vue Router configuration
│   ├── services/      # API services
│   ├── stores/        # Pinia stores for state management
│   ├── views/         # Page components
│   ├── App.vue        # Root component
│   └── main.js        # Application entry point
├── index.html         # HTML template
└── vite.config.js     # Vite configuration
```

## Key Components

### Views

- `DashboardView.vue`: Main dashboard with time entry form and time panels
- `AnalysisView.vue`: Future time analysis features
- `HistoryView.vue`: Future comprehensive history view
- `ProfileView.vue`: User profile and settings
- `LoginView.vue`: User authentication

### Components

- `NavBar.vue`: Navigation bar with responsive design
- `TimeEntryForm.vue`: Form for adding new time entries
- `TodayTimePanel.vue`: Panel showing today's time entries
- `WeekTimePanel.vue`: Panel showing the current week's time entries
- `EditTimeEntryModal.vue`: Modal for editing time entries

### Stores

- `auth.js`: Authentication state and methods
- `timeEntries.js`: Time entry state and CRUD operations

### Services

- `api.js`: API communication with axios and utility functions

## Frontend-Backend Integration

The frontend and backend are integrated through:

1. **Development Mode**: Vite's proxy configuration allows the frontend dev server to proxy API requests to the backend server
2. **Production Mode**: The Vue app is built and served directly by FastAPI

## Authentication

Authentication is handled with JWT tokens:

1. User logs in with username/password
2. Backend validates and issues a JWT token
3. Frontend stores token in localStorage
4. API requests include token in Authorization header
5. Auth interceptor handles 401 errors automatically

## State Management

1. **Auth Store**: Manages user authentication state
2. **Time Entries Store**: Manages time entry data and operations

## Routing

Vue Router manages navigation with route guards that:
1. Redirect unauthenticated users to login
2. Prevent authenticated users from accessing the login page

## Development Workflow

1. Run `./start-dev.sh` to start both backend and frontend dev servers
2. Backend runs on http://localhost:8000
3. Frontend dev server runs on http://localhost:5173
4. API requests from the frontend are proxied to the backend

## Deployment

1. Run `./build.sh` to build the Vue frontend
2. The build output is placed in `/static/dist/`
3. FastAPI serves the built frontend files directly
4. API requests are handled by the same FastAPI application