"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { tokenStorage, api, Player, BattleHistoryItem } from "@/lib/api";
import {
  getTypeColor,
  calculateWinRate,
  Pokemon,
  PokemonType,
} from "@/lib/mocks";
import { BottomNavigation } from "@/components/navigation/bottom-nav";

interface ProfilePlayer extends Player {
  currentPokemon?: Pokemon;
}

export default function ProfilePage() {
  const router = useRouter();
  const [player, setPlayer] = useState<ProfilePlayer | null>(null);
  const [battles, setBattles] = useState<BattleHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      const token = tokenStorage.getAccessToken();
      if (!token) {
        router.replace("/");
        return;
      }

      try {
        const [playerData, myPokemon, battleHistory] = await Promise.all([
          api.getMe(),
          api.listMyPokemon().catch(() => []),
          api.getBattleHistory(),
        ]);

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

        const profilePlayer: ProfilePlayer = {
          ...playerData,
          currentPokemon,
        };

        setPlayer(profilePlayer);
        setBattles(battleHistory);
      } catch (err) {
        setError("Failed to load profile");
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, [router]);

  if (isLoading) {
    return <ProfileSkeleton />;
  }

  if (error || !player) {
    return (
      <div className="min-h-screen landing-bg flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-red-500 mb-4">{error || "Something went wrong"}</p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const winRate = calculateWinRate(player.wins, player.losses);
  const totalBattles = player.wins + player.losses;
  const typeColor = player.currentPokemon
    ? getTypeColor(player.currentPokemon.primaryType)
    : "#A8A878";

  // Calculate badges based on performance
  const badges = [];
  if (player.wins >= 10) badges.push({ icon: "🏅", name: "Novice Trainer", description: "Won 10 battles" });
  if (player.wins >= 50) badges.push({ icon: "🎖️", name: "Skilled Battler", description: "Won 50 battles" });
  if (player.wins >= 100) badges.push({ icon: "🏆", name: "Champion", description: "Won 100 battles" });
  if (winRate >= 70 && totalBattles >= 10) badges.push({ icon: "⭐", name: "Elite Trainer", description: "70%+ win rate" });
  if (totalBattles >= 100) badges.push({ icon: "🎮", name: "Veteran", description: "100+ battles" });

  return (
    <main className="min-h-screen landing-bg pb-24 lg:pb-8">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </Link>
          <span className="font-semibold">Profile</span>
          <Link
            href="/settings"
            className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </Link>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Profile Card */}
        <Card className="overflow-hidden animate-slide-in-up">
          <div
            className="h-24 relative"
            style={{
              background: `linear-gradient(135deg, ${typeColor}40 0%, ${typeColor}20 100%)`
            }}
          >
            <div className="absolute -bottom-10 left-6">
              <div
                className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center text-white font-bold text-2xl shadow-lg"
                style={{ backgroundColor: typeColor }}
              >
                {player.username.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
          <CardContent className="pt-14 pb-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold">{player.username}</h1>
                <p className="text-sm text-muted-foreground">
                  Joined {new Date(player.created_at).toLocaleDateString()}
                </p>
              </div>
              {player.currentPokemon && (
                <div className="flex items-center gap-2">
                  <img
                    src={player.currentPokemon.spriteUrl}
                    alt={player.currentPokemon.name}
                    className="w-10 h-10 object-contain"
                  />
                  <span
                    className="px-2 py-0.5 rounded-full text-xs font-semibold text-white uppercase"
                    style={{ backgroundColor: typeColor }}
                  >
                    {player.currentPokemon.primaryType}
                  </span>
                </div>
              )}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{player.wins}</p>
                <p className="text-xs text-muted-foreground">Wins</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-500">{player.losses}</p>
                <p className="text-xs text-muted-foreground">Losses</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{totalBattles}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-[var(--color-pokemon-blue)]">{winRate}%</p>
                <p className="text-xs text-muted-foreground">Win Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Current Pokemon */}
        {player.currentPokemon && (
          <Card className="animate-slide-in-up delay-100">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <span>🎮</span>
                Current Partner
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className="flex items-center gap-4 p-4 rounded-lg border-l-4"
                style={{
                  borderColor: typeColor,
                  backgroundColor: `${typeColor}10`,
                }}
              >
                <img
                  src={player.currentPokemon.spriteUrl}
                  alt={player.currentPokemon.name}
                  className="w-20 h-20 object-contain"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-bold text-lg">{player.currentPokemon.name}</h3>
                    <span
                      className="px-2 py-0.5 rounded-full text-xs font-semibold text-white uppercase"
                      style={{ backgroundColor: typeColor }}
                    >
                      {player.currentPokemon.primaryType}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-sm">
                    <div className="text-center p-2 bg-white/50 rounded">
                      <p className="font-bold">{player.currentPokemon.baseHp}</p>
                      <p className="text-xs text-muted-foreground">HP</p>
                    </div>
                    <div className="text-center p-2 bg-white/50 rounded">
                      <p className="font-bold">{player.currentPokemon.baseAttack}</p>
                      <p className="text-xs text-muted-foreground">ATK</p>
                    </div>
                    <div className="text-center p-2 bg-white/50 rounded">
                      <p className="font-bold">{player.currentPokemon.baseDefense}</p>
                      <p className="text-xs text-muted-foreground">DEF</p>
                    </div>
                    <div className="text-center p-2 bg-white/50 rounded">
                      <p className="font-bold">{player.currentPokemon.baseSpeed}</p>
                      <p className="text-xs text-muted-foreground">SPD</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Badges */}
        <Card className="animate-slide-in-up delay-150">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <span>🎖️</span>
              Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            {badges.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-4xl mb-2">🏅</p>
                <p>No badges yet. Keep battling to earn achievements!</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {badges.map((badge, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200"
                  >
                    <span className="text-2xl">{badge.icon}</span>
                    <div>
                      <p className="font-semibold text-sm">{badge.name}</p>
                      <p className="text-xs text-muted-foreground">{badge.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Links */}
        <Card className="animate-slide-in-up delay-200">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 gap-3">
              <Link href="/rules">
                <Button
                  variant="outline"
                  className="w-full h-auto py-4 flex flex-col gap-1 hover:bg-blue-50 hover:border-blue-300 transition-all"
                >
                  <span className="text-2xl">📖</span>
                  <span className="text-sm">Game Rules</span>
                </Button>
              </Link>
              <Link href="/history">
                <Button
                  variant="outline"
                  className="w-full h-auto py-4 flex flex-col gap-1 hover:bg-purple-50 hover:border-purple-300 transition-all"
                >
                  <span className="text-2xl">📜</span>
                  <span className="text-sm">Battle History</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </main>
  );
}

// ===========================================
// Component: Profile Skeleton
// ===========================================

function ProfileSkeleton() {
  return (
    <main className="min-h-screen landing-bg pb-24 lg:pb-8">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-6" />
        </div>
      </header>
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <Skeleton className="h-48 w-full rounded-lg" />
        <Skeleton className="h-32 w-full rounded-lg" />
        <Skeleton className="h-40 w-full rounded-lg" />
      </div>
    </main>
  );
}
