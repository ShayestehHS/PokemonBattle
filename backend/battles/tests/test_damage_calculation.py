from unittest.mock import patch

import pytest

from pokemon.models import TypeEffectiveness
from utils.game.damage_calculator import calculate_damage, get_type_effectiveness


@pytest.mark.django_db
class TestGetTypeEffectiveness:
    @pytest.fixture(autouse=True)
    def setup(self, create_pokemon, create_pokemon_type, create_type_effectiveness):
        fire_type = create_pokemon_type(name="fire")
        water_type = create_pokemon_type(name="water")
        grass_type = create_pokemon_type(name="grass")
        self.fire_pokemon = create_pokemon(name="Charmander", pokedex_number=5001, primary_type=fire_type)
        self.water_pokemon = create_pokemon(name="Squirtle", pokedex_number=5002, primary_type=water_type)
        self.grass_pokemon = create_pokemon(name="Bulbasaur", pokedex_number=5003, primary_type=grass_type)

    def test_get_type_effectiveness_with_super_effective_returns_2_0(self, create_type_effectiveness):
        create_type_effectiveness(
            attacker_type=self.fire_pokemon.primary_type,
            defender_type=self.grass_pokemon.primary_type,
            multiplier=TypeEffectiveness.SUPER_EFFECTIVE,
        )

        multiplier = get_type_effectiveness(self.fire_pokemon, self.grass_pokemon)

        assert multiplier == TypeEffectiveness.SUPER_EFFECTIVE

    def test_get_type_effectiveness_with_not_very_effective_returns_0_5(self, create_type_effectiveness):
        create_type_effectiveness(
            attacker_type=self.fire_pokemon.primary_type,
            defender_type=self.water_pokemon.primary_type,
            multiplier=TypeEffectiveness.NOT_VERY_EFFECTIVE,
        )

        multiplier = get_type_effectiveness(self.fire_pokemon, self.water_pokemon)

        assert multiplier == TypeEffectiveness.NOT_VERY_EFFECTIVE

    def test_get_type_effectiveness_with_no_match_returns_normal(self):
        multiplier = get_type_effectiveness(self.fire_pokemon, self.water_pokemon)

        assert multiplier == TypeEffectiveness.NORMAL

    def test_get_type_effectiveness_with_dual_type_returns_product(
        self, create_pokemon_type, create_pokemon, create_type_effectiveness
    ):
        electric_type = create_pokemon_type(name="electric")
        dual_type_pokemon = create_pokemon(
            name="Charizard",
            pokedex_number=5004,
            primary_type=self.fire_pokemon.primary_type,
            secondary_type=electric_type,
        )

        create_type_effectiveness(
            attacker_type=self.water_pokemon.primary_type,
            defender_type=self.fire_pokemon.primary_type,
            multiplier=TypeEffectiveness.SUPER_EFFECTIVE,
        )
        create_type_effectiveness(
            attacker_type=self.water_pokemon.primary_type,
            defender_type=electric_type,
            multiplier=TypeEffectiveness.NORMAL,
        )

        multiplier = get_type_effectiveness(self.water_pokemon, dual_type_pokemon)

        assert multiplier == TypeEffectiveness.SUPER_EFFECTIVE * TypeEffectiveness.NORMAL


@pytest.mark.django_db
class TestCalculateDamage:
    @pytest.fixture(autouse=True)
    def setup(self, create_pokemon, create_pokemon_type, create_type_effectiveness):
        fire_type = create_pokemon_type(name="fire")
        water_type = create_pokemon_type(name="water")
        self.attacker = create_pokemon(
            name="Charmander", pokedex_number=6001, primary_type=fire_type, base_attack=52, base_defense=43
        )
        self.defender = create_pokemon(
            name="Squirtle", pokedex_number=6002, primary_type=water_type, base_attack=48, base_defense=65
        )

    @patch("utils.game.damage_calculator.random.random")
    def test_calculate_damage_with_normal_effectiveness_returns_expected_damage(self, mock_random):
        mock_random.return_value = 0.5  # No crit

        result = calculate_damage(self.attacker, self.defender, 0, 0, "attack")

        assert result["damage"] >= 1
        assert result["is_critical"] is False
        assert result["is_super_effective"] is False
        expected_base = int(self.attacker.base_attack * 0.3)
        assert result["damage"] == expected_base

    @patch("utils.game.damage_calculator.random.random")
    def test_calculate_damage_with_critical_hit_returns_doubled_damage(self, mock_random):
        mock_random.return_value = 0.95  # Crit (10% chance, > 0.9)

        result = calculate_damage(self.attacker, self.defender, 0, 0, "attack")

        assert result["is_critical"] is True
        expected_base = self.attacker.base_attack * 0.3
        expected_damage = int(expected_base * 2)
        assert result["damage"] == expected_damage

    def test_calculate_damage_with_super_effective_returns_increased_damage(self, create_type_effectiveness):
        create_type_effectiveness(
            attacker_type=self.attacker.primary_type,
            defender_type=self.defender.primary_type,
            multiplier=TypeEffectiveness.SUPER_EFFECTIVE,
        )

        with patch("utils.game.damage_calculator.random.random", return_value=0.5):
            result = calculate_damage(self.attacker, self.defender, 0, 0, "attack")

        assert result["is_super_effective"] is True
        expected_base = self.attacker.base_attack * 0.3
        expected_damage = int(expected_base * TypeEffectiveness.SUPER_EFFECTIVE)
        assert result["damage"] == expected_damage

    @patch("utils.game.damage_calculator.random.random")
    def test_calculate_damage_with_attack_boost_returns_increased_damage(self, mock_random):
        mock_random.return_value = 0.5  # No crit

        result = calculate_damage(self.attacker, self.defender, 1, 0, "attack")

        assert result["damage"] >= 1
        expected_base = self.attacker.base_attack * 0.3
        expected_damage = int(expected_base * 1.5)
        assert result["damage"] == expected_damage

    @patch("utils.game.damage_calculator.random.random")
    def test_calculate_damage_with_defense_boost_returns_reduced_damage(self, mock_random):
        mock_random.return_value = 0.5  # No crit

        result = calculate_damage(self.attacker, self.defender, 0, 1, "attack")

        assert result["damage"] >= 1
        expected_base = int(self.attacker.base_attack * 0.3)
        assert result["damage"] == int(expected_base * 0.5)

    @patch("utils.game.damage_calculator.random.random")
    def test_calculate_damage_with_defend_action_returns_reduced_damage(self, mock_random):
        mock_random.return_value = 0.5  # No crit

        result = calculate_damage(self.attacker, self.defender, 0, 0, "defend")

        assert result["damage"] >= 1
        expected_base = int(self.attacker.base_attack * 0.3)
        defense_reduction = int(self.defender.base_defense * 0.1)
        assert result["damage"] == max(1, expected_base - defense_reduction)

    @patch("utils.game.damage_calculator.random.random")
    def test_calculate_damage_always_returns_at_least_1_damage(self, mock_random):
        mock_random.return_value = 0.5  # No crit

        result = calculate_damage(self.attacker, self.defender, 0, 10, "defend")

        assert result["damage"] >= 1
