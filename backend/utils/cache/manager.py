from django.core.cache import cache
from django.views.decorators.cache import cache_page

from utils.cache.constants import CACHE_TTL


def cache_page_with_prefix(prefix_key, timeout=None):
    """
    Decorator that caches a view with a prefix key for cache invalidation.

    Args:
        prefix_key: The cache prefix key (e.g., 'pokemon', 'pokemon_type')
        timeout: Cache timeout in seconds (defaults to CACHE_TTL from constants)
    """
    if timeout is None:
        timeout = CACHE_TTL
    return cache_page(timeout, key_prefix=prefix_key)


def invalidate_cache_prefix(prefix_key):
    """
    Invalidate all cache entries with the given prefix.
    This function only works with Redis backend. It deletes all keys matching

    Args:
        prefix_key: The cache prefix key to invalidate
    """
    try:
        redis_client = cache._cache.get_client(write=True)

        # ToDo: Check which pattern is use in the cache_page in our version
        pattern1 = f"*:views.decorators.cache.cache_page.*:{prefix_key}:*"
        pattern2 = f"views.decorators.cache.cache_page.*:{prefix_key}:*"
        for pattern in (pattern1, pattern2):
            # Find matching keys in batch
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
