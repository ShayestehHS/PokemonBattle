class BattleException(Exception):
    def __init__(self, message: str = "Battle error occurred", status_code: int = 400):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)


class NoOpponentAvailableException(BattleException):
    def __init__(self, message: str = "No opponent available for battle"):
        super().__init__(message, 404)


class NoPokemonException(BattleException):
    def __init__(self):
        super().__init__("No active Pokémon selected", 400)


class OpponentNoPokemonException(BattleException):
    def __init__(self):
        super().__init__("Opponent has no active Pokémon", 400)


class OpponentNotFoundException(BattleException):
    def __init__(self):
        super().__init__("Opponent not found", 404)


class PokemonNotFoundException(BattleException):
    def __init__(self):
        super().__init__("Pokémon not found", 404)


class BattleNotActiveException(BattleException):
    def __init__(self):
        super().__init__("Battle is not active", 400)


class NotParticipantException(BattleException):
    def __init__(self):
        super().__init__("You are not a participant in this battle", 403)


class NotYourTurnException(BattleException):
    def __init__(self):
        super().__init__("It is not your turn", 400)


class InvalidItemTypeException(BattleException):
    def __init__(self, message: str = "Invalid item type"):
        super().__init__(message, 400)


class NoPotionRemainingException(BattleException):
    def __init__(self):
        super().__init__("No potions remaining", 400)


class NoXAttackRemainingException(BattleException):
    def __init__(self):
        super().__init__("No X-Attack remaining", 400)


class NoXDefenseRemainingException(BattleException):
    def __init__(self):
        super().__init__("No X-Defense remaining", 400)
