import pytest
from django.urls import reverse
from rest_framework import status

from pokemon.models import PlayerPokemon


@pytest.mark.django_db
class TestPokemonMeListGET:
    @pytest.fixture(autouse=True)
    def setup(self, api_client, create_player, create_pokemon, create_pokemon_type):
        self.client = api_client
        self.url = reverse("pokemon:pokemon-me-list")
        self.player = create_player(username="testuser", password="TestPass123!")
        fire_type = create_pokemon_type(name="fire")
        water_type = create_pokemon_type(name="water")
        self.charmander = create_pokemon(name="Charmander", pokedex_number=4, primary_type=fire_type)
        self.squirtle = create_pokemon(name="Squirtle", pokedex_number=7, primary_type=water_type)

    def test_list_my_pokemon_with_authentication_returns_200(self):
        # Add pokemon to player's collection
        PlayerPokemon.objects.create(player=self.player, pokemon=self.charmander)
        PlayerPokemon.objects.create(player=self.player, pokemon=self.squirtle)

        self.client.force_authenticate(user=self.player)

        response = self.client.get(self.url)
        json_response = response.json()

        assert response.status_code == status.HTTP_200_OK
        assert set(json_response.keys()) == {"count", "next", "previous", "results"}
        assert json_response["count"] == 2
        assert len(json_response["results"]) == 2
        assert set(json_response["results"][0].keys()) == {
            "id",
            "pokedex_number",
            "name",
            "sprite_url",
            "primary_type_name",
            "secondary_type_name",
            "player_pokemon_id",
        }
        pokemon_names = [pokemon["name"] for pokemon in json_response["results"]]
        assert "Charmander" in pokemon_names
        assert "Squirtle" in pokemon_names

    def test_list_my_pokemon_without_authentication_returns_401(self):
        response = self.client.get(self.url)
        json_response = response.json()

        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert json_response == {"detail": "Authentication credentials were not provided."}

    def test_list_my_pokemon_returns_only_owned_pokemon(self):
        # Create another player with different pokemon
        other_player = self.player.__class__.objects.create_user(username="otheruser", password="TestPass123!")
        PlayerPokemon.objects.create(player=other_player, pokemon=self.charmander)

        # Current player has squirtle
        PlayerPokemon.objects.create(player=self.player, pokemon=self.squirtle)

        self.client.force_authenticate(user=self.player)

        response = self.client.get(self.url)
        json_response = response.json()

        assert response.status_code == status.HTTP_200_OK
        assert json_response["count"] == 1
        assert len(json_response["results"]) == 1
        assert json_response["results"][0]["name"] == "Squirtle"

    def test_list_my_pokemon_with_empty_collection_returns_empty_list(self):
        self.client.force_authenticate(user=self.player)

        response = self.client.get(self.url)
        json_response = response.json()

        assert response.status_code == status.HTTP_200_OK
        assert json_response["count"] == 0
        assert json_response["results"] == []

    def test_list_my_pokemon_ordered_by_most_recent_first(self):
        # Add pokemon in specific order
        PlayerPokemon.objects.create(player=self.player, pokemon=self.charmander)
        PlayerPokemon.objects.create(player=self.player, pokemon=self.squirtle)

        self.client.force_authenticate(user=self.player)

        response = self.client.get(self.url)
        json_response = response.json()

        assert response.status_code == status.HTTP_200_OK
        # The view orders by most recent first (PlayerPokemon.id), so Squirtle (created second) should come before Charmander (created first)
        assert len(json_response["results"]) == 2
        assert json_response["results"][0]["name"] == "Squirtle"
        assert json_response["results"][0]["pokedex_number"] == 7
        assert json_response["results"][1]["name"] == "Charmander"
        assert json_response["results"][1]["pokedex_number"] == 4


