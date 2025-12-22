import pytest
from django.urls import reverse
from rest_framework import status


@pytest.mark.django_db
class TestPlayerMeGET:
    @pytest.fixture(autouse=True)
    def setup(self, api_client, create_player):
        self.client = api_client
        self.url = reverse("players:me")
        self.player = create_player(username="testuser", password="TestPass123!")

    def test_get_me_with_authentication_returns_200(self):
        self.client.force_authenticate(user=self.player)

        response = self.client.get(self.url)
        json_response = response.json()

        assert response.status_code == status.HTTP_200_OK
        assert set(json_response.keys()) == {
            "id",
            "username",
            "wins",
            "losses",
            "win_rate",
            "created_at",
            "active_pokemon",
        }
        assert json_response["username"] == "testuser"
        assert json_response["wins"] == 0
        assert json_response["losses"] == 0
        assert json_response["win_rate"] == 0.0

    def test_get_me_without_authentication_returns_401(self):
        response = self.client.get(self.url)
        json_response = response.json()

        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert json_response == {"detail": "Authentication credentials were not provided."}

    def test_get_me_returns_correct_player_data(self):
        self.player.wins = 5
        self.player.losses = 3
        self.player.save()
        self.client.force_authenticate(user=self.player)

        response = self.client.get(self.url)
        json_response = response.json()

        assert response.status_code == status.HTTP_200_OK
        assert json_response["wins"] == 5
        assert json_response["losses"] == 3
        assert json_response["win_rate"] == 62.5
