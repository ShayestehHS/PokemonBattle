from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.db import models
from uuid_extensions import uuid7

from players.managers import PlayerManager


class Player(AbstractBaseUser, PermissionsMixin):
    id = models.UUIDField(
        primary_key=True, default=uuid7, editable=False, help_text="UUIDv7 primary key (time-sortable)"
    )
    username = models.CharField(max_length=150, unique=True, help_text="Required. 150 characters or fewer.")
    wins = models.PositiveIntegerField(default=0, help_text="Total number of battles won")
    losses = models.PositiveIntegerField(default=0, help_text="Total number of battles lost")
    created_at = models.DateTimeField(auto_now_add=True, help_text="When the player account was created")
    is_active = models.BooleanField(default=True, help_text="Whether this player account is active")
    is_staff = models.BooleanField(default=False, help_text="Whether the player can access the admin site")
    active_pokemon = models.ForeignKey(
        "pokemon.PlayerPokemon",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="active_for_players",
        help_text="The active Pokemon for battles",
    )

    objects = PlayerManager()

    USERNAME_FIELD = "username"
    REQUIRED_FIELDS = []

    class Meta:
        db_table = "players"
        verbose_name = "Player"
        verbose_name_plural = "Players"
        ordering = ["-id"]
        indexes = [
            # Composite index for scoreboard queries (Player.objects.order_by('-wins', 'losses'))
            models.Index(fields=["-wins", "losses"], name="player_scoreboard_idx"),
        ]

    def __str__(self) -> str:
        return self.username
