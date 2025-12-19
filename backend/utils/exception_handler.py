from rest_framework.response import Response
from rest_framework.views import exception_handler as drf_exception_handler

from utils.game.exceptions import BattleException


def exception_handler(exc, context):
    if isinstance(exc, BattleException):
        return Response(
            {"detail": exc.message},
            status=exc.status_code,
        )

    return drf_exception_handler(exc, context)
