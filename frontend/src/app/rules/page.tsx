"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TYPE_EFFECTIVENESS, PokemonType, getTypeColor } from "@/lib/mocks";
import { BottomNavigation } from "@/components/navigation/bottom-nav";

type TabId = "basics" | "combat" | "types" | "items";

interface Tab {
  id: TabId;
  label: string;
  icon: string;
}

const TABS: Tab[] = [
  { id: "basics", label: "Basics", icon: "📖" },
  { id: "combat", label: "Combat", icon: "⚔️" },
  { id: "types", label: "Types", icon: "🔥" },
  { id: "items", label: "Items", icon: "🎒" },
];

const TYPES: PokemonType[] = [
  "normal", "fire", "water", "electric", "grass", "ice",
  "fighting", "poison", "ground", "flying", "psychic", "bug",
  "rock", "ghost", "dragon", "dark", "steel", "fairy"
];

export default function RulesPage() {
  const [activeTab, setActiveTab] = useState<TabId>("basics");

  return (
    <main className="min-h-screen landing-bg pb-24 lg:pb-8">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </Link>
          <span className="font-semibold flex items-center gap-2">
            <span>📖</span>
            Game Rules
          </span>
          <div className="w-16" />
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="sticky top-[57px] z-40 bg-white/90 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto py-2">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? "bg-[var(--color-pokeball-red)] text-white"
                    : "bg-gray-100 text-muted-foreground hover:bg-gray-200"
                }`}
              >
                <span>{tab.icon}</span>
                <span className="text-sm font-medium">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {activeTab === "basics" && <BasicsTab />}
        {activeTab === "combat" && <CombatTab />}
        {activeTab === "types" && <TypesTab />}
        {activeTab === "items" && <ItemsTab />}
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </main>
  );
}

// ===========================================
// Tab: Basics
// ===========================================

function BasicsTab() {
  return (
    <div className="space-y-6 animate-slide-in-up">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>🎮</span>
            Welcome to Pokémon Battle Arena!
          </CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm max-w-none">
          <p className="text-muted-foreground">
            Battle against trainers from around the world in turn-based Pokémon battles.
            Choose your starter, build your strategy, and become a champion!
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Getting Started</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-full bg-[var(--color-pokeball-red)] text-white flex items-center justify-center font-bold shrink-0">
              1
            </div>
            <div>
              <h4 className="font-semibold">Choose Your Starter</h4>
              <p className="text-sm text-muted-foreground">
                Select from Bulbasaur (Grass), Charmander (Fire), or Squirtle (Water).
                Each has unique strengths and weaknesses.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-full bg-[var(--color-pokeball-red)] text-white flex items-center justify-center font-bold shrink-0">
              2
            </div>
            <div>
              <h4 className="font-semibold">Find an Opponent</h4>
              <p className="text-sm text-muted-foreground">
                Battle a random AI trainer or challenge a specific trainer by name.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-full bg-[var(--color-pokeball-red)] text-white flex items-center justify-center font-bold shrink-0">
              3
            </div>
            <div>
              <h4 className="font-semibold">Battle!</h4>
              <p className="text-sm text-muted-foreground">
                Take turns attacking and defending. Use type advantages and items strategically!
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-full bg-[var(--color-pokeball-red)] text-white flex items-center justify-center font-bold shrink-0">
              4
            </div>
            <div>
              <h4 className="font-semibold">Climb the Ranks</h4>
              <p className="text-sm text-muted-foreground">
                Win battles to increase your ranking and earn achievements!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">How to Get More Pokémon</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <span className="font-semibold">Coming Soon!</span> In future updates,
              you&apos;ll be able to catch and collect more Pokémon by winning battles,
              completing achievements, and exploring the world.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ===========================================
// Tab: Combat
// ===========================================

function CombatTab() {
  return (
    <div className="space-y-6 animate-slide-in-up">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>⚔️</span>
            Battle Mechanics
          </CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm max-w-none">
          <p className="text-muted-foreground">
            Battles are turn-based. Each turn, you can choose to Attack or Defend.
            The battle ends when one Pokémon&apos;s HP reaches 0.
          </p>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="border-red-200 bg-red-50/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <span className="text-2xl">⚔️</span>
              Attack
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Deal damage to your opponent based on your Pokémon&apos;s Attack stat.
            </p>
            <div className="p-3 bg-white rounded-lg text-sm">
              <p className="font-semibold mb-1">Damage Formula:</p>
              <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                Base ATK × 0.3 × Type Multiplier
              </code>
            </div>
            <ul className="text-sm space-y-1">
              <li className="flex items-center gap-2">
                <span className="text-yellow-500">⚡</span>
                <span>10% chance for Critical Hit (2x damage)</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <span>Type advantage = 2x damage</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-red-500">✗</span>
                <span>Type disadvantage = 0.5x damage</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <span className="text-2xl">🛡️</span>
              Defend
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Reduce incoming damage by 50% for this turn. Strategic for surviving big hits!
            </p>
            <div className="p-3 bg-white rounded-lg text-sm">
              <p className="font-semibold mb-1">Defense Reduction:</p>
              <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                Incoming Damage × 0.5
              </code>
            </div>
            <ul className="text-sm space-y-1">
              <li className="flex items-center gap-2">
                <span className="text-blue-500">🛡️</span>
                <span>Halves damage from any attack</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-orange-500">⚠️</span>
                <span>Deals no damage this turn</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-purple-500">💡</span>
                <span>Use when expecting a super-effective hit</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Stats Explained</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 bg-green-50 rounded-lg text-center">
              <p className="text-2xl mb-1">❤️</p>
              <p className="font-semibold text-sm">HP</p>
              <p className="text-xs text-muted-foreground">Health Points</p>
            </div>
            <div className="p-3 bg-red-50 rounded-lg text-center">
              <p className="text-2xl mb-1">⚔️</p>
              <p className="font-semibold text-sm">ATK</p>
              <p className="text-xs text-muted-foreground">Attack Power</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg text-center">
              <p className="text-2xl mb-1">🛡️</p>
              <p className="font-semibold text-sm">DEF</p>
              <p className="text-xs text-muted-foreground">Defense</p>
            </div>
            <div className="p-3 bg-yellow-50 rounded-lg text-center">
              <p className="text-2xl mb-1">⚡</p>
              <p className="font-semibold text-sm">SPD</p>
              <p className="text-xs text-muted-foreground">Speed</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ===========================================
// Tab: Types
// ===========================================

function TypesTab() {
  const [selectedType, setSelectedType] = useState<PokemonType | null>(null);

  const getEffectivenessLabel = (multiplier: number) => {
    if (multiplier === 0) return { text: "No Effect", color: "text-gray-400", bg: "bg-gray-100" };
    if (multiplier === 0.5) return { text: "Not Effective", color: "text-red-600", bg: "bg-red-50" };
    if (multiplier === 2) return { text: "Super Effective", color: "text-green-600", bg: "bg-green-50" };
    return { text: "Normal", color: "text-gray-600", bg: "bg-gray-50" };
  };

  return (
    <div className="space-y-6 animate-slide-in-up">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>🔥</span>
            Type Effectiveness
          </CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm max-w-none">
          <p className="text-muted-foreground">
            Each Pokémon type has strengths and weaknesses. Understanding type matchups
            is key to winning battles!
          </p>
        </CardContent>
      </Card>

      {/* Type Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Select a Type to See Matchups</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {TYPES.map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(selectedType === type ? null : type)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold uppercase transition-all hover:scale-105 ${
                  selectedType === type
                    ? "ring-2 ring-offset-2 ring-gray-400"
                    : ""
                }`}
                style={{
                  backgroundColor: getTypeColor(type),
                  color: "white",
                }}
              >
                {type}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Type Details */}
      {selectedType && (
        <Card className="animate-slide-in-up">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <span
                className="px-3 py-1 rounded-full text-sm font-semibold uppercase text-white"
                style={{ backgroundColor: getTypeColor(selectedType) }}
              >
                {selectedType}
              </span>
              Matchups
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Attacking */}
            <div>
              <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                <span>⚔️</span> When Attacking:
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {TYPES.filter(t => TYPE_EFFECTIVENESS[selectedType][t] !== 1).map((type) => {
                  const multiplier = TYPE_EFFECTIVENESS[selectedType][type];
                  const label = getEffectivenessLabel(multiplier);
                  return (
                    <div
                      key={type}
                      className={`flex items-center gap-2 p-2 rounded ${label.bg}`}
                    >
                      <span
                        className="px-2 py-0.5 rounded text-xs font-semibold uppercase text-white"
                        style={{ backgroundColor: getTypeColor(type) }}
                      >
                        {type}
                      </span>
                      <span className={`text-xs font-medium ${label.color}`}>
                        {multiplier}x
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Defending */}
            <div>
              <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                <span>🛡️</span> When Defending:
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {TYPES.filter(t => TYPE_EFFECTIVENESS[t][selectedType] !== 1).map((type) => {
                  const multiplier = TYPE_EFFECTIVENESS[type][selectedType];
                  const label = getEffectivenessLabel(multiplier);
                  return (
                    <div
                      key={type}
                      className={`flex items-center gap-2 p-2 rounded ${label.bg}`}
                    >
                      <span
                        className="px-2 py-0.5 rounded text-xs font-semibold uppercase text-white"
                        style={{ backgroundColor: getTypeColor(type) }}
                      >
                        {type}
                      </span>
                      <span className={`text-xs font-medium ${label.color}`}>
                        {multiplier}x
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Starter Triangle */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Starter Type Triangle</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <div className="relative w-64 h-56">
              {/* Grass */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 text-center">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl mx-auto"
                  style={{ backgroundColor: getTypeColor("grass") }}
                >
                  🌿
                </div>
                <p className="font-semibold mt-1">Grass</p>
                <p className="text-xs text-muted-foreground">Bulbasaur</p>
              </div>

              {/* Fire */}
              <div className="absolute bottom-0 left-0 text-center">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl mx-auto"
                  style={{ backgroundColor: getTypeColor("fire") }}
                >
                  🔥
                </div>
                <p className="font-semibold mt-1">Fire</p>
                <p className="text-xs text-muted-foreground">Charmander</p>
              </div>

              {/* Water */}
              <div className="absolute bottom-0 right-0 text-center">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl mx-auto"
                  style={{ backgroundColor: getTypeColor("water") }}
                >
                  💧
                </div>
                <p className="font-semibold mt-1">Water</p>
                <p className="text-xs text-muted-foreground">Squirtle</p>
              </div>

              {/* Arrows */}
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 180">
                {/* Fire beats Grass */}
                <path d="M 60 140 L 100 50" stroke="#F08030" strokeWidth="2" markerEnd="url(#arrowhead)" fill="none" />
                {/* Water beats Fire */}
                <path d="M 140 140 L 60 140" stroke="#6890F0" strokeWidth="2" markerEnd="url(#arrowhead)" fill="none" />
                {/* Grass beats Water */}
                <path d="M 100 50 L 140 140" stroke="#78C850" strokeWidth="2" markerEnd="url(#arrowhead)" fill="none" />
                <defs>
                  <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" fill="#666" />
                  </marker>
                </defs>
              </svg>
            </div>
          </div>
          <p className="text-center text-sm text-muted-foreground mt-2">
            Fire → Grass → Water → Fire
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// ===========================================
// Tab: Items
// ===========================================

function ItemsTab() {
  const items = [
    {
      name: "Potion",
      icon: "🧪",
      effect: "+50 HP",
      description: "Restores 50 HP to your Pokémon. Use when health is low!",
      color: "bg-pink-50 border-pink-200",
    },
    {
      name: "X-Attack",
      icon: "⚔️",
      effect: "+50% ATK (2 turns)",
      description: "Boosts attack power by 50% for the next 2 turns. Great for finishing off opponents!",
      color: "bg-red-50 border-red-200",
    },
    {
      name: "X-Defense",
      icon: "🛡️",
      effect: "-50% DMG (2 turns)",
      description: "Reduces incoming damage by 50% for the next 2 turns. Perfect for surviving tough attacks!",
      color: "bg-blue-50 border-blue-200",
    },
  ];

  return (
    <div className="space-y-6 animate-slide-in-up">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>🎒</span>
            Battle Items
          </CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm max-w-none">
          <p className="text-muted-foreground">
            Items can turn the tide of battle! Each trainer starts with a limited supply.
            Use them wisely to overcome type disadvantages and tough opponents.
          </p>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {items.map((item) => (
          <Card key={item.name} className={`${item.color} border`}>
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl bg-white flex items-center justify-center text-3xl shadow-sm">
                  {item.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold">{item.name}</h3>
                    <span className="px-2 py-0.5 rounded-full bg-white text-xs font-semibold">
                      {item.effect}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Strategic Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-yellow-500">💡</span>
              <span>Use <strong>Potions</strong> when below 30% HP to survive another turn.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-yellow-500">💡</span>
              <span>Stack <strong>X-Attack</strong> with type advantage for massive damage.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-yellow-500">💡</span>
              <span>Use <strong>X-Defense</strong> when facing a super-effective attacker.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-yellow-500">💡</span>
              <span>Items can only be used once per battle - save them for critical moments!</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
