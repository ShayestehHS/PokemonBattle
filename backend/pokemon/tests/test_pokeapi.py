import pytest
from django.urls import reverse
from rest_framework import status

from pokemon.models import Pokemon


@pytest.mark.django_db
class TestPokeAPISearchGET:
    @pytest.fixture(autouse=True)
    def setup(self, api_client, create_player):
        self.client = api_client
        self.player = create_player(username="testuser", password="TestPass123!")

    def _get_url(self, search):
        return reverse("pokemon:pokeapi-search", kwargs={"search": search})

    def test_search_pokemon_by_name_with_authentication_returns_200(self, mock_pokeapi_client):
        self.client.force_authenticate(user=self.player)
        mock_pokemon_data = {
            "pokedex_number": 25,
            "name": "pikachu",
            "sprite_url": "https://example.com/pikachu.png",
            "types": ["electric"],
            "stats": {"hp": 35, "attack": 55, "defense": 40, "speed": 90},
        }

        mock_pokeapi_client.get_pokemon_by_name.return_value = mock_pokemon_data

        response = self.client.get(self._get_url("pikachu"))
        json_response = response.json()

        assert response.status_code == status.HTTP_200_OK
        assert "data" in json_response
        assert json_response["data"] is not None
        data = json_response["data"]
        assert set(data.keys()) == {
            "pokedex_number",
            "name",
            "sprite_url",
            "primary_type_name",
            "secondary_type_name",
            "base_hp",
            "base_attack",
            "base_defense",
            "base_speed",
        }
        assert data["name"] == "pikachu"
        assert data["pokedex_number"] == 25
        assert data["primary_type_name"] == "electric"
        assert data["secondary_type_name"] is None

    def test_search_pokemon_by_pokedex_number_with_authentication_returns_200(self, mock_pokeapi_client):
        self.client.force_authenticate(user=self.player)
        mock_pokemon_data = {
            "pokedex_number": 25,
            "name": "pikachu",
            "sprite_url": "https://example.com/pikachu.png",
            "types": ["electric"],
            "stats": {"hp": 35, "attack": 55, "defense": 40, "speed": 90},
        }

        mock_pokeapi_client.get_pokemon.return_value = mock_pokemon_data

        response = self.client.get(self._get_url("25"))
        json_response = response.json()

        assert response.status_code == status.HTTP_200_OK
        assert "data" in json_response
        assert json_response["data"] is not None
        data = json_response["data"]
        assert data["name"] == "pikachu"
        assert data["pokedex_number"] == 25

    def test_search_pokemon_without_authentication_returns_401(self):
        response = self.client.get(self._get_url("pikachu"))
        json_response = response.json()

        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert json_response == {"detail": "Authentication credentials were not provided."}

    def test_search_nonexistent_pokemon_returns_null_data(self, mock_pokeapi_client):
        self.client.force_authenticate(user=self.player)

        mock_pokeapi_client.get_pokemon_by_name.return_value = None

        response = self.client.get(self._get_url("nonexistent"))
        json_response = response.json()

        assert response.status_code == status.HTTP_200_OK
        assert json_response == {"data": None}


