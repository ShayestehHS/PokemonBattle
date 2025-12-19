from django.db.models import Q
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.mixins import CreateModelMixin, ListModelMixin, RetrieveModelMixin
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
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


class BattleViewSet(CreateModelMixin, RetrieveModelMixin, ListModelMixin, GenericViewSet):
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
        return BattleStateSerializer

    @action(detail=True, methods=["post"])
    def turn(self, request, pk=None):
        battle = self.get_object()
        serializer = TurnSubmitSerializer(data=request.data, context={"request": request, "battle": battle})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"], url_path="use-item")
    def use_item(self, request, pk=None):
        battle = self.get_object()
        serializer = ItemUseSerializer(data=request.data, context={"request": request, "battle": battle})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)
