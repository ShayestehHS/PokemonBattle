from django.db import models


class BattleManager(models.Manager):
    def active_for_player(self, player):
        from battles.models import Battle

        return self.filter(
            models.Q(player1=player) | models.Q(player2=player),
            status=Battle.STATUS_ACTIVE,
        )

    def for_player(self, player):
        return self.filter(models.Q(player1=player) | models.Q(player2=player))
