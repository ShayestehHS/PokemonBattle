from rest_framework import serializers


class ScoreboardEntrySerializer(serializers.Serializer):
    rank = serializers.IntegerField(read_only=True)
    player_id = serializers.UUIDField(source="id", read_only=True)
    username = serializers.CharField(read_only=True)
    wins = serializers.IntegerField(read_only=True)
    losses = serializers.IntegerField(read_only=True)
    win_rate = serializers.SerializerMethodField()

    def get_win_rate(self, obj):
        total = obj.wins + obj.losses
        if total == 0:
            return 0
        return round((obj.wins / total) * 100)
