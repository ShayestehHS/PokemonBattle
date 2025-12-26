"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { tokenStorage, api, BattleState, BattleTurn, ItemType, PlayerInventory } from "@/lib/api";
import { getTypeColor, BATTLE_ITEMS, DEFAULT_INVENTORY } from "@/lib/mocks";
import { showErrorToast } from "@/lib/toast";

export default function BattleExecutionPage() {
  const router = useRouter();
  const params = useParams();
  const battleId = params.id as string;

  const [battle, setBattle] = useState<BattleState | null>(null);
  const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(null);
  const [player1Hp, setPlayer1Hp] = useState(0);
  const [player2Hp, setPlayer2Hp] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [battleLog, setBattleLog] = useState<BattleTurn[]>([]);
  const [lastAction, setLastAction] = useState<string | null>(null);
  const [shakeTarget, setShakeTarget] = useState<"player1" | "player2" | null>(null);
  const [showItems, setShowItems] = useState(false);
  const [inventory, setInventory] = useState<PlayerInventory>(DEFAULT_INVENTORY);
  const [attackBoost, setAttackBoost] = useState(0);
  const [defenseBoost, setDefenseBoost] = useState(0);
  const [itemMessage, setItemMessage] = useState<string | null>(null);

  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const init = async () => {
      const token = tokenStorage.getAccessToken();
      if (!token) {
        router.replace("/");
        return;
      }

      try {
        const [battleData, playerData] = await Promise.all([
          api.getBattleState(battleId),
          api.getMe(),
        ]);

        if (!battleData || !playerData) {
          showErrorToast({ message: "Battle not found" });
          return;
        }

        // Check if battle is already completed
        if (battleData.status === "completed") {
          router.replace(`/battle/${battleId}/result`);
          return;
        }

        setBattle(battleData);
        setCurrentPlayerId(playerData.id);
        setPlayer1Hp(battleData.player1.pokemon.current_hp);
        setPlayer2Hp(battleData.player2.pokemon.current_hp);
        setBattleLog(battleData.turns);

        // Load inventory and boost status
        const isPlayer1 = battleData.player1.id === playerData.id;
        const inv: PlayerInventory = isPlayer1
          ? {
              potion: battleData.player1_potions,
              "x-attack": battleData.player1_x_attack,
              "x-defense": battleData.player1_x_defense,
            }
          : {
              potion: battleData.player2_potions,
              "x-attack": battleData.player2_x_attack,
              "x-defense": battleData.player2_x_defense,
            };
        setInventory(inv);
        setAttackBoost(isPlayer1 ? battleData.player1_attack_boost : battleData.player2_attack_boost);
        setDefenseBoost(isPlayer1 ? battleData.player1_defense_boost : battleData.player2_defense_boost);
      } catch (err) {
        setError("Failed to load battle");
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, [battleId, router]);

  // Scroll to bottom of log when new entries are added
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [battleLog]);

  const handleAction = async (action: "attack" | "defend") => {
    if (!battle || isSubmitting) return;

    setIsSubmitting(true);
    setLastAction(action);
    setError(null);
    setItemMessage(null);

    try {
      const result = await api.submitTurn(battleId, action);

      if (result.battle) {
        setBattle(result.battle);
        setPlayer1Hp(result.battle.player1.pokemon.current_hp);
        setPlayer2Hp(result.battle.player2.pokemon.current_hp);
        setBattleLog(result.battle.turns);

        const isPlayer1 = result.battle.player1.id === currentPlayerId;
        const inv: PlayerInventory = isPlayer1
          ? {
              potion: result.battle.player1_potions,
              "x-attack": result.battle.player1_x_attack,
              "x-defense": result.battle.player1_x_defense,
            }
          : {
              potion: result.battle.player2_potions,
              "x-attack": result.battle.player2_x_attack,
              "x-defense": result.battle.player2_x_defense,
            };
        setInventory(inv);
        setAttackBoost(isPlayer1 ? result.battle.player1_attack_boost : result.battle.player2_attack_boost);
        setDefenseBoost(isPlayer1 ? result.battle.player1_defense_boost : result.battle.player2_defense_boost);

        // Trigger shake animation on damage
        const lastTurn = result.battle.turns[result.battle.turns.length - 1];
        if (lastTurn && lastTurn.damage > 0) {
          const isPlayer1Turn = lastTurn.player_id === result.battle.player1.id;
          setShakeTarget(isPlayer1Turn ? "player2" : "player1");
          setTimeout(() => setShakeTarget(null), 500);
        }

        // Check if battle is complete
        if (result.battle.status === "completed" || result.winner) {
          setTimeout(() => {
            router.push(`/battle/${battleId}/result`);
          }, 1500);
        }
      }
    } catch (err) {
      showErrorToast(err);
    } finally {
      setIsSubmitting(false);
      setLastAction(null);
    }
  };

  const handleUseItem = async (itemType: ItemType) => {
    if (!battle || !currentPlayerId || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);
    setItemMessage(null);

    try {
      const result = await api.useItem(battleId, itemType);

      if (result.success) {
        setItemMessage(result.message);
        setInventory(result.inventory);

        if (result.new_hp !== undefined) {
          const isPlayer1 = battle.player1.id === currentPlayerId;
          if (isPlayer1) {
            setPlayer1Hp(result.new_hp);
            setBattle(prev => prev ? { ...prev, player1: { ...prev.player1, pokemon: { ...prev.player1.pokemon, current_hp: result.new_hp! } } } : null);
          } else {
            setPlayer2Hp(result.new_hp);
            setBattle(prev => prev ? { ...prev, player2: { ...prev.player2, pokemon: { ...prev.player2.pokemon, current_hp: result.new_hp! } } } : null);
          }
        }

        if (result.boost_turns_remaining !== undefined) {
          const isPlayer1 = battle.player1.id === currentPlayerId;
          const boostTurns = result.boost_turns_remaining;
          if (itemType === "x-attack") {
            setAttackBoost(boostTurns);
            setBattle(prev => prev ? {
              ...prev,
              player1_attack_boost: isPlayer1 ? boostTurns : prev.player1_attack_boost,
              player2_attack_boost: !isPlayer1 ? boostTurns : prev.player2_attack_boost,
            } : null);
          }
          if (itemType === "x-defense") {
            setDefenseBoost(boostTurns);
            setBattle(prev => prev ? {
              ...prev,
              player1_defense_boost: isPlayer1 ? boostTurns : prev.player1_defense_boost,
              player2_defense_boost: !isPlayer1 ? boostTurns : prev.player2_defense_boost,
            } : null);
          }
        }

        setShowItems(false);
        setTimeout(() => setItemMessage(null), 2000);
      } else {
        showErrorToast({ message: result.message });
      }
    } catch (err) {
      showErrorToast(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen battle-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pokeball-spin mb-4">
            <svg viewBox="0 0 40 40" className="w-16 h-16">
              <circle cx="20" cy="20" r="18" fill="#EE1515" />
              <path d="M 20 38 A 18 18 0 0 1 2 20 L 38 20 A 18 18 0 0 1 20 38" fill="white" />
              <rect x="2" y="18" width="36" height="4" fill="#2D2D2D" />
              <circle cx="20" cy="20" r="6" fill="#2D2D2D" />
              <circle cx="20" cy="20" r="4" fill="white" />
            </svg>
          </div>
          <p className="text-white/80">Loading battle...</p>
        </div>
      </div>
    );
  }

  if (error || !battle) {
    return (
      <div className="min-h-screen battle-bg flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-red-500 mb-4">{error || "Battle not found"}</p>
            <Button onClick={() => router.push("/dashboard")}>
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isPlayer1 = currentPlayerId === battle.player1.id;
  const yourPokemon = isPlayer1 ? battle.player1.pokemon : battle.player2.pokemon;
  const opponentPokemon = isPlayer1 ? battle.player2.pokemon : battle.player1.pokemon;
  const yourHp = isPlayer1 ? player1Hp : player2Hp;
  const opponentHp = isPlayer1 ? player2Hp : player1Hp;
  const opponent = isPlayer1 ? battle.player2 : battle.player1;

  const yourTypeColor = getTypeColor(yourPokemon.primary_type as any);
  const opponentTypeColor = getTypeColor(opponentPokemon.primary_type as any);

  const getHpBarColor = (current: number, max: number) => {
    const percentage = (current / max) * 100;
    if (percentage > 50) return "var(--color-hp-green)";
    if (percentage > 25) return "var(--color-hp-yellow)";
    return "var(--color-hp-red)";
  };

  const turnNumber = Math.floor(battleLog.length / 2) + 1;

  return (
    <main className="min-h-screen battle-bg flex flex-col">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-sm border-b border-white/10 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="flex items-center gap-1 text-white/70 hover:text-white transition-colors hover:scale-105"
            >
              <span>🏠</span>
            </Link>
            <Link
              href="/scoreboard"
              className="flex items-center gap-1 text-white/70 hover:text-white transition-colors hover:scale-105"
            >
              <span>🏆</span>
            </Link>
            <span className="text-white/50 text-xs">|</span>
            <span className="text-white/80 text-sm">Battle #{battleId.slice(-6)}</span>
          </div>
          <span className="text-white font-semibold">Turn {turnNumber}</span>
          <span className="text-white/60 text-sm">vs {opponent.username}</span>
        </div>
      </header>

      {/* Battle Area */}
      <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full px-4 py-6">
        {/* Opponent Pokemon Card */}
        <div className={`mb-4 ${shakeTarget === (isPlayer1 ? "player2" : "player1") ? "animate-shake" : ""}`}>
          <Card className="bg-white/10 backdrop-blur border-white/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-white/60 text-xs uppercase tracking-wide">Opponent</p>
                  <p className="text-white font-bold">{opponent.username}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className="px-2 py-0.5 rounded-full text-xs font-semibold text-white uppercase"
                    style={{ backgroundColor: opponentTypeColor }}
                  >
                    {opponentPokemon.primary_type}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <img
                  src={opponentPokemon.sprite_url}
                  alt={opponentPokemon.name}
                  className="w-20 h-20 object-contain drop-shadow-lg"
                />
                <div className="flex-1">
                  <p className="text-white font-semibold mb-1">{opponentPokemon.name}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-white/60 text-xs">HP</span>
                    <div className="flex-1 h-3 bg-black/30 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full hp-bar"
                        style={{
                          width: `${(opponentHp / opponentPokemon.max_hp) * 100}%`,
                          backgroundColor: getHpBarColor(opponentHp, opponentPokemon.max_hp),
                        }}
                      />
                    </div>
                    <span className="text-white text-xs font-mono w-14 text-right">
                      {opponentHp}/{opponentPokemon.max_hp}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* VS Divider */}
        <div className="flex items-center justify-center my-2">
          <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
            <span className="text-white font-bold text-lg">⚔️</span>
          </div>
        </div>

        {/* Your Pokemon Card */}
        <div className={`mb-4 ${shakeTarget === (isPlayer1 ? "player1" : "player2") ? "animate-shake" : ""}`}>
          <Card className="bg-white/10 backdrop-blur border-white/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <p className="text-white font-semibold mb-1">{yourPokemon.name}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-white/60 text-xs">HP</span>
                    <div className="flex-1 h-3 bg-black/30 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full hp-bar ${yourHp <= yourPokemon.max_hp * 0.25 ? "animate-hp-pulse" : ""}`}
                        style={{
                          width: `${(yourHp / yourPokemon.max_hp) * 100}%`,
                          backgroundColor: getHpBarColor(yourHp, yourPokemon.max_hp),
                        }}
                      />
                    </div>
                    <span className="text-white text-xs font-mono w-14 text-right">
                      {yourHp}/{yourPokemon.max_hp}
                    </span>
                  </div>
                </div>
                <img
                  src={yourPokemon.sprite_url}
                  alt={yourPokemon.name}
                  className="w-20 h-20 object-contain drop-shadow-lg"
                />
              </div>
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-2">
                  <span
                    className="px-2 py-0.5 rounded-full text-xs font-semibold text-white uppercase"
                    style={{ backgroundColor: yourTypeColor }}
                  >
                    {yourPokemon.primary_type}
                  </span>
                </div>
                <p className="text-white/60 text-xs uppercase tracking-wide">You</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Battle Log */}
        <Card className="flex-1 min-h-[150px] max-h-[200px] bg-black/30 backdrop-blur border-white/10 mb-4 overflow-hidden">
          <CardContent className="p-3 h-full flex flex-col">
            <p className="text-white/60 text-xs uppercase tracking-wide mb-2 flex-shrink-0">Battle Log</p>
            <div
              ref={logRef}
              className="flex-1 overflow-y-auto space-y-1 text-sm scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent"
            >
              {battleLog.length === 0 ? (
                <p className="text-white/40 text-center py-4">Battle started! Make your move.</p>
              ) : (
                battleLog.slice().reverse().map((turn, idx) => {
                  const isYourTurn = turn.player_id === currentPlayerId;
                  return (
                    <div
                      key={idx}
                      className={`px-2 py-1 rounded ${
                        isYourTurn ? "bg-white/10" : "bg-white/5"
                      } ${idx === 0 ? "animate-slide-in-up" : ""}`}
                    >
                      <span className={`${isYourTurn ? "text-green-400" : "text-red-400"}`}>
                        Turn {turn.turn_number}:
                      </span>
                      <span className="text-white/90 ml-2">{turn.message}</span>
                      {turn.is_super_effective && (
                        <span className="ml-2 text-yellow-400 text-xs">Super Effective!</span>
                      )}
                      {turn.is_critical && (
                        <span className="ml-2 text-orange-400 text-xs">Critical Hit!</span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        {/* Item Message */}
        {itemMessage && (
          <div className="mb-2 p-3 rounded-lg bg-green-500/20 border border-green-500/50 text-white text-center text-sm animate-slide-in-up">
            {itemMessage}
          </div>
        )}

        {/* Active Boosts */}
        {(attackBoost > 0 || defenseBoost > 0) && (
          <div className="mb-2 flex gap-2 justify-center">
            {attackBoost > 0 && (
              <span className="px-3 py-1 rounded-full bg-red-500/20 border border-red-400 text-red-100 text-xs flex items-center gap-1">
                ⚔️ ATK +50% ({attackBoost} turns)
              </span>
            )}
            {defenseBoost > 0 && (
              <span className="px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400 text-blue-100 text-xs flex items-center gap-1">
                🛡️ DEF +50% ({defenseBoost} turns)
              </span>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <Card className="bg-white/95">
          <CardContent className="p-4">
            <p className="text-center text-sm font-medium text-muted-foreground mb-3">
              Your Turn - Choose an action:
            </p>
            <div className="grid grid-cols-3 gap-3">
              <Button
                onClick={() => handleAction("attack")}
                disabled={isSubmitting}
                className="h-14 text-base font-semibold bg-gradient-to-r from-[var(--color-pokeball-red)] to-[var(--color-pokeball-dark-red)] hover:from-[var(--color-pokeball-dark-red)] hover:to-[var(--color-pokeball-red)] text-white transition-all hover:scale-[1.02]"
              >
                {isSubmitting && lastAction === "attack" ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  </span>
                ) : (
                  <>
                    <span className="mr-1">⚔️</span>
                    Attack
                  </>
                )}
              </Button>
              <Button
                onClick={() => handleAction("defend")}
                disabled={isSubmitting}
                variant="outline"
                className="h-14 text-base font-semibold border-2 border-[var(--color-pokemon-blue)] text-[var(--color-pokemon-blue)] hover:bg-[var(--color-pokemon-blue)] hover:text-white transition-all hover:scale-[1.02]"
              >
                {isSubmitting && lastAction === "defend" ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  </span>
                ) : (
                  <>
                    <span className="mr-1">🛡️</span>
                    Defend
                  </>
                )}
              </Button>
              <Button
                onClick={() => setShowItems(!showItems)}
                disabled={isSubmitting}
                variant="outline"
                className={`h-14 text-base font-semibold border-2 transition-all hover:scale-[1.02] ${
                  showItems
                    ? "border-yellow-500 bg-yellow-50 text-yellow-700"
                    : "border-yellow-400 text-yellow-600 hover:bg-yellow-50"
                }`}
              >
                <span className="mr-1">🎒</span>
                Items
              </Button>
            </div>

            {/* Items Panel */}
            {showItems && (
              <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200 animate-slide-in-up">
                <p className="text-xs font-semibold text-yellow-800 mb-2">Select an item to use:</p>
                <div className="grid grid-cols-3 gap-2">
                  {(Object.keys(BATTLE_ITEMS) as ItemType[]).map((itemType) => {
                    const item = BATTLE_ITEMS[itemType];
                    const count = inventory[itemType];
                    return (
                      <button
                        key={itemType}
                        onClick={() => handleUseItem(itemType)}
                        disabled={count <= 0 || isSubmitting}
                        className={`p-2 rounded-lg border transition-all ${
                          count > 0
                            ? "bg-white hover:bg-yellow-100 hover:border-yellow-400 hover:scale-105 cursor-pointer"
                            : "bg-gray-100 opacity-50 cursor-not-allowed"
                        }`}
                      >
                        <span className="text-2xl">{item.icon}</span>
                        <p className="text-xs font-semibold mt-1">{item.name}</p>
                        <p className="text-[10px] text-muted-foreground">{item.effect}</p>
                        <span className={`text-xs font-bold ${count > 0 ? "text-green-600" : "text-red-400"}`}>
                          x{count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-white text-center text-sm">
            {error}
          </div>
        )}
      </div>
    </main>
  );
}
