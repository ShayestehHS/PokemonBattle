from dataclasses import dataclass

from utils.game.exceptions import (
    InvalidItemTypeException,
    NoPotionRemainingException,
    NoXAttackRemainingException,
    NoXDefenseRemainingException,
)


@dataclass
class ItemUseResult:
    message: str
    hp_restored: int = 0
    new_hp: int = 0
    boost_turns_remaining: int = 0


class ItemType:
    POTION = "potion"
    X_ATTACK = "x-attack"
    X_DEFENSE = "x-defense"

    ALL = [POTION, X_ATTACK, X_DEFENSE]


class BaseItemHandler:
    @classmethod
    def use(cls, battle, player) -> ItemUseResult:
        is_player1 = battle.player1 == player

        if is_player1:
            cls._validate_player1(battle)
            return cls._apply_player1(battle)
        else:
            cls._validate_player2(battle)
            return cls._apply_player2(battle)

    @classmethod
    def _validate_player1(cls, battle):
        raise NotImplementedError("Subclasses must implement _validate_player1")

    @classmethod
    def _validate_player2(cls, battle):
        raise NotImplementedError("Subclasses must implement _validate_player2")

    @classmethod
    def _apply(cls, battle, player_name) -> ItemUseResult:
        raise NotImplementedError("Subclasses must implement _apply")

    @classmethod
    def _apply_player1(cls, battle) -> ItemUseResult:
        return cls._apply(battle, "player1")

    @classmethod
    def _apply_player2(cls, battle) -> ItemUseResult:
        return cls._apply(battle, "player2")


class PotionHandler(BaseItemHandler):
    HEAL_AMOUNT = 50

    @classmethod
    def _validate_player1(cls, battle):
        if battle.player1_potions == 0:
            raise NoPotionRemainingException()

    @classmethod
    def _validate_player2(cls, battle):
        if battle.player2_potions == 0:
            raise NoPotionRemainingException()

    @classmethod
    def _apply(cls, battle, player_name) -> ItemUseResult:
        setattr(battle, f"{player_name}_potions", getattr(battle, f"{player_name}_potions") - 1)
        current_hp = getattr(battle, f"{player_name}_current_hp")
        max_hp = getattr(battle, f"{player_name}_pokemon").pokemon.base_hp
        new_hp = min(max_hp, current_hp + cls.HEAL_AMOUNT)
        setattr(battle, f"{player_name}_current_hp", new_hp)
        hp_restored = new_hp - current_hp

        return ItemUseResult(
            message=f"Used Potion! Restored {hp_restored} HP.",
            hp_restored=hp_restored,
            new_hp=new_hp,
        )


class XAttackHandler(BaseItemHandler):
    BOOST_TURNS = 2
    BOOST_MULTIPLIER = "50%"

    @classmethod
    def _validate_player1(cls, battle):
        if battle.player1_x_attack == 0:
            raise NoXAttackRemainingException()

    @classmethod
    def _validate_player2(cls, battle):
        if battle.player2_x_attack == 0:
            raise NoXAttackRemainingException()

    @classmethod
    def _apply(cls, battle, player_name) -> ItemUseResult:
        setattr(battle, f"{player_name}_x_attack", getattr(battle, f"{player_name}_x_attack") - 1)
        setattr(battle, f"{player_name}_attack_boost", cls.BOOST_TURNS)

        return ItemUseResult(
            message=f"Used X-Attack! Attack boosted by {cls.BOOST_MULTIPLIER} for {cls.BOOST_TURNS} turns.",
            boost_turns_remaining=cls.BOOST_TURNS,
        )


class XDefenseHandler(BaseItemHandler):
    BOOST_TURNS = 2

    @classmethod
    def _validate_player1(cls, battle):
        if battle.player1_x_defense == 0:
            raise NoXDefenseRemainingException()

    @classmethod
    def _validate_player2(cls, battle):
        if battle.player2_x_defense == 0:
            raise NoXDefenseRemainingException()

    @classmethod
    def _apply(cls, battle, player_name) -> ItemUseResult:
        setattr(battle, f"{player_name}_x_defense", getattr(battle, f"{player_name}_x_defense") - 1)
        setattr(battle, f"{player_name}_defense_boost", cls.BOOST_TURNS)

        return ItemUseResult(
            message=f"Used X-Defense! Defense boosted for {cls.BOOST_TURNS} turns.",
            boost_turns_remaining=cls.BOOST_TURNS,
        )


class ItemHandlerRegistry:
    _handlers = {
        ItemType.POTION: PotionHandler,
        ItemType.X_ATTACK: XAttackHandler,
        ItemType.X_DEFENSE: XDefenseHandler,
    }

    @classmethod
    def get_handler(cls, item_type: str):
        handler = cls._handlers.get(item_type)
        if handler is None:
            raise InvalidItemTypeException(f"Invalid item type: {item_type}")
        return handler

    @classmethod
    def use_item(cls, battle, player, item_type: str) -> ItemUseResult:
        handler = cls.get_handler(item_type)
        return handler.use(battle, player)
