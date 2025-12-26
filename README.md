# PokemonBattle

A turn-based Pokemon battle simulation API built with Django REST Framework.

## Project Structure

- `backend/`: Django REST Framework API
- `nginx/`: Nginx reverse proxy configuration
- `docker-compose.yml`: Docker Compose configuration for the entire stack

## Getting Started

### Prerequisites

- Docker and Docker Compose

### Quick Start with Docker

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd PokemonBattle
   ```

2. **Run with Docker Compose:**
   ```bash
   docker-compose up --build
   ```

3. **Seed the database:**
   After the backend container is running, seed the database with Pokemon data:
   ```bash
   docker-compose exec backend python manage.py seed_all
   ```

4. **Access the application:**
   - Backend API: [http://localhost/api](http://localhost/api)
   - API Documentation: [http://localhost/api/docs](http://localhost/api/docs)
   - API Health Check: [http://localhost/health/](http://localhost/health/)

## Development

### Backend Setup (Local)

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create and activate a virtual environment:
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Run migrations and seed the database:
   ```bash
   python manage.py migrate
   python manage.py seed_all
   ```

5. Start the development server:
   ```bash
   python manage.py runserver
   ```

## Setup Instructions

### Required Secrets

Before running the application, you need to create the following secret files:

1. **Create the secrets directory:**
   ```bash
   mkdir secrets
   ```

2. **Create `secrets/django_secret_key.txt`:**
   ```bash
   # Generate a secure Django secret key
   # You can use: python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
   echo "your-secret-key-here" > secrets/django_secret_key.txt
   ```

3. **Create `secrets/db_password.txt`:**
   ```bash
   echo "your-database-password-here" > secrets/db_password.txt
   ```

**Note:** These files are required for Docker Compose to start the services. Make sure to use strong, unique values for production environments.

## License

MIT
