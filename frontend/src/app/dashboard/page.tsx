"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { tokenStorage, PokeAPIPokemon, api, Player, BattleHistoryItem, ApiError } from "@/lib/api";
import { showErrorToast } from "@/lib/toast";
import {
  mockLogout,
  mockChangePokemon,
  mockAddPokemon,
  mockSetActivePokemon,
  mockRemovePokemon,
  Pokemon,
  PokemonType,
  getTypeColor,
  calculateWinRate,
} from "@/lib/mocks";
import { BottomNavigation } from "@/components/navigation/bottom-nav";
import { ChangePokemonModal } from "@/components/pokemon/change-pokemon-modal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export interface DashboardPlayer extends Player {
  currentPokemon?: Pokemon;
  team: Pokemon[];
  starterPokemonId?: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [player, setPlayer] = useState<DashboardPlayer | null>(null);
  const [recentBattles, setRecentBattles] = useState<BattleHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isChangePokemonOpen, setIsChangePokemonOpen] = useState(false);
  const [isAddPokemonOpen, setIsAddPokemonOpen] = useState(false);
  const [isChangingPokemon, setIsChangingPokemon] = useState(false);
  const [isAddingPokemon, setIsAddingPokemon] = useState(false);
  const [switchingPokemonId, setSwitchingPokemonId] = useState<string | null>(null);
  const [pokemonToRemove, setPokemonToRemove] = useState<Pokemon | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  useEffect(() => {
    const loadDashboard = async () => {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/3c9f2c06-5e2a-484f-bcf7-8ad84bc3f91b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dashboard/page.tsx:loadDashboard:entry',message:'Dashboard load started',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      const token = tokenStorage.getAccessToken();
      if (!token) {
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/3c9f2c06-5e2a-484f-bcf7-8ad84bc3f91b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dashboard/page.tsx:loadDashboard:no-token',message:'No token found',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        router.replace("/");
        return;
      }

      try {
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/3c9f2c06-5e2a-484f-bcf7-8ad84bc3f91b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dashboard/page.tsx:loadDashboard:before-api-calls',message:'Starting API calls',data:{hasToken:!!token},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
        const [playerData, myPokemon, battles] = await Promise.all([
          api.getMe(),
          api.listMyPokemon().catch(() => []), // If no pokemon yet, return empty array
          api.getBattleHistory(),
        ]);
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/3c9f2c06-5e2a-484f-bcf7-8ad84bc3f91b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dashboard/page.tsx:loadDashboard:after-api-calls',message:'API calls completed',data:{hasPlayerData:!!playerData,playerDataKeys:playerData?Object.keys(playerData):null,myPokemonCount:myPokemon?.length||0,battlesCount:battles?.length||0},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
        // #endregion

        if (!playerData) {
          // #region agent log
          fetch('http://127.0.0.1:7243/ingest/3c9f2c06-5e2a-484f-bcf7-8ad84bc3f91b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dashboard/page.tsx:loadDashboard:no-player-data',message:'No player data returned',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
          // #endregion
          router.replace("/");
          return;
        }

        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/3c9f2c06-5e2a-484f-bcf7-8ad84bc3f91b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dashboard/page.tsx:loadDashboard:processing-data',message:'Processing player data',data:{hasActivePokemon:!!playerData.active_pokemon,activePokemonKeys:playerData.active_pokemon?Object.keys(playerData.active_pokemon):null,hasPrimaryType:!!playerData.active_pokemon?.primary_type},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
        // #endregion
        const hasStarter = localStorage.getItem("pokemon_arena_has_starter") === "true";
        if (!hasStarter && myPokemon.length === 0) {
          router.replace("/starter");
          return;
        }

        // Convert DatabasePokemon to Pokemon format for compatibility
        const team: Pokemon[] = myPokemon.map((p) => ({
          id: p.id,
          pokedexNumber: p.pokedex_number,
          name: p.name,
          spriteUrl: p.sprite_url,
          primaryType: p.primary_type_name as PokemonType,
          secondaryType: p.secondary_type_name ? (p.secondary_type_name as PokemonType) : undefined,
          baseHp: 0, // Not available in list view
          baseAttack: 0,
          baseDefense: 0,
          baseSpeed: 0,
        }));

        // Use active_pokemon from backend if available, otherwise use first pokemon
        let currentPokemon: Pokemon | undefined;
        if (playerData.active_pokemon && playerData.active_pokemon.primary_type) {
          // Convert DatabasePokemonDetail to Pokemon format
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
        } else if (team.length > 0) {
          // Fallback to first pokemon if no active_pokemon is set
          try {
            const detail = await api.getDatabasePokemonDetail(team[0].id);
            if (detail && detail.primary_type) {
              currentPokemon = {
                id: detail.id,
                pokedexNumber: detail.pokedex_number,
                name: detail.name,
                spriteUrl: detail.sprite_url,
                primaryType: detail.primary_type.name as PokemonType,
                secondaryType: detail.secondary_type?.name ? (detail.secondary_type.name as PokemonType) : undefined,
                baseHp: detail.base_hp,
                baseAttack: detail.base_attack,
                baseDefense: detail.base_defense,
                baseSpeed: detail.base_speed,
              };
            }
          } catch (err) {
            console.error("Failed to fetch pokemon detail:", err);
          }
        }

        const dashboardPlayer: DashboardPlayer = {
          ...playerData,
          team,
          currentPokemon,
        };

        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/3c9f2c06-5e2a-484f-bcf7-8ad84bc3f91b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dashboard/page.tsx:loadDashboard:before-set-state',message:'About to set state',data:{hasDashboardPlayer:!!dashboardPlayer,hasCurrentPokemon:!!currentPokemon,currentPokemonName:currentPokemon?.name,currentPokemonId:currentPokemon?.id,currentPokemonKeys:currentPokemon?Object.keys(currentPokemon):null,teamLength:team.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        setPlayer(dashboardPlayer);
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/3c9f2c06-5e2a-484f-bcf7-8ad84bc3f91b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dashboard/page.tsx:loadDashboard:after-set-state',message:'State set',data:{dashboardPlayerCurrentPokemon:dashboardPlayer.currentPokemon?.name},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        setRecentBattles(battles.slice(0, 3));
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/3c9f2c06-5e2a-484f-bcf7-8ad84bc3f91b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dashboard/page.tsx:loadDashboard:success',message:'Dashboard loaded successfully',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
      } catch (err) {
        // #region agent log
        const errObj = err as any;
        fetch('http://127.0.0.1:7243/ingest/3c9f2c06-5e2a-484f-bcf7-8ad84bc3f91b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dashboard/page.tsx:loadDashboard:error',message:'Error caught in dashboard load',data:{error:String(err),errorType:errObj?.constructor?.name,errorMessage:errObj?.message,errorDetail:errObj?.detail,errorStack:errObj?.stack?.substring(0,200)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        setError("Failed to load dashboard");
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboard();
  }, [router]);

  const handleLogout = async () => {
    await mockLogout();
    tokenStorage.clearTokens();
    router.replace("/");
  };

  const handleStartBattle = () => {
    router.push("/battle/new");
  };

  const handleChangePokemon = async (pokemon: PokeAPIPokemon) => {
    setIsChangingPokemon(true);
    try {
      // Convert PokeAPIPokemon to PokeAPIPokemonInput format
      const pokemonInput = {
        pokedex_number: pokemon.pokedex_number,
        name: pokemon.name,
        sprite_url: pokemon.sprite_url,
        types: pokemon.secondary_type_name
          ? [pokemon.primary_type_name, pokemon.secondary_type_name]
          : [pokemon.primary_type_name],
        stats: {
          hp: pokemon.base_hp,
          attack: pokemon.base_attack,
          defense: pokemon.base_defense,
          speed: pokemon.base_speed,
        },
      };
      const updatedPlayer = await mockChangePokemon(pokemonInput);
      // Convert CurrentPlayer to DashboardPlayer format
      const dashboardPlayer: DashboardPlayer = {
        ...updatedPlayer,
        win_rate: calculateWinRate(updatedPlayer.wins, updatedPlayer.losses),
        created_at: updatedPlayer.createdAt,
        starterPokemonId: updatedPlayer.starterPokemonId,
        active_pokemon: player?.active_pokemon ?? null,
        team: player?.team ?? [],
      };
      setPlayer(dashboardPlayer);
      setIsChangePokemonOpen(false);
    } catch (err) {
      setError("Failed to change Pokémon. Please try again.");
    } finally {
      setIsChangingPokemon(false);
    }
  };

  const handleAddPokemon = async (pokemon: PokeAPIPokemon) => {
    setIsAddingPokemon(true);
    try {
      // Search for the pokemon first - this ensures it exists in the database
      // The search endpoint creates the pokemon if it doesn't exist
      await api.searchPokemon(pokemon.pokedex_number.toString());

      // Now find the pokemon in the database by pokedex number
      // We'll search through pages to find it
      let pokemonId: string | null = null;
      let page = 1;
      const maxPages = 20; // Limit search to prevent infinite loops

      while (page <= maxPages && !pokemonId) {
        const response = await api.listDatabasePokemon(page);
        const foundPokemon = response.results.find(
          (p) => p.pokedex_number === pokemon.pokedex_number
        );

        if (foundPokemon) {
          pokemonId = foundPokemon.id;
          break;
        }

        if (!response.next) {
          break; // No more pages
        }
        page++;
      }

      if (!pokemonId) {
        throw new Error("Pokemon not found in database. Please try again.");
      }

      // Add pokemon to collection using backend API
      await api.addPokemonToCollection(pokemonId);

      // Reload player's pokemon list
      const myPokemon = await api.listMyPokemon();
      const team: Pokemon[] = myPokemon.map((p) => ({
        id: p.id,
        pokedexNumber: p.pokedex_number,
        name: p.name,
        spriteUrl: p.sprite_url,
        primaryType: p.primary_type_name as PokemonType,
        secondaryType: p.secondary_type_name ? (p.secondary_type_name as PokemonType) : undefined,
        baseHp: 0,
        baseAttack: 0,
        baseDefense: 0,
        baseSpeed: 0,
      }));

      // Update player state
      setPlayer((prev) => ({
        ...prev!,
        team,
      }));

      setIsAddPokemonOpen(false);
    } catch (err) {
      const apiError = err as ApiError;

      // Determine error type: FormError has field_name, ToastError has message but no field_name
      if (apiError.field_name) {
        // FormError: show inline error only
        const errorMessage = apiError.message || "Failed to add Pokémon. Please try again.";
        setError(errorMessage);
      } else {
        // ToastError: show toast only
        showErrorToast(err);
      }
    } finally {
      setIsAddingPokemon(false);
    }
  };

  const handleQuickSwitch = async (pokemonId: string) => {
    setSwitchingPokemonId(pokemonId);
    try {
      // Find the PlayerPokemon ID for this Pokemon
      const myPokemon = await api.listMyPokemon();
      const pokemon = myPokemon.find((p) => p.id === pokemonId);

      if (!pokemon || !pokemon.player_pokemon_id) {
        throw new Error("Pokemon not found in your collection.");
      }

      // Update active_pokemon on backend
      const updatedPlayer = await api.updateActivePokemon(pokemon.player_pokemon_id);

      // Convert active_pokemon from backend to Pokemon format
      let currentPokemon: Pokemon | undefined;
      if (updatedPlayer.active_pokemon && updatedPlayer.active_pokemon.primary_type) {
        currentPokemon = {
          id: updatedPlayer.active_pokemon.id,
          pokedexNumber: updatedPlayer.active_pokemon.pokedex_number,
          name: updatedPlayer.active_pokemon.name,
          spriteUrl: updatedPlayer.active_pokemon.sprite_url,
          primaryType: updatedPlayer.active_pokemon.primary_type.name as PokemonType,
          secondaryType: updatedPlayer.active_pokemon.secondary_type?.name ? (updatedPlayer.active_pokemon.secondary_type.name as PokemonType) : undefined,
          baseHp: updatedPlayer.active_pokemon.base_hp,
          baseAttack: updatedPlayer.active_pokemon.base_attack,
          baseDefense: updatedPlayer.active_pokemon.base_defense,
          baseSpeed: updatedPlayer.active_pokemon.base_speed,
        };
      }

      setPlayer((prev) => ({
        ...prev!,
        ...updatedPlayer,
        currentPokemon,
      }));
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to switch Pokémon.";
      setError(errorMessage);
    } finally {
      setSwitchingPokemonId(null);
    }
  };

  const handleRemovePokemon = async () => {
    if (!pokemonToRemove) return;

    setIsRemoving(true);
    try {
      // Backend doesn't support removing pokemon yet, so we'll just show an error
      // In the future, this would be: await api.removePokemonFromCollection(pokemonToRemove.id);
      throw new Error("Removing Pokémon is not yet supported by the backend. This feature will be available soon.");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to remove Pokémon.";
      setError(errorMessage);
    } finally {
      setIsRemoving(false);
      setPokemonToRemove(null);
    }
  };

  if (isLoading) {
    return <DashboardSkeleton />;
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
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/3c9f2c06-5e2a-484f-bcf7-8ad84bc3f91b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dashboard/page.tsx:render:before-return',message:'Rendering dashboard',data:{hasPlayer:!!player,hasCurrentPokemon:!!player?.currentPokemon,currentPokemonKeys:player?.currentPokemon?Object.keys(player.currentPokemon):null,currentPokemonName:player?.currentPokemon?.name,teamLength:player?.team?.length||0},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'B'})}).catch(()=>{});
  // #endregion
  const typeColor = player.currentPokemon
    ? getTypeColor(player.currentPokemon.primaryType)
    : "#A8A878";

  return (
    <main className="min-h-screen landing-bg pb-24 lg:pb-8">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg viewBox="0 0 40 40" className="w-8 h-8">
              <circle cx="20" cy="20" r="18" fill="#EE1515" />
              <path d="M 20 38 A 18 18 0 0 1 2 20 L 38 20 A 18 18 0 0 1 20 38" fill="white" />
              <rect x="2" y="18" width="36" height="4" fill="#2D2D2D" />
              <circle cx="20" cy="20" r="6" fill="#2D2D2D" />
              <circle cx="20" cy="20" r="4" fill="white" />
            </svg>
            <span className="font-bold text-lg">Dashboard</span>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm"
                  style={{ backgroundColor: typeColor }}
                >
                  {player.username ? player.username.charAt(0).toUpperCase() : "T"}
                </div>
                <svg className="w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <Link href="/profile">
                <DropdownMenuItem className="cursor-pointer hover:bg-gray-100 transition-colors">
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Profile
                </DropdownMenuItem>
              </Link>
              <Link href="/rules">
                <DropdownMenuItem className="cursor-pointer hover:bg-gray-100 transition-colors">
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  Game Rules
                </DropdownMenuItem>
              </Link>
              <Link href="/settings">
                <DropdownMenuItem className="cursor-pointer hover:bg-gray-100 transition-colors">
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Settings
                </DropdownMenuItem>
              </Link>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 hover:bg-red-50 transition-colors">
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Welcome Card */}
        <Card className="mb-6 overflow-hidden animate-slide-in-up">
          <div
            className="h-2"
            style={{ backgroundColor: typeColor }}
          />
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-[var(--color-pokeball-black)] mb-1">
                  Welcome back, {player.username || "Trainer"}!
                </h1>
                <p className="text-muted-foreground">
                  Ready for your next battle?
                </p>
              </div>
              <div className="flex items-center gap-6 text-sm">
                <Link
                  href="/scoreboard"
                  className="flex items-center gap-2 p-2 -m-2 rounded-lg hover:bg-yellow-50 transition-colors group"
                  title="View Scoreboard"
                >
                  <span className="text-2xl group-hover:scale-110 transition-transform">🏆</span>
                  <div>
                    <p className="font-semibold text-lg group-hover:text-yellow-600 transition-colors">#{42}</p>
                    <p className="text-muted-foreground text-xs">Rank</p>
                  </div>
                  <svg className="w-4 h-4 text-yellow-500 group-hover:text-yellow-600 transition-colors ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">⚔️</span>
                  <div>
                    <p className="font-semibold text-lg text-green-600">{player.wins}</p>
                    <p className="text-muted-foreground text-xs">Wins</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">💀</span>
                  <div>
                    <p className="font-semibold text-lg text-red-500">{player.losses}</p>
                    <p className="text-muted-foreground text-xs">Losses</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">📊</span>
                  <div>
                    <p className="font-semibold text-lg">{winRate}%</p>
                    <p className="text-muted-foreground text-xs">Win Rate</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Your Pokemon */}
        <Card className="mb-6 animate-slide-in-up delay-100">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Your Pokémon</CardTitle>
            <button
              onClick={() => setIsAddPokemonOpen(true)}
              disabled={isAddingPokemon}
              className="text-sm text-green-600 hover:underline flex items-center gap-1 disabled:opacity-50"
            >
              {isAddingPokemon ? (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              )}
              {isAddingPokemon ? "Adding..." : "Add Pokémon"}
            </button>
          </CardHeader>
          <CardContent>
            {/* Active Pokemon */}
            {/* #region agent log */}
            {(()=>{fetch('http://127.0.0.1:7243/ingest/3c9f2c06-5e2a-484f-bcf7-8ad84bc3f91b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dashboard/page.tsx:render:pokemon-card-check',message:'Checking currentPokemon for render',data:{hasCurrentPokemon:!!player.currentPokemon,currentPokemonValue:player.currentPokemon,currentPokemonType:typeof player.currentPokemon},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'B'})}).catch(()=>{});return null;})()}
            {/* #endregion */}
            {player.currentPokemon && (
              <div
                className="flex items-center gap-4 p-4 rounded-lg border-l-4 mb-4"
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
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold text-white uppercase bg-green-500">
                      Active
                    </span>
                    <h3 className="font-bold text-lg">{player.currentPokemon.name}</h3>
                    <span
                      className="px-2 py-0.5 rounded-full text-xs font-semibold text-white uppercase"
                      style={{ backgroundColor: typeColor }}
                    >
                      {player.currentPokemon.primaryType}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>HP: {player.currentPokemon.baseHp}</span>
                    <span>ATK: {player.currentPokemon.baseAttack}</span>
                    <span>DEF: {player.currentPokemon.baseDefense}</span>
                    <span>SPD: {player.currentPokemon.baseSpeed}</span>
                  </div>
                  <div className="mt-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">HP</span>
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden max-w-[200px]">
                        <div
                          className="h-full rounded-full bg-[var(--color-hp-green)]"
                          style={{ width: "100%" }}
                        />
                      </div>
                      <span className="text-xs font-mono">{player.currentPokemon.baseHp}/{player.currentPokemon.baseHp}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Team Pokemon (excluding active) */}
            {player.team && player.team.length > 1 && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Team ({player.team.length} Pokémon) — Click to switch</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {player.team
                    .filter((p) => p.id !== player.currentPokemon?.id)
                    .map((pokemon) => {
                      const pokemonTypeColor = getTypeColor(pokemon.primaryType);
                      const isSwitching = switchingPokemonId === pokemon.id;
                      return (
                        <div
                          key={pokemon.id}
                          className={`relative p-3 rounded-lg border transition-all group ${
                            isSwitching
                              ? "border-[var(--color-pokemon-blue)] bg-blue-50 opacity-70"
                              : "border-gray-200 hover:border-[var(--color-pokemon-blue)] hover:bg-blue-50/50 hover:shadow-sm"
                          } ${switchingPokemonId && !isSwitching ? "opacity-50" : ""}`}
                        >
                          {/* Remove button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setPokemonToRemove(pokemon);
                            }}
                            disabled={isRemoving || !!switchingPokemonId}
                            className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center z-10 disabled:opacity-50 shadow-sm"
                            title="Remove Pokémon"
                          >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>

                          {/* Pokemon card (clickable for switch) */}
                          <button
                            onClick={() => handleQuickSwitch(pokemon.id)}
                            disabled={isSwitching || !!switchingPokemonId}
                            className={`w-full text-left ${switchingPokemonId && !isSwitching ? "cursor-not-allowed" : "cursor-pointer"}`}
                          >
                            <div className="flex items-start gap-3">
                              <img
                                src={pokemon.spriteUrl}
                                alt={pokemon.name}
                                className={`w-14 h-14 object-contain flex-shrink-0 ${isSwitching ? "animate-pulse" : ""}`}
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="font-semibold text-sm truncate">{pokemon.name}</p>
                                  <span
                                    className="px-1.5 py-0.5 rounded text-[10px] font-semibold text-white uppercase flex-shrink-0"
                                    style={{ backgroundColor: pokemonTypeColor }}
                                  >
                                    {pokemon.primaryType}
                                  </span>
                                  {isSwitching && (
                                    <svg className="w-4 h-4 animate-spin text-[var(--color-pokemon-blue)] flex-shrink-0" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                  )}
                                </div>
                                {/* Stats */}
                                <div className="grid grid-cols-4 gap-1 text-[10px]">
                                  <div className="text-center">
                                    <span className="text-red-500 font-bold">HP</span>
                                    <p className="font-semibold text-gray-700">{pokemon.baseHp}</p>
                                  </div>
                                  <div className="text-center">
                                    <span className="text-orange-500 font-bold">ATK</span>
                                    <p className="font-semibold text-gray-700">{pokemon.baseAttack}</p>
                                  </div>
                                  <div className="text-center">
                                    <span className="text-blue-500 font-bold">DEF</span>
                                    <p className="font-semibold text-gray-700">{pokemon.baseDefense}</p>
                                  </div>
                                  <div className="text-center">
                                    <span className="text-green-500 font-bold">SPD</span>
                                    <p className="font-semibold text-gray-700">{pokemon.baseSpeed}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </button>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Empty state */}
            {(!player.team || player.team.length === 0) && !player.currentPokemon && (
              <div className="text-center py-4 text-muted-foreground">
                <p>You don't have any Pokémon yet.</p>
                <button
                  onClick={() => setIsAddPokemonOpen(true)}
                  className="text-[var(--color-pokemon-blue)] hover:underline mt-2"
                >
                  Add your first Pokémon
                </button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Start Battle CTA */}
        <div className="mb-6 animate-slide-in-up delay-150">
          <Button
            onClick={handleStartBattle}
            className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-[var(--color-pokeball-red)] to-[var(--color-pokeball-dark-red)] hover:from-[var(--color-pokeball-dark-red)] hover:to-[var(--color-pokeball-red)] text-white shadow-lg shadow-red-500/25 transition-all duration-300 hover:shadow-red-500/40 hover:scale-[1.02] active:scale-[0.98] btn-primary-glow group"
          >
            <span className="mr-2 inline-block transition-transform group-hover:scale-125 group-hover:rotate-12">⚔️</span>
            Start a Battle
          </Button>
        </div>

        {/* Recent Battles */}
        <Card className="animate-slide-in-up delay-200">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent Battles</CardTitle>
            <Link
              href="/history"
              className="text-sm text-[var(--color-pokemon-blue)] hover:underline"
            >
              View All →
            </Link>
          </CardHeader>
          <CardContent>
            {recentBattles.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  Your journey has just begun. Start your first battle!
                </p>
                <Button
                  variant="outline"
                  onClick={handleStartBattle}
                >
                  Start Your First Battle
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {recentBattles.map((battle) => {
                  const result = battle.winner_id === null
                    ? "pending"
                    : battle.winner_id === player?.id
                    ? "win"
                    : "loss";
                  return (
                    <Link
                      key={battle.id}
                      href={`/battle/${battle.id}/result`}
                      className="block"
                    >
                      <div
                        className={`flex items-center gap-4 p-4 rounded-lg border transition-all hover:shadow-md cursor-pointer ${
                          result === "win"
                            ? "border-l-4 border-l-green-500 bg-green-50/50"
                            : result === "loss"
                            ? "border-l-4 border-l-red-500 bg-red-50/50"
                            : "border-l-4 border-l-yellow-500 bg-yellow-50/50"
                        }`}
                      >
                        {/* Result badge */}
                        <div className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center text-white font-bold flex-shrink-0 ${
                          result === "win" ? "bg-green-500" : result === "loss" ? "bg-red-500" : "bg-yellow-500"
                        }`}>
                          <span className="text-xl">{result === "win" ? "✓" : result === "loss" ? "✗" : "⏳"}</span>
                          <span className="text-xs font-bold">{result === "win" ? "WIN" : result === "loss" ? "LOSS" : "..."}</span>
                        </div>

                        {/* Battle info - centered */}
                        <div className="flex-1 flex items-center justify-center gap-3 sm:gap-6">
                          <div className="flex flex-col items-center text-center">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold text-white bg-blue-500 mb-1">YOU</span>
                            <div className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center">
                              <span className="text-2xl">⚔️</span>
                            </div>
                          </div>

                          {/* VS divider */}
                          <div className="flex flex-col items-center">
                            <span className="text-xl font-bold text-muted-foreground">⚔️</span>
                            <span className="text-xs text-muted-foreground font-medium">VS</span>
                          </div>

                          <div className="flex flex-col items-center text-center">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold text-white bg-gray-500 mb-1">OPP</span>
                            <div className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center">
                              <span className="text-2xl">⚔️</span>
                            </div>
                          </div>
                        </div>

                        {/* Right side info */}
                        <div className="flex flex-col items-end text-right flex-shrink-0">
                          <span className="text-sm font-medium text-muted-foreground">vs {battle.opponent.username}</span>
                          <span className="text-xs text-muted-foreground">{formatTimeAgo(battle.created_at)}</span>
                          <span className="text-xs text-muted-foreground capitalize mt-1">{battle.status}</span>
                          <svg className="w-5 h-5 text-muted-foreground mt-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />

      {/* Change Pokemon Modal */}
      <ChangePokemonModal
        open={isChangePokemonOpen}
        onOpenChange={setIsChangePokemonOpen}
        onSelect={handleChangePokemon}
        currentPokemonName={player.currentPokemon?.name}
        ownedPokemonNumbers={player.team?.map((p: Pokemon) => p.pokedexNumber) || []}
        mode="change"
      />

      {/* Add Pokemon Modal */}
      <ChangePokemonModal
        open={isAddPokemonOpen}
        onOpenChange={setIsAddPokemonOpen}
        onSelect={handleAddPokemon}
        ownedPokemonNumbers={player.team?.map((p: Pokemon) => p.pokedexNumber) || []}
        mode="add"
      />

      {/* Remove Pokemon Confirmation Dialog */}
      <AlertDialog open={!!pokemonToRemove} onOpenChange={(open) => !open && setPokemonToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {pokemonToRemove?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove <span className="font-semibold">{pokemonToRemove?.name}</span> from your team?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRemoving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemovePokemon}
              disabled={isRemoving}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {isRemoving ? (
                <>
                  <svg className="w-4 h-4 animate-spin mr-2" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Removing...
                </>
              ) : (
                "Remove"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}

// ===========================================
// Component: Dashboard Skeleton
// ===========================================

function DashboardSkeleton() {
  return (
    <main className="min-h-screen landing-bg pb-24 lg:pb-8">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-9 w-9 rounded-full" />
        </div>
      </header>
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <Skeleton className="h-32 w-full rounded-lg" />
        <Skeleton className="h-40 w-full rounded-lg" />
        <Skeleton className="h-14 w-full rounded-lg" />
        <Skeleton className="h-48 w-full rounded-lg" />
      </div>
    </main>
  );
}

// ===========================================
// Helper: Format Time Ago
// ===========================================

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}hr ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString();
}
