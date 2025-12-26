# Management Commands

## Custom Django Management Commands

Created comprehensive database seeding commands with orchestration for easy database setup and maintenance.

### Main Seeder Command

**Command:** `python manage.py seed_all`

```python
from django.core.management import call_command
from django.core.management.base import BaseCommand

class Command(BaseCommand):
    """
    Orchestrates all seeder commands in the correct order:
    1. seed_pokemon_types - Seeds PokemonType model with all types from PokeAPI
    2. seed_type_effectiveness - Seeds TypeEffectiveness model with type matchups
    3. seed_pokemon - Seeds Pokemon model with Pokemon data (default: 20 Pokemon)

    Usage:
        python manage.py seed_all
        python manage.py seed_all --pokemon-count 50

    Options:
        --pokemon-count: Number of Pokemon to seed (default: 20)
    """

    help = "Run all seeder commands in the correct order"

    def add_arguments(self, parser):
        parser.add_argument(
            "--pokemon-count",
            type=int,
            default=20,
            help="Number of Pokemon to seed (default: 20)",
        )

    def handle(self, *args, **options):
        pokemon_count = options["pokemon_count"]
        self.stdout.write(self.style.SUCCESS("=" * 60))
        self.stdout.write(self.style.SUCCESS("Starting full database seeding process"))
        self.stdout.write(self.style.SUCCESS("=" * 60))

        try:
            # Step 1: Seed Pokemon Types
            self.stdout.write(self.style.WARNING("\n[Step 1/3] Seeding Pokemon Types..."))
            call_command("seed_pokemon_types")
            self.stdout.write(self.style.SUCCESS("✓ Pokemon Types seeded successfully\n"))

            # Step 2: Seed Type Effectiveness
            self.stdout.write(self.style.WARNING("[Step 2/3] Seeding Type Effectiveness..."))
            call_command("seed_type_effectiveness")
            self.stdout.write(self.style.SUCCESS("✓ Type Effectiveness seeded successfully\n"))

            # Step 3: Seed Pokemon
            self.stdout.write(self.style.WARNING(f"[Step 3/3] Seeding Pokemon (count: {pokemon_count})..."))
            call_command("seed_pokemon", count=pokemon_count)
            self.stdout.write(self.style.SUCCESS("✓ Pokemon seeded successfully\n"))

            self.stdout.write(self.style.SUCCESS("=" * 60))
            self.stdout.write(self.style.SUCCESS("All seeders completed successfully!"))
            self.stdout.write(self.style.SUCCESS("=" * 60))
        except Exception as e:
            self.stdout.write(self.style.ERROR("=" * 60))
            self.stdout.write(self.style.ERROR(f"Seeding failed with error: {e}"))
            self.stdout.write(self.style.ERROR("=" * 60))
            raise
```

### Individual Seed Commands

#### 1. Seed Pokemon Types

**Command:** `python manage.py seed_pokemon_types`

```python
class Command(BaseCommand):
    """
    Seeds PokemonType model with all 18 Pokemon types from PokeAPI.

    Fetches type data from external PokeAPI and creates PokemonType records.
    Idempotent - safe to run multiple times.
    """

    help = "Seed Pokemon types from PokeAPI"

    def handle(self, *args, **options):
        client = PokeAPIClient()
        all_types = client.get_all_types()

        created_count = 0
        for type_name in all_types:
            pokemon_type, created = PokemonType.objects.get_or_create(
                name=type_name
            )
            if created:
                created_count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Successfully seeded {created_count} new Pokemon types. "
                f"Total types: {PokemonType.objects.count()}"
            )
        )
```

**Features:**
- ✅ Fetches all 18 Pokemon types from PokeAPI
- ✅ Idempotent (safe to run multiple times)
- ✅ Creates only new types (skips existing)
- ✅ Provides feedback on created vs existing types

#### 2. Seed Type Effectiveness

**Command:** `python manage.py seed_type_effectiveness`

```python
class Command(BaseCommand):
    """
    Seeds TypeEffectiveness model with complete 18x18 type matchup matrix.

    Creates 324 entries (18 types × 18 types) with damage multipliers.
    Uses PokeAPI to fetch type effectiveness data.
    """

    help = "Seed type effectiveness chart from PokeAPI"

    def handle(self, *args, **options):
        client = PokeAPIClient()
        all_types = PokemonType.objects.all()

        created_count = 0
        for attacker_type in all_types:
            effectiveness_data = client.get_type_effectiveness(attacker_type.name)

            for defender_type in all_types:
                multiplier = effectiveness_data.get(defender_type.name, 1.0)

                type_effectiveness, created = TypeEffectiveness.objects.get_or_create(
                    attacker_type=attacker_type,
                    defender_type=defender_type,
                    defaults={"multiplier": multiplier}
                )
                if created:
                    created_count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Successfully seeded {created_count} type effectiveness entries. "
                f"Total entries: {TypeEffectiveness.objects.count()}"
            )
        )
```

