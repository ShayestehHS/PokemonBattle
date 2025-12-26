#!/usr/bin/env python
"""Django's command-line utility for administrative tasks."""

import os
import sys

# Import coreapi compatibility shim before any other imports
# This fixes coreapi compatibility with Python 3.13+
try:
    import utils.coreapi_compat  # noqa: F401
except ImportError:
    pass  # If utils doesn't exist yet, continue normally


def main():
    """Run administrative tasks."""
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    execute_from_command_line(sys.argv)


if __name__ == "__main__":
    main()
