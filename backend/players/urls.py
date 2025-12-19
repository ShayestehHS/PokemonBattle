from django.urls import include, path
from rest_framework.routers import DefaultRouter

from players.views import AuthViewSet, PlayerMeView

app_name = "players"

router = DefaultRouter()
router.register("auth", AuthViewSet, basename="auth")

urlpatterns = [
    path("", include(router.urls)),
    # Player endpoints
    path("me/", PlayerMeView.as_view(), name="me"),
]
