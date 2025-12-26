from django.db.models import Q
from rest_framework.decorators import action
from rest_framework.mixins import CreateModelMixin, ListModelMixin, RetrieveModelMixin, UpdateModelMixin
from rest_framework.permissions import IsAuthenticated
from rest_framework.viewsets import GenericViewSet

from battles.models import Battle
from battles.serializers import (
    BattleCreateSerializer,
    BattleHistorySerializer,
    BattleStateSerializer,
    ItemUseSerializer,
    TurnSubmitSerializer,
)


class BattleHistoryViewSet(ListModelMixin, GenericViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = BattleHistorySerializer

    def get_queryset(self):
        return Battle.objects.for_player(self.request.user).order_by("-id")


class BattleViewSet(CreateModelMixin, RetrieveModelMixin, ListModelMixin, UpdateModelMixin, GenericViewSet):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return (
            Battle.objects.filter(Q(player1=user) | Q(player2=user))
            .select_related(
                "player1",
                "player2",
                "winner",
                "current_turn_player",
                "player1_pokemon__pokemon__primary_type",
                "player2_pokemon__pokemon__primary_type",
            )
            .prefetch_related("turns")
        )

    def get_serializer_class(self):
        if self.action == "create":
            return BattleCreateSerializer
        elif self.action == "retrieve":
            return BattleStateSerializer
        elif self.action == "turn":
            return TurnSubmitSerializer
        elif self.action == "use_item":
            return ItemUseSerializer
        return BattleStateSerializer

    def get_serializer_context(self):
        context = super().get_serializer_context()
        if self.action in ["turn", "use_item"]:
            context["battle"] = self.get_object()
        return context

    @action(detail=True, methods=["post"])
    def turn(self, request, pk=None, *args, **kwargs):
        return super().update(request, *args, **kwargs)

    @action(detail=True, methods=["post"], url_path="use-item")
    def use_item(self, request, pk=None, *args, **kwargs):
        return super().update(request, *args, **kwargs)
