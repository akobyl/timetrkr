# Multi-stage build for TimeTrkr
# Stage 1: Build the frontend
FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# Stage 2: Build the final application
FROM python:3.12-slim

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Create app directory and non-root user
WORKDIR /app
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Copy Python dependencies first for better layer caching
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-cache --no-dev

# Copy the backend application
COPY app/ ./app/
COPY alembic.ini ./
COPY migrations/ ./migrations/

# Copy built frontend from previous stage
COPY --from=frontend-builder /app/frontend/../static/dist ./static/dist

# Create database directory and set permissions
RUN mkdir -p /app/db && \
    chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:80/docs || exit 1

# Run the application
CMD ["/app/.venv/bin/uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "80"]
