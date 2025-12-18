from typing import TypedDict


class PokemonStatsData(TypedDict):
    hp: int
    attack: int
    defense: int
    speed: int


class PokemonData(TypedDict):
    pokedex_number: int
    name: str
    sprite_url: str
    types: list[str]
    stats: PokemonStatsData


class PokemonTypeData(TypedDict):
    name: str


class TypeEffectivenessData(TypedDict):
    double_damage_to: list[str]
    half_damage_to: list[str]
    no_damage_to: list[str]
