# Docker & Infrastructure

## Docker Compose with Custom Networks

Designed a production-ready multi-container architecture with security-focused network isolation.

### Network Architecture

```yaml
networks:
  frontend-network:
    driver: bridge
    # Public-facing network for Nginx and client applications

  backend-network:
    driver: bridge
    internal: true  # No external access - DB isolated
    # Private network for backend services
```

### Network Isolation Strategy

```yaml
services:
  nginx:
    networks:
      - frontend-network  # Public-facing network

  backend:
    networks:
      - frontend-network   # Can communicate with Nginx
      - backend-network    # Can access database

  postgres:
    networks:
      - backend-network    # Only accessible by backend
    # NOT accessible from internet or external networks

  redis:
    networks:
      - backend-network    # Only accessible by backend
```

### Security Benefits

- ✅ **Database Isolation:** PostgreSQL not exposed to external networks
- ✅ **Principle of Least Privilege:** Each service only accesses what it needs
- ✅ **Attack Surface Reduction:** Backend services hidden from public internet
- ✅ **Network Segmentation:** Public and private networks separated

---

## Docker Secrets Management

Implemented secure secret management using Docker Compose secrets.

### Secrets Configuration

```yaml
secrets:
  django_secret_key:
    file: ./secrets/django_secret_key.txt
  db_password:
    file: ./secrets/db_password.txt
```

### Usage in Services

```yaml
services:
  backend:
    secrets:
      - django_secret_key
      - db_password
    environment:
      - DJANGO_SECRET_KEY_FILE=/run/secrets/django_secret_key
      - POSTGRES_PASSWORD_FILE=/run/secrets/db_password

  postgres:
    secrets:
      - db_password
    environment:
      - POSTGRES_PASSWORD_FILE=/run/secrets/db_password
```

### Secret Reading in Django

```python
def read_secret(secret_name: str, default: str = "") -> str:
    """
    Read secret from Docker secret file or environment variable.

    Supports both Docker secrets (via file) and environment variables
    for local development.
    """
    secret_file = os.environ.get(f"{secret_name.upper()}_FILE")
    if secret_file and os.path.exists(secret_file):
        with open(secret_file, "r") as f:
            return f.read().strip()
    return os.environ.get(secret_name.upper(), default)

# Usage in settings.py
SECRET_KEY = read_secret("django_secret_key")
DATABASES = {
    "default": {
        "PASSWORD": read_secret("db_password", "postgres"),
    }
}
```

### Security Features

- ✅ **No Secrets in Code:** All secrets stored in files (excluded from Git)
- ✅ **Runtime Injection:** Secrets mounted at runtime, not in images
- ✅ **Environment Fallback:** Supports both Docker secrets and environment variables
- ✅ **Development Friendly:** Default values for local development
- ✅ **Git Ignored:** `secrets/` directory excluded from version control

---

## Health Checks & Service Dependencies

Implemented robust health checks and service dependency management.

### Backend Health Check

```yaml
services:
  backend:
    healthcheck:
      test: ["CMD", "python", "-c",
             "import urllib.request; "
             "urllib.request.urlopen('http://localhost:8000/health/').read()"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s
```

**Health Endpoint:**

```python
# config/urls.py
def health_check(request):
    return JsonResponse({"status": "ok"})
```

### Database Health Check

```yaml
services:
  postgres:
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d pokemon_battle"]
      interval: 10s
      timeout: 5s
      retries: 5
```

---

## Resource Management

### Memory Limits

```yaml
services:
  nginx:
    deploy:
      resources:
        limits:
          memory: 50M

  backend:
    deploy:
      resources:
        limits:
          memory: 512M

  postgres:
    deploy:
      resources:
        limits:
          memory: 1G

  redis:
    deploy:
      resources:
        limits:
          memory: 200M
```

### Restart Policies

```yaml
services:
  backend:
    restart: unless-stopped  # Restart unless manually stopped

  postgres:
    restart: unless-stopped

  redis:
    restart: unless-stopped
```

---

## Nginx Reverse Proxy

### Configuration

```nginx
upstream backend {
    server backend:8000;
}

server {
    listen 80;

    # API routes
    location /api {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://backend;
    }
}
```

### Benefits

- ✅ **Single Entry Point:** All traffic through port 80
- ✅ **Load Balancing:** Can add multiple backend instances
- ✅ **SSL Termination:** Easy to add SSL/TLS
- ✅ **Request Routing:** Smart routing based on URL patterns

---

## Volume Management

### Persistent Data

```yaml
volumes:
  postgres_data:
    # PostgreSQL data persists across container restarts
  redis_data:
    # Redis data persists across container restarts
```

### Usage

```yaml
services:
  postgres:
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    volumes:
      - redis_data:/data
```
