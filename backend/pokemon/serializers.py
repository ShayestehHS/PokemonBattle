from rest_framework import serializers

from pokemon.models import Pokemon, PokemonType, TypeEffectiveness


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
