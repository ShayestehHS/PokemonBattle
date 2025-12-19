import pytest
from django.urls import reverse
from rest_framework import status


@pytest.mark.django_db
class TestTypeEffectivenessListGET:
    @pytest.fixture(autouse=True)
    def setup(self, api_client, shared_test_player, global_pokemon_data):
        self.client = api_client
        self.url = reverse("pokemon:type-effectiveness-list")
        self.player = shared_test_player
        self.pokemon_data = global_pokemon_data

    def test_list_type_effectiveness_with_authentication_returns_200(self):
        self.client.force_authenticate(user=self.player)

        response = self.client.get(self.url)
        json_response = response.json()

        assert response.status_code == status.HTTP_200_OK
        assert isinstance(json_response, list)
        assert len(json_response) >= 3
        assert set(json_response[0].keys()) == {
            "id",
            "attacker_type_name",
            "defender_type_name",
            "multiplier",
        }

    def test_list_type_effectiveness_without_authentication_returns_401(self):
        response = self.client.get(self.url)
        json_response = response.json()

        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert json_response == {"detail": "Authentication credentials were not provided."}

    def test_list_type_effectiveness_with_attacker_filter_returns_filtered_results(self):
        self.client.force_authenticate(user=self.player)

        response = self.client.get(self.url, data={"attacker": "fire"})
        json_response = response.json()

        assert response.status_code == status.HTTP_200_OK
        assert len(json_response) >= 2
        assert all(effectiveness["attacker_type_name"] == "fire" for effectiveness in json_response)

    def test_list_type_effectiveness_with_defender_filter_returns_filtered_results(self):
        self.client.force_authenticate(user=self.player)

        response = self.client.get(self.url, data={"defender": "water"})
        json_response = response.json()

        assert response.status_code == status.HTTP_200_OK
        # Global fixture adds more type effectiveness data, so expect at least 1
        assert len(json_response) >= 1
        assert all(effectiveness["defender_type_name"] == "water" for effectiveness in json_response)
        # Check that at least one has the expected multiplier
        multipliers = [e["multiplier"] for e in json_response]
        assert 0.5 in multipliers or 2.0 in multipliers

    def test_list_type_effectiveness_with_both_filters_returns_filtered_results(self):
        self.client.force_authenticate(user=self.player)

        response = self.client.get(self.url, data={"attacker": "fire", "defender": "grass"})
        json_response = response.json()

        assert response.status_code == status.HTTP_200_OK
        assert len(json_response) == 1
        assert json_response[0]["attacker_type_name"] == "fire"
        assert json_response[0]["defender_type_name"] == "grass"
        assert json_response[0]["multiplier"] == 2.0
