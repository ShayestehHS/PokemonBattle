from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from players.models import Player
from pokemon.models import PlayerPokemon
from pokemon.serializers import PokemonDetailSerializer


class PlayerSerializer(serializers.ModelSerializer):
    win_rate = serializers.SerializerMethodField()
    active_pokemon = PokemonDetailSerializer(default=None)

    class Meta:
        model = Player
        fields = ["id", "username", "wins", "losses", "win_rate", "created_at", "active_pokemon"]
        read_only_fields = ["id", "wins", "losses", "created_at"]

    def get_win_rate(self, obj: Player) -> float:
        total_games = obj.wins + obj.losses
        if total_games == 0:
            return 0.0
        return round((obj.wins / total_games) * 100, 2)


class PlayerUpdateSerializer(serializers.ModelSerializer):
    active_pokemon = serializers.PrimaryKeyRelatedField(
        queryset=PlayerPokemon.objects.all(),
        required=False,
        allow_null=True,
    )

    class Meta:
        model = Player
        fields = ["active_pokemon"]

    def validate_active_pokemon(self, value):
        if value is None:
            return None

        user = self.context["request"].user
        if value.player != user:
            raise serializers.ValidationError("PlayerPokemon does not belong to you.")

        return value


class AuthResponseMixin:
    def get_auth_representation(self, player: Player) -> dict:
        refresh = TokenObtainPairSerializer.get_token(player)
        return {
            "id": player.id,
            "username": player.username,
            "created_at": player.created_at,
            "token": {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
            },
        }


class RegisterSerializer(AuthResponseMixin, serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])

    class Meta:
        model = Player
        fields = ["username", "password"]

    def create(self, validated_data):
        return Player.objects.create_user(
            username=validated_data["username"],
            password=validated_data["password"],
        )

    def to_representation(self, instance: Player) -> dict:
        return self.get_auth_representation(instance)


class LoginSerializer(AuthResponseMixin, serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        player = authenticate(username=attrs["username"], password=attrs["password"])
        if not player:
            raise serializers.ValidationError({"detail": "Invalid credentials."})
        if not player.is_active:
            raise serializers.ValidationError({"detail": "User account is disabled."})
        attrs["player"] = player
        return attrs

    def create(self, validated_data):
        return validated_data["player"]

    def to_representation(self, instance: Player) -> dict:
        return self.get_auth_representation(instance)
