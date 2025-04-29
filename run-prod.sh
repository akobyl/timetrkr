#!/bin/bash

# Default port (can be overridden by command line arg)
PORT=8000

# Allow custom port to be specified
if [ $# -eq 1 ]; then
  PORT=$1
fi

echo "Starting TimeTrkr in production mode on 0.0.0.0:$PORT"
echo "Press Ctrl+C to stop the server"

# Run the application with the specified host and port
uv run uvicorn app.main:app --host 0.0.0.0 --port $PORT

