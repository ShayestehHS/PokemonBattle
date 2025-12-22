import logging

from django.db.models import OuterRef, Subquery
from django.utils.decorators import method_decorator
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.decorators import action
from rest_framework.generics import ListAPIView
from rest_framework.mixins import CreateModelMixin, DestroyModelMixin, ListModelMixin
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import GenericViewSet, ReadOnlyModelViewSet, ViewSet

from pokemon.filters import PokemonFilter, TypeEffectivenessFilter
from pokemon.models import PlayerPokemon, Pokemon, PokemonType, TypeEffectiveness
from pokemon.serializers import (
    PlayerPokemonCreateSerializer,
    PlayerPokemonListSerializer,
    PokeAPIPokemonSerializer,
    PokemonDetailSerializer,
    PokemonListSerializer,
    PokemonTypeSerializer,
    TypeEffectivenessSerializer,
)
from pokemon.throttles import PokeAPIThrottle
from utils.cache.constants import (
    CACHE_PREFIX_POKEMON,
    CACHE_PREFIX_POKEMON_TYPE,
    CACHE_PREFIX_TYPE_EFFECTIVENESS,
)
from utils.cache.manager import cache_page_with_prefix
from utils.third_party_services.PokemonAPI.pokeapi.client import PokeAPIClient

logger = logging.getLogger(__name__)


class PokemonTypeListView(ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = PokemonTypeSerializer
    queryset = PokemonType.objects.all()
    pagination_class = None

    @method_decorator(cache_page_with_prefix(CACHE_PREFIX_POKEMON_TYPE))
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)


class TypeEffectivenessListView(ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = TypeEffectivenessSerializer
    pagination_class = None
    filter_backends = [DjangoFilterBackend]
    filterset_class = TypeEffectivenessFilter

    def get_queryset(self):
        return TypeEffectiveness.objects.select_related("attacker_type", "defender_type")

    @method_decorator(cache_page_with_prefix(CACHE_PREFIX_TYPE_EFFECTIVENESS))
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)


class PokemonViewSet(ReadOnlyModelViewSet):
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_class = PokemonFilter

    def get_serializer_class(self):
        if self.action == "retrieve":
            return PokemonDetailSerializer
        return PokemonListSerializer

    def get_queryset(self):
        queryset = Pokemon.objects.select_related("primary_type", "secondary_type").order_by("pokedex_number")
        if self.action == "starters":
            # Use subquery to get one Pokemon per primary type (SQLite compatible)
            from django.db.models import Min, OuterRef, Subquery

            min_pokedex_per_type = (
                Pokemon.objects.filter(primary_type_id=OuterRef("primary_type_id"))
                .values("primary_type_id")
                .annotate(min_pokedex=Min("pokedex_number"))
                .values("min_pokedex")[:1]
            )
            queryset = queryset.filter(pokedex_number=Subquery(min_pokedex_per_type)).order_by("primary_type_id")

        return queryset

    @method_decorator(cache_page_with_prefix(CACHE_PREFIX_POKEMON))
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @method_decorator(cache_page_with_prefix(CACHE_PREFIX_POKEMON))
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

    @method_decorator(cache_page_with_prefix(CACHE_PREFIX_POKEMON))
    @action(detail=False, methods=["get"], url_path="starters")
    def starters(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)


