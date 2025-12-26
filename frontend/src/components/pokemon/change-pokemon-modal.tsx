"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { PokeAPIPokemon, api } from "@/lib/api";

type ModalMode = "change" | "add";

interface ChangePokemonModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (pokemon: PokeAPIPokemon) => void;
  currentPokemonName?: string;
  ownedPokemonNumbers?: number[];
  mode?: ModalMode;
}

const TYPE_COLORS: Record<string, string> = {
  normal: "#A8A878",
  fire: "#F08030",
  water: "#6890F0",
  electric: "#F8D030",
  grass: "#78C850",
  ice: "#98D8D8",
  fighting: "#C03028",
  poison: "#A040A0",
  ground: "#E0C068",
  flying: "#A890F0",
  psychic: "#F85888",
  bug: "#A8B820",
  rock: "#B8A038",
  ghost: "#705898",
  dragon: "#7038F8",
  dark: "#705848",
  steel: "#B8B8D0",
  fairy: "#EE99AC",
};

export function ChangePokemonModal({
  open,
  onOpenChange,
  onSelect,
  currentPokemonName,
  ownedPokemonNumbers = [],
  mode = "change",
}: ChangePokemonModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResult, setSearchResult] = useState<PokeAPIPokemon | null>(null);
  const [pokemonList, setPokemonList] = useState<PokeAPIPokemon[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [selectedPokemon, setSelectedPokemon] = useState<PokeAPIPokemon | null>(null);

  const LIMIT = 20;
  const loadingRef = useRef(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load Pokemon list
  const loadPokemon = useCallback(async (newOffset: number, reset = false) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      // If we're at the beginning and it's a reset, try to get choices from our backend first
      if (newOffset === 0 && reset) {
        try {
          const choices = await api.getChoices();
          if (choices && choices.length > 0) {
            setPokemonList(choices);
            setHasMore(true);
            setOffset(choices.length);
            setIsLoading(false);
            loadingRef.current = false;
            return;
          }
        } catch (err) {
          console.error("Failed to fetch choices from backend, falling back to PokeAPI list", err);
        }
      }

      // Use our backend to list pokemon
      const response = await api.listPokemon(newOffset, LIMIT);
      const validResults = response.results;

      setPokemonList(prev => reset ? validResults : [...prev, ...validResults]);
      setHasMore(newOffset + validResults.length < response.count);
      setOffset(newOffset + validResults.length);
    } catch (err) {
      setError("Failed to load Pokémon. Please try again.");
    } finally {
      setIsLoading(false);
      loadingRef.current = false;
    }
  }, []);

  // Load on mount
  useEffect(() => {
    if (open && pokemonList.length === 0 && !loadingRef.current) {
      loadPokemon(0, true);
    }
  }, [open, pokemonList.length, loadPokemon]);

  // Search for Pokemon
  const handleSearch = useCallback(async (queryOverride?: string) => {
    const query = (queryOverride !== undefined ? queryOverride : searchQuery).trim().toLowerCase();

    if (!query) {
      setSearchResult(null);
      setError(null);
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      // Use our backend to search pokemon
      const pokemon = await api.searchPokemon(query);

      if (pokemon) {
        setSearchResult(pokemon);
      } else {
        setSearchResult(null);
        setError(`No Pokémon found matching "${query}"`);
      }
    } catch (err) {
      setSearchResult(null);
      setError(`No Pokémon found matching "${query}"`);
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery]);

  // Debounce search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.trim()) {
      searchTimeoutRef.current = setTimeout(() => {
        handleSearch();
      }, 500);
    } else {
      setSearchResult(null);
      setError(null);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, handleSearch]);

  // Handle manual search trigger (button click or Enter)
  const handleManualSearch = () => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    handleSearch();
  };

  // Handle search on Enter
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleManualSearch();
    }
  };

  // Clear search
  const handleClearSearch = () => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    setSearchQuery("");
    setSearchResult(null);
    setError(null);
  };

  // Handle selection
  const handleConfirm = () => {
    if (selectedPokemon) {
      onSelect(selectedPokemon);
      onOpenChange(false);
      setSelectedPokemon(null);
    }
  };

  // Capitalize first letter
  const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

  // Get type color
  const getTypeColor = (type: string) => TYPE_COLORS[type] || "#A8A878";

  // Check if Pokemon is owned (for add mode)
  const isPokemonOwned = (pokedexNumber: number) => ownedPokemonNumbers.includes(pokedexNumber);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {mode === "add" ? "Add New Pokémon" : "Change Your Pokémon"}
          </DialogTitle>
          <DialogDescription>
            {mode === "add"
              ? "Search for any Pokémon to add to your team."
              : "Search for any Pokémon by name or Pokédex number, or browse the list below."}
          </DialogDescription>
        </DialogHeader>

        {/* Search Section */}
        <div className="flex gap-2 mt-2">
          <div className="relative flex-1">
            <Input
              placeholder="Search by name or number (e.g., pikachu, 25)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="pr-8"
            />
            {searchQuery && (
              <button
                onClick={handleClearSearch}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          <Button onClick={handleManualSearch} disabled={isSearching || !searchQuery.trim()}>
            {isSearching ? (
              <span className="animate-spin">⏳</span>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            )}
          </Button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="text-sm text-red-500 bg-red-50 p-2 rounded-md">
            {error}
          </div>
        )}

        {/* Search Result */}
        {searchResult && (
          <div className="mt-2">
            <p className="text-sm text-muted-foreground mb-2">Search Result:</p>
            <PokemonCard
              pokemon={searchResult}
              isSelected={selectedPokemon?.pokedex_number === searchResult.pokedex_number}
              isCurrent={mode === "change" && currentPokemonName?.toLowerCase() === searchResult.name.toLowerCase()}
              isOwned={isPokemonOwned(searchResult.pokedex_number)}
              disableOwned={mode === "add"}
              onClick={() => setSelectedPokemon(searchResult)}
              getTypeColor={getTypeColor}
              capitalize={capitalize}
            />
          </div>
        )}

        {/* Pokemon List */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden mt-4">
          {!searchResult && (
            <>
              <p className="text-sm text-muted-foreground mb-2">
                All Pokémon ({pokemonList.length} loaded)
                {ownedPokemonNumbers.length > 0 && (
                  <span className="text-xs ml-2 text-green-600">
                    • {mode === "add" ? "Owned Pokémon cannot be added again" : "Your Pokémon are marked"}
                  </span>
                )}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pr-1">
                {pokemonList.map((pokemon) => (
                  <PokemonCard
                    key={pokemon.pokedex_number}
                    pokemon={pokemon}
                    isSelected={selectedPokemon?.pokedex_number === pokemon.pokedex_number}
                    isCurrent={mode === "change" && currentPokemonName?.toLowerCase() === pokemon.name.toLowerCase()}
                    isOwned={isPokemonOwned(pokemon.pokedex_number)}
                    disableOwned={mode === "add"}
                    onClick={() => setSelectedPokemon(pokemon)}
                    getTypeColor={getTypeColor}
                    capitalize={capitalize}
                  />
                ))}
                {isLoading && (
                  <>
                    {[...Array(6)].map((_, i) => (
                      <Skeleton key={i} className="h-24 rounded-lg" />
                    ))}
                  </>
                )}
              </div>
              {hasMore && !isLoading && (
                <div className="mt-4 text-center">
                  <Button
                    variant="outline"
                    onClick={() => loadPokemon(offset)}
                    className="w-full"
                  >
                    Load More Pokémon
                  </Button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center mt-4 pt-4 border-t">
          <div>
            {selectedPokemon && (
              <p className="text-sm">
                Selected: <span className="font-semibold">{capitalize(selectedPokemon.name)}</span>
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!selectedPokemon}
              className="bg-gradient-to-r from-[var(--color-pokeball-red)] to-[var(--color-pokeball-dark-red)] text-white"
            >
              Confirm Selection
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Pokemon Card Component
interface PokemonCardProps {
  pokemon: PokeAPIPokemon;
  isSelected: boolean;
  isCurrent: boolean;
  isOwned?: boolean;
  disableOwned?: boolean;
  onClick: () => void;
  getTypeColor: (type: string) => string;
  capitalize: (str: string) => string;
}

function PokemonCard({
  pokemon,
  isSelected,
  isCurrent,
  isOwned = false,
  disableOwned = false,
  onClick,
  getTypeColor,
  capitalize,
}: PokemonCardProps) {
  // Only disable if current, or if owned AND disableOwned is true
  const isDisabled = isCurrent || (isOwned && disableOwned);

  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      className={`relative p-3 rounded-lg border-2 transition-all text-left ${
        isDisabled
          ? "border-gray-300 bg-gray-100 opacity-60 cursor-not-allowed"
          : isOwned
          ? isSelected
            ? "border-green-500 bg-green-50 shadow-md ring-2 ring-green-300"
            : "border-green-300 bg-green-50/50 hover:border-green-400 hover:shadow-sm"
          : isSelected
          ? "border-[var(--color-pokemon-blue)] bg-blue-50 shadow-md"
          : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
      }`}
    >
      {isCurrent && (
        <span className="absolute top-1 right-1 text-[10px] bg-gray-500 text-white px-1.5 py-0.5 rounded-full">
          Current
        </span>
      )}
      {isOwned && !isCurrent && (
        <span className="absolute top-1 right-1 text-[10px] bg-green-600 text-white px-1.5 py-0.5 rounded-full">
          Owned
        </span>
      )}
      {isSelected && !isDisabled && (
        <span className="absolute top-1 right-1 text-[10px] bg-[var(--color-pokemon-blue)] text-white px-1.5 py-0.5 rounded-full">
          Selected
        </span>
      )}
      <div className="flex items-center gap-2 overflow-hidden">
        <img
          src={pokemon.sprite_url || "/placeholder-pokemon.png"}
          alt={pokemon.name}
          className="w-12 h-12 object-contain flex-shrink-0"
        />
        <div className="flex-1 min-w-0 overflow-hidden">
          <p className="text-xs text-muted-foreground">#{pokemon.pokedex_number}</p>
          <p className="font-semibold text-sm truncate">{capitalize(pokemon.name)}</p>
          <div className="flex gap-1 mt-1 flex-wrap">
            <span
              className="px-1.5 py-0.5 rounded text-[10px] text-white uppercase"
              style={{ backgroundColor: getTypeColor(pokemon.primary_type_name) }}
            >
              {pokemon.primary_type_name}
            </span>
            {pokemon.secondary_type_name && (
              <span
                className="px-1.5 py-0.5 rounded text-[10px] text-white uppercase"
                style={{ backgroundColor: getTypeColor(pokemon.secondary_type_name) }}
              >
                {pokemon.secondary_type_name}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="mt-2 grid grid-cols-4 gap-1 text-[10px] text-muted-foreground">
        <div className="text-center">
          <p className="font-semibold text-foreground">{pokemon.base_hp}</p>
          <p>HP</p>
        </div>
        <div className="text-center">
          <p className="font-semibold text-foreground">{pokemon.base_attack}</p>
          <p>ATK</p>
        </div>
        <div className="text-center">
          <p className="font-semibold text-foreground">{pokemon.base_defense}</p>
          <p>DEF</p>
        </div>
        <div className="text-center">
          <p className="font-semibold text-foreground">{pokemon.base_speed}</p>
          <p>SPD</p>
        </div>
      </div>
    </button>
  );
}
