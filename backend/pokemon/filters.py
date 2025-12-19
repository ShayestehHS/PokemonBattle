import django_filters
from django.db.models import Q

from pokemon.models import Pokemon, TypeEffectiveness


class PokemonFilter(django_filters.FilterSet):
    type = django_filters.CharFilter(method="filter_type")

    class Meta:
        model = Pokemon
        fields = ["type"]

    def filter_type(self, queryset, name, value):
        return queryset.filter(Q(primary_type__name__iexact=value) | Q(secondary_type__name__iexact=value))


class TypeEffectivenessFilter(django_filters.FilterSet):
    attacker = django_filters.CharFilter(field_name="attacker_type__name", lookup_expr="iexact")
    defender = django_filters.CharFilter(field_name="defender_type__name", lookup_expr="iexact")

    class Meta:
        model = TypeEffectiveness
        fields = ["attacker", "defender"]
