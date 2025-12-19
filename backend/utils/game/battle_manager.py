from dataclasses import dataclass, field
from uuid import UUID

from django.db import transaction

from battles.models import Battle
from players.models import Player
from utils.game.ai import BattleAI
from utils.game.battle_creator import BattleCreator
from utils.game.exceptions import BattleNotActiveException, NotParticipantException, NotYourTurnException
from utils.game.items import ItemHandlerRegistry, ItemUseResult
from utils.game.turn_processor import TurnProcessor, TurnResult


@dataclass
class ItemUseResponse:
    success: bool
    message: str
    hp_restored: int = 0
    new_hp: int = 0
    boost_turns_remaining: int = 0
    inventory: dict = field(default_factory=dict)


@dataclass
class TurnResponse:
    battle: Battle
    turn_result: TurnResult
    ai_turn_result: TurnResult | None = None

    @property
    def is_battle_complete(self) -> bool:
        if self.turn_result.battle_complete:
            return True
        if self.ai_turn_result and self.ai_turn_result.battle_complete:
            return True
        return False

    @property
    def winner(self) -> Player | None:
        if self.turn_result.battle_complete:
            return self.turn_result.winner
        if self.ai_turn_result and self.ai_turn_result.battle_complete:
            return self.ai_turn_result.winner
        return None


class BattleManager:
    def __init__(self, battle: Battle, player: Player):
        self.battle = battle
        self.player = player

    # =========================================================================
    # Validation Methods
    # =========================================================================

    def validate_participant(self):
        if self.battle.player1 != self.player and self.battle.player2 != self.player:
            raise NotParticipantException()

    def validate_active(self):
        if self.battle.status != Battle.STATUS_ACTIVE:
            raise BattleNotActiveException()

    def validate_turn(self):
        if not self.battle.is_player_turn(self.player):
            raise NotYourTurnException()

    def validate_can_act(self):
        self.validate_participant()
        self.validate_active()
        self.validate_turn()

    # =========================================================================
    # Battle Creation
    # =========================================================================

    @classmethod
    def create_battle(
        cls,
        user: Player,
        pokemon_id: UUID | None = None,
        opponent_id: UUID | None = None,
    ) -> Battle:
        creator = BattleCreator(user, pokemon_id, opponent_id)
        return creator.create()

    # =========================================================================
    # Turn Processing
    # =========================================================================

    def process_turn(self, action: str) -> TurnResponse:
        self.validate_can_act()

        with transaction.atomic():
            battle = Battle.objects.select_for_update().get(id=self.battle.id)
            self.battle = battle

            processor = TurnProcessor(battle, self.player, action)
            turn_result = processor.process()

            ai_turn_result = None
            if not turn_result.battle_complete:
                ai_turn_result = self._process_ai_turn()

            return TurnResponse(
                battle=self.battle,
                turn_result=turn_result,
                ai_turn_result=ai_turn_result,
            )

    def _process_ai_turn(self) -> TurnResult:
        ai_player = self.battle.current_turn_player
        ai_action = BattleAI.get_action()

        processor = TurnProcessor(self.battle, ai_player, ai_action)
        return processor.process()

    # =========================================================================
    # Item Usage
    # =========================================================================

    def use_item(self, item_type: str) -> ItemUseResponse:
        self.validate_can_act()

        with transaction.atomic():
            battle = Battle.objects.select_for_update().get(id=self.battle.id)
            self.battle = battle

            item_result = ItemHandlerRegistry.use_item(battle, self.player, item_type)
            self._advance_turn_after_item()

            return self._build_item_response(item_result)

    def _advance_turn_after_item(self):
        self.battle.turn_number += 1
        self.battle.current_turn_player = self.battle.get_opponent(self.player)
        self.battle.save()

    def _build_item_response(self, item_result: ItemUseResult) -> ItemUseResponse:
        inventory = self._get_player_inventory()

        return ItemUseResponse(
            success=True,
            message=item_result.message,
            hp_restored=item_result.hp_restored,
            new_hp=item_result.new_hp,
            boost_turns_remaining=item_result.boost_turns_remaining,
            inventory=inventory,
        )

    def _get_player_inventory(self) -> dict:
        if self.player == self.battle.player1:
            return {
                "potion": self.battle.player1_potions,
                "x-attack": self.battle.player1_x_attack,
                "x-defense": self.battle.player1_x_defense,
            }
        return {
            "potion": self.battle.player2_potions,
            "x-attack": self.battle.player2_x_attack,
            "x-defense": self.battle.player2_x_defense,
        }

    # =========================================================================
    # Battle State Retrieval
    # =========================================================================

    def get_battle_with_player_data(self) -> Battle:
        self.validate_participant()

        self.battle.player1_data = {
            "player": self.battle.player1,
            "player_pokemon": self.battle.player1_pokemon,
        }
        self.battle.player2_data = {
            "player": self.battle.player2,
            "player_pokemon": self.battle.player2_pokemon,
        }

        return self.battle
