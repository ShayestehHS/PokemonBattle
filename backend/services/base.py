from abc import ABC, abstractmethod

from services.types import PokemonData, PokemonTypeData, TypeEffectivenessData


class BasePokemonClient(ABC):
    @abstractmethod
    def get_pokemon(self, pokemon_id: int) -> PokemonData | None:
        """Fetch Pokemon data by Pokedex number."""
        pass

    @abstractmethod
    def get_pokemon_by_name(self, name: str) -> PokemonData | None:
        """Fetch Pokemon data by name."""
        pass

    @abstractmethod
    def get_type(self, type_name: str) -> PokemonTypeData | None:
        """Fetch a single Pokemon type."""
        pass

    @abstractmethod
    def get_all_types(self) -> list[str]:
        """Get list of all Pokemon types."""
        pass

    @abstractmethod
    def get_type_effectiveness(self, type_name: str) -> TypeEffectivenessData | None:
        """Get damage relations for a type."""
        pass
