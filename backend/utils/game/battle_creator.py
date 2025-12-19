from __future__ import annotations

import random
from dataclasses import dataclass
from uuid import UUID

from battles.models import Battle
from players.models import Player
from pokemon.models import PlayerPokemon, Pokemon
from utils.game.exceptions import (
    NoOpponentAvailableException,
    NoPokemonException,
    OpponentNoPokemonException,
    OpponentNotFoundException,
    PokemonNotFoundException,
)


@dataclass
class BattleSetup:
    player1: Player
    player2: Player
    player1_pokemon: PlayerPokemon
    player2_pokemon: PlayerPokemon
    first_turn_player: Player


class BattleCreator:
    DEFAULT_POTIONS = 2
    DEFAULT_X_ATTACK = 1
    DEFAULT_X_DEFENSE = 1

    def __init__(self, user: Player, pokemon_id: UUID | None = None, opponent_id: UUID | None = None):
        self.user = user
        self.pokemon_id = pokemon_id
        self.opponent_id = opponent_id

    def create(self) -> Battle:
        player_pokemon = self._get_player_pokemon()
        opponent = self._get_opponent()
        opponent_pokemon = self._get_opponent_pokemon(opponent)
        setup = self._determine_turn_order(player_pokemon, opponent, opponent_pokemon)
        return self._create_battle(setup)

    def _get_player_pokemon(self) -> PlayerPokemon:
        if self.pokemon_id:
            return self._get_specific_pokemon()
        return self._get_active_pokemon()

    def _get_specific_pokemon(self) -> PlayerPokemon:
        try:
            return PlayerPokemon.objects.get(id=self.pokemon_id, player=self.user)
        except PlayerPokemon.DoesNotExist as err:
            raise PokemonNotFoundException() from err

    def _get_active_pokemon(self) -> PlayerPokemon:
        if not self.user.active_pokemon:
            raise NoPokemonException()
        return self.user.active_pokemon

    def _get_opponent(self) -> Player:
        if self.opponent_id:
            return self._get_specific_opponent()
        return self._get_random_opponent()

    def _get_specific_opponent(self) -> Player:
        try:
            return Player.objects.get(id=self.opponent_id)
        except Player.DoesNotExist as err:
            raise OpponentNotFoundException() from err

    def _get_random_opponent(self) -> Player:
        opponents = Player.objects.exclude(id=self.user.id).filter(active_pokemon__isnull=False)
        if not opponents.exists():
            # Create an AI opponent if none exist
            return self._create_ai_opponent()
        return random.choice(list(opponents))

    def _create_ai_opponent(self) -> Player:
        """Create an AI opponent player with a random Pokemon."""
        # Get a random Pokemon from the database
        pokemon_count = Pokemon.objects.count()
        if pokemon_count == 0:
            raise NoOpponentAvailableException("No Pokemon available in database. Please seed Pokemon first.")

        # Get a random Pokemon
        random_pokemon = Pokemon.objects.order_by("?").first()

        # Create AI opponent player
        ai_opponent, created = Player.objects.get_or_create(
            username="AI Trainer",
            defaults={
                "is_active": True,
            },
        )

        # If player already exists but has no active pokemon, create one
        if not ai_opponent.active_pokemon:
            # Check if this player already has this pokemon
            player_pokemon, _ = PlayerPokemon.objects.get_or_create(
                player=ai_opponent,
                pokemon=random_pokemon,
            )
            ai_opponent.active_pokemon = player_pokemon
            ai_opponent.save()

        return ai_opponent

    def _get_opponent_pokemon(self, opponent: Player) -> PlayerPokemon:
        if not opponent.active_pokemon:
            raise OpponentNoPokemonException()
        return opponent.active_pokemon

    def _determine_turn_order(
        self,
        player_pokemon: PlayerPokemon,
        opponent: Player,
        opponent_pokemon: PlayerPokemon,
    ) -> BattleSetup:
        player_speed = player_pokemon.pokemon.base_speed
        opponent_speed = opponent_pokemon.pokemon.base_speed

        if player_speed >= opponent_speed:
            return BattleSetup(
                player1=self.user,
                player2=opponent,
                player1_pokemon=player_pokemon,
                player2_pokemon=opponent_pokemon,
                first_turn_player=self.user,
            )
        else:
            return BattleSetup(
                player1=opponent,
                player2=self.user,
                player1_pokemon=opponent_pokemon,
                player2_pokemon=player_pokemon,
                first_turn_player=opponent,
            )

    def _create_battle(self, setup: BattleSetup) -> Battle:
        battle = Battle.objects.create(
            player1=setup.player1,
            player2=setup.player2,
            player1_pokemon=setup.player1_pokemon,
            player2_pokemon=setup.player2_pokemon,
            status=Battle.STATUS_ACTIVE,
            current_turn_player=setup.first_turn_player,
            turn_number=1,
            player1_current_hp=setup.player1_pokemon.pokemon.base_hp,
            player2_current_hp=setup.player2_pokemon.pokemon.base_hp,
            player1_potions=self.DEFAULT_POTIONS,
            player1_x_attack=self.DEFAULT_X_ATTACK,
            player1_x_defense=self.DEFAULT_X_DEFENSE,
            player2_potions=self.DEFAULT_POTIONS,
            player2_x_attack=self.DEFAULT_X_ATTACK,
            player2_x_defense=self.DEFAULT_X_DEFENSE,
        )

        battle.player1_data = {"player": battle.player1, "player_pokemon": battle.player1_pokemon}
        battle.player2_data = {"player": battle.player2, "player_pokemon": battle.player2_pokemon}

        return battle
