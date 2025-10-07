# syntax=docker/dockerfile:1.7

FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    DJANGO_SETTINGS_MODULE=config.settings

WORKDIR /app

# Install Node.js, npm, and system dependencies
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        build-essential \
        libpq-dev \
        curl \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/ ./

# Copy frontend code and build it
COPY frontend/package*.json /tmp/frontend/
WORKDIR /tmp/frontend
RUN npm install

COPY frontend/ /tmp/frontend/
RUN npm run build

# Move frontend build to Django static folder
WORKDIR /app
RUN mkdir -p static/frontend \
    && cp -r /tmp/frontend/dist/* static/frontend/ \
    && rm -rf /tmp/frontend

# Collect static files (Django + React build)
RUN python manage.py collectstatic --noinput

EXPOSE 8000

# Run gunicorn
CMD ["sh", "-c", "gunicorn config.wsgi:application --bind 0.0.0.0:${PORT:-8000}"]
