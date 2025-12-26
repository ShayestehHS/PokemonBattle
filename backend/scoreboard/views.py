from django.db import models
from rest_framework.generics import ListAPIView
from rest_framework.pagination import CursorPagination
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from players.models import Player
from scoreboard.serializers import ScoreboardEntrySerializer


class ScoreboardCursorPagination(CursorPagination):
    page_size = 20
    ordering = "-wins", "losses"
    page_size_query_param = "page_size"
    max_page_size = 100


class ScoreboardListView(ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ScoreboardEntrySerializer
    pagination_class = ScoreboardCursorPagination

    def get_queryset(self):
        return Player.objects.filter(is_active=True).order_by("-wins", "losses")

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        page = self.paginate_queryset(queryset)

        if page is not None:
            # Calculate starting rank from cursor position
            # For cursor pagination, we need to count players before the first item
            first_item = page[0] if page else None
            starting_rank = 1

            if first_item:
                # Count players with better stats (more wins or same wins but fewer losses)
                better_players = (
                    Player.objects.filter(is_active=True)
                    .filter(
                        models.Q(wins__gt=first_item.wins)
                        | models.Q(wins=first_item.wins, losses__lt=first_item.losses)
                    )
                    .count()
                )
                starting_rank = better_players + 1

            # Add rank to each entry
            serializer = self.get_serializer(page, many=True)
            entries = serializer.data
            for i, entry in enumerate(entries):
                entry["rank"] = starting_rank + i

            response = self.get_paginated_response(entries)

            # Add current user entry if not in top 20
            current_user = request.user
            current_user_entry = None
            current_user_in_top20 = False

            # Check if current user is in the current page
            current_user_in_page = any(entry.id == current_user.id for entry in page)

            if not current_user_in_page:
                # Get current user's rank by counting players with better stats
                better_players_count = (
                    Player.objects.filter(is_active=True)
                    .filter(
                        models.Q(wins__gt=current_user.wins)
                        | models.Q(wins=current_user.wins, losses__lt=current_user.losses)
                    )
                    .count()
                )
                current_user_rank = better_players_count + 1
                current_user_in_top20 = current_user_rank <= 20

                # Create entry for current user
                current_user_entry = {
                    "rank": current_user_rank,
                    "player_id": str(current_user.id),
                    "username": current_user.username,
                    "wins": current_user.wins,
                    "losses": current_user.losses,
                    "win_rate": self._calculate_win_rate(current_user.wins, current_user.losses),
                }
            else:
                # User is in the page, find their entry
                for entry in entries:
                    if entry["player_id"] == str(current_user.id):
                        current_user_entry = entry
                        current_user_in_top20 = True
                        break

            # Add current user info to response
            response.data["current_user_entry"] = current_user_entry
            response.data["current_user_in_top20"] = current_user_in_top20

            return response

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    def _calculate_win_rate(self, wins, losses):
        total = wins + losses
        if total == 0:
            return 0
        return round((wins / total) * 100)
