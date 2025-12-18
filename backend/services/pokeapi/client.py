import logging

import httpx

from services.base import BasePokemonClient
from services.types import (
    PokemonData,
    PokemonStatsData,
    PokemonTypeData,
    TypeEffectivenessData,
)

logger = logging.getLogger(__name__)

POKEAPI_BASE_URL = "https://pokeapi.co/api/v2"


class PokeAPIClient(BasePokemonClient):
    def __init__(self, timeout: float = 30.0):
        self.base_url = POKEAPI_BASE_URL
        self.timeout = timeout

    def _get_client(self) -> httpx.Client:
        return httpx.Client(timeout=self.timeout)

    def get_pokemon(self, pokemon_id: int) -> PokemonData | None:
        url = f"{self.base_url}/pokemon/{pokemon_id}"
        try:
            with self._get_client() as client:
                response = client.get(url)
                response.raise_for_status()
                data = response.json()
                return self._parse_pokemon_response(data)
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 404:
                logger.warning(f"Pokemon with ID {pokemon_id} not found")
                return None
            logger.error(f"HTTP error fetching Pokemon {pokemon_id}: {e}")
            raise
        except httpx.RequestError as e:
            logger.error(f"Request error fetching Pokemon {pokemon_id}: {e}")
            raise

    def get_pokemon_by_name(self, name: str) -> PokemonData | None:
        url = f"{self.base_url}/pokemon/{name.lower()}"
        try:
            with self._get_client() as client:
                response = client.get(url)
                response.raise_for_status()
                data = response.json()
                return self._parse_pokemon_response(data)
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 404:
                logger.warning(f"Pokemon '{name}' not found")
                return None
            logger.error(f"HTTP error fetching Pokemon '{name}': {e}")
            raise
        except httpx.RequestError as e:
            logger.error(f"Request error fetching Pokemon '{name}': {e}")
            raise

    def get_type(self, type_name: str) -> PokemonTypeData | None:
        url = f"{self.base_url}/type/{type_name.lower()}"
        try:
            with self._get_client() as client:
                response = client.get(url)
                response.raise_for_status()
                data = response.json()
                return PokemonTypeData(name=data["name"])
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 404:
                logger.warning(f"Type '{type_name}' not found")
                return None
            logger.error(f"HTTP error fetching type '{type_name}': {e}")
            raise
        except httpx.RequestError as e:
            logger.error(f"Request error fetching type '{type_name}': {e}")
            raise

    def get_all_types(self) -> list[str]:
        url = f"{self.base_url}/type"
        try:
            with self._get_client() as client:
                response = client.get(url)
                response.raise_for_status()
                data = response.json()
                # Filter out special types that aren't used for Pokemon (shadow, unknown)
                excluded_types = {"shadow", "unknown"}
                return [t["name"] for t in data["results"] if t["name"] not in excluded_types]
        except httpx.RequestError as e:
            logger.error(f"Request error fetching types: {e}")
            raise

    def get_type_effectiveness(self, type_name: str) -> TypeEffectivenessData | None:
        url = f"{self.base_url}/type/{type_name.lower()}"
        try:
            with self._get_client() as client:
                response = client.get(url)
                response.raise_for_status()
                data = response.json()
                damage_relations = data["damage_relations"]
                return TypeEffectivenessData(
                    double_damage_to=[t["name"] for t in damage_relations["double_damage_to"]],
                    half_damage_to=[t["name"] for t in damage_relations["half_damage_to"]],
                    no_damage_to=[t["name"] for t in damage_relations["no_damage_to"]],
                )
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 404:
                logger.warning(f"Type '{type_name}' not found")
                return None
            logger.error(f"HTTP error fetching type effectiveness for '{type_name}': {e}")
            raise
        except httpx.RequestError as e:
            logger.error(f"Request error fetching type effectiveness for '{type_name}': {e}")
            raise

    def _parse_pokemon_response(self, data: dict) -> PokemonData:
        stats_map = {stat["stat"]["name"]: stat["base_stat"] for stat in data["stats"]}
        types = [t["type"]["name"] for t in sorted(data["types"], key=lambda x: x["slot"])]
        sprite_url = data["sprites"]["front_default"] or ""

        return PokemonData(
            pokedex_number=data["id"],
            name=data["name"],
            sprite_url=sprite_url,
            types=types,
            stats=PokemonStatsData(
                hp=stats_map.get("hp", 0),
                attack=stats_map.get("attack", 0),
                defense=stats_map.get("defense", 0),
                speed=stats_map.get("speed", 0),
            ),
        )
