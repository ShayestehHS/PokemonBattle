from unittest.mock import Mock, patch

import pytest
from django.db import connection
from rest_framework.test import APIClient

from players.models import Player
from pokemon.models import PlayerPokemon, Pokemon, PokemonType, TypeEffectiveness


@pytest.fixture(scope="session", autouse=True)
def django_db_setup_optimized(django_db_setup, django_db_blocker):
    """
    Optimized database setup that pre-creates schema to avoid first-test overhead.
    This runs once per test session and ensures the database is ready.
    """
    with django_db_blocker.unblock():
        # Pre-create all tables by importing models and ensuring schema exists

        # Ensure connection is established
        connection.ensure_connection()

        # Create tables if they don't exist (this is fast with --nomigrations)
        # The tables are created automatically by Django when models are accessed
        # We just need to ensure the connection is warm
        try:
            # Touch the database to ensure it's initialized
            from django.contrib.contenttypes.models import ContentType

            ContentType.objects.all().count()  # This will create tables if needed
        except Exception:
            pass  # Ignore if tables don't exist yet


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def create_player(db):
    def _create_player(username="testuser", password="TestPass123!", **kwargs):
        return Player.objects.create_user(username=username, password=password, **kwargs)

    return _create_player


@pytest.fixture(scope="session")
def shared_test_player(django_db_setup, django_db_blocker):
    """
    Session-scoped fixture that creates a shared test player for readonly tests.
    Use this in tests that don't modify player data to avoid creating players for each test.
    """
    with django_db_blocker.unblock():
        player, _ = Player.objects.get_or_create(
            username="shared_testuser",
            defaults={"password": "pbkdf2_sha256$test$TestPass123!"},
        )
        # Set password properly
        player.set_password("TestPass123!")
        player.save()
        return player


@pytest.fixture
def create_pokemon_type(db):
    def _create_pokemon_type(name="fire", **kwargs):
        pokemon_type, _ = PokemonType.objects.get_or_create(name=name, defaults=kwargs)
        return pokemon_type

    return _create_pokemon_type


@pytest.fixture
def create_pokemon(db, create_pokemon_type):
    def _create_pokemon(name="Pikachu", pokedex_number=25, primary_type=None, secondary_type=None, **kwargs):
        if primary_type is None:
            primary_type = create_pokemon_type(name="electric")
        if secondary_type is None and "secondary_type" not in kwargs:
            secondary_type = None

        defaults = {
            "name": name,
            "base_hp": 35,
            "base_attack": 55,
            "base_defense": 40,
            "base_speed": 90,
            "sprite_url": "https://example.com/pikachu.png",
            "primary_type": primary_type,
            "secondary_type": secondary_type,
            **kwargs,
        }
        pokemon, _ = Pokemon.objects.get_or_create(pokedex_number=pokedex_number, defaults=defaults)
        return pokemon

    return _create_pokemon


@pytest.fixture
def create_type_effectiveness(db, create_pokemon_type):
    def _create_type_effectiveness(
        attacker_type=None, defender_type=None, multiplier=TypeEffectiveness.NORMAL, **kwargs
    ):
        if attacker_type is None:
            attacker_type = create_pokemon_type(name="fire")
        if defender_type is None:
            defender_type = create_pokemon_type(name="water")

        return TypeEffectiveness.objects.create(
            attacker_type=attacker_type,
            defender_type=defender_type,
            multiplier=multiplier,
            **kwargs,
        )

    return _create_type_effectiveness


@pytest.fixture
def mock_pokeapi_client():
    """Fixture that mocks PokeAPIClient and returns the mock instance."""
    with patch("pokemon.views.PokeAPIClient") as mock_client_class:
        mock_client = Mock()
        mock_client_class.return_value = mock_client
        yield mock_client


