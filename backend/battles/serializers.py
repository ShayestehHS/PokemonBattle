from rest_framework import serializers

from battles.models import Battle, BattleTurn
from players.models import Player
from pokemon.models import PlayerPokemon
from utils.exceptions.exceptions import FormError, ToastError
from utils.game.battle_manager import BattleManager
from utils.game.items import ItemType


class BattlePokemonSerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(source="pokemon.id")
    name = serializers.CharField(source="pokemon.name")
    primary_type = serializers.CharField(source="pokemon.primary_type.name")
    secondary_type = serializers.CharField(source="pokemon.secondary_type.name", allow_null=True)
    current_hp = serializers.SerializerMethodField()
    max_hp = serializers.IntegerField(source="pokemon.base_hp")
    sprite_url = serializers.URLField(source="pokemon.sprite_url")

    class Meta:
        model = PlayerPokemon
        fields = ["id", "name", "primary_type", "secondary_type", "current_hp", "max_hp", "sprite_url"]

    def get_current_hp(self, obj):
        battle = self.context.get("battle")
        if not battle:
            return obj.pokemon.base_hp

        if battle.player1_pokemon == obj:
            return battle.player1_current_hp
        return battle.player2_current_hp


class BattlePlayerSerializer(serializers.ModelSerializer):
    id = serializers.UUIDField()
    username = serializers.CharField()
    pokemon = serializers.SerializerMethodField()

    class Meta:
        model = Player
        fields = ["id", "username", "pokemon"]

    def get_pokemon(self, obj):
        battle = self.context.get("battle")
        if not battle:
            return None

        if battle.player1 == obj:
            pokemon = battle.player1_pokemon
        else:
            pokemon = battle.player2_pokemon

        return BattlePokemonSerializer(pokemon, context=self.context).data


class BattleTurnSerializer(serializers.ModelSerializer):
    player_id = serializers.UUIDField(source="player.id")
    action = serializers.CharField()
    damage = serializers.IntegerField()
    is_critical = serializers.BooleanField()
    is_super_effective = serializers.BooleanField()
    message = serializers.CharField()

    class Meta:
        model = BattleTurn
        fields = ["turn_number", "player_id", "action", "damage", "is_critical", "is_super_effective", "message"]
        read_only_fields = fields


class BattleStateSerializer(serializers.ModelSerializer):
    player1 = BattlePlayerSerializer(read_only=True)
    player2 = BattlePlayerSerializer(read_only=True)
    current_turn = serializers.UUIDField(source="current_turn_player.id")
    turns = BattleTurnSerializer(many=True, read_only=True)
    winner_id = serializers.UUIDField(source="winner.id", allow_null=True)

    class Meta:
        model = Battle
        fields = [
            "id",
            "status",
            "player1",
            "player2",
            "current_turn",
            "turn_number",
            "turns",
            "winner_id",
            "player1_potions",
            "player1_x_attack",
            "player1_x_defense",
            "player2_potions",
            "player2_x_attack",
            "player2_x_defense",
            "player1_attack_boost",
            "player1_defense_boost",
            "player2_attack_boost",
            "player2_defense_boost",
            "created_at",
            "completed_at",
        ]
        read_only_fields = fields

    def to_representation(self, instance):
        user = self.context["request"].user
        manager = BattleManager(instance, user)
        battle = manager.get_battle_with_player_data()

        self.context["battle"] = battle

        return super().to_representation(battle)


class BattleCreateSerializer(serializers.Serializer):
    opponent_id = serializers.UUIDField(required=False, allow_null=True)
    pokemon_id = serializers.UUIDField(required=False, allow_null=True)

    def validate_opponent_id(self, value):
        if value and not Player.objects.filter(id=value).exists():
            raise FormError(field_name="opponent_id", message="Opponent not found.")
        return value

    def validate_pokemon_id(self, value):
        user = self.context["request"].user
        if value and not PlayerPokemon.objects.filter(id=value, player=user).exists():
            raise FormError(field_name="pokemon_id", message="Pokemon does not belong to you.")
        return value

    def validate(self, attrs):
        user = self.context["request"].user

        if Battle.objects.active_for_player(user).exists():
            raise ToastError(message="You already have an active battle.")

        if not user.active_pokemon:
            raise ToastError(message="You must have an active Pokemon to start a battle.")

        return attrs

    def create(self, validated_data):
        user = self.context["request"].user
        battle = BattleManager.create_battle(
            user=user,
            pokemon_id=validated_data.get("pokemon_id"),
            opponent_id=validated_data.get("opponent_id"),
        )
        return battle

    def to_representation(self, instance):
        return BattleStateSerializer(instance, context=self.context).data


class TurnSubmitSerializer(serializers.Serializer):
    action = serializers.ChoiceField(choices=[BattleTurn.ACTION_ATTACK, BattleTurn.ACTION_DEFEND])

    def update(self, instance, validated_data):
        battle = instance
        user = self.context["request"].user
        manager = BattleManager(battle, user)
        response = manager.process_turn(validated_data["action"])
        return response

    def to_representation(self, instance):
        battle_data = BattleStateSerializer(instance.battle, context=self.context).data

        if instance.is_battle_complete:
            return {
                "battle": battle_data,
                "winner": instance.winner.id if instance.winner else None,
                "message": f"{instance.winner.username} wins!" if instance.winner else "Battle complete",
            }

        return battle_data


class ItemUseResponseSerializer(serializers.Serializer):
    success = serializers.BooleanField()
    message = serializers.CharField()
    hp_restored = serializers.IntegerField()
    new_hp = serializers.IntegerField()
    boost_turns_remaining = serializers.IntegerField()
    inventory = serializers.DictField()


class ItemUseSerializer(serializers.Serializer):
    item_type = serializers.ChoiceField(choices=ItemType.ALL)

    def create(self, validated_data):
        battle = self.context["battle"]
        user = self.context["request"].user
        manager = BattleManager(battle, user)
        response = manager.use_item(validated_data["item_type"])
        return response

    def to_representation(self, instance):
        return ItemUseResponseSerializer(instance).data


class BattleHistorySerializer(serializers.ModelSerializer):
    opponent = serializers.SerializerMethodField()
    winner_id = serializers.UUIDField(source="winner.id", allow_null=True)
    created_at = serializers.DateTimeField()
    completed_at = serializers.DateTimeField(allow_null=True)

    class Meta:
        model = Battle
        fields = ["id", "status", "opponent", "winner_id", "created_at", "completed_at"]
        read_only_fields = fields

    def get_opponent(self, obj):
        user = self.context["request"].user
        opponent = obj.get_opponent(user)
        return {
            "id": opponent.id,
            "username": opponent.username,
        }
