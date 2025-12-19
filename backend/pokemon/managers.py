import logging
from typing import TYPE_CHECKING

from django.db import models

from pokemon.models import PokemonType
from utils.cache import CACHE_PREFIX_POKEMON, invalidate_cache_prefix

if TYPE_CHECKING:
    from utils.third_party_services.PokemonAPI.base import BasePokemonClient

logger = logging.getLogger(__name__)


class PokemonManager(models.Manager):
    def bulk_create_from_pokemon_api(
        self, pokedex_numbers: list[int], client: "BasePokemonClient"
    ) -> list[models.Model]:
        """
        Fetch Pokemon from PokeAPI and bulk create them in the database.

        Args:
            pokedex_numbers: List of pokedex numbers to fetch and create
            client: PokeAPIClient instance to use for fetching Pokemon data

        Returns:
            List of created Pokemon instances
        """
        if not pokedex_numbers:
            return []

        # Step 1: Get all pokemons that we should create
        pokemon_data_list = []
        for pokedex_number in pokedex_numbers:
            pokemon_data = client.get_pokemon(pokedex_number)
            if pokemon_data:
                pokemon_data_list.append(pokemon_data)

        if not pokemon_data_list:
            return []

        # Step 2: Iterate over all of them and get the types
        all_type_names = set()
        for pokemon_data in pokemon_data_list:
            if pokemon_data.get("types"):
                all_type_names.update(pokemon_data["types"])

        # Step 3: Run one query and get list PokemonTypes that are not exists
        existing_types = set(PokemonType.objects.filter(name__in=all_type_names).values_list("name", flat=True))
        missing_type_names = all_type_names - existing_types

        # Step 4: Run bulk_create for creating those types
        types_to_create = []
        if missing_type_names:
            for type_name in missing_type_names:
                types_to_create.append(PokemonType(name=type_name))
            PokemonType.objects.bulk_create(types_to_create)

        # Step 5: Get all types (existing + newly created) and create a mapping
        all_types = {type_obj.name: type_obj for type_obj in PokemonType.objects.filter(name__in=all_type_names)}

        # Step 6: Bulk create all Pokemon objects
        pokemon_to_create = []
        for pokemon_data in pokemon_data_list:
            types = pokemon_data.get("types", [])
            if not types:
                continue

            primary_type_name = types[0]
            primary_type = all_types.get(primary_type_name)
            if not primary_type:
                logger.warning(
                    f"Primary type '{primary_type_name}' not found for Pokemon #{pokemon_data['pokedex_number']}, skipping..."
                )
                continue

            secondary_type = None
            if len(types) > 1:
                secondary_type_name = types[1]
                secondary_type = all_types.get(secondary_type_name)
                if not secondary_type:
                    logger.warning(
                        f"Secondary type '{secondary_type_name}' not found for Pokemon #{pokemon_data['pokedex_number']}, using only primary type"
                    )

            pokemon_to_create.append(
                self.model(
                    pokedex_number=pokemon_data["pokedex_number"],
                    name=pokemon_data["name"],
                    sprite_url=pokemon_data.get("sprite_url", "") or "",
                    base_hp=pokemon_data["stats"]["hp"],
                    base_attack=pokemon_data["stats"]["attack"],
                    base_defense=pokemon_data["stats"]["defense"],
                    base_speed=pokemon_data["stats"]["speed"],
                    primary_type=primary_type,
                    secondary_type=secondary_type,
                )
            )

        # Step 7: At last invalidate the pokemon cache
        created_pokemon = []
        if pokemon_to_create:
            created_pokemon = self.bulk_create(pokemon_to_create)
            invalidate_cache_prefix(CACHE_PREFIX_POKEMON)

        return created_pokemon
