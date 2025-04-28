#!/bin/bash

# Build the Vue.js frontend
echo "Building Vue.js frontend..."
cd frontend && npm install && npm run build

# Create directories if they don't exist
mkdir -p static/dist

echo "Build complete. Run 'python -m uvicorn app.main:app' to start the application."