from django.core.management import call_command
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    """
    Main seeder command that orchestrates all seeder commands.

    This command runs all seeder commands in the correct order:
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