@pytest.mark.django_db
class TestPokeAPIListPokemonGET:
    @pytest.fixture(autouse=True)
    def setup(self, api_client, create_player, create_pokemon, create_pokemon_type):
        self.client = api_client
        self.url = reverse("pokemon:pokeapi-list-pokemon")
        self.player = create_player(username="testuser", password="TestPass123!")
        fire_type = create_pokemon_type(name="fire")
        self.pokemon = create_pokemon(name="Charmander", pokedex_number=4, primary_type=fire_type)

    def test_list_pokemon_with_authentication_returns_200(self, mock_pokeapi_client):
        self.client.force_authenticate(user=self.player)

        # Mock PokeAPI client to return data for missing pokemon
        # The setup creates pokemon with pokedex_number=4, so we need to mock others
        def mock_get_pokemon(pokedex_number):
            return {
                "pokedex_number": pokedex_number,
                "name": f"pokemon{pokedex_number}",
                "sprite_url": f"https://example.com/pokemon{pokedex_number}.png",
                "types": ["normal"],
                "stats": {"hp": 50, "attack": 50, "defense": 50, "speed": 50},
            }

        mock_pokeapi_client.get_pokemon.side_effect = mock_get_pokemon

        response = self.client.get(self.url, data={"offset": 0, "limit": 20})
        json_response = response.json()

        assert response.status_code == status.HTTP_200_OK
        assert set(json_response.keys()) == {"count", "offset", "limit", "results"}
        assert json_response["count"] == 1025
        assert json_response["offset"] == 0
        assert json_response["limit"] == 20
        assert isinstance(json_response["results"], list)

    def test_list_pokemon_without_authentication_returns_401(self):
        response = self.client.get(self.url)
        json_response = response.json()

        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert json_response == {"detail": "Authentication credentials were not provided."}

    def test_list_pokemon_with_custom_offset_and_limit_returns_correct_range(self, create_pokemon_type, create_pokemon):
        self.client.force_authenticate(user=self.player)
        from pokemon.models import PokemonType

        fire_type, _ = PokemonType.objects.get_or_create(name="fire")
        water_type, _ = PokemonType.objects.get_or_create(name="water")

        # Create pokemon in the expected range (offset=10, limit=5 means pokedex 11-15)
        expected_pokedex_numbers = [11, 12, 13, 14, 15]
        for pokedex_num in expected_pokedex_numbers:
            create_pokemon(
                name=f"Pokemon{pokedex_num}",
                pokedex_number=pokedex_num,
                primary_type=fire_type if pokedex_num % 2 == 0 else water_type,
            )

        # Create some pokemon outside the range to ensure filtering works
        create_pokemon(name="Pokemon5", pokedex_number=5, primary_type=fire_type)
        create_pokemon(name="Pokemon20", pokedex_number=20, primary_type=water_type)

        response = self.client.get(self.url, data={"offset": 10, "limit": 5})
        json_response = response.json()

        assert response.status_code == status.HTTP_200_OK
        assert json_response["offset"] == 10
        assert json_response["limit"] == 5
        assert len(json_response["results"]) == 5

        # Validate that all returned pokemon have correct pokedex numbers
        returned_pokedex_numbers = [pokemon["pokedex_number"] for pokemon in json_response["results"]]
        assert set(returned_pokedex_numbers) == set(expected_pokedex_numbers)
        assert returned_pokedex_numbers == expected_pokedex_numbers  # Should be ordered by pokedex_number

    def test_list_pokemon_with_limit_over_50_caps_at_50(self, mock_pokeapi_client):
        self.client.force_authenticate(user=self.player)

        # Mock PokeAPI client to return data for missing pokemon
        def mock_get_pokemon(pokedex_number):
            return {
                "pokedex_number": pokedex_number,
                "name": f"pokemon{pokedex_number}",
                "sprite_url": f"https://example.com/pokemon{pokedex_number}.png",
                "types": ["normal"],
                "stats": {"hp": 50, "attack": 50, "defense": 50, "speed": 50},
            }

        mock_pokeapi_client.get_pokemon.side_effect = mock_get_pokemon

        response = self.client.get(self.url, data={"offset": 0, "limit": 100})
        json_response = response.json()

        assert response.status_code == status.HTTP_200_OK
        assert json_response["limit"] == 50

    def test_list_pokemon_creates_missing_pokemon_from_api(self, mock_pokeapi_client):
        self.client.force_authenticate(user=self.player)
        mock_pokemon_data = {
            "pokedex_number": 1,
            "name": "bulbasaur",
            "sprite_url": "https://example.com/bulbasaur.png",
            "types": ["grass", "poison"],
            "stats": {"hp": 45, "attack": 49, "defense": 49, "speed": 45},
        }

        mock_pokeapi_client.get_pokemon.return_value = mock_pokemon_data

        response = self.client.get(self.url, data={"offset": 0, "limit": 1})

        assert response.status_code == status.HTTP_200_OK
        assert Pokemon.objects.filter(pokedex_number=1).exists()


@pytest.mark.django_db
class TestPokeAPIChoicesGET:
    @pytest.fixture(autouse=True)
    def setup(self, api_client, create_player, create_pokemon, create_pokemon_type):
        self.client = api_client
        self.url = reverse("pokemon:pokeapi-choices")
        self.player = create_player(username="testuser", password="TestPass123!")
        # This test needs specific pokemon data (1-25) for testing, so it doesn't use global fixture
        fire_type = create_pokemon_type(name="fire")
        water_type = create_pokemon_type(name="water")
        for i in range(25):
            create_pokemon(
                name=f"Pokemon{i}",
                pokedex_number=i + 1,
                primary_type=fire_type if i % 2 == 0 else water_type,
            )

    def test_choices_with_authentication_returns_200(self):
        self.client.force_authenticate(user=self.player)

        response = self.client.get(self.url)
        json_response = response.json()

        assert response.status_code == status.HTTP_200_OK
        assert isinstance(json_response, list)
        assert len(json_response) == 20
        assert set(json_response[0].keys()) == {
            "id",
            "pokedex_number",
            "name",
            "sprite_url",
            "primary_type_name",
            "secondary_type_name",
        }

    def test_choices_without_authentication_returns_401(self):
        response = self.client.get(self.url)
        json_response = response.json()

        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert json_response == {"detail": "Authentication credentials were not provided."}

    def test_choices_returns_first_20_pokemon_ordered_by_pokedex_number(self):
        self.client.force_authenticate(user=self.player)

        response = self.client.get(self.url)
        json_response = response.json()

        assert response.status_code == status.HTTP_200_OK
        assert len(json_response) == 20
        pokedex_numbers = [pokemon["pokedex_number"] for pokemon in json_response]
        assert pokedex_numbers == list(range(1, 21))

    def test_choices_with_empty_database_returns_empty_list(self):
        Pokemon.objects.all().delete()
        self.client.force_authenticate(user=self.player)

        response = self.client.get(self.url)
        json_response = response.json()

        assert response.status_code == status.HTTP_200_OK
        assert json_response == []
