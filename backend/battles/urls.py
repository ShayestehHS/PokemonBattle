from rest_framework.routers import DefaultRouter

from battles.views import BattleHistoryViewSet, BattleViewSet

app_name = "battles"

router = DefaultRouter()
router.register(r"history", BattleHistoryViewSet, basename="battle-history")
router.register(r"", BattleViewSet, basename="battle")

urlpatterns = router.urls