class PokeAPIViewSet(ViewSet):
    permission_classes = [IsAuthenticated]
    throttle_classes = [PokeAPIThrottle]

    @action(detail=False, methods=["get"], url_path="search/(?P<search>[^/.]+)")
    def search(self, request, search):
        query = search.strip().lower()

        client = PokeAPIClient()

        # Try to parse as integer (Pokedex number)
        try:
            pokedex_number = int(query)
            pokemon_data = client.get_pokemon(pokedex_number)
        except ValueError:
            # Search by name
            pokemon_data = client.get_pokemon_by_name(query)

        if not pokemon_data:
            return Response({"data": None})

        # Create or get Pokemon instance from API data
        from pokemon.models import PokemonType

        # Get or create types
        type_names = pokemon_data.get("types", [])
        primary_type_name = type_names[0] if type_names else None
        secondary_type_name = type_names[1] if len(type_names) > 1 else None

        primary_type = None
        if primary_type_name:
            primary_type, _ = PokemonType.objects.get_or_create(name=primary_type_name)

        secondary_type = None
        if secondary_type_name:
            secondary_type, _ = PokemonType.objects.get_or_create(name=secondary_type_name)

        # Get or create Pokemon instance
        pokemon, _ = Pokemon.objects.get_or_create(
            pokedex_number=pokemon_data["pokedex_number"],
            defaults={
                "name": pokemon_data["name"],
                "sprite_url": pokemon_data.get("sprite_url", "") or "",
                "base_hp": pokemon_data["stats"]["hp"],
                "base_attack": pokemon_data["stats"]["attack"],
                "base_defense": pokemon_data["stats"]["defense"],
                "base_speed": pokemon_data["stats"]["speed"],
                "primary_type": primary_type,
                "secondary_type": secondary_type,
            },
        )

        serializer = PokeAPIPokemonSerializer(pokemon)
        return Response({"data": serializer.data})

    @action(detail=False, methods=["get"])
    def list_pokemon(self, request):
        # Get pagination parameters
        offset = int(request.query_params.get("offset", 0))
        limit = int(request.query_params.get("limit", 20))

        limit = min(limit, 50)
        pokedex_range = set(range(offset + 1, offset + limit + 1))

        existing_ids = set(
            Pokemon.objects.filter(pokedex_number__in=pokedex_range).values_list("pokedex_number", flat=True)
        )
        missing_ids = pokedex_range.difference(existing_ids)

        if missing_ids:
            client = PokeAPIClient()
            Pokemon.objects.bulk_create_from_pokemon_api(list(missing_ids), client)

        # Get all desired pokemons from DB (the first id list) and serialize it
        all_pokemon = (
            Pokemon.objects.filter(pokedex_number__in=pokedex_range)
            .select_related("primary_type", "secondary_type")
            .order_by("pokedex_number")
        )

        serializer = PokeAPIPokemonSerializer(all_pokemon, many=True)

        # Return with pagination info
        return Response(
            {
                "count": 1025,  # Total Pokemon count (approx)
                "offset": offset,
                "limit": limit,
                "results": serializer.data,
            }
        )

    @method_decorator(cache_page_with_prefix(CACHE_PREFIX_POKEMON))
    @action(detail=False, methods=["get"])
    def choices(self, request):
        pokemon_list = Pokemon.objects.select_related("primary_type", "secondary_type").order_by("pokedex_number")[:20]

        if not pokemon_list:
            logger.warning(
                "Pokemon choices list is empty. Consider running 'python manage.py seed_all' to populate the database."
            )

        serializer = PokemonListSerializer(pokemon_list, many=True)
        return Response(serializer.data)


class PokemonMeViewSet(ListModelMixin, CreateModelMixin, DestroyModelMixin, GenericViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = PokemonListSerializer

    def get_queryset(self):
        user = self.request.user
        # Use subquery to get PlayerPokemon.id for ordering by most recent first
        player_pokemon_subquery = PlayerPokemon.objects.filter(player=user, pokemon=OuterRef("pk")).values("id")[:1]

        return (
            user.pokemons.select_related("primary_type", "secondary_type")
            .annotate(player_pokemon_id=Subquery(player_pokemon_subquery))
            .order_by("-player_pokemon_id")
        )

    def get_serializer_class(self):
        if self.action == "create":
            return PlayerPokemonCreateSerializer
        if self.action == "list":
            return PlayerPokemonListSerializer
        return PokemonListSerializer

    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        serializer.save(player=self.request.user)
