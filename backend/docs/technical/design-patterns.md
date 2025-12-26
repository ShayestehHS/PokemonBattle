# Design Patterns

## Abstract Base Class Pattern - BasePokemonAPI

Implemented a flexible, extensible architecture using the Abstract Base Class (ABC) pattern for third-party API integrations.

### Base Interface

```python
from abc import ABC, abstractmethod

class BasePokemonClient(ABC):
    """Abstract base class for Pokemon API clients."""

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
```

### Concrete Implementation

```python
class PokeAPIClient(BasePokemonClient):
    """Concrete implementation for PokeAPI.co"""

    def __init__(self, timeout: float = 30.0):
        self.base_url = "https://pokeapi.co/api/v2"
        self.timeout = timeout

    def get_pokemon(self, pokemon_id: int) -> PokemonData | None:
        url = f"{self.base_url}/pokemon/{pokemon_id}"
        try:
            with httpx.Client(timeout=self.timeout) as client:
                response = client.get(url)
                response.raise_for_status()
                return self._parse_pokemon_response(response.json())
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 404:
                logger.warning(f"Pokemon with ID {pokemon_id} not found")
                return None
            logger.error(f"HTTP error fetching Pokemon {pokemon_id}: {e}")
            raise
        except httpx.RequestError as e:
            logger.error(f"Request error fetching Pokemon {pokemon_id}: {e}")
            raise
```

### Benefits

- ✅ **Extensibility:** Easy to add new Pokemon API providers (e.g., custom API, mock API)
- ✅ **Testability:** Can create mock implementations for testing
- ✅ **Type Safety:** TypedDict definitions ensure data consistency
- ✅ **Maintainability:** Clear interface contract for all implementations

### Usage in Managers

```python
class PokemonManager(models.Manager):
    def bulk_create_from_pokemon_api(
        self,
        pokedex_numbers: list[int],
        client: BasePokemonClient  # Accepts any implementation
    ) -> list[models.Model]:
        """
        Fetch Pokemon from any Pokemon API client and bulk create them.

        Works with PokeAPIClient, MockPokemonClient, or any future implementation.
        """
        pokemon_data_list = []
        for pokedex_number in pokedex_numbers:
            pokemon_data = client.get_pokemon(pokedex_number)
            if pokemon_data:
                pokemon_data_list.append(pokemon_data)
        # ... process and create Pokemon ...
```

### Future Extensibility

**Adding a New Provider:**

```python
class CustomPokemonClient(BasePokemonClient):
    """Custom Pokemon API implementation."""

    def get_pokemon(self, pokemon_id: int) -> PokemonData | None:
        # Custom implementation
        pass

    # Implement all abstract methods...
```

**Mock Implementation for Testing:**

```python
class MockPokemonClient(BasePokemonClient):
    """Mock client for testing."""

    def __init__(self):
        self.pokemon_data = {}

    def get_pokemon(self, pokemon_id: int) -> PokemonData | None:
        return self.pokemon_data.get(pokemon_id)

    # Implement all abstract methods with mock data...
```

---

## Type Safety with TypedDict

### Type Definitions

```python
from typing import TypedDict

class PokemonStatsData(TypedDict):
    hp: int
    attack: int
    defense: int
    speed: int

class PokemonData(TypedDict):
    pokedex_number: int
    name: str
    types: list[str]
    stats: PokemonStatsData
    sprite_url: str
```

### Benefits

- ✅ **IDE Support:** Autocomplete and type checking
- ✅ **Runtime Safety:** Type validation
- ✅ **Documentation:** Self-documenting code
- ✅ **Refactoring:** Safer code changes
