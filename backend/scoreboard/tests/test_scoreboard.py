import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from players.models import Player


@pytest.mark.django_db
class TestScoreboardListView:
    def test_get_scoreboard_requires_authentication(self):
        client = APIClient()
        url = reverse("scoreboard:scoreboard-list")
        response = client.get(url)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_get_scoreboard_returns_top_players(self):
        client = APIClient()

        # Create test players with different win counts
        player1 = Player.objects.create_user(username="player1", password="testpass123")
        player1.wins = 10
        player1.losses = 2
        player1.save()

        player2 = Player.objects.create_user(username="player2", password="testpass123")
        player2.wins = 8
        player2.losses = 3
        player2.save()

        player3 = Player.objects.create_user(username="player3", password="testpass123")
        player3.wins = 5
        player3.losses = 1
        player3.save()

        # Authenticate as one of the players
        client.force_authenticate(user=player1)
        url = reverse("scoreboard:scoreboard-list")
        response = client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert "results" in response.data
        assert len(response.data["results"]) == 3

        # Check ordering (highest wins first)
        results = response.data["results"]
        assert results[0]["username"] == "player1"
        assert results[0]["wins"] == 10
        assert results[0]["rank"] == 1
        assert results[1]["username"] == "player2"
        assert results[1]["wins"] == 8
        assert results[1]["rank"] == 2
        assert results[2]["username"] == "player3"
        assert results[2]["wins"] == 5
        assert results[2]["rank"] == 3

    def test_get_scoreboard_includes_win_rate(self):
        client = APIClient()

        player1 = Player.objects.create_user(username="player1", password="testpass123")
        player1.wins = 8
        player1.losses = 2
        player1.save()

        client.force_authenticate(user=player1)
        url = reverse("scoreboard:scoreboard-list")
        response = client.get(url)

        assert response.status_code == status.HTTP_200_OK
        results = response.data["results"]
        assert len(results) > 0
        assert "win_rate" in results[0]
        # 8 wins, 2 losses = 80% win rate
        assert results[0]["win_rate"] == 80

    def test_get_scoreboard_includes_current_user_entry_when_not_in_top_20(self):
        client = APIClient()

        # Create 20 players with high wins
        for i in range(20):
            player = Player.objects.create_user(username=f"top_player_{i}", password="testpass123")
            player.wins = 100 - i
            player.losses = 0
            player.save()

        # Create a player with low wins (not in top 20)
        low_player = Player.objects.create_user(username="low_player", password="testpass123")
        low_player.wins = 1
        low_player.losses = 0
        low_player.save()

        client.force_authenticate(user=low_player)
        url = reverse("scoreboard:scoreboard-list")
        response = client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert "current_user_entry" in response.data
        assert response.data["current_user_entry"] is not None
        assert response.data["current_user_entry"]["username"] == "low_player"
        assert response.data["current_user_entry"]["rank"] == 21
        assert response.data["current_user_in_top20"] is False

    def test_get_scoreboard_includes_current_user_entry_when_in_top_20(self):
        client = APIClient()

        # Create a player with high wins
        top_player = Player.objects.create_user(username="top_player", password="testpass123")
        top_player.wins = 100
        top_player.losses = 0
        top_player.save()

        client.force_authenticate(user=top_player)
        url = reverse("scoreboard:scoreboard-list")
        response = client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert "current_user_entry" in response.data
        assert response.data["current_user_entry"] is not None
        assert response.data["current_user_entry"]["username"] == "top_player"
        assert response.data["current_user_entry"]["rank"] == 1
        assert response.data["current_user_in_top20"] is True

    def test_get_scoreboard_sorts_by_wins_then_losses(self):
        client = APIClient()

        # Create players with same wins but different losses
        player1 = Player.objects.create_user(username="player1", password="testpass123")
        player1.wins = 10
        player1.losses = 1  # Fewer losses = better rank
        player1.save()

        player2 = Player.objects.create_user(username="player2", password="testpass123")
        player2.wins = 10
        player2.losses = 3  # More losses = worse rank
        player2.save()

        player3 = Player.objects.create_user(username="player3", password="testpass123")
        player3.wins = 9
        player3.losses = 0
        player3.save()

        client.force_authenticate(user=player1)
        url = reverse("scoreboard:scoreboard-list")
        response = client.get(url)

        assert response.status_code == status.HTTP_200_OK
        results = response.data["results"]

        # player1 should be first (same wins, fewer losses)
        assert results[0]["username"] == "player1"
        assert results[0]["wins"] == 10
        assert results[0]["losses"] == 1

        # player2 should be second (same wins, more losses)
        assert results[1]["username"] == "player2"
        assert results[1]["wins"] == 10
        assert results[1]["losses"] == 3

        # player3 should be third (fewer wins)
        assert results[2]["username"] == "player3"
        assert results[2]["wins"] == 9

    def test_get_scoreboard_excludes_inactive_players(self):
        client = APIClient()

        active_player = Player.objects.create_user(username="active", password="testpass123")
        active_player.wins = 10
        active_player.save()

        inactive_player = Player.objects.create_user(username="inactive", password="testpass123")
        inactive_player.wins = 20
        inactive_player.is_active = False
        inactive_player.save()

        client.force_authenticate(user=active_player)
        url = reverse("scoreboard:scoreboard-list")
        response = client.get(url)

        assert response.status_code == status.HTTP_200_OK
        results = response.data["results"]
        usernames = [r["username"] for r in results]
        assert "active" in usernames
        assert "inactive" not in usernames

    def test_get_scoreboard_handles_zero_wins_and_losses(self):
        client = APIClient()

        player = Player.objects.create_user(username="new_player", password="testpass123")
        player.wins = 0
        player.losses = 0
        player.save()

        client.force_authenticate(user=player)
        url = reverse("scoreboard:scoreboard-list")
        response = client.get(url)

        assert response.status_code == status.HTTP_200_OK
        results = response.data["results"]
        assert len(results) > 0
        # Find the new player in results
        new_player_entry = next((r for r in results if r["username"] == "new_player"), None)
        if new_player_entry:
            assert new_player_entry["win_rate"] == 0
