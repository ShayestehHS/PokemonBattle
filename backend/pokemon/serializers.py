from rest_framework import serializers

from pokemon.models import PlayerPokemon, Pokemon, PokemonType, TypeEffectiveness
from utils.exceptions.exceptions import FormError, ToastError


class PokeAPIPokemonSerializer(serializers.ModelSerializer):
    primary_type_name = serializers.CharField(source="primary_type.name")
    secondary_type_name = serializers.CharField(source="secondary_type.name", allow_null=True)

    class Meta:
        model = Pokemon
        fields = [
            "pokedex_number",
            "name",
            "sprite_url",
            "primary_type_name",
            "secondary_type_name",
            "base_hp",
            "base_attack",
            "base_defense",
            "base_speed",
        ]
        read_only_fields = fields


class PokemonTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = PokemonType
        fields = ["id", "name"]
        read_only_fields = fields


class TypeEffectivenessSerializer(serializers.ModelSerializer):
    attacker_type_name = serializers.CharField(source="attacker_type.name")
    defender_type_name = serializers.CharField(source="defender_type.name")

    class Meta:
        model = TypeEffectiveness
        fields = ["id", "attacker_type_name", "defender_type_name", "multiplier"]
        read_only_fields = fields


class PokemonListSerializer(serializers.ModelSerializer):
    primary_type_name = serializers.CharField(source="primary_type.name")
    secondary_type_name = serializers.CharField(source="secondary_type.name", allow_null=True)

    class Meta:
        model = Pokemon
        fields = [
            "id",
            "pokedex_number",
            "name",
            "sprite_url",
            "primary_type_name",
            "secondary_type_name",
        ]
        read_only_fields = fields


class PlayerPokemonListSerializer(serializers.ModelSerializer):
    primary_type_name = serializers.CharField(source="primary_type.name")
    secondary_type_name = serializers.CharField(source="secondary_type.name", allow_null=True)
    player_pokemon_id = serializers.UUIDField(read_only=True)

    class Meta:
        model = Pokemon
        fields = [
            "id",
            "pokedex_number",
            "name",
            "sprite_url",
            "primary_type_name",
            "secondary_type_name",
            "player_pokemon_id",
        ]
        read_only_fields = fields


class PokemonDetailSerializer(serializers.ModelSerializer):
    primary_type = PokemonTypeSerializer(read_only=True)
    secondary_type = PokemonTypeSerializer(read_only=True)

    class Meta:
        model = Pokemon
        fields = [
            "id",
            "pokedex_number",
            "name",
            "sprite_url",
            "base_hp",
            "base_attack",
            "base_defense",
            "base_speed",
            "primary_type",
            "secondary_type",
            "created_at",
        ]
        read_only_fields = fields


class PlayerPokemonCreateSerializer(serializers.ModelSerializer):
    pokemon_id = serializers.UUIDField(write_only=True)

    class Meta:
        model = PlayerPokemon
        fields = ["pokemon_id"]
        read_only_fields = ["player"]

    def validate_pokemon_id(self, value):
        if not Pokemon.objects.filter(id=value).exists():
            raise FormError(field_name="pokemon_id", message=f'Invalid pk "{value}" - object does not exist.')

        if PlayerPokemon.objects.filter(player=self.context["request"].user, pokemon_id=value).exists():
            raise FormError(field_name="pokemon_id", message="You already own this pokemon.")

        return value

    def validate(self, attrs):
        user = self.context["request"].user
        current_pokemon_count = PlayerPokemon.objects.filter(player=user).count()

        if current_pokemon_count >= 1 and user.wins <= current_pokemon_count:
            raise ToastError(
                message=f"You can only have up to {user.wins} pokemon (based on your wins). You currently have {current_pokemon_count} pokemon."
            )

        return attrs

    def to_representation(self, instance):
        return PokemonListSerializer(instance.pokemon).data
