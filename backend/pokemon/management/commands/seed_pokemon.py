from django.core.management.base import BaseCommand

from pokemon.models import Pokemon, PokemonType
from utils.third_party_services.PokemonAPI import PokeAPIClient


class Command(BaseCommand):
    help = "Seed Pokemon model with data from PokeAPI"

    def add_arguments(self, parser):
        parser.add_argument(
            "--count",
            type=int,
            default=20,
            help="Number of Pokemon to seed (default: 20)",
        )

    def handle(self, *args, **options):
        count = options["count"]
        self.stdout.write(f"Starting Pokemon seeder (fetching {count} Pokemon)...")
        client = PokeAPIClient()

        try:
            current_count = Pokemon.objects.count()

            if current_count >= count:
                self.stdout.write(
                    self.style.SUCCESS(
                        f"Pokemon seeder skipped: Database already has {current_count} Pokemon (requested: {count})"
                    )
                )
                return

            created_count = 0
            updated_count = 0
            skipped_count = 0

            for pokemon_id in range(1, count + 1):
                pokemon_data = client.get_pokemon(pokemon_id)
                if not pokemon_data:
                    self.stdout.write(self.style.WARNING(f"Pokemon #{pokemon_id} not found, skipping..."))
                    skipped_count += 1
                    continue

                # Get or create primary type
                primary_type_name = pokemon_data["types"][0] if pokemon_data["types"] else None
                if not primary_type_name:
                    self.stdout.write(self.style.WARNING(f"Pokemon #{pokemon_id} has no types, skipping..."))
                    skipped_count += 1
                    continue

                try:
                    primary_type = PokemonType.objects.get(name=primary_type_name)
                except PokemonType.DoesNotExist:
                    self.stdout.write(
                        self.style.WARNING(
                            f"Primary type '{primary_type_name}' not found. Please run seed_pokemon_types first."
                        )
                    )
                    skipped_count += 1
                    continue

                # Get secondary type if exists
                secondary_type = None
                if len(pokemon_data["types"]) > 1:
                    secondary_type_name = pokemon_data["types"][1]
                    try:
                        secondary_type = PokemonType.objects.get(name=secondary_type_name)
                    except PokemonType.DoesNotExist:
                        self.stdout.write(
                            self.style.WARNING(
                                f"Secondary type '{secondary_type_name}' not found, using only primary type"
                            )
                        )

                # Create or update Pokemon
                pokemon, created = Pokemon.objects.update_or_create(
                    pokedex_number=pokemon_data["pokedex_number"],
                    defaults={
                        "name": pokemon_data["name"],
                        "sprite_url": pokemon_data["sprite_url"],
                        "base_hp": pokemon_data["stats"]["hp"],
                        "base_attack": pokemon_data["stats"]["attack"],
                        "base_defense": pokemon_data["stats"]["defense"],
                        "base_speed": pokemon_data["stats"]["speed"],
                        "primary_type": primary_type,
                        "secondary_type": secondary_type,
                    },
                )

                if created:
                    created_count += 1
                    self.stdout.write(self.style.SUCCESS(f"Created Pokemon: #{pokemon.pokedex_number} {pokemon.name}"))
                else:
                    updated_count += 1

            self.stdout.write(
                self.style.SUCCESS(
                    f"\nPokemon seeder completed: {created_count} created, {updated_count} updated, {skipped_count} skipped"
                )
            )
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Error seeding Pokemon: {e}"))
            raise