@pytest.mark.django_db
class TestPokemonMeCreatePOST:
    @pytest.fixture(autouse=True)
    def setup(self, api_client, create_player, create_pokemon, create_pokemon_type):
        self.client = api_client
        self.url = reverse("pokemon:pokemon-me-list")
        self.player = create_player(username="testuser", password="TestPass123!")
        fire_type = create_pokemon_type(name="fire")
        water_type = create_pokemon_type(name="water")
        self.charmander = create_pokemon(name="Charmander", pokedex_number=4, primary_type=fire_type)
        self.squirtle = create_pokemon(name="Squirtle", pokedex_number=7, primary_type=water_type)

    def test_create_my_pokemon_with_valid_data_returns_201(self):
        self.client.force_authenticate(user=self.player)
        data = {"pokemon_id": str(self.charmander.id)}

        response = self.client.post(self.url, data=data)
        json_response = response.json()

        assert response.status_code == status.HTTP_201_CREATED
        assert set(json_response.keys()) == {
            "id",
            "pokedex_number",
            "name",
            "sprite_url",
            "primary_type_name",
            "secondary_type_name",
        }
        assert json_response["name"] == "Charmander"
        assert json_response["pokedex_number"] == 4
        assert PlayerPokemon.objects.filter(player=self.player, pokemon=self.charmander).exists()

    def test_create_my_pokemon_without_authentication_returns_401(self):
        data = {"pokemon_id": str(self.charmander.id)}

        response = self.client.post(self.url, data=data)
        json_response = response.json()

        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert json_response == {"detail": "Authentication credentials were not provided."}

    def test_create_my_pokemon_with_nonexistent_pokemon_id_returns_400(self):
        self.client.force_authenticate(user=self.player)
        from uuid_extensions import uuid7

        nonexistent_id = uuid7()
        data = {"pokemon_id": str(nonexistent_id)}

        response = self.client.post(self.url, data=data)
        json_response = response.json()

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert json_response == {"pokemon_id": [f'Invalid pk "{nonexistent_id}" - object does not exist.']}

    def test_create_my_pokemon_with_duplicate_pokemon_returns_400(self):
        # Add pokemon to player's collection first
        PlayerPokemon.objects.create(player=self.player, pokemon=self.charmander)

        self.client.force_authenticate(user=self.player)
        data = {"pokemon_id": str(self.charmander.id)}

        response = self.client.post(self.url, data=data)
        json_response = response.json()

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "pokemon_id" in json_response
        # The error can be a dict or list, handle both cases
        error_msg = str(json_response["pokemon_id"])
        if isinstance(json_response["pokemon_id"], list):
            error_msg = str(json_response["pokemon_id"][0])
        assert "already own" in error_msg.lower()

    def test_create_my_pokemon_without_pokemon_id_returns_400(self):
        self.client.force_authenticate(user=self.player)
        data = {}

        response = self.client.post(self.url, data=data)
        json_response = response.json()

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert json_response == {"pokemon_id": ["This field is required."]}

    def test_create_my_pokemon_respects_wins_limit(self):
        # Set player wins to 1 (can only have 1 pokemon)
        self.player.wins = 1
        self.player.save()

        # Add first pokemon
        PlayerPokemon.objects.create(player=self.player, pokemon=self.charmander)

        self.client.force_authenticate(user=self.player)
        data = {"pokemon_id": str(self.squirtle.id)}

        response = self.client.post(self.url, data=data)
        json_response = response.json()

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert json_response == {
            "non_field_errors": [
                "You can only have up to 1 pokemon (based on your wins). You currently have 1 pokemon."
            ]
        }

    def test_create_my_pokemon_allows_first_pokemon_without_wins(self):
        # Player with 0 wins should be able to add first pokemon
        self.player.wins = 0
        self.player.save()

        self.client.force_authenticate(user=self.player)
        data = {"pokemon_id": str(self.charmander.id)}

        response = self.client.post(self.url, data=data)
        json_response = response.json()

        assert response.status_code == status.HTTP_201_CREATED
        assert json_response["name"] == "Charmander"
