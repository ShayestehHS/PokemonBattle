from unittest.mock import patch

import pytest
from django.urls import reverse
from rest_framework import status

from battles.models import Battle, BattleTurn


@pytest.mark.django_db
class TestBattleTurnPOST:
    @pytest.fixture(autouse=True)
    def setup(
        self, api_client, create_player, create_pokemon, create_pokemon_type, create_player_pokemon, create_battle
    ):
        self.client = api_client
        self.player = create_player(username="player1", password="TestPass123!")
        self.opponent = create_player(username="opponent", password="TestPass123!")
        fire_type = create_pokemon_type(name="fire")
        water_type = create_pokemon_type(name="water")
        self.charmander = create_pokemon(name="Charmander", pokedex_number=2001, primary_type=fire_type, base_speed=65)
        self.squirtle = create_pokemon(name="Squirtle", pokedex_number=2002, primary_type=water_type, base_speed=43)
        self.player_pokemon = create_player_pokemon(player=self.player, pokemon=self.charmander)
        self.opponent_pokemon = create_player_pokemon(player=self.opponent, pokemon=self.squirtle)
        self.battle = create_battle(
            player1=self.player,
            player2=self.opponent,
            player1_pokemon=self.player_pokemon,
            player2_pokemon=self.opponent_pokemon,
            current_turn_player=self.player,
        )

    def _get_url(self, battle_id):
        return reverse("battles:battle-turn", kwargs={"pk": battle_id})

    @patch("battles.services.battle_engine.get_ai_action")
    @patch("battles.services.damage_calculator.random.random")
    def test_submit_turn_with_attack_action_returns_200(self, mock_random, mock_ai_action):
        mock_random.return_value = 0.5  # No crit
        mock_ai_action.return_value = "attack"

        self.client.force_authenticate(user=self.player)
        data = {"action": "attack"}

        response = self.client.post(self._get_url(self.battle.id), data=data)
        json_response = response.json()

        assert response.status_code == status.HTTP_200_OK
        assert "battle" in json_response or "id" in json_response
        assert BattleTurn.objects.filter(battle=self.battle, player=self.player).exists()

    @patch("battles.services.battle_engine.get_ai_action")
    def test_submit_turn_with_defend_action_returns_200(self, mock_ai_action):
        mock_ai_action.return_value = "defend"

        self.client.force_authenticate(user=self.player)
        data = {"action": "defend"}

        response = self.client.post(self._get_url(self.battle.id), data=data)

        assert response.status_code == status.HTTP_200_OK
        assert BattleTurn.objects.filter(battle=self.battle, player=self.player, action="defend").exists()

    def test_submit_turn_without_authentication_returns_401(self):
        data = {"action": "attack"}

        response = self.client.post(self._get_url(self.battle.id), data=data)

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_submit_turn_with_invalid_battle_id_returns_404(self):
        self.client.force_authenticate(user=self.player)
        data = {"action": "attack"}

        response = self.client.post(self._get_url("00000000-0000-0000-0000-000000000000"), data=data)

        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_submit_turn_when_not_participant_returns_403(self, create_player):
        other_player = create_player(username="other", password="TestPass123!")

        self.client.force_authenticate(user=other_player)
        data = {"action": "attack"}

        response = self.client.post(self._get_url(self.battle.id), data=data)
        json_response = response.json()

        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert "not a participant" in json_response["detail"]

    def test_submit_turn_when_not_your_turn_returns_400(self):
        self.battle.current_turn_player = self.opponent
        self.battle.save()

        self.client.force_authenticate(user=self.player)
        data = {"action": "attack"}

        response = self.client.post(self._get_url(self.battle.id), data=data)
        json_response = response.json()

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "Not your turn" in json_response["detail"]

    def test_submit_turn_with_invalid_action_returns_400(self):
        self.client.force_authenticate(user=self.player)
        data = {"action": "invalid"}

        response = self.client.post(self._get_url(self.battle.id), data=data)

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_submit_turn_with_missing_action_returns_400(self):
        self.client.force_authenticate(user=self.player)
        data = {}

        response = self.client.post(self._get_url(self.battle.id), data=data)

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_submit_turn_when_battle_completed_returns_400(self):
        self.battle.status = Battle.STATUS_COMPLETED
        self.battle.save()

        self.client.force_authenticate(user=self.player)
        data = {"action": "attack"}

        response = self.client.post(self._get_url(self.battle.id), data=data)
        json_response = response.json()

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "not active" in json_response["detail"]

    @patch("battles.services.battle_engine.get_ai_action")
    @patch("battles.services.damage_calculator.random.random")
    def test_submit_turn_completes_battle_when_hp_reaches_zero(self, mock_random, mock_ai_action):
        mock_random.return_value = 0.5  # No crit
        mock_ai_action.return_value = "attack"
        self.battle.player2_current_hp = 1
        self.battle.save()

        self.client.force_authenticate(user=self.player)
        data = {"action": "attack"}

        response = self.client.post(self._get_url(self.battle.id), data=data)
        json_response = response.json()

        self.battle.refresh_from_db()
        assert response.status_code == status.HTTP_200_OK
        assert "winner" in json_response or self.battle.status == Battle.STATUS_COMPLETED
