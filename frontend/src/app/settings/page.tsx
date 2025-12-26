"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { tokenStorage } from "@/lib/api";
import {
  mockGetCurrentPlayer,
  mockLogout,
  CurrentPlayer,
  getTypeColor,
} from "@/lib/mocks";
import { BottomNavigation } from "@/components/navigation/bottom-nav";

interface SettingToggle {
  id: string;
  label: string;
  description: string;
  icon: string;
  enabled: boolean;
}

export default function SettingsPage() {
  const router = useRouter();
  const [player, setPlayer] = useState<CurrentPlayer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [settings, setSettings] = useState<SettingToggle[]>([
    {
      id: "sound",
      label: "Sound Effects",
      description: "Play sound effects during battles",
      icon: "🔊",
      enabled: true,
    },
    {
      id: "music",
      label: "Background Music",
      description: "Play background music",
      icon: "🎵",
      enabled: true,
    },
    {
      id: "vibration",
      label: "Vibration",
      description: "Vibrate on important events",
      icon: "📳",
      enabled: true,
    },
    {
      id: "notifications",
      label: "Notifications",
      description: "Receive battle notifications",
      icon: "🔔",
      enabled: false,
    },
    {
      id: "animations",
      label: "Animations",
      description: "Show battle animations",
      icon: "✨",
      enabled: true,
    },
  ]);

  useEffect(() => {
    const init = async () => {
      const token = tokenStorage.getAccessToken();
      if (!token) {
        router.replace("/");
        return;
      }

      try {
        const playerData = await mockGetCurrentPlayer();
        if (!playerData) {
          router.replace("/");
          return;
        }
        setPlayer(playerData);
      } catch (err) {
        console.error("Failed to load settings");
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, [router]);

  const handleToggle = (id: string) => {
    setSettings((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s))
    );
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await mockLogout();
      tokenStorage.clearTokens();
      router.replace("/");
    } catch (err) {
      console.error("Logout failed");
      setIsLoggingOut(false);
    }
  };

  const handleClearData = () => {
    if (typeof window !== "undefined") {
      if (confirm("Are you sure you want to clear all local data? This cannot be undone.")) {
        localStorage.clear();
        router.replace("/");
      }
    }
  };

  if (isLoading) {
    return <SettingsSkeleton />;
  }

  const typeColor = player?.currentPokemon
    ? getTypeColor(player.currentPokemon.primaryType)
    : "#A8A878";

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
          <span className="font-semibold">Settings</span>
          <div className="w-16" />
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Account Section */}
        <Card className="animate-slide-in-up">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <span>👤</span>
              Account
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {player && (
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                  style={{ backgroundColor: typeColor }}
                >
                  {player.username.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="font-semibold">{player.username}</p>
                  <p className="text-sm text-muted-foreground">
                    Trainer since {new Date(player.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <Link href="/profile">
                  <Button variant="outline" size="sm" className="hover:bg-gray-100 transition-colors">
                    View Profile
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Preferences Section */}
        <Card className="animate-slide-in-up delay-100">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <span>⚙️</span>
              Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {settings.map((setting) => (
              <div
                key={setting.id}
                className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{setting.icon}</span>
                  <div>
                    <p className="font-medium">{setting.label}</p>
                    <p className="text-sm text-muted-foreground">{setting.description}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleToggle(setting.id)}
                  className={`relative w-12 h-6 rounded-full transition-all duration-200 ${
                    setting.enabled ? "bg-[var(--color-pokeball-red)]" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-200 ${
                      setting.enabled ? "left-6" : "left-0.5"
                    }`}
                  />
                </button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Game Section */}
        <Card className="animate-slide-in-up delay-150">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <span>🎮</span>
              Game
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/rules" className="block">
              <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <span className="text-xl">📖</span>
                  <div>
                    <p className="font-medium">Game Rules</p>
                    <p className="text-sm text-muted-foreground">Learn how to play</p>
                  </div>
                </div>
                <svg className="w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
            <Link href="/history" className="block">
              <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <span className="text-xl">📜</span>
                  <div>
                    <p className="font-medium">Battle History</p>
                    <p className="text-sm text-muted-foreground">View past battles</p>
                  </div>
                </div>
                <svg className="w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="animate-slide-in-up delay-200 border-red-200">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-red-600">
              <span>⚠️</span>
              Danger Zone
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              onClick={handleClearData}
              className="w-full justify-start gap-3 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 transition-colors"
            >
              <span>🗑️</span>
              Clear Local Data
            </Button>
            <Button
              variant="outline"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="w-full justify-start gap-3 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 transition-colors"
            >
              {isLoggingOut ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span>Logging out...</span>
                </>
              ) : (
                <>
                  <span>🚪</span>
                  <span>Logout</span>
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* App Info */}
        <div className="text-center text-sm text-muted-foreground py-4">
          <p>Pokémon Battle Arena v1.0.0</p>
          <p className="text-xs mt-1">Made with ❤️ for Trainers</p>
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </main>
  );
}

// ===========================================
// Component: Settings Skeleton
// ===========================================

function SettingsSkeleton() {
  return (
    <main className="min-h-screen landing-bg pb-24 lg:pb-8">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-6 w-20" />
          <div className="w-16" />
        </div>
      </header>
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <Skeleton className="h-32 w-full rounded-lg" />
        <Skeleton className="h-64 w-full rounded-lg" />
        <Skeleton className="h-32 w-full rounded-lg" />
      </div>
    </main>
  );
}
