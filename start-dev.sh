#!/bin/bash

# Run the dev setup script to handle static/index.html
./dev-setup.sh

# Start the FastAPI backend
echo "Starting FastAPI backend..."
uv run uvicorn app.main:app --reload &
BACKEND_PID=$!

# Start the Vue.js development server
echo "Starting Vue.js development server..."
cd frontend && npm run dev &
FRONTEND_PID=$!

# Handle Ctrl+C to stop both servers
cleanup() {
  echo "Stopping servers..."
  kill $BACKEND_PID $FRONTEND_PID

  # Restore the original index.html if backup exists
  if [ -f static/index.html.bak ]; then
    echo "Restoring original static/index.html..."
    mv static/index.html.bak static/index.html
  fi

  exit
}

trap cleanup INT

# Print instructions
echo ""
echo "================================================================"
echo "Development servers are running!"
echo "Access the Vue.js dev server at: http://localhost:5173"
echo "The FastAPI backend is available at: http://localhost:8000"
echo "Press Ctrl+C to stop both servers"
echo "================================================================"
echo ""

# Wait for both processes
wait

