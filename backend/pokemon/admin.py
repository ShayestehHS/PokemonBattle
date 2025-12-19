from django.contrib import admin

from pokemon.models import PlayerPokemon, Pokemon, PokemonType, TypeEffectiveness

admin.site.register(PokemonType)
admin.site.register(TypeEffectiveness)
admin.site.register(Pokemon)
admin.site.register(PlayerPokemon)
