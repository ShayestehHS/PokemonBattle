# Pokemon Battle API

A turn-based Pokemon battle simulation API built with Django REST Framework.

## Overview

The Pokemon Battle Arena is a Django REST Framework API backend featuring:
- **Backend**: Django REST Framework API with PostgreSQL and Redis
- **Infrastructure**: Docker Compose with Nginx reverse proxy

> **Note:** A frontend application has been implemented by vibe coding to showcase the backend features in a perfect way, demonstrating the API's capabilities and user experience.

## Quick Start

### Authentication

All endpoints except registration and login require JWT authentication.

```bash
# Register a new user
curl -X POST http://localhost:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{"username": "trainer", "password": "SecurePass123!"}'

# Login
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username": "trainer", "password": "SecurePass123!"}'

# Use the access token for authenticated requests
curl -X GET http://localhost:8000/api/players/me/ \
  -H "Authorization: Bearer <access_token>"
```

## Documentation Structure

This documentation is organized into multiple tabs for easy navigation:

### 🔌 [API Reference](api-reference/index.md)
Complete reference documentation for the Pokemon Battle API, including:
- **Endpoints** - All API endpoints with request/response examples, authentication requirements, and error handling
- **Data Models** - Detailed documentation of all Django models including fields, relationships, and methods
- **ER Diagrams** - Visual representation of database schema and model relationships

### 🛠️ [Technical Implementation](technical/index.md)
Showcase of advanced technologies and best practices organized by topic:
- **Code Quality & Automation** - Pre-commit hooks, Ruff linter, automated code quality
- **Database Optimization** - `select_related()`, composite indexes, query optimization
- **Caching Strategy** - Redis caching, prefix-based invalidation, performance metrics
- **Design Patterns** - Abstract Base Class pattern, type safety, extensible architecture
- **Testing Infrastructure** - pytest configuration, fixtures, comprehensive test coverage
- **Docker & Infrastructure** - Custom networks, secrets management, health checks
- **Management Commands** - Database seeding, command orchestration
- **API Architecture** - Rate limiting, UUIDv7, JWT authentication, API design

## Technology Stack

- **Backend Framework**: Django 5.x with Django REST Framework
- **Database**: PostgreSQL
- **Cache**: Redis
- **Authentication**: JWT (djangorestframework-simplejwt)
- **Testing**: pytest, pytest-django
- **Documentation**: MkDocs with Material theme
- **Containerization**: Docker & Docker Compose
- **Web Server**: Nginx

## Getting Started

### With Docker (Recommended)

```bash
# Start all services
docker-compose up --build

# Seed the database
docker-compose exec backend python manage.py seed_all

# Access the application
# Backend API: http://localhost/api
# API Docs: http://localhost/api/docs
```

### Local Development

```bash
# Backend setup
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_all
python manage.py runserver
```
