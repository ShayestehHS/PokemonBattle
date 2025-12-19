import pytest
from django.urls import reverse
from rest_framework import status

from battles.models import Battle


@pytest.mark.django_db
class TestBattleRetrieveGET:
    @pytest.fixture(autouse=True)
    def setup(
        self, api_client, create_player, create_pokemon, create_pokemon_type, create_player_pokemon, create_battle
    ):
        self.client = api_client
        self.player = create_player(username="player1", password="TestPass123!")
        self.opponent = create_player(username="opponent", password="TestPass123!")
        fire_type = create_pokemon_type(name="fire")
        water_type = create_pokemon_type(name="water")
        self.charmander = create_pokemon(name="Charmander", pokedex_number=4001, primary_type=fire_type, base_speed=65)
        self.squirtle = create_pokemon(name="Squirtle", pokedex_number=4002, primary_type=water_type, base_speed=43)
        self.player_pokemon = create_player_pokemon(player=self.player, pokemon=self.charmander)
        self.opponent_pokemon = create_player_pokemon(player=self.opponent, pokemon=self.squirtle)
        self.battle = create_battle(
            player1=self.player,
            player2=self.opponent,
            player1_pokemon=self.player_pokemon,
            player2_pokemon=self.opponent_pokemon,
        )

    def _get_url(self, battle_id):
        return reverse("battles:battle-detail", kwargs={"pk": battle_id})

    def test_retrieve_battle_state_returns_200(self):
        self.client.force_authenticate(user=self.player)

        response = self.client.get(self._get_url(self.battle.id))
        json_response = response.json()

        assert response.status_code == status.HTTP_200_OK
        assert set(json_response.keys()) == {
            "id",
            "status",
            "player1",
            "player2",
            "current_turn",
            "turn_number",
            "turns",
            "winner_id",
            "player1_inventory",
            "player2_inventory",
            "player1_attack_boost",
            "player1_defense_boost",
            "player2_attack_boost",
            "player2_defense_boost",
        }
        assert json_response["id"] == str(self.battle.id)
        assert json_response["status"] == "active"

    def test_retrieve_battle_state_without_authentication_returns_401(self):
        response = self.client.get(self._get_url(self.battle.id))

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_retrieve_battle_state_when_not_participant_returns_403(self, create_player):
        other_player = create_player(username="other", password="TestPass123!")

        self.client.force_authenticate(user=other_player)

        response = self.client.get(self._get_url(self.battle.id))
        json_response = response.json()

        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert "not a participant" in json_response["detail"]

    def test_retrieve_battle_state_with_invalid_id_returns_404(self):
        self.client.force_authenticate(user=self.player)

        response = self.client.get(self._get_url("00000000-0000-0000-0000-000000000000"))

        assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.django_db
class TestBattleHistoryGET:
    @pytest.fixture(autouse=True)
    def setup(
        self, api_client, create_player, create_pokemon, create_pokemon_type, create_player_pokemon, create_battle
    ):
        self.client = api_client
        self.url = reverse("battles:battle-history")
        self.player = create_player(username="player1", password="TestPass123!")
        self.opponent = create_player(username="opponent", password="TestPass123!")
        fire_type = create_pokemon_type(name="fire")
        water_type = create_pokemon_type(name="water")
        self.charmander = create_pokemon(name="Charmander", pokedex_number=4001, primary_type=fire_type, base_speed=65)
        self.squirtle = create_pokemon(name="Squirtle", pokedex_number=4002, primary_type=water_type, base_speed=43)
        self.player_pokemon = create_player_pokemon(player=self.player, pokemon=self.charmander)
        self.opponent_pokemon = create_player_pokemon(player=self.opponent, pokemon=self.squirtle)

    def test_get_battle_history_returns_200(self, create_battle):
        create_battle(
            player1=self.player,
            player2=self.opponent,
            player1_pokemon=self.player_pokemon,
            player2_pokemon=self.opponent_pokemon,
            status=Battle.STATUS_COMPLETED,
        )

        self.client.force_authenticate(user=self.player)

        response = self.client.get(self.url)
        json_response = response.json()

        assert response.status_code == status.HTTP_200_OK
        assert isinstance(json_response, list)
        assert len(json_response) >= 1
        battle_data = json_response[0]
        assert set(battle_data.keys()) == {
            "id",
            "status",
            "opponent",
            "winner_id",
            "created_at",
            "completed_at",
        }

    def test_get_battle_history_without_authentication_returns_401(self):
        response = self.client.get(self.url)

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_get_battle_history_returns_only_player_battles(self, create_battle, create_player, create_player_pokemon):
        other_player = create_player(username="other", password="TestPass123!")
        other_opponent = create_player(username="other_opponent", password="TestPass123!")
        other_pokemon = create_player_pokemon(player=other_player, pokemon=self.charmander)
        other_opponent_pokemon = create_player_pokemon(player=other_opponent, pokemon=self.squirtle)

        create_battle(
            player1=other_player,
            player2=other_opponent,
            player1_pokemon=other_pokemon,
            player2_pokemon=other_opponent_pokemon,
            status=Battle.STATUS_COMPLETED,
        )

        completed_battle = create_battle(
            player1=self.player,
            player2=self.opponent,
            player1_pokemon=self.player_pokemon,
            player2_pokemon=self.opponent_pokemon,
            status=Battle.STATUS_COMPLETED,
        )

        self.client.force_authenticate(user=self.player)

        response = self.client.get(self.url)
        json_response = response.json()

        assert response.status_code == status.HTTP_200_OK
        assert len(json_response) == 1
        assert json_response[0]["id"] == str(completed_battle.id)


@pytest.mark.django_db
class TestBattleDetailGET:
    @pytest.fixture(autouse=True)
    def setup(
        self, api_client, create_player, create_pokemon, create_pokemon_type, create_player_pokemon, create_battle
    ):
        self.client = api_client
        self.player = create_player(username="player1", password="TestPass123!")
        self.opponent = create_player(username="opponent", password="TestPass123!")
        fire_type = create_pokemon_type(name="fire")
        water_type = create_pokemon_type(name="water")
        self.charmander = create_pokemon(name="Charmander", pokedex_number=4001, primary_type=fire_type, base_speed=65)
        self.squirtle = create_pokemon(name="Squirtle", pokedex_number=4002, primary_type=water_type, base_speed=43)
        self.player_pokemon = create_player_pokemon(player=self.player, pokemon=self.charmander)
        self.opponent_pokemon = create_player_pokemon(player=self.opponent, pokemon=self.squirtle)
        self.battle = create_battle(
            player1=self.player,
            player2=self.opponent,
            player1_pokemon=self.player_pokemon,
            player2_pokemon=self.opponent_pokemon,
        )

    def _get_url(self, battle_id):
        return reverse("battles:battle-detail", kwargs={"pk": battle_id})

    def test_get_battle_detail_returns_200(self):
        self.client.force_authenticate(user=self.player)

        response = self.client.get(self._get_url(self.battle.id))
        json_response = response.json()

        assert response.status_code == status.HTTP_200_OK
        assert "turns" in json_response
        assert isinstance(json_response["turns"], list)

    def test_get_battle_detail_without_authentication_returns_401(self):
        response = self.client.get(self._get_url(self.battle.id))

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_get_battle_detail_when_not_participant_returns_403(self, create_player):
        other_player = create_player(username="other", password="TestPass123!")

        self.client.force_authenticate(user=other_player)

        response = self.client.get(self._get_url(self.battle.id))
        json_response = response.json()

        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert "not a participant" in json_response["detail"]
