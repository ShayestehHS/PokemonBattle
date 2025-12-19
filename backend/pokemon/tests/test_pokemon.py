import pytest
from django.urls import reverse
from rest_framework import status


@pytest.mark.django_db
class TestPokemonListGET:
    @pytest.fixture(autouse=True)
    def setup(self, api_client, shared_test_player, global_pokemon_data):
        self.client = api_client
        self.url = reverse("pokemon:pokemon-list")
        self.player = shared_test_player
        self.pokemon_data = global_pokemon_data

    def test_list_pokemon_with_authentication_returns_200(self):
        self.client.force_authenticate(user=self.player)

        response = self.client.get(self.url)
        json_response = response.json()

        assert response.status_code == status.HTTP_200_OK
        assert "results" in json_response
        assert len(json_response["results"]) >= 3
        assert set(json_response["results"][0].keys()) == {
            "id",
            "pokedex_number",
            "name",
            "sprite_url",
            "primary_type_name",
            "secondary_type_name",
        }

    def test_list_pokemon_without_authentication_returns_401(self):
        response = self.client.get(self.url)
        json_response = response.json()

        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert json_response == {"detail": "Authentication credentials were not provided."}

    def test_list_pokemon_with_type_filter_returns_filtered_results(self):
        self.client.force_authenticate(user=self.player)

        response = self.client.get(self.url, data={"type": "fire"})
        json_response = response.json()

        assert response.status_code == status.HTTP_200_OK
        assert len(json_response["results"]) == 2
        assert all(
            pokemon["primary_type_name"] == "fire" or pokemon["secondary_type_name"] == "fire"
            for pokemon in json_response["results"]
        )


@pytest.mark.django_db
class TestPokemonRetrieveGET:
    @pytest.fixture(autouse=True)
    def setup(self, api_client, shared_test_player, global_pokemon_data):
        self.client = api_client
        self.player = shared_test_player
        self.pokemon = global_pokemon_data["pokemon"]["charmander"]

    def _get_url(self, pokemon_id):
        return reverse("pokemon:pokemon-detail", kwargs={"pk": pokemon_id})

    def test_retrieve_pokemon_with_authentication_returns_200(self):
        self.client.force_authenticate(user=self.player)

        response = self.client.get(self._get_url(self.pokemon.id))
        json_response = response.json()

        assert response.status_code == status.HTTP_200_OK
        assert set(json_response.keys()) == {
            "id",
            "pokedex_number",
            "name",
            "sprite_url",
            "base_hp",
            "base_attack",
            "base_defense",
            "base_speed",
            "primary_type",
            "secondary_type",
            "created_at",
        }
        assert json_response["name"] == "Charmander"
        assert json_response["pokedex_number"] == 4
        assert json_response["base_hp"] == 39  # From global fixture
        assert json_response["primary_type"]["name"] == "fire"
        assert json_response["secondary_type"] is None

    def test_retrieve_pokemon_without_authentication_returns_401(self):
        response = self.client.get(self._get_url(self.pokemon.id))
        json_response = response.json()

        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert json_response == {"detail": "Authentication credentials were not provided."}

    def test_retrieve_nonexistent_pokemon_returns_404(self):
        self.client.force_authenticate(user=self.player)
        from uuid_extensions import uuid7

        nonexistent_id = uuid7()

        response = self.client.get(self._get_url(nonexistent_id))
        json_response = response.json()

        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert "detail" in json_response
        assert json_response["detail"] in ["Not found.", "No Pokemon matches the given query."]


@pytest.mark.django_db
class TestPokemonStartersGET:
    @pytest.fixture(autouse=True)
    def setup(self, api_client, shared_test_player, create_pokemon, create_pokemon_type):
        self.client = api_client
        self.url = reverse("pokemon:pokemon-starters")
        self.player = shared_test_player
        # Create pokemon with different primary types
        fire_type = create_pokemon_type(name="fire")
        water_type = create_pokemon_type(name="water")
        grass_type = create_pokemon_type(name="grass")
        electric_type = create_pokemon_type(name="electric")

        # Create multiple pokemon with same primary type (should only get one per type)
        self.charmander = create_pokemon(name="Charmander", pokedex_number=4, primary_type=fire_type)
        self.charizard = create_pokemon(name="Charizard", pokedex_number=6, primary_type=fire_type)
        self.squirtle = create_pokemon(name="Squirtle", pokedex_number=7, primary_type=water_type)
        self.bulbasaur = create_pokemon(name="Bulbasaur", pokedex_number=1, primary_type=grass_type)
        self.pikachu = create_pokemon(name="Pikachu", pokedex_number=25, primary_type=electric_type)

    def test_starters_with_authentication_returns_200(self):
        self.client.force_authenticate(user=self.player)

        response = self.client.get(self.url)
        json_response = response.json()

        assert response.status_code == status.HTTP_200_OK
        assert "results" in json_response
        assert len(json_response["results"]) >= 4  # At least one per type
        assert set(json_response["results"][0].keys()) == {
            "id",
            "pokedex_number",
            "name",
            "sprite_url",
            "primary_type_name",
            "secondary_type_name",
        }

    def test_starters_without_authentication_returns_401(self):
        response = self.client.get(self.url)
        json_response = response.json()

        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert json_response == {"detail": "Authentication credentials were not provided."}

    def test_starters_returns_one_pokemon_per_primary_type(self):
        self.client.force_authenticate(user=self.player)

        response = self.client.get(self.url)
        json_response = response.json()

        assert response.status_code == status.HTTP_200_OK
        # Should have one pokemon per unique primary type
        primary_types = [pokemon["primary_type_name"] for pokemon in json_response["results"]]
        # Each type should appear only once
        assert len(primary_types) == len(set(primary_types))
        # Should include all the types we created
        assert "fire" in primary_types
        assert "water" in primary_types
        assert "grass" in primary_types
        assert "electric" in primary_types
