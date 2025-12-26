"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { tokenStorage, api, Player, DatabasePokemon } from "@/lib/api";
import { getTypeColor, Pokemon, PokemonType } from "@/lib/mocks";
import { showErrorToast } from "@/lib/toast";

type OpponentType = "random" | "username";

interface BattlePlayer extends Player {
  currentPokemon?: Pokemon;
}

export default function BattleSetupPage() {
  const router = useRouter();
  const [player, setPlayer] = useState<BattlePlayer | null>(null);
  const [myPokemon, setMyPokemon] = useState<DatabasePokemon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [opponentType, setOpponentType] = useState<OpponentType>("random");
  const [opponentUsername, setOpponentUsername] = useState("");

  useEffect(() => {
    const init = async () => {
      const token = tokenStorage.getAccessToken();
      if (!token) {
        router.replace("/");
        return;
      }

      try {
        const playerData = await api.getMe();
        if (!playerData) {
          router.replace("/");
          return;
        }

        // Convert active_pokemon to Pokemon format
        let currentPokemon: Pokemon | undefined;
        if (playerData.active_pokemon && playerData.active_pokemon.primary_type) {
          currentPokemon = {
            id: playerData.active_pokemon.id,
            pokedexNumber: playerData.active_pokemon.pokedex_number,
            name: playerData.active_pokemon.name,
            spriteUrl: playerData.active_pokemon.sprite_url,
            primaryType: playerData.active_pokemon.primary_type.name as PokemonType,
            secondaryType: playerData.active_pokemon.secondary_type?.name ? (playerData.active_pokemon.secondary_type.name as PokemonType) : undefined,
            baseHp: playerData.active_pokemon.base_hp,
            baseAttack: playerData.active_pokemon.base_attack,
            baseDefense: playerData.active_pokemon.base_defense,
            baseSpeed: playerData.active_pokemon.base_speed,
          };
        }

        // Check if player has any pokemon
        const myPokemonList = await api.listMyPokemon().catch(() => []);
        if (myPokemonList.length === 0) {
          router.replace("/starter");
          return;
        }

        setMyPokemon(myPokemonList);
        setPlayer({
          ...playerData,
          currentPokemon,
        });
      } catch (err) {
        showErrorToast(err);
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, [router]);

  const handleCreateBattle = async () => {
    setIsCreating(true);
    setError(null);

    try {
      // Check if player has any pokemon
      if (myPokemon.length === 0) {
        setError("You must have a Pokemon to start a battle. Please add a Pokemon first.");
        setIsCreating(false);
        return;
      }

      // If player doesn't have an active pokemon, set the first one as active
      if (!player?.active_pokemon) {
        const firstPokemon = myPokemon[0];
        if (!firstPokemon.player_pokemon_id) {
          setError("Unable to determine Pokemon ID. Please try again.");
          setIsCreating(false);
          return;
        }

        // Set the first pokemon as active
        await api.updateActivePokemon(firstPokemon.player_pokemon_id);

        // Reload player data to get the updated active_pokemon
        const updatedPlayer = await api.getMe();
        setPlayer({
          ...updatedPlayer,
          currentPokemon: player?.currentPokemon, // Keep current pokemon display
        });
      }

      let opponentId: string | undefined;
      if (opponentType === "username" && opponentUsername) {
        // For now, we'll just pass null and let the backend select a random opponent
        // In the future, we could add a player search endpoint
        opponentId = undefined;
      }

      // Create battle - backend will use active_pokemon automatically
      const battle = await api.createBattle(opponentId);
      router.push(`/battle/${battle.id}`);
    } catch (err: any) {
      showErrorToast(err);
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen battle-bg flex items-center justify-center">
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

  const typeColor = player?.currentPokemon
    ? getTypeColor(player.currentPokemon.primaryType)
    : "#A8A878";

  return (
    <main className="min-h-screen battle-bg">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/10 backdrop-blur-md border-b border-white/10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </Link>
          <span className="text-white font-semibold">Battle Setup</span>
          <div className="w-16" /> {/* Spacer for centering */}
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-500/20 border border-red-500/50 text-white animate-shake">
            {error}
          </div>
        )}

        {/* Step 1: Opponent Selection */}
        <Card className="mb-6 bg-white/95 animate-slide-in-up">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-[var(--color-pokeball-red)] text-white flex items-center justify-center text-sm font-bold">1</span>
              Opponent
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Random Opponent Option */}
            <label
              className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                opponentType === "random"
                  ? "border-[var(--color-pokeball-red)] bg-red-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <input
                type="radio"
                name="opponent"
                value="random"
                checked={opponentType === "random"}
                onChange={() => setOpponentType("random")}
                className="sr-only"
              />
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                opponentType === "random"
                  ? "border-[var(--color-pokeball-red)]"
                  : "border-gray-300"
              }`}>
                {opponentType === "random" && (
                  <div className="w-3 h-3 rounded-full bg-[var(--color-pokeball-red)]" />
                )}
              </div>
              <div className="flex-1">
                <p className="font-semibold">Random Opponent (Quick Match)</p>
                <p className="text-sm text-muted-foreground">Battle against a random AI trainer</p>
              </div>
              <span className="text-2xl">🎲</span>
            </label>

            {/* Challenge by Username Option */}
            <label
              className={`flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                opponentType === "username"
                  ? "border-[var(--color-pokeball-red)] bg-red-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <input
                type="radio"
                name="opponent"
                value="username"
                checked={opponentType === "username"}
                onChange={() => setOpponentType("username")}
                className="sr-only"
              />
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-1 ${
                opponentType === "username"
                  ? "border-[var(--color-pokeball-red)]"
                  : "border-gray-300"
              }`}>
                {opponentType === "username" && (
                  <div className="w-3 h-3 rounded-full bg-[var(--color-pokeball-red)]" />
                )}
              </div>
              <div className="flex-1">
                <p className="font-semibold">Challenge by Username</p>
                <p className="text-sm text-muted-foreground mb-3">Challenge a specific trainer</p>
                {opponentType === "username" && (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter trainer name (e.g., Blue, Misty)"
                        value={opponentUsername}
                        onChange={(e) => setOpponentUsername(e.target.value)}
                        className="bg-white flex-1"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && opponentUsername) {
                            handleCreateBattle();
                          }
                        }}
                      />
                      <Button
                        onClick={handleCreateBattle}
                        disabled={!opponentUsername || isCreating}
                        className="bg-[var(--color-pokeball-red)] hover:bg-[var(--color-pokeball-dark-red)] text-white transition-all hover:scale-105"
                      >
                        {isCreating ? (
                          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                        ) : (
                          <>
                            <span className="mr-1">🎯</span>
                            Challenge
                          </>
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Available: Red, Blue, Lance, Cynthia, Brock, Misty, etc.
                    </p>
                  </div>
                )}
              </div>
              <span className="text-2xl">🎯</span>
            </label>
          </CardContent>
        </Card>

        {/* Step 2: Your Pokemon */}
        <Card className="mb-6 bg-white/95 animate-slide-in-up delay-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-[var(--color-pokeball-red)] text-white flex items-center justify-center text-sm font-bold">2</span>
              Your Pokémon
            </CardTitle>
          </CardHeader>
          <CardContent>
            {player?.currentPokemon && (
              <div
                className="flex items-center gap-4 p-4 rounded-lg border-2"
                style={{
                  borderColor: typeColor,
                  backgroundColor: `${typeColor}10`,
                }}
              >
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center`} style={{ borderColor: typeColor }}>
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: typeColor }} />
                </div>
                <img
                  src={player.currentPokemon.spriteUrl}
                  alt={player.currentPokemon.name}
                  className="w-16 h-16 object-contain"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-bold">{player.currentPokemon.name}</p>
                    <span className="text-xs px-2 py-0.5 rounded-full text-white font-semibold" style={{ backgroundColor: typeColor }}>
                      {player.currentPokemon.primaryType.toUpperCase()}
                    </span>
                    <span className="text-xs text-muted-foreground">(Recommended)</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    HP: {player.currentPokemon.baseHp} | ATK: {player.currentPokemon.baseAttack} | DEF: {player.currentPokemon.baseDefense} | SPD: {player.currentPokemon.baseSpeed}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Battle Rules */}
        <Card className="mb-6 bg-white/90 animate-slide-in-up delay-150">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <svg className="w-5 h-5 text-[var(--color-pokemon-blue)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Battle Rules
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-pokemon-blue)]" />
                One Pokémon per Trainer
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-pokemon-blue)]" />
                Turn-based simulation
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-pokemon-blue)]" />
                Speed determines who attacks first
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-pokemon-blue)]" />
                Type effectiveness applies to damage
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Create Battle Button */}
        <div className="animate-slide-in-up delay-200">
          <Button
            onClick={handleCreateBattle}
            disabled={isCreating || (opponentType === "username" && !opponentUsername)}
            className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-[var(--color-pokeball-red)] to-[var(--color-pokeball-dark-red)] hover:from-[var(--color-pokeball-dark-red)] hover:to-[var(--color-pokeball-red)] text-white shadow-lg shadow-red-500/25 transition-all duration-300 hover:shadow-red-500/40 hover:scale-[1.01]"
          >
            {isCreating ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Finding Opponent...
              </span>
            ) : (
              <>
                <span className="mr-2">⚔️</span>
                Create Battle
              </>
            )}
          </Button>
        </div>
      </div>
    </main>
  );
}
