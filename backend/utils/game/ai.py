import random


class BattleAI:
    ATTACK_PROBABILITY = 0.75
    DEFEND_PROBABILITY = 0.25

    ACTION_ATTACK = "attack"
    ACTION_DEFEND = "defend"

    @classmethod
    def get_action(cls) -> str:
        return cls.ACTION_ATTACK if random.random() < cls.ATTACK_PROBABILITY else cls.ACTION_DEFEND
