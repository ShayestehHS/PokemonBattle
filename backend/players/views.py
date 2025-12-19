from rest_framework import status
from rest_framework.decorators import action
from rest_framework.generics import RetrieveUpdateAPIView
from rest_framework.mixins import CreateModelMixin
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import GenericViewSet
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.serializers import TokenRefreshSerializer

from players.models import Player
from players.serializers import LoginSerializer, PlayerSerializer, PlayerUpdateSerializer, RegisterSerializer


class AuthViewSet(CreateModelMixin, GenericViewSet):
    permission_classes = [AllowAny]
    authentication_classes = []

    def get_serializer_class(self):
        if self.action == "login":
            return LoginSerializer
        if self.action == "refresh":
            return TokenRefreshSerializer
        return RegisterSerializer

    @action(detail=False, methods=["post"])
    def register(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)

    @action(detail=False, methods=["post"])
    def login(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        player = serializer.save()
        return Response(serializer.to_representation(player), status=status.HTTP_200_OK)

    @action(detail=False, methods=["post"])
    def refresh(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
        except TokenError as e:
            return Response({"detail": str(e.args[0])}, status=status.HTTP_401_UNAUTHORIZED)
        return Response(serializer.validated_data, status=status.HTTP_200_OK)


class PlayerMeView(RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated]

    def get_object(self):
        user = self.request.user
        if self.request.method == "GET":
            return Player.objects.select_related(
                "active_pokemon__pokemon__primary_type", "active_pokemon__pokemon__secondary_type"
            ).get(id=user.id)
        return user

    def get_serializer_class(self):
        if self.request.method == "PATCH":
            return PlayerUpdateSerializer
        return PlayerSerializer
