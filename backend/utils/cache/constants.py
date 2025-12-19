import os

CACHE_TTL = int(os.environ.get("CACHE_TTL", 900))  # 15 minutes

CACHE_PREFIX_POKEMON = "pokemon"
CACHE_PREFIX_POKEMON_TYPE = "pokemon_type"
CACHE_PREFIX_TYPE_EFFECTIVENESS = "type_effectiveness"
