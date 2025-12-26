import os
import tempfile

from config.settings import *  # noqa: F403, F401

# Configure logging to show errors in tests
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "verbose": {
            "format": "{levelname} {asctime} {module} {process:d} {thread:d} {message}",
            "style": "{",
            "datefmt": "%Y-%m-%d %H:%M:%S",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "verbose",
            "level": "ERROR",
        },
    },
    "root": {
        "handlers": ["console"],
        "level": "ERROR",
    },
    "loggers": {
        "django": {
            "handlers": ["console"],
            "level": "ERROR",
            "propagate": False,
        },
        "django.request": {
            "handlers": ["console"],
            "level": "ERROR",
            "propagate": False,
        },
        "django.server": {
            "handlers": ["console"],
            "level": "ERROR",
            "propagate": False,
        },
        "battles": {
            "handlers": ["console"],
            "level": "ERROR",
            "propagate": False,
        },
        "utils": {
            "handlers": ["console"],
            "level": "ERROR",
            "propagate": False,
        },
        "utils.exceptions": {
            "handlers": ["console"],
            "level": "ERROR",
            "propagate": False,
        },
    },
}

# Disable static files collection for tests
STATICFILES_STORAGE = None

# Disable template caching
TEMPLATES[0]["OPTIONS"]["debug"] = True  # noqa: F405

# Override database to use SQLite file-based database (can be reused with --reuse-db)
# Using a file instead of :memory: allows database reuse across test runs

# Use a temporary file for the test database
TEST_DB_FILE = os.path.join(tempfile.gettempdir(), "test_pokemon_battle.db")

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": TEST_DB_FILE,
        "OPTIONS": {
            "timeout": 20,  # Prevent database locked errors
        },
        "CONN_MAX_AGE": 0,  # Don't keep connections open between tests
    }
}

# Use dummy cache for tests
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.dummy.DummyCache",
    }
}

# Disable migrations
# This creates tables directly from models without running migrations
MIGRATION_MODULES = {
    "players": None,
    "pokemon": None,
    "battles": None,
    "scoreboard": None,
    "logs": None,
}
