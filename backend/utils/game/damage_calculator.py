import random

from pokemon.models import TypeEffectiveness


def get_type_effectiveness(attacker_pokemon, defender_pokemon):
    """
    Calculate type effectiveness multiplier between two Pokemon.
    For dual-type defenders, uses the product of both type matchups.
    """
    attacker_type = attacker_pokemon.primary_type

    defender_primary = defender_pokemon.primary_type
    defender_secondary = defender_pokemon.secondary_type

    primary_multiplier = TypeEffectiveness.NORMAL
    secondary_multiplier = TypeEffectiveness.NORMAL

    try:
        effectiveness = TypeEffectiveness.objects.get(attacker_type=attacker_type, defender_type=defender_primary)
        primary_multiplier = effectiveness.multiplier
    except TypeEffectiveness.DoesNotExist:
        primary_multiplier = TypeEffectiveness.NORMAL

    if defender_secondary:
        try:
            effectiveness = TypeEffectiveness.objects.get(attacker_type=attacker_type, defender_type=defender_secondary)
            secondary_multiplier = effectiveness.multiplier
        except TypeEffectiveness.DoesNotExist:
            secondary_multiplier = TypeEffectiveness.NORMAL
        return primary_multiplier * secondary_multiplier

    return primary_multiplier


def calculate_damage(
    attacker_pokemon, defender_pokemon, attacker_attack_boost, defender_defense_boost, defender_action
):
    """
    Calculate damage dealt by attacker to defender.

    Formula:
    base_damage = attacker.base_attack * 0.3
    type_multiplier = get_type_effectiveness(attacker_type, defender_type)
    critical_multiplier = 2.0 if random() > 0.9 else 1.0  # 10% crit chance
    attack_boost_multiplier = 1.5 if attacker_attack_boost > 0 else 1.0
    defense_boost_multiplier = 0.5 if defender_defense_boost > 0 else 1.0
    action_defense_reduction = defender.base_defense * 0.1 if defender_action == "defend" else 0
    final_damage = max(1, (base_damage * type_multiplier * critical_multiplier * attack_boost_multiplier * defense_boost_multiplier) - action_defense_reduction)
    """
    base_damage = attacker_pokemon.base_attack * 0.3
    type_multiplier = get_type_effectiveness(attacker_pokemon, defender_pokemon)
    is_critical = random.random() > 0.9
    critical_multiplier = 2.0 if is_critical else 1.0

    attack_boost_multiplier = 1.5 if attacker_attack_boost > 0 else 1.0
    defense_boost_multiplier = 0.5 if defender_defense_boost > 0 else 1.0

    action_defense_reduction = defender_pokemon.base_defense * 0.1 if defender_action == "defend" else 0

    final_damage = max(
        1,
        int(
            (base_damage * type_multiplier * critical_multiplier * attack_boost_multiplier * defense_boost_multiplier)
            - action_defense_reduction
        ),
    )

    is_super_effective = type_multiplier > 1.0

    return {
        "damage": final_damage,
        "is_critical": is_critical,
        "is_super_effective": is_super_effective,
    }
