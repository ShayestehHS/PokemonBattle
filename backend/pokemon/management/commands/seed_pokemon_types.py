from django.core.management.base import BaseCommand

from pokemon.models import PokemonType
from utils.third_party_services.PokemonAPI import PokeAPIClient


class Command(BaseCommand):
    help = "Seed PokemonType model with data from PokeAPI"

    def handle(self, *args, **options):
        self.stdout.write("Starting PokemonType seeder...")
        client = PokeAPIClient()

        try:
            type_names = client.get_all_types()
            expected_count = len(type_names)
            current_count = PokemonType.objects.count()

            if current_count >= expected_count:
                self.stdout.write(
                    self.style.SUCCESS(
                        f"PokemonType seeder skipped: Database already has {current_count} types (expected: {expected_count})"
                    )
                )
                return

            created_count = 0
            updated_count = 0

            for type_name in type_names:
                pokemon_type, created = PokemonType.objects.update_or_create(
                    name=type_name, defaults={"name": type_name}
                )
                if created:
                    created_count += 1
                    self.stdout.write(self.style.SUCCESS(f"Created type: {type_name}"))
                else:
                    updated_count += 1

            self.stdout.write(
                self.style.SUCCESS(
                    f"\nPokemonType seeder completed: {created_count} created, {updated_count} already existed"
                )
            )
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Error seeding PokemonType: {e}"))
            raise
