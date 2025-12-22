import pytest
from django.urls import reverse
from rest_framework import status


@pytest.mark.django_db
class TestPokemonTypeListGET:
    @pytest.fixture(autouse=True)
    def setup(self, api_client, shared_test_player, global_pokemon_data):
        self.client = api_client
        self.url = reverse("pokemon:type-list")
        self.player = shared_test_player
        self.pokemon_data = global_pokemon_data

    def test_list_pokemon_types_with_authentication_returns_200(self):
        self.client.force_authenticate(user=self.player)

        response = self.client.get(self.url)
        json_response = response.json()

        assert response.status_code == status.HTTP_200_OK
        assert isinstance(json_response, list)
        assert len(json_response) >= 3
        assert set(json_response[0].keys()) == {"id", "name"}
        type_names = {type_obj["name"] for type_obj in json_response}
        assert "fire" in type_names
        assert "water" in type_names
        assert "grass" in type_names

    def test_list_pokemon_types_without_authentication_returns_401(self):
        response = self.client.get(self.url)
        json_response = response.json()

        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert json_response == {"message": "Authentication credentials were not provided."}

    def test_list_pokemon_types_ordered_by_name(self):
        self.client.force_authenticate(user=self.player)

        response = self.client.get(self.url)
        json_response = response.json()

        assert response.status_code == status.HTTP_200_OK
        names = [type_obj["name"] for type_obj in json_response]
        # Verify ordering (should be sorted alphabetically)
        assert names == sorted(names)
        # Verify expected types are present
        assert "fire" in names
        assert "grass" in names
        assert "water" in names