**Features:**
- ✅ Creates complete 18×18 type matchup matrix (324 entries)
- ✅ Fetches data from PokeAPI
- ✅ Handles super effective, not very effective, and no effect multipliers
- ✅ Idempotent operation

#### 3. Seed Pokemon

**Command:** `python manage.py seed_pokemon --count 20`

```python
class Command(BaseCommand):
    """
    Seeds Pokemon model with Pokemon data from PokeAPI.

    Fetches Pokemon by Pokedex number and creates Pokemon records with:
    - Stats (HP, Attack, Defense, Speed)
    - Types (Primary and Secondary)
    - Sprite URLs
    - Names and Pokedex numbers

    Usage:
        python manage.py seed_pokemon
        python manage.py seed_pokemon --count 50
    """

    help = "Seed Pokemon from PokeAPI"

    def add_arguments(self, parser):
        parser.add_argument(
            "--count",
            type=int,
            default=20,
            help="Number of Pokemon to seed (default: 20)",
        )

    def handle(self, *args, **options):
        count = options["count"]
        client = PokeAPIClient()

        created_count = 0
        for pokedex_number in range(1, count + 1):
            pokemon_data = client.get_pokemon(pokedex_number)
            if not pokemon_data:
                self.stdout.write(
                    self.style.WARNING(
                        f"Pokemon #{pokedex_number} not found, skipping..."
                    )
                )
                continue

            # Create Pokemon using manager method
            pokemon, created = Pokemon.objects.get_or_create(
                pokedex_number=pokedex_number,
                defaults={
                    "name": pokemon_data["name"],
                    "base_hp": pokemon_data["stats"]["hp"],
                    "base_attack": pokemon_data["stats"]["attack"],
                    "base_defense": pokemon_data["stats"]["defense"],
                    "base_speed": pokemon_data["stats"]["speed"],
                    "sprite_url": pokemon_data["sprite_url"],
                    # ... type assignments ...
                }
            )
            if created:
                created_count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Successfully seeded {created_count} new Pokemon. "
                f"Total Pokemon: {Pokemon.objects.count()}"
            )
        )
```

**Features:**
- ✅ Configurable Pokemon count
- ✅ Fetches from PokeAPI with error handling
- ✅ Creates Pokemon with all stats and types
- ✅ Skips Pokemon that already exist
- ✅ Progress feedback

---

## Command Features

### Idempotency

All commands are **idempotent** - safe to run multiple times:

```python
# First run - creates data
python manage.py seed_all
# → Creates all Pokemon types, effectiveness, and Pokemon

# Second run - skips existing
python manage.py seed_all
# → Only creates new data, skips existing
```

### Progress Feedback

Commands provide colored, informative output:

```bash
============================================================
Starting full database seeding process
============================================================

[Step 1/3] Seeding Pokemon Types...
✓ Pokemon Types seeded successfully

[Step 2/3] Seeding Type Effectiveness...
✓ Type Effectiveness seeded successfully

[Step 3/3] Seeding Pokemon (count: 20)...
✓ Pokemon seeded successfully

============================================================
All seeders completed successfully!
============================================================
```

### Error Handling

Comprehensive error handling with clear messages:

```python
try:
    # Seeding logic
except Exception as e:
    self.stdout.write(self.style.ERROR("=" * 60))
    self.stdout.write(self.style.ERROR(f"Seeding failed with error: {e}"))
    self.stdout.write(self.style.ERROR("=" * 60))
    raise
```

---

## Usage Examples

### Basic Usage

```bash
# Seed with default settings (20 Pokemon)
python manage.py seed_all

# Seed with custom Pokemon count
python manage.py seed_all --pokemon-count 50

# Seed individual components
python manage.py seed_pokemon_types
python manage.py seed_type_effectiveness
python manage.py seed_pokemon --count 30
```

### Docker Usage

```bash
# Run in Docker container
docker-compose exec backend python manage.py seed_all

# Run with custom count
docker-compose exec backend python manage.py seed_all --pokemon-count 100
```

---

## Best Practices

1. **Idempotency:** Always check if data exists before creating
2. **Error Handling:** Provide clear error messages
3. **Progress Feedback:** Show what's happening
4. **Flexibility:** Allow configuration via arguments
5. **Documentation:** Clear help text and docstrings
6. **Validation:** Validate input arguments
7. **Transaction Safety:** Use database transactions when appropriate

---

## Command Structure

```
backend/
└── pokemon/
    └── management/
        └── commands/
            ├── __init__.py
            ├── seed_all.py          # Main orchestrator
            ├── seed_pokemon_types.py
            ├── seed_type_effectiveness.py
            └── seed_pokemon.py
```
