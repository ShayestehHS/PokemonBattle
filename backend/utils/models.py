"""
Base models for the Pokemon Battle API.

This module provides the UUIDv7Model base class that all models should inherit from.
UUIDv7 is time-sortable and provides better indexing performance than UUID4.
PostgreSQL 17 has native support for UUIDv7.
"""

import uuid
from django.db import models


class UUIDv7Model(models.Model):
    """
    Abstract base model that uses UUIDv7 as the primary key.

    UUIDv7 advantages over UUID4:
    - Time-sortable: UUIDs created later are lexicographically greater
    - Better indexing: Sequential nature reduces B-tree page splits
    - Native PostgreSQL 17 support

    All models in this project should inherit from this class.
    """

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid7,
        editable=False,
        help_text="UUIDv7 primary key (time-sortable)"
    )

    class Meta:
        abstract = True