@pytest.fixture(scope="session")
def global_pokemon_data(django_db_setup, django_db_blocker):
    """
    Session-scoped fixture that creates global pokemon data for readonly tests.
    This fixture creates pokemon types, pokemon, and type effectiveness data once per test session.
    Only use in readonly tests that don't modify pokemon data.
    """
    with django_db_blocker.unblock():
        # Create pokemon types
        fire_type, _ = PokemonType.objects.get_or_create(name="fire")
        water_type, _ = PokemonType.objects.get_or_create(name="water")
        grass_type, _ = PokemonType.objects.get_or_create(name="grass")
        electric_type, _ = PokemonType.objects.get_or_create(name="electric")
        poison_type, _ = PokemonType.objects.get_or_create(name="poison")

        # Create pokemon
        charmander, _ = Pokemon.objects.get_or_create(
            pokedex_number=4,
            defaults={
                "name": "Charmander",
                "sprite_url": "https://example.com/charmander.png",
                "base_hp": 39,
                "base_attack": 52,
                "base_defense": 43,
                "base_speed": 65,
                "primary_type": fire_type,
            },
        )
        squirtle, _ = Pokemon.objects.get_or_create(
            pokedex_number=7,
            defaults={
                "name": "Squirtle",
                "sprite_url": "https://example.com/squirtle.png",
                "base_hp": 44,
                "base_attack": 48,
                "base_defense": 65,
                "base_speed": 43,
                "primary_type": water_type,
            },
        )
        charizard, _ = Pokemon.objects.get_or_create(
            pokedex_number=6,
            defaults={
                "name": "Charizard",
                "sprite_url": "https://example.com/charizard.png",
                "base_hp": 78,
                "base_attack": 84,
                "base_defense": 78,
                "base_speed": 100,
                "primary_type": fire_type,
                "secondary_type": water_type,
            },
        )
        pikachu, _ = Pokemon.objects.get_or_create(
            pokedex_number=25,
            defaults={
                "name": "Pikachu",
                "sprite_url": "https://example.com/pikachu.png",
                "base_hp": 35,
                "base_attack": 55,
                "base_defense": 40,
                "base_speed": 90,
                "primary_type": electric_type,
            },
        )

        # Create type effectiveness data
        TypeEffectiveness.objects.get_or_create(
            attacker_type=fire_type,
            defender_type=water_type,
            defaults={"multiplier": TypeEffectiveness.NOT_VERY_EFFECTIVE},
        )
        TypeEffectiveness.objects.get_or_create(
            attacker_type=fire_type,
            defender_type=grass_type,
            defaults={"multiplier": TypeEffectiveness.SUPER_EFFECTIVE},
        )
        TypeEffectiveness.objects.get_or_create(
            attacker_type=water_type,
            defender_type=fire_type,
            defaults={"multiplier": TypeEffectiveness.SUPER_EFFECTIVE},
        )
        TypeEffectiveness.objects.get_or_create(
            attacker_type=electric_type,
            defender_type=water_type,
            defaults={"multiplier": TypeEffectiveness.SUPER_EFFECTIVE},
        )

        return {
            "types": {
                "fire": fire_type,
                "water": water_type,
                "grass": grass_type,
                "electric": electric_type,
                "poison": poison_type,
            },
            "pokemon": {
                "charmander": charmander,
                "squirtle": squirtle,
                "charizard": charizard,
                "pikachu": pikachu,
            },
        }


@pytest.fixture
def create_player_pokemon(db, create_player, create_pokemon):
    def _create_player_pokemon(player=None, pokemon=None, **kwargs):
        if player is None:
            player = create_player()
        if pokemon is None:
            pokemon = create_pokemon()
        return PlayerPokemon.objects.create(player=player, pokemon=pokemon, **kwargs)

    return _create_player_pokemon


@pytest.fixture
def create_battle(db, create_player, create_player_pokemon):
    def _create_battle(player1=None, player2=None, player1_pokemon=None, player2_pokemon=None, **kwargs):
        from battles.models import Battle

        if player1 is None:
            player1 = create_player(username="player1")
        if player2 is None:
            player2 = create_player(username="player2")
        if player1_pokemon is None:
            player1_pokemon = create_player_pokemon(player=player1)
        if player2_pokemon is None:
            player2_pokemon = create_player_pokemon(player=player2)

        defaults = {
            "status": Battle.STATUS_ACTIVE,
            "current_turn_player": player1,
            "turn_number": 1,
            "player1_current_hp": player1_pokemon.pokemon.base_hp,
            "player2_current_hp": player2_pokemon.pokemon.base_hp,
            "player1_potions": 2,
            "player1_x_attack": 1,
            "player1_x_defense": 1,
            "player2_potions": 2,
            "player2_x_attack": 1,
            "player2_x_defense": 1,
            **kwargs,
        }

        return Battle.objects.create(
            player1=player1,
            player2=player2,
            player1_pokemon=player1_pokemon,
            player2_pokemon=player2_pokemon,
            **defaults,
        )

    return _create_battle


@pytest.fixture
def active_battle(create_battle, create_player):
    player1 = create_player(username="player1")
    player2 = create_player(username="player2")
    return create_battle(player1=player1, player2=player2)
