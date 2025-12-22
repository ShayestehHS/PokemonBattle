import pytest
from django.urls import reverse
from rest_framework import status

from battles.models import Battle


@pytest.mark.django_db
class TestBattleUseItemPOST:
    @pytest.fixture(autouse=True)
    def setup(
        self, api_client, create_player, create_pokemon, create_pokemon_type, create_player_pokemon, create_battle
    ):
        self.client = api_client
        self.player = create_player(username="player1", password="TestPass123!")
        self.opponent = create_player(username="opponent", password="TestPass123!")
        fire_type = create_pokemon_type(name="fire")
        water_type = create_pokemon_type(name="water")
        self.charmander = create_pokemon(name="Charmander", pokedex_number=3001, primary_type=fire_type, base_speed=65)
        self.squirtle = create_pokemon(name="Squirtle", pokedex_number=3002, primary_type=water_type, base_speed=43)
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
        return reverse("battles:battle-use-item", kwargs={"pk": battle_id})

    def test_use_potion_returns_200(self):
        initial_hp = 50
        self.battle.player1_current_hp = initial_hp
        self.battle.player1_potions = 2
        self.battle.save()

        self.client.force_authenticate(user=self.player)
        data = {"item_type": "potion"}

        response = self.client.post(self._get_url(self.battle.id), data=data)
        json_response = response.json()

        assert response.status_code == status.HTTP_200_OK
        assert set(json_response.keys()) == {
            "success",
            "message",
            "hp_restored",
            "new_hp",
            "boost_turns_remaining",
            "inventory",
        }
        assert json_response["success"] is True
        assert "Potion" in json_response["message"]
        self.battle.refresh_from_db()
        assert self.battle.player1_potions == 1
        # Verify potion was used (inventory reduced)
        assert json_response["inventory"]["potion"] == 1

    def test_use_x_attack_returns_200(self):
        self.battle.player1_x_attack = 1
        self.battle.save()

        self.client.force_authenticate(user=self.player)
        data = {"item_type": "x-attack"}

        response = self.client.post(self._get_url(self.battle.id), data=data)
        json_response = response.json()

        assert response.status_code == status.HTTP_200_OK
        assert json_response["success"] is True
        assert "X-Attack" in json_response["message"]
        assert json_response["boost_turns_remaining"] == 2
        self.battle.refresh_from_db()
        assert self.battle.player1_x_attack == 0
        assert self.battle.player1_attack_boost == 2

    def test_use_x_defense_returns_200(self):
        self.battle.player1_x_defense = 1
        self.battle.save()

        self.client.force_authenticate(user=self.player)
        data = {"item_type": "x-defense"}

        response = self.client.post(self._get_url(self.battle.id), data=data)
        json_response = response.json()

        assert response.status_code == status.HTTP_200_OK
        assert json_response["success"] is True
        assert "X-Defense" in json_response["message"]
        assert json_response["boost_turns_remaining"] == 2
        self.battle.refresh_from_db()
        assert self.battle.player1_x_defense == 0
        assert self.battle.player1_defense_boost == 2

    def test_use_potion_when_no_potions_remaining_returns_400(self):
        self.battle.player1_potions = 0
        self.battle.save()

        self.client.force_authenticate(user=self.player)
        data = {"item_type": "potion"}

        response = self.client.post(self._get_url(self.battle.id), data=data)
        json_response = response.json()

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "No potions" in str(json_response) or "item_type" in json_response

    def test_use_x_attack_when_no_items_remaining_returns_400(self):
        self.battle.player1_x_attack = 0
        self.battle.save()

        self.client.force_authenticate(user=self.player)
        data = {"item_type": "x-attack"}

        response = self.client.post(self._get_url(self.battle.id), data=data)
        json_response = response.json()

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "No X-Attack" in str(json_response) or "detail" in json_response

    def test_use_x_defense_when_no_items_remaining_returns_400(self):
        self.battle.player1_x_defense = 0
        self.battle.save()

        self.client.force_authenticate(user=self.player)
        data = {"item_type": "x-defense"}

        response = self.client.post(self._get_url(self.battle.id), data=data)
        json_response = response.json()

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "No X-Defense" in str(json_response) or "detail" in json_response

    def test_use_item_without_authentication_returns_401(self):
        data = {"item_type": "potion"}

        response = self.client.post(self._get_url(self.battle.id), data=data)

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_use_item_when_not_participant_returns_404(self, create_player):
        other_player = create_player(username="other", password="TestPass123!")

        self.client.force_authenticate(user=other_player)
        data = {"item_type": "potion"}

        response = self.client.post(self._get_url(self.battle.id), data=data)

        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_use_item_when_not_your_turn_returns_400(self):
        self.battle.current_turn_player = self.opponent
        self.battle.save()

        self.client.force_authenticate(user=self.player)
        data = {"item_type": "potion"}

        response = self.client.post(self._get_url(self.battle.id), data=data)
        json_response = response.json()

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "It is not your turn" in str(json_response) or "item_type" in json_response

    def test_use_item_when_battle_completed_returns_400(self):
        self.battle.status = Battle.STATUS_COMPLETED
        self.battle.save()

        self.client.force_authenticate(user=self.player)
        data = {"item_type": "potion"}

        response = self.client.post(self._get_url(self.battle.id), data=data)
        json_response = response.json()

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "not active" in str(json_response) or "item_type" in json_response

    def test_use_item_with_invalid_item_type_returns_400(self):
        self.client.force_authenticate(user=self.player)
        data = {"item_type": "invalid"}

        response = self.client.post(self._get_url(self.battle.id), data=data)

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_use_potion_restores_hp_up_to_max(self):
        max_hp = self.player_pokemon.pokemon.base_hp
        self.battle.player1_current_hp = max_hp - 20
        self.battle.player1_potions = 2
        self.battle.save()

        self.client.force_authenticate(user=self.player)
        data = {"item_type": "potion"}

        response = self.client.post(self._get_url(self.battle.id), data=data)
        json_response = response.json()

        assert response.status_code == status.HTTP_200_OK
        assert json_response["new_hp"] == max_hp
        assert json_response["hp_restored"] == 20
