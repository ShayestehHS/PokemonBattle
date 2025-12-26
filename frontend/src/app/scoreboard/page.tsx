"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { api, tokenStorage, ScoreboardResult } from "@/lib/api";
import { showErrorToast } from "@/lib/toast";
import { BottomNavigation } from "@/components/navigation/bottom-nav";

export default function ScoreboardPage() {
  const router = useRouter();
  const [scoreboardResult, setScoreboardResult] = useState<ScoreboardResult | null>(null);
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
        const result = await api.getScoreboard();
        setScoreboardResult(result);
      } catch (err) {
        showErrorToast(err);
        setError("Failed to load scoreboard");
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, [router]);

  if (isLoading) {
    return <ScoreboardSkeleton />;
  }

  const scoreboard = scoreboardResult?.entries || [];
  const currentUserEntry = scoreboardResult?.currentUserEntry;
  const currentUserInTop20 = scoreboardResult?.currentUserInTop20 ?? false;
  const currentPlayerId = currentUserEntry?.playerId || null;

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
          <div className="flex items-center gap-2">
            <span className="text-xl">🏆</span>
            <span className="font-semibold">Scoreboard</span>
          </div>
          <div className="w-16" /> {/* Spacer */}
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700">
            {error}
          </div>
        )}

        {/* Current User Rank Card */}
        {currentUserEntry && (
          <Card className={`mb-6 border animate-slide-in-up ${
            currentUserInTop20
              ? "bg-gradient-to-r from-[var(--color-pokemon-light-blue)]/20 to-[var(--color-pokemon-blue)]/10 border-[var(--color-pokemon-blue)]/30"
              : "bg-gradient-to-r from-yellow-100/50 to-orange-100/50 border-orange-300/50"
          }`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${
                    currentUserInTop20 ? "bg-[var(--color-pokemon-blue)]" : "bg-gradient-to-br from-yellow-500 to-orange-500"
                  }`}>
                    #{currentUserEntry.rank}
                  </div>
                  <div>
                    <p className="font-semibold flex items-center gap-1">
                      {currentUserEntry.username}
                      <span className="text-yellow-500">★</span>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {currentUserInTop20 ? "Your Ranking" : "Your Ranking (not in top 20)"}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">{currentUserEntry.wins} wins</p>
                  <p className="text-sm text-muted-foreground">{currentUserEntry.winRate}% win rate</p>
                </div>
              </div>
              {!currentUserInTop20 && (
                <p className="text-xs text-orange-600 mt-2 text-center">
                  Win more battles to climb into the top 20!
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Scoreboard Table */}
        <Card className="animate-slide-in-up delay-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Global Rankings</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {scoreboard.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-muted-foreground">No trainers yet. Be the first champion!</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-gray-50/50">
                      <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Rank
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Trainer
                      </th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Wins
                      </th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Win Rate
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {scoreboard.map((entry, index) => {
                      const isCurrentUser = entry.playerId === currentPlayerId;
                      const isTopThree = entry.rank <= 3;

                      return (
                        <tr
                          key={entry.playerId}
                          className={`
                            border-b last:border-b-0 transition-colors
                            ${isCurrentUser ? "bg-[var(--color-pokemon-light-blue)]/10" : ""}
                            ${isTopThree && entry.rank === 1 ? "bg-yellow-50" : ""}
                            ${isTopThree && entry.rank === 2 ? "bg-gray-50" : ""}
                            ${isTopThree && entry.rank === 3 ? "bg-orange-50" : ""}
                            ${index % 2 === 0 && !isCurrentUser && !isTopThree ? "bg-gray-50/30" : ""}
                          `}
                          style={{
                            animationDelay: `${index * 30}ms`,
                          }}
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              {entry.rank === 1 && <span className="text-xl">🥇</span>}
                              {entry.rank === 2 && <span className="text-xl">🥈</span>}
                              {entry.rank === 3 && <span className="text-xl">🥉</span>}
                              {entry.rank > 3 && (
                                <span className="font-mono text-sm text-muted-foreground w-6 text-right">
                                  {entry.rank}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <span className={`font-medium ${isCurrentUser ? "text-[var(--color-pokemon-blue)]" : ""}`}>
                                {entry.username}
                              </span>
                              {isCurrentUser && (
                                <span className="text-yellow-500 text-sm">★</span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className="font-mono font-semibold text-green-600">
                              {entry.wins}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className="font-mono text-sm">
                              {entry.winRate}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Load More */}
        <div className="text-center pt-6">
          <Button variant="outline" disabled className="hover:bg-gray-100 transition-colors">
            Load More ↓
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            Showing top 20 trainers
          </p>
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </main>
  );
}

// ===========================================
// Component: Scoreboard Skeleton
// ===========================================

function ScoreboardSkeleton() {
  return (
    <main className="min-h-screen landing-bg pb-20 lg:pb-8">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-6 w-32" />
          <div className="w-16" />
        </div>
      </header>
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <Skeleton className="h-20 w-full rounded-lg" />
        <Skeleton className="h-96 w-full rounded-lg" />
      </div>
    </main>
  );
}
