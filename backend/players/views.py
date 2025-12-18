from rest_framework import status
from rest_framework.decorators import action
from rest_framework.generics import RetrieveAPIView
from rest_framework.mixins import CreateModelMixin
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import GenericViewSet
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.serializers import TokenRefreshSerializer

from players.serializers import LoginSerializer, PlayerSerializer, RegisterSerializer


class AuthViewSet(CreateModelMixin, GenericViewSet):
    permission_classes = [AllowAny]
    authentication_classes = []

    @action(detail=False, methods=["post"], serializer_class=RegisterSerializer)
    def register(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)

    @action(detail=False, methods=["post"], serializer_class=LoginSerializer)
    def login(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        player = serializer.save()
        return Response(serializer.to_representation(player), status=status.HTTP_200_OK)

    @action(detail=False, methods=["post"], serializer_class=TokenRefreshSerializer)
    def refresh(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
        except TokenError as e:
            return Response({"detail": str(e.args[0])}, status=status.HTTP_401_UNAUTHORIZED)
        return Response(serializer.validated_data, status=status.HTTP_200_OK)


class PlayerMeView(RetrieveAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = PlayerSerializer

    def get_object(self):
        return self.request.user
