from django.contrib import admin

from pokemon.models import Pokemon, PokemonType, TypeEffectiveness

admin.site.register(PokemonType)
admin.site.register(TypeEffectiveness)
admin.site.register(Pokemon)
