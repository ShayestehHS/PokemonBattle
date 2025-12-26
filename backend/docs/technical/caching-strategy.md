# Caching Strategy

## Redis-Based View Caching

Implemented sophisticated caching layer using Redis with prefix-based cache invalidation for optimal performance and data consistency.

### Custom Cache Decorator

**Implementation:**

```python
def cache_page_with_prefix(prefix_key, timeout=None):
    """
    Decorator that caches a view with a prefix key for cache invalidation.

    Args:
        prefix_key: The cache prefix key (e.g., 'pokemon', 'pokemon_type')
        timeout: Cache timeout in seconds (defaults to CACHE_TTL from constants)
    """
    if timeout is None:
        timeout = CACHE_TTL  # 15 minutes default
    return cache_page(timeout, key_prefix=prefix_key)
```

**Usage in Views:**

```python
class PokemonViewSet(ReadOnlyModelViewSet):
    @method_decorator(cache_page_with_prefix(CACHE_PREFIX_POKEMON))
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @method_decorator(cache_page_with_prefix(CACHE_PREFIX_POKEMON))
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)
```

**Cache Prefixes:**

```python
CACHE_PREFIX_POKEMON = "pokemon"
CACHE_PREFIX_POKEMON_TYPE = "pokemon_type"
CACHE_PREFIX_TYPE_EFFECTIVENESS = "type_effectiveness"
```

---

## Cache Invalidation Strategy

### Prefix-Based Invalidation

**Implementation:**

```python
def invalidate_cache_prefix(prefix_key):
    """
    Invalidate all cache entries with the given prefix.
    Uses Redis SCAN for efficient pattern matching.
    """
    try:
        redis_client = cache._cache.get_client(write=True)

        # Pattern matching for cache keys
        patterns = [
            f"*:views.decorators.cache.cache_page.*:{prefix_key}:*",
            f"views.decorators.cache.cache_page.*:{prefix_key}:*"
        ]

        for pattern in patterns:
            cursor = 0
            while True:
                cursor, keys = redis_client.scan(cursor, match=pattern, count=100)
                if keys:
                    redis_client.delete(*keys)
                if cursor == 0:
                    break
    except Exception:
        # If cache operations fail, just continue silently
        pass
```

**Why SCAN Instead of KEYS:**
- ✅ **Non-blocking:** SCAN doesn't block Redis server
- ✅ **Production-safe:** Safe to use in production environments
- ✅ **Efficient:** Processes keys in batches (100 at a time)

### Automatic Cache Invalidation via Signals

**Django Signals Integration:**

```python
from django.db.models.signals import post_save
from django.dispatch import receiver

@receiver(post_save, sender=Pokemon)
def invalidate_pokemon_cache(sender, instance, **kwargs):
    """Invalidate Pokemon cache when Pokemon is created/updated."""
    invalidate_cache_prefix(CACHE_PREFIX_POKEMON)

@receiver(post_save, sender=PokemonType)
def invalidate_pokemon_type_cache(sender, instance, **kwargs):
    """Invalidate Pokemon type cache when type is created/updated."""
    invalidate_cache_prefix(CACHE_PREFIX_POKEMON_TYPE)
```

**Benefits:**
- ✅ **Automatic:** No manual cache invalidation needed
- ✅ **Consistent:** Cache always reflects database state
- ✅ **Reliable:** Works for all create/update operations

---

## Cache Configuration

### Redis Setup

```python
# settings.py
REDIS_URL = os.environ.get("REDIS_URL", "redis://localhost:6379/0")

CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.redis.RedisCache",
        "LOCATION": REDIS_URL,
    }
}

CACHE_TTL = 900  # 15 minutes
```

### Docker Configuration

```yaml
# docker-compose.yml
services:
  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    networks:
      - backend-network
    restart: unless-stopped
```
