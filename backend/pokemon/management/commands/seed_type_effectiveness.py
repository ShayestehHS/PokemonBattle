from django.core.management.base import BaseCommand

from pokemon.models import PokemonType, TypeEffectiveness
from utils.third_party_services.PokemonAPI.pokeapi.client import PokeAPIClient


class Command(BaseCommand):
    help = "Seed TypeEffectiveness model with data from PokeAPI"

    def handle(self, *args, **options):
        self.stdout.write("Starting TypeEffectiveness seeder...")
        client = PokeAPIClient()

        try:
            # Get all types from database
            types = PokemonType.objects.all()
            if not types.exists():
                self.stdout.write(self.style.WARNING("No PokemonType found. Please run seed_pokemon_types first."))
                return

            # Check if we already have effectiveness data for all types
            types_count = types.count()
            effectiveness_count = TypeEffectiveness.objects.values("attacker_type").distinct().count()

            if effectiveness_count >= types_count:
                self.stdout.write(
                    self.style.SUCCESS(
                        f"TypeEffectiveness seeder skipped: Database already has effectiveness data for {effectiveness_count} types (expected: {types_count})"
                    )
                )
                return

            created_count = 0
            updated_count = 0

            for attacker_type in types:
                effectiveness_data = client.get_type_effectiveness(attacker_type.name)
                if not effectiveness_data:
                    self.stdout.write(
                        self.style.WARNING(f"Could not fetch effectiveness data for {attacker_type.name}")
                    )
                    continue

                # Process double damage (2.0x)
                for defender_name in effectiveness_data["double_damage_to"]:
                    try:
                        defender_type = PokemonType.objects.get(name=defender_name)
                        effectiveness, created = TypeEffectiveness.objects.update_or_create(
                            attacker_type=attacker_type,
                            defender_type=defender_type,
                            defaults={"multiplier": TypeEffectiveness.SUPER_EFFECTIVE},
                        )
                        if created:
                            created_count += 1
                        else:
                            updated_count += 1
                    except PokemonType.DoesNotExist:
                        self.stdout.write(self.style.WARNING(f"Defender type '{defender_name}' not found in database"))

                # Process half damage (0.5x)
                for defender_name in effectiveness_data["half_damage_to"]:
                    try:
                        defender_type = PokemonType.objects.get(name=defender_name)
                        effectiveness, created = TypeEffectiveness.objects.update_or_create(
                            attacker_type=attacker_type,
                            defender_type=defender_type,
                            defaults={"multiplier": TypeEffectiveness.NOT_VERY_EFFECTIVE},
                        )
                        if created:
                            created_count += 1
                        else:
                            updated_count += 1
                    except PokemonType.DoesNotExist:
                        self.stdout.write(self.style.WARNING(f"Defender type '{defender_name}' not found in database"))

                # Process no damage (0.0x)
                for defender_name in effectiveness_data["no_damage_to"]:
                    try:
                        defender_type = PokemonType.objects.get(name=defender_name)
                        effectiveness, created = TypeEffectiveness.objects.update_or_create(
                            attacker_type=attacker_type,
                            defender_type=defender_type,
                            defaults={"multiplier": TypeEffectiveness.NO_EFFECT},
                        )
                        if created:
                            created_count += 1
                        else:
                            updated_count += 1
                    except PokemonType.DoesNotExist:
                        self.stdout.write(self.style.WARNING(f"Defender type '{defender_name}' not found in database"))

            self.stdout.write(
                self.style.SUCCESS(
                    f"\nTypeEffectiveness seeder completed: {created_count} created, {updated_count} already existed"
                )
            )
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Error seeding TypeEffectiveness: {e}"))
            raise
