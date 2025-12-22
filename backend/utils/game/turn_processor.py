from dataclasses import dataclass

from battles.models import Battle, BattleTurn
from utils.exceptions.exceptions import ToastError
from utils.game.damage_calculator import calculate_damage


@dataclass
class TurnResult:
    turn: BattleTurn
    battle_complete: bool
    winner: object | None
    damage: int
    new_hp: int


class TurnProcessor:
    ACTION_ATTACK = "attack"
    ACTION_DEFEND = "defend"

    def __init__(self, battle: Battle, player, action: str):
        self.battle = battle
        self.player = player
        self.action = action
        self.opponent = battle.get_opponent(player)

    def validate(self):
        self._validate_battle_active()
        self._validate_player_turn()

    def _validate_battle_active(self):
        if self.battle.status != Battle.STATUS_ACTIVE:
            raise ToastError("Battle is not active")

    def _validate_player_turn(self):
        if not self.battle.is_player_turn(self.player):
            raise ToastError("It is not your turn")

    def process(self) -> TurnResult:
        self.validate()

        damage_result = self._calculate_damage()
        damage = self._get_damage_from_result(damage_result)
        new_hp = self._apply_damage(damage)
        message = self._generate_message(damage, damage_result)
        turn = self._create_turn_record(damage, damage_result, message)
        battle_complete, winner = self._check_battle_completion(new_hp)

        if battle_complete:
            self._complete_battle(winner)
        else:
            self._advance_turn()
            self._decay_boosts()

        return TurnResult(
            turn=turn,
            battle_complete=battle_complete,
            winner=winner,
            damage=damage,
            new_hp=new_hp,
        )

    def _calculate_damage(self) -> dict:
        attacker_pokemon = self.battle.get_player_pokemon(self.player).pokemon
        defender_pokemon = self.battle.get_player_pokemon(self.opponent).pokemon
        attacker_attack_boost = self._get_attacker_attack_boost()
        defender_defense_boost = self._get_defender_defense_boost()

        return calculate_damage(
            attacker_pokemon,
            defender_pokemon,
            attacker_attack_boost,
            defender_defense_boost,
            self.action,
        )

    def _get_attacker_attack_boost(self) -> int:
        if self.player == self.battle.player1:
            return self.battle.player1_attack_boost
        return self.battle.player2_attack_boost

    def _get_defender_defense_boost(self) -> int:
        if self.opponent == self.battle.player1:
            return self.battle.player1_defense_boost
        return self.battle.player2_defense_boost

    def _get_damage_from_result(self, damage_result: dict) -> int:
        if self.action == self.ACTION_ATTACK:
            return damage_result["damage"]
        return 0

    def _apply_damage(self, damage: int) -> int:
        current_hp = self.battle.get_current_hp(self.opponent)
        new_hp = max(0, current_hp - damage)
        self.battle.set_current_hp(self.opponent, new_hp)
        return new_hp

    def _generate_message(self, damage: int, damage_result: dict) -> str:
        if self.action == self.ACTION_DEFEND:
            return f"{self.player.username} chose to defend!"

        parts = [f"{self.player.username} attacks!"]

        if damage_result["is_critical"]:
            parts.append("Critical hit!")

        if damage_result["is_super_effective"]:
            parts.append("It's super effective!")

        parts.append(f"Dealt {damage} damage.")

        return " ".join(parts)

    def _create_turn_record(self, damage: int, damage_result: dict, message: str) -> BattleTurn:
        return BattleTurn.objects.create(
            battle=self.battle,
            player=self.player,
            turn_number=self.battle.turn_number,
            action=self.action,
            damage=damage,
            is_critical=damage_result["is_critical"],
            is_super_effective=damage_result["is_super_effective"],
            message=message,
        )

    def _check_battle_completion(self, new_hp: int) -> tuple:
        if new_hp == 0:
            return True, self.player
        return False, None

    def _complete_battle(self, winner):
        self.battle.complete(winner)
        winner.wins += 1
        winner.save(update_fields=["wins"])
        self.opponent.losses += 1
        self.opponent.save(update_fields=["losses"])

    def _advance_turn(self):
        self.battle.turn_number += 1
        self.battle.current_turn_player = self.opponent
        self.battle.save(
            update_fields=[
                "turn_number",
                "current_turn_player",
                "player1_current_hp",
                "player2_current_hp",
            ]
        )

    def _decay_boosts(self):
        attacker_boost = self._get_attacker_attack_boost()
        defender_boost = self._get_defender_defense_boost()

        if attacker_boost > 0:
            if self.player == self.battle.player1:
                self.battle.player1_attack_boost -= 1
            else:
                self.battle.player2_attack_boost -= 1

        if defender_boost > 0:
            if self.opponent == self.battle.player1:
                self.battle.player1_defense_boost -= 1
            else:
                self.battle.player2_defense_boost -= 1

        self.battle.save(
            update_fields=[
                "player1_attack_boost",
                "player1_defense_boost",
                "player2_attack_boost",
                "player2_defense_boost",
            ]
        )
