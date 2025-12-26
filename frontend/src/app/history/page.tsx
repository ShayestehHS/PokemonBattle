"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { tokenStorage, api, BattleHistoryItem } from "@/lib/api";
import { getTypeColor } from "@/lib/mocks";
import { BottomNavigation } from "@/components/navigation/bottom-nav";

export default function HistoryPage() {
  const router = useRouter();
  const [battles, setBattles] = useState<BattleHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      const token = tokenStorage.getAccessToken();
      if (!token) {
        router.replace("/");
        return;
      }

      try {
        const [history, player] = await Promise.all([
          api.getBattleHistory(),
          api.getMe(),
        ]);
        setBattles(history);
        setCurrentUserId(player.id);
      } catch (err) {
        setError("Failed to load battle history");
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, [router]);

  if (isLoading) {
    return <HistorySkeleton />;
  }

  return (
    <main className="min-h-screen landing-bg pb-20 lg:pb-8">
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
          <span className="font-semibold">Battle History</span>
          <div className="w-16" /> {/* Spacer */}
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700">
            {error}
          </div>
        )}

        {battles.length === 0 ? (
          <Card className="animate-slide-in-up">
            <CardContent className="py-12 text-center">
              <div className="text-6xl mb-4">⚔️</div>
              <h2 className="text-xl font-semibold mb-2">No Battles Yet</h2>
              <p className="text-muted-foreground mb-6">
                Your journey has just begun. Start your first battle!
              </p>
              <Link href="/battle/new">
                <Button className="bg-gradient-to-r from-[var(--color-pokeball-red)] to-[var(--color-pokeball-dark-red)] hover:from-[var(--color-pokeball-dark-red)] hover:to-[var(--color-pokeball-red)] transition-all hover:scale-[1.02] active:scale-[0.98] hover:shadow-lg hover:shadow-red-500/30">
                  Start Your First Battle
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {battles.map((battle, index) => (
              <Link
                key={battle.id}
                href={`/battle/${battle.id}/result`}
                className="block animate-slide-in-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <Card className="hover:shadow-lg transition-shadow cursor-pointer overflow-hidden">
                  {(() => {
                    const isWin = currentUserId && battle.winner_id === currentUserId;
                    const isLoss = battle.status === "completed" && currentUserId && battle.winner_id !== currentUserId && battle.winner_id !== null;
                    return (
                      <>
                        <div
                          className={`h-1 ${
                            isWin
                              ? "bg-green-500"
                              : isLoss
                              ? "bg-red-500"
                              : "bg-yellow-500"
                          }`}
                        />
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4">
                            {/* Result Badge */}
                            <div
                              className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${
                                isWin
                                  ? "bg-green-500"
                                  : isLoss
                                  ? "bg-red-500"
                                  : "bg-yellow-500"
                              }`}
                            >
                              {isWin ? "✓" : isLoss ? "✗" : "⏳"}
                            </div>

                            {/* Battle Details */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`font-bold uppercase text-sm ${
                                  isWin
                                    ? "text-green-600"
                                    : isLoss
                                    ? "text-red-600"
                                    : "text-yellow-600"
                                }`}>
                                  {isWin ? "VICTORY" : isLoss ? "DEFEAT" : "PENDING"}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                vs {battle.opponent.username}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {formatTimeAgo(battle.created_at)}
                              </p>
                            </div>

                            {/* Arrow */}
                            <svg className="w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </CardContent>
                      </>
                    );
                  })()}
                </Card>
              </Link>
            ))}

            {/* Load More Button */}
            <div className="text-center pt-4">
              <Button variant="outline" disabled>
                Load More ↓
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                Showing all {battles.length} battles
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </main>
  );
}

// ===========================================
// Component: History Skeleton
// ===========================================

function HistorySkeleton() {
  return (
    <main className="min-h-screen landing-bg pb-20 lg:pb-8">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-6 w-32" />
          <div className="w-16" />
        </div>
      </header>
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-3">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-lg" />
        ))}
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
