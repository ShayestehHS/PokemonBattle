from django.urls import path

from scoreboard.views import ScoreboardListView

app_name = "scoreboard"

urlpatterns = [
    path("", ScoreboardListView.as_view(), name="scoreboard-list"),
]
