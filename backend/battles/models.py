from django.db import models
from django.utils import timezone
from uuid_extensions import uuid7

from battles.managers import BattleManager


class Battle(models.Model):
    STATUS_PENDING = "pending"
    STATUS_ACTIVE = "active"
    STATUS_COMPLETED = "completed"
    STATUS_CANCELLED = "cancelled"

    STATUS_CHOICES = [
        (STATUS_PENDING, "Pending"),
        (STATUS_ACTIVE, "Active"),
        (STATUS_COMPLETED, "Completed"),
        (STATUS_CANCELLED, "Cancelled"),
    ]

    id = models.UUIDField(
        primary_key=True, default=uuid7, editable=False, help_text="UUIDv7 primary key (time-sortable)"
    )
    player1 = models.ForeignKey(
        "players.Player",
        on_delete=models.CASCADE,
        related_name="battles_as_player1",
        help_text="First player in the battle",
    )
    player2 = models.ForeignKey(
        "players.Player",
        on_delete=models.CASCADE,
        related_name="battles_as_player2",
        help_text="Second player in the battle (usually AI)",
    )
    player1_pokemon = models.ForeignKey(
        "pokemon.PlayerPokemon",
        on_delete=models.PROTECT,
        related_name="+",
        help_text="Player 1's Pokemon in this battle",
    )
    player2_pokemon = models.ForeignKey(
        "pokemon.PlayerPokemon",
        on_delete=models.PROTECT,
        related_name="+",
        help_text="Player 2's Pokemon in this battle",
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_ACTIVE, help_text="Battle status")
    winner = models.ForeignKey(
        "players.Player",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="won_battles",
        help_text="Winner of the battle (null if not completed)",
    )
    current_turn_player = models.ForeignKey(
        "players.Player",
        on_delete=models.CASCADE,
        related_name="current_turn_battles",
        help_text="Player whose turn it is",
    )
    turn_number = models.PositiveIntegerField(default=1, help_text="Current turn number")
    player1_current_hp = models.PositiveIntegerField(help_text="Player 1's current HP")
    player2_current_hp = models.PositiveIntegerField(help_text="Player 2's current HP")
    player1_potions = models.PositiveIntegerField(default=3, help_text="Player 1's remaining potions")
    player1_x_attack = models.PositiveIntegerField(default=1, help_text="Player 1's remaining X-Attack items")
    player1_x_defense = models.PositiveIntegerField(default=1, help_text="Player 1's remaining X-Defense items")
    player2_potions = models.PositiveIntegerField(default=3, help_text="Player 2's remaining potions")
    player2_x_attack = models.PositiveIntegerField(default=1, help_text="Player 2's remaining X-Attack items")
    player2_x_defense = models.PositiveIntegerField(default=1, help_text="Player 2's remaining X-Defense items")
    player1_attack_boost = models.PositiveIntegerField(default=0, help_text="Player 1's remaining attack boost turns")
    player1_defense_boost = models.PositiveIntegerField(default=0, help_text="Player 1's remaining defense boost turns")
    player2_attack_boost = models.PositiveIntegerField(default=0, help_text="Player 2's remaining attack boost turns")
    player2_defense_boost = models.PositiveIntegerField(default=0, help_text="Player 2's remaining defense boost turns")
    created_at = models.DateTimeField(auto_now_add=True, help_text="When the battle was created")
    completed_at = models.DateTimeField(null=True, blank=True, help_text="When the battle was completed")

    objects = BattleManager()

    class Meta:
        db_table = "battles"
        verbose_name = "Battle"
        verbose_name_plural = "Battles"
        ordering = ["-id"]
        indexes = [
            models.Index(fields=["player1", "status"], name="battle_player1_status_idx"),
            models.Index(fields=["player2", "status"], name="battle_player2_status_idx"),
            models.Index(fields=["status", "-created_at"], name="battle_status_created_idx"),
        ]

    def __str__(self) -> str:
        return f"Battle {self.id} - {self.player1.username} vs {self.player2.username}"

    def is_player_turn(self, player):
        return self.current_turn_player == player

    def get_opponent(self, player):
        if player == self.player1:
            return self.player2
        return self.player1

    def get_player_pokemon(self, player):
        if player == self.player1:
            return self.player1_pokemon
        return self.player2_pokemon

    def get_current_hp(self, player):
        if player == self.player1:
            return self.player1_current_hp
        return self.player2_current_hp

    def set_current_hp(self, player, hp):
        if player == self.player1:
            self.player1_current_hp = max(0, hp)
        else:
            self.player2_current_hp = max(0, hp)

    def complete(self, winner):
        self.status = self.STATUS_COMPLETED
        self.winner = winner
        self.completed_at = timezone.now()
        self.save(update_fields=["status", "winner", "completed_at"])


class BattleTurn(models.Model):
    ACTION_ATTACK = "attack"
    ACTION_DEFEND = "defend"

    ACTION_CHOICES = [
        (ACTION_ATTACK, "Attack"),
        (ACTION_DEFEND, "Defend"),
    ]

    id = models.UUIDField(
        primary_key=True, default=uuid7, editable=False, help_text="UUIDv7 primary key (time-sortable)"
    )
    battle = models.ForeignKey(
        Battle,
        on_delete=models.CASCADE,
        related_name="turns",
        help_text="The battle this turn belongs to",
    )
    player = models.ForeignKey(
        "players.Player",
        on_delete=models.CASCADE,
        related_name="battle_turns",
        help_text="The player who made this action",
    )
    turn_number = models.PositiveIntegerField(help_text="The turn number this action occurred on")
    action = models.CharField(max_length=10, choices=ACTION_CHOICES, help_text="Action taken (attack or defend)")
    damage = models.PositiveIntegerField(default=0, help_text="Damage dealt in this turn (0 if defend or miss)")
    is_critical = models.BooleanField(default=False, help_text="Whether this was a critical hit")
    is_super_effective = models.BooleanField(default=False, help_text="Whether this was super effective")
    message = models.CharField(max_length=255, help_text="Turn message/description")

    class Meta:
        db_table = "battle_turns"
        verbose_name = "Battle Turn"
        verbose_name_plural = "Battle Turns"
        ordering = ["turn_number", "id"]
        indexes = [
            models.Index(fields=["battle", "turn_number"], name="battle_turn_battle_turn_idx"),
        ]

    def __str__(self) -> str:
        return f"Turn {self.turn_number} - {self.player.username} - {self.action}"
