from django.db.models.signals import post_save
from django.dispatch import receiver

from pokemon.models import Pokemon, PokemonType, TypeEffectiveness
from utils.cache import (
    CACHE_PREFIX_POKEMON,
    CACHE_PREFIX_POKEMON_TYPE,
    CACHE_PREFIX_TYPE_EFFECTIVENESS,
    invalidate_cache_prefix,
)


@receiver(post_save, sender=Pokemon)
def invalidate_pokemon_cache(sender, instance, **kwargs):
    invalidate_cache_prefix(CACHE_PREFIX_POKEMON)


@receiver(post_save, sender=PokemonType)
def invalidate_pokemon_type_cache(sender, instance, **kwargs):
    invalidate_cache_prefix(CACHE_PREFIX_POKEMON_TYPE)
    # Also invalidate Pokemon and TypeEffectiveness caches since they are depends on types
    invalidate_cache_prefix(CACHE_PREFIX_POKEMON)
    invalidate_cache_prefix(CACHE_PREFIX_TYPE_EFFECTIVENESS)


@receiver(post_save, sender=TypeEffectiveness)
def invalidate_type_effectiveness_cache(sender, instance, **kwargs):
    invalidate_cache_prefix(CACHE_PREFIX_TYPE_EFFECTIVENESS)
