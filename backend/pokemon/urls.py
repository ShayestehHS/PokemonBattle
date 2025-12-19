from django.urls import include, path
from rest_framework.routers import DefaultRouter

from pokemon.views import (
    PokeAPIViewSet,
    PokemonTypeListView,
    PokemonViewSet,
    TypeEffectivenessListView,
)

app_name = "pokemon"

router = DefaultRouter()
router.register("pokemon", PokemonViewSet, basename="pokemon")
router.register("pokeapi", PokeAPIViewSet, basename="pokeapi")

urlpatterns = [
    path("", include(router.urls)),
    path("types/", PokemonTypeListView.as_view(), name="type-list"),
    path("type-effectiveness/", TypeEffectivenessListView.as_view(), name="type-effectiveness-list"),
]
