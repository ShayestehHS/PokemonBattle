import pytest
from django.urls import reverse
from rest_framework import status

from battles.models import Battle


@pytest.mark.django_db
class TestBattleCreatePOST:
    @pytest.fixture(autouse=True)
    def setup(self, api_client, create_player, create_pokemon, create_pokemon_type, create_player_pokemon):
        self.client = api_client
        self.url = reverse("battles:battle-list")
        self.player = create_player(username="testuser", password="TestPass123!")
        fire_type = create_pokemon_type(name="fire")
        water_type = create_pokemon_type(name="water")
        self.charmander = create_pokemon(name="Charmander", pokedex_number=1001, primary_type=fire_type, base_speed=65)
        self.squirtle = create_pokemon(name="Squirtle", pokedex_number=1002, primary_type=water_type, base_speed=43)
        self.player_pokemon = create_player_pokemon(player=self.player, pokemon=self.charmander)
        self.player.active_pokemon = self.player_pokemon
        self.player.save()

    def test_create_battle_with_opponent_id_returns_201(
        self, create_player, create_player_pokemon, create_pokemon_type
    ):
        opponent = create_player(username="opponent", password="TestPass123!")
        opponent_pokemon = create_player_pokemon(player=opponent, pokemon=self.squirtle)
        opponent.active_pokemon = opponent_pokemon
        opponent.save()

        self.client.force_authenticate(user=self.player)
        data = {"opponent_id": str(opponent.id)}

        response = self.client.post(self.url, data=data)
        json_response = response.json()

        assert response.status_code == status.HTTP_201_CREATED
        assert set(json_response.keys()) == {
            "id",
            "status",
            "player1",
            "player2",
            "current_turn",
            "turn_number",
            "turns",
            "winner_id",
            "player1_potions",
            "player1_x_attack",
            "player1_x_defense",
            "player2_potions",
            "player2_x_attack",
            "player2_x_defense",
            "player1_attack_boost",
            "player1_defense_boost",
            "player2_attack_boost",
            "player2_defense_boost",
            "created_at",
            "completed_at",
        }
        assert json_response["status"] == "active"
        assert json_response["turn_number"] == 1
        assert Battle.objects.filter(id=json_response["id"]).exists()

    def test_create_battle_without_opponent_id_returns_201(
        self, create_player, create_player_pokemon, create_pokemon_type
    ):
        opponent = create_player(username="opponent", password="TestPass123!")
        opponent_pokemon = create_player_pokemon(player=opponent, pokemon=self.squirtle)
        opponent.active_pokemon = opponent_pokemon
        opponent.save()

        self.client.force_authenticate(user=self.player)
        data = {}

        response = self.client.post(self.url, data=data)
        json_response = response.json()

        assert response.status_code == status.HTTP_201_CREATED
        assert json_response["status"] == "active"
        assert Battle.objects.filter(id=json_response["id"]).exists()

    def test_create_battle_with_pokemon_id_returns_201(self, create_player, create_player_pokemon, create_pokemon_type):
        opponent = create_player(username="opponent", password="TestPass123!")
        opponent_pokemon = create_player_pokemon(player=opponent, pokemon=self.squirtle)
        opponent.active_pokemon = opponent_pokemon
        opponent.save()

        other_pokemon = create_player_pokemon(player=self.player, pokemon=self.squirtle)

        self.client.force_authenticate(user=self.player)
        data = {"opponent_id": str(opponent.id), "pokemon_id": str(other_pokemon.id)}

        response = self.client.post(self.url, data=data)
        json_response = response.json()

        assert response.status_code == status.HTTP_201_CREATED
        assert json_response["status"] == "active"

    def test_create_battle_without_authentication_returns_401(self):
        data = {}

        response = self.client.post(self.url, data=data)

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_create_battle_without_active_pokemon_returns_400(self, create_player, create_player_pokemon):
        self.player.active_pokemon = None
        self.player.save()

        opponent = create_player(username="opponent", password="TestPass123!")
        opponent_pokemon = create_player_pokemon(player=opponent, pokemon=self.squirtle)
        opponent.active_pokemon = opponent_pokemon
        opponent.save()

        self.client.force_authenticate(user=self.player)
        data = {"opponent_id": str(opponent.id)}

        response = self.client.post(self.url, data=data)
        json_response = response.json()

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "active Pokemon" in str(json_response) or "detail" in json_response

    def test_create_battle_with_invalid_opponent_id_returns_400(self, create_player):
        self.client.force_authenticate(user=self.player)
        data = {"opponent_id": "00000000-0000-0000-0000-000000000000"}

        response = self.client.post(self.url, data=data)
        json_response = response.json()

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "opponent_id" in json_response or "Opponent not found" in str(json_response)

    def test_create_battle_with_opponent_without_active_pokemon_returns_400(self, create_player, create_pokemon_type):
        opponent = create_player(username="opponent", password="TestPass123!")
        opponent.active_pokemon = None
        opponent.save()

        self.client.force_authenticate(user=self.player)
        data = {"opponent_id": str(opponent.id)}

        response = self.client.post(self.url, data=data)
        json_response = response.json()

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "active Pokemon" in str(json_response) or "detail" in json_response

    def test_create_battle_with_invalid_pokemon_id_returns_400(
        self, create_player, create_player_pokemon, create_pokemon_type
    ):
        opponent = create_player(username="opponent", password="TestPass123!")
        opponent_pokemon = create_player_pokemon(player=opponent, pokemon=self.squirtle)
        opponent.active_pokemon = opponent_pokemon
        opponent.save()

        self.client.force_authenticate(user=self.player)
        data = {"opponent_id": str(opponent.id), "pokemon_id": "00000000-0000-0000-0000-000000000000"}

        response = self.client.post(self.url, data=data)
        json_response = response.json()

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "pokemon_id" in json_response or "Pokemon does not belong" in str(json_response)

    def test_create_battle_with_other_player_pokemon_returns_400(
        self, create_player, create_player_pokemon, create_pokemon_type
    ):
        opponent = create_player(username="opponent", password="TestPass123!")
        opponent_pokemon = create_player_pokemon(player=opponent, pokemon=self.squirtle)
        opponent.active_pokemon = opponent_pokemon
        opponent.save()

        self.client.force_authenticate(user=self.player)
        data = {"opponent_id": str(opponent.id), "pokemon_id": str(opponent_pokemon.id)}

        response = self.client.post(self.url, data=data)
        json_response = response.json()

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "pokemon_id" in json_response or "Pokemon does not belong" in str(json_response)
