# API Architecture

## Rate Limiting & Throttling

Implemented sophisticated rate limiting for external API calls to prevent abuse and ensure fair usage.

### Custom Throttle Class

```python
from rest_framework.throttling import UserRateThrottle

class PokeAPIThrottle(UserRateThrottle):
    """Custom throttle for PokeAPI endpoints."""
    scope = "pokeapi"
```

### Configuration

```python
# settings.py
REST_FRAMEWORK = {
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.UserRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {
        "user": "1000/day",      # General user rate limit
        "pokeapi": "60/min",      # PokeAPI specific limit
    },
}
```

### Usage

```python
class PokeAPIViewSet(ViewSet):
    permission_classes = [IsAuthenticated]
    throttle_classes = [PokeAPIThrottle]  # Applied to all actions

    @action(detail=False, methods=["get"])
    def list_pokemon(self, request):
        # Rate limited to 60 requests per minute
        pass
```

### Benefits

- ✅ **API Protection:** Prevents abuse of external PokeAPI
- ✅ **Cost Control:** Limits external API usage
- ✅ **Fair Usage:** Ensures all users get equal access
- ✅ **Resource Management:** Prevents server overload

### Throttle Response

When rate limit is exceeded:

```json
{
    "detail": "Request was throttled. Expected available in 45 seconds."
}
```

Status Code: `429 Too Many Requests`

---

## UUIDv7 Primary Keys

Implemented UUIDv7 (time-sortable UUIDs) for all models instead of sequential integers.

### Implementation

```python
from uuid_extensions import uuid7

class Pokemon(models.Model):
    id = models.UUIDField(
        primary_key=True,
        default=uuid7,
        editable=False,
        help_text="UUIDv7 primary key (time-sortable)"
    )
    # ... other fields ...
```

### Advantages

**1. Time-Sortable:**
- UUIDs are naturally ordered by creation time
- No need for separate `created_at` field for sorting
- Efficient for time-based queries

**2. Distributed Systems:**
- No central ID generation needed
- Works across multiple servers
- No ID conflicts in distributed environments

**3. Security:**
- No sequential IDs that reveal data volume
- Harder to guess or enumerate
- Better privacy protection

**4. Database Performance:**
- Better than UUIDv4 for indexing
- Time-based ordering improves query performance
- Efficient for range queries

### UUIDv7 Structure

```
UUIDv7 Format:
[Timestamp (48 bits)][Version (4 bits)][Random (12 bits)][Variant (2 bits)][Random (62 bits)]

Example: 018f1234-5678-7890-abcd-ef1234567890
         ^^^^^^^^
         Timestamp (sortable)
```

---

## JWT Authentication

Implemented JWT (JSON Web Token) authentication using `djangorestframework-simplejwt`.

### Configuration

```python
# settings.py
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=60),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
}
```

### Token Structure

**Access Token:**
- Short-lived (60 minutes)
- Used for API requests
- Contains user ID and permissions

**Refresh Token:**
- Long-lived (7 days)
- Used to obtain new access tokens
- Rotated on each use

### Authentication Flow

1. **Register/Login:** User receives access + refresh tokens
2. **API Requests:** Include access token in `Authorization` header
3. **Token Expiry:** Use refresh token to get new access token
4. **Token Rotation:** Refresh token is rotated on each use

### Usage Example

```python
# Login
POST /api/auth/login/
{
    "username": "trainer",
    "password": "SecurePass123!"
}

# Response
{
    "id": "uuid",
    "username": "trainer",
    "token": {
        "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
        "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
    }
}

# Authenticated Request
GET /api/players/me/
Headers: Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc...
```

---

## Filtering & Search

### Django-Filter Integration

```python
import django_filters

class PokemonFilter(django_filters.FilterSet):
    type = django_filters.CharFilter(
        field_name="primary_type__name",
        lookup_expr="iexact"
    )

    class Meta:
        model = Pokemon
        fields = ["type"]
```

### Usage

```bash
GET /api/pokemon/?type=fire
```

---

## API Documentation

### Auto-Generated Documentation

Using `drf-to-mkdoc` for automatic API documentation:

```python
REST_FRAMEWORK = {
    "DEFAULT_SCHEMA_CLASS": "drf_to_mkdoc.utils.schema.AutoSchema",
}
```

**Features:**
- Automatic endpoint discovery
- Request/response examples
- Interactive API testing
- Schema validation

---

## Performance Optimizations

### Query Optimization

- Use `select_related()` for ForeignKeys
- Use `prefetch_related()` for ManyToMany
- Optimize querysets in ViewSets

### Caching

- Cache frequently accessed endpoints
- Use prefix-based cache invalidation
- Implement cache warming strategies

### Pagination

- Use appropriate pagination class
- Cursor pagination for large datasets
- Page number pagination for smaller datasets
