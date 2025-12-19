from django.db import models
from uuid_extensions import uuid7

from pokemon.managers import PokemonManager


class PokemonType(models.Model):
    id = models.UUIDField(
        primary_key=True, default=uuid7, editable=False, help_text="UUIDv7 primary key (time-sortable)"
    )
    name = models.CharField(max_length=50, unique=True, help_text="Pokemon type name (e.g., fire, water, grass)")

    class Meta:
        db_table = "pokemon_types"
        verbose_name = "Pokemon Type"
        verbose_name_plural = "Pokemon Types"
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name


class TypeEffectiveness(models.Model):
    SUPER_EFFECTIVE = 2.0
    NORMAL = 1.0
    NOT_VERY_EFFECTIVE = 0.5
    NO_EFFECT = 0.0

    MULTIPLIER_CHOICES = [
        (SUPER_EFFECTIVE, "Super Effective (2x)"),
        (NORMAL, "Normal (1x)"),
        (NOT_VERY_EFFECTIVE, "Not Very Effective (0.5x)"),
        (NO_EFFECT, "No Effect (0x)"),
    ]

    id = models.UUIDField(
        primary_key=True, default=uuid7, editable=False, help_text="UUIDv7 primary key (time-sortable)"
    )
    attacker_type = models.ForeignKey(
        PokemonType,
        on_delete=models.CASCADE,
        related_name="attacking_effectiveness",
        help_text="The attacking Pokemon's type",
    )
    defender_type = models.ForeignKey(
        PokemonType,
        on_delete=models.CASCADE,
        related_name="defending_effectiveness",
        help_text="The defending Pokemon's type",
    )
    multiplier = models.FloatField(
        choices=MULTIPLIER_CHOICES,
        default=NORMAL,
        help_text="Damage multiplier: 2.0=super effective, 0.5=not very effective, 0=no effect",
    )

    class Meta:
        db_table = "type_effectiveness"
        verbose_name = "Type Effectiveness"
        verbose_name_plural = "Type Effectivenesses"
        constraints = [
            models.UniqueConstraint(
                fields=["attacker_type", "defender_type"],
                name="unique_type_matchup",
            ),
        ]

    def __str__(self) -> str:
        return f"{self.attacker_type} vs {self.defender_type}: {self.multiplier}x"


class Pokemon(models.Model):
    id = models.UUIDField(
        primary_key=True, default=uuid7, editable=False, help_text="UUIDv7 primary key (time-sortable)"
    )
    pokedex_number = models.PositiveIntegerField(unique=True, help_text="National Pokedex number")
    name = models.CharField(max_length=100, unique=True, help_text="Pokemon name")
    sprite_url = models.URLField(max_length=500, blank=True, help_text="URL to Pokemon sprite image")
    base_hp = models.PositiveIntegerField(help_text="Base HP stat")
    base_attack = models.PositiveIntegerField(help_text="Base Attack stat")
    base_defense = models.PositiveIntegerField(help_text="Base Defense stat")
    base_speed = models.PositiveIntegerField(help_text="Base Speed stat")
    primary_type = models.ForeignKey(
        PokemonType,
        on_delete=models.PROTECT,
        related_name="pokemon_primary",
        help_text="Primary Pokemon type",
    )
    secondary_type = models.ForeignKey(
        PokemonType,
        on_delete=models.PROTECT,
        related_name="pokemon_secondary",
        null=True,
        blank=True,
        help_text="Secondary Pokemon type (optional)",
    )
    created_at = models.DateTimeField(auto_now_add=True, help_text="When this Pokemon was added to the database")

    objects = PokemonManager()

    class Meta:
        db_table = "pokemon"
        verbose_name = "Pokemon"
        verbose_name_plural = "Pokemon"

    def __str__(self) -> str:
        return f"#{self.pokedex_number} {self.name}"
