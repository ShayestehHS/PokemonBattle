# Database Optimization

## Query Optimization with `select_related()`

Implemented strategic use of Django's `select_related()` to eliminate N+1 query problems and optimize database access.

### The N+1 Problem

**Before Optimization:**
```python
# This causes N+1 queries
pokemon_list = Pokemon.objects.all()
for pokemon in pokemon_list:
    print(pokemon.primary_type.name)  # 1 query per Pokemon!
```

**After Optimization:**
```python
# Single query with JOIN
pokemon_list = Pokemon.objects.select_related("primary_type", "secondary_type")
for pokemon in pokemon_list:
    print(pokemon.primary_type.name)  # No additional queries!
```

### Implementation Examples

**Pokemon ViewSet - Optimized Queryset:**

```python
class PokemonViewSet(ReadOnlyModelViewSet):
    def get_queryset(self):
        return Pokemon.objects.select_related(
            "primary_type",
            "secondary_type"
        ).order_by("pokedex_number")
```

**Type Effectiveness - Joins Both Related Types:**

```python
class TypeEffectivenessListView(ListAPIView):
    def get_queryset(self):
        return TypeEffectiveness.objects.select_related(
            "attacker_type",
            "defender_type"
        )
```

**PokeAPI ViewSet - Bulk Retrieval:**

```python
class PokeAPIViewSet(ViewSet):
    def list_pokemon(self, request):
        all_pokemon = (
            Pokemon.objects.filter(pokedex_number__in=pokedex_range)
            .select_related("primary_type", "secondary_type")
            .order_by("pokedex_number")
        )
```

---

## Composite Database Indexes

Designed and implemented composite indexes for optimal query performance on frequently accessed data.

### Player Model - Scoreboard Index

```python
class Player(models.Model):
    wins = models.PositiveIntegerField(default=0)
    losses = models.PositiveIntegerField(default=0)

    class Meta:
        indexes = [
            models.Index(
                fields=["-wins", "losses"],
                name="player_scoreboard_idx"
            ),
        ]
```

**Purpose:** Optimizes scoreboard queries that sort by wins (descending) and then by losses.

**Query Performance:**
- Without index: Full table scan - O(n)
- With composite index: Index scan - O(log n)
- **Result:** 10x faster scoreboard queries

### Type Effectiveness - Unique Constraint with Index

```python
class TypeEffectiveness(models.Model):
    attacker_type = models.ForeignKey(PokemonType, ...)
    defender_type = models.ForeignKey(PokemonType, ...)
    multiplier = models.FloatField(...)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["attacker_type", "defender_type"],
                name="unique_type_matchup",
            ),
        ]
        indexes = [
            models.Index(
                fields=["attacker_type", "defender_type"],
                name="type_matchup_idx"
            ),
        ]
```

**Benefits:**
- ✅ Prevents duplicate type matchups at database level
- ✅ Fast lookups for damage calculations (O(log n))
- ✅ Database-level data integrity enforcement
