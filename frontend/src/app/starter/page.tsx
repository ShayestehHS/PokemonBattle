"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { tokenStorage, api, DatabasePokemon, ApiError } from "@/lib/api";
import { showErrorToast } from "@/lib/toast";
import {
  getTypeColor,
  PokemonType,
} from "@/lib/mocks";

export default function StarterSelectionPage() {
  const router = useRouter();
  const [starters, setStarters] = useState<DatabasePokemon[]>([]);
  const [selectedPokemon, setSelectedPokemon] = useState<DatabasePokemon | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check auth and load starters
    const init = async () => {
      const token = tokenStorage.getAccessToken();
      if (!token) {
        router.replace("/");
        return;
      }

      // Check if user already has pokemon in their collection
      try {
        const myPokemon = await api.listMyPokemon();
        if (myPokemon && myPokemon.length > 0) {
          router.replace("/dashboard");
          return;
        }
      } catch (err) {
        // If API call fails, continue to show starter selection
      }

      // Load starter Pokemon from our backend
      try {
        const starterPokemon = await api.getStarters();
        setStarters(starterPokemon);
      } catch (err) {
        setError("Failed to load starter Pokemon from backend");
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, [router]);

  const handleLogout = () => {
    tokenStorage.clearTokens();
    router.replace("/");
  };

  const handleSelectPokemon = (pokemon: DatabasePokemon) => {
    setSelectedPokemon(pokemon);
    setIsConfirmOpen(true);
  };

  const handleConfirmSelection = async () => {
    if (!selectedPokemon) return;

    setIsSaving(true);
    setError(null);

    try {
      // Add pokemon to collection using backend API
      await api.addPokemonToCollection(selectedPokemon.id);

      // Mark that starter has been selected (for frontend state management)
      localStorage.setItem("pokemon_arena_has_starter", "true");

      setShowSuccess(true);

      // Wait for animation, then redirect
      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
    } catch (err) {
      const apiError = err as ApiError;

      // Determine error type: FormError has field_name, ToastError has message but no field_name
      if (apiError.field_name) {
        // FormError: show inline error only
        const errorMessage = apiError.message || "Failed to save your selection. Please try again.";
        setError(errorMessage);
      } else {
        // ToastError: show toast only
        showErrorToast(err);
      }
      setIsConfirmOpen(false);
    } finally {
      setIsSaving(false);
    }
  };

  const getTypeBgClass = (type: string) => {
    const classes: Record<string, string> = {
      grass: "bg-type-grass",
      fire: "bg-type-fire",
      water: "bg-type-water",
    };
    return classes[type] || "bg-gray-500";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen landing-bg flex items-center justify-center">
        <div className="animate-pokeball-spin">
          <svg viewBox="0 0 40 40" className="w-16 h-16">
            <circle cx="20" cy="20" r="18" fill="#EE1515" />
            <path d="M 20 38 A 18 18 0 0 1 2 20 L 38 20 A 18 18 0 0 1 20 38" fill="white" />
            <rect x="2" y="18" width="36" height="4" fill="#2D2D2D" />
            <circle cx="20" cy="20" r="6" fill="#2D2D2D" />
            <circle cx="20" cy="20" r="4" fill="white" />
          </svg>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen landing-bg relative overflow-hidden">
      {/* Logout Button */}
      <div className="absolute top-4 right-4 z-50">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-colors"
        >
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Logout
        </Button>
      </div>

      {/* Floating type orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[10%] left-[10%] w-32 h-32 rounded-full bg-[var(--color-type-grass)]/20 blur-3xl animate-blob-drift" />
        <div className="absolute top-[20%] right-[15%] w-40 h-40 rounded-full bg-[var(--color-type-fire)]/20 blur-3xl animate-blob-drift delay-500" />
        <div className="absolute bottom-[20%] left-[20%] w-36 h-36 rounded-full bg-[var(--color-type-water)]/20 blur-3xl animate-blob-drift delay-300" />
      </div>

      <div className="relative z-10 min-h-screen flex flex-col items-center py-12 px-6">
        {/* Header */}
        <div className="text-center mb-8 md:mb-12 animate-slide-in-up">
          <p className="text-sm text-muted-foreground mb-2">Step 1 of 1</p>
          <h1 className="text-3xl md:text-4xl font-bold text-[var(--color-pokeball-black)] mb-3">
            Choose Your First Partner
          </h1>
          <p className="text-lg text-muted-foreground max-w-md">
            This Pokémon will begin your journey as a Trainer in the Battle Arena
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 animate-shake">
            {error}
          </div>
        )}

        {/* Pokemon Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 w-full max-w-4xl mb-8">
          {starters.map((pokemon, index) => (
            <div
              key={pokemon.pokedex_number}
              className="animate-slide-in-up"
              style={{ animationDelay: `${index * 100 + 100}ms` }}
            >
              <PokemonCard
                pokemon={pokemon}
                isSelected={selectedPokemon?.pokedex_number === pokemon.pokedex_number}
                onClick={() => handleSelectPokemon(pokemon)}
              />
            </div>
          ))}
        </div>

        {/* Helper text */}
        <p className="text-sm text-muted-foreground/60 animate-slide-in-up delay-500">
          Click on a Pokémon to select it as your partner
        </p>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          {showSuccess ? (
            <div className="py-8 text-center">
              <div className="mb-4 relative">
                <div className="w-24 h-24 mx-auto relative">
                  <img
                    src={selectedPokemon?.sprite_url}
                    alt={selectedPokemon?.name}
                    className="w-full h-full object-contain animate-gentle-bounce"
                  />
                  {/* Confetti/sparkles */}
                  <Sparkle className="absolute -top-2 left-0 w-4 h-4 text-[var(--color-pokemon-yellow)] animate-sparkle" />
                  <Sparkle className="absolute top-0 -right-2 w-3 h-3 text-[var(--color-pokemon-yellow)] animate-sparkle delay-200" />
                  <Sparkle className="absolute -bottom-1 right-0 w-5 h-5 text-[var(--color-pokemon-yellow)] animate-sparkle delay-300" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-[var(--color-pokeball-black)] mb-2">
                {selectedPokemon?.name} joined your team!
              </h3>
              <p className="text-muted-foreground">
                Redirecting to your dashboard...
              </p>
            </div>
          ) : (
            <>
              <DialogHeader>
                <div className="flex justify-center mb-4">
                  <div
                    className="w-20 h-20 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${getTypeColor((selectedPokemon?.primary_type_name || "normal") as PokemonType)}20` }}
                  >
                    <img
                      src={selectedPokemon?.sprite_url}
                      alt={selectedPokemon?.name}
                      className="w-16 h-16 object-contain"
                    />
                  </div>
                </div>
                <DialogTitle className="text-center text-xl capitalize">
                  Choose {selectedPokemon?.name}?
                </DialogTitle>
                <DialogDescription className="text-center">
                  {selectedPokemon?.name} will be your partner on this journey!
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="flex gap-3 sm:justify-center mt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsConfirmOpen(false)}
                  disabled={isSaving}
                  className="hover:bg-gray-100 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmSelection}
                  disabled={isSaving}
                  className="bg-gradient-to-r from-[var(--color-pokeball-red)] to-[var(--color-pokeball-dark-red)] hover:from-[var(--color-pokeball-dark-red)] hover:to-[var(--color-pokeball-red)] transition-all hover:scale-[1.02] active:scale-[0.98] hover:shadow-lg hover:shadow-red-500/30"
                >
                  {isSaving ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Confirming...
                    </span>
                  ) : (
                    <>
                      Confirm
                      <svg className="ml-1 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </>
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}

// ===========================================
// Component: Pokemon Card
// ===========================================

interface PokemonCardProps {
  pokemon: DatabasePokemon;
  isSelected: boolean;
  onClick: () => void;
}

function PokemonCard({ pokemon, isSelected, onClick }: PokemonCardProps) {
  const typeColor = getTypeColor(pokemon.primary_type_name as PokemonType);

  return (
    <Card
      onClick={onClick}
      className={`relative cursor-pointer transition-all duration-300 overflow-hidden group
        ${isSelected
          ? "scale-105 shadow-2xl ring-4"
          : "hover:scale-[1.02] hover:shadow-xl"
        }`}
      style={{
        borderColor: isSelected ? typeColor : "transparent",
        borderWidth: isSelected ? "3px" : "1px",
        boxShadow: isSelected ? `0 0 0 4px ${typeColor}40` : "none",
      }}
    >
      {/* Type colored header */}
      <div
        className="h-2 w-full"
        style={{ backgroundColor: typeColor }}
      />

      {/* Selected checkmark */}
      {isSelected && (
        <div
          className="absolute top-4 right-4 w-6 h-6 rounded-full flex items-center justify-center animate-scale-in"
          style={{ backgroundColor: typeColor }}
        >
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}

      <div className="p-6">
        {/* Pokemon sprite */}
        <div className="flex justify-center mb-4">
          <div
            className="w-28 h-28 rounded-full flex items-center justify-center transition-transform group-hover:scale-110"
            style={{ backgroundColor: `${typeColor}15` }}
          >
            <img
              src={pokemon.sprite_url}
              alt={pokemon.name}
              className="w-24 h-24 object-contain drop-shadow-lg"
            />
          </div>
        </div>

        {/* Pokemon name */}
        <h3 className="text-xl font-bold text-center text-[var(--color-pokeball-black)] mb-2">
          {pokemon.name}
        </h3>

        {/* Type badge */}
        <div className="flex justify-center gap-2 mb-4">
          <span
            className="px-3 py-1 rounded-full text-xs font-semibold text-white uppercase tracking-wide"
            style={{ backgroundColor: typeColor }}
          >
            {pokemon.primary_type_name}
          </span>
          {pokemon.secondary_type_name && (
            <span
              className="px-3 py-1 rounded-full text-xs font-semibold text-white uppercase tracking-wide"
              style={{ backgroundColor: getTypeColor(pokemon.secondary_type_name as PokemonType) }}
            >
              {pokemon.secondary_type_name}
            </span>
          )}
        </div>

        {/* Note: DatabasePokemon doesn't have stats in list view */}
        <div className="text-center text-sm text-muted-foreground mt-2">
          Click to view details
        </div>

        {/* Select button */}
        <Button
          className="w-full mt-4 transition-all relative z-10 hover:opacity-90 active:scale-95"
          variant={isSelected ? "default" : "outline"}
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
          style={{
            backgroundColor: isSelected ? typeColor : "transparent",
            borderColor: typeColor,
            color: isSelected ? "white" : typeColor,
          }}
        >
          {isSelected ? "Selected ✓" : "Select"}
        </Button>
      </div>
    </Card>
  );
}

// ===========================================
// Component: Stat Bar
// ===========================================

interface StatBarProps {
  label: string;
  value: number;
  maxValue: number;
  color: string;
}

function StatBar({ label, value, maxValue, color }: StatBarProps) {
  const percentage = (value / maxValue) * 100;

  return (
    <div className="flex items-center gap-2">
      <span className="w-10 text-xs font-mono font-semibold text-muted-foreground">
        {label}
      </span>
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${percentage}%`,
            backgroundColor: color,
          }}
        />
      </div>
      <span className="w-8 text-xs font-mono font-semibold text-right">
        {value}
      </span>
    </div>
  );
}

// ===========================================
// Component: Sparkle
// ===========================================

function Sparkle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
    </svg>
  );
}
