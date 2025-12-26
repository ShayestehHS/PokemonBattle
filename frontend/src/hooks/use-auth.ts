"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { tokenStorage } from "@/lib/api";
import { mockGetCurrentPlayer, mockHasSelectedStarter, CurrentPlayer } from "@/lib/mocks";

interface UseAuthOptions {
  requireAuth?: boolean;
  requireStarter?: boolean;
  redirectTo?: string;
}

interface UseAuthReturn {
  isLoading: boolean;
  isAuthenticated: boolean;
  hasStarter: boolean;
  player: CurrentPlayer | null;
  logout: () => Promise<void>;
}

/**
 * Custom hook for handling authentication state
 *
 * @param options - Configuration options
 * @param options.requireAuth - If true, redirects to auth page if not logged in
 * @param options.requireStarter - If true, redirects to starter page if no starter selected
 * @param options.redirectTo - Custom redirect path for unauthenticated users
 *
 * @returns Authentication state and utilities
 */
export function useAuth(options: UseAuthOptions = {}): UseAuthReturn {
  const {
    requireAuth = true,
    requireStarter = false,
    redirectTo = "/"
  } = options;

  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasStarter, setHasStarter] = useState(false);
  const [player, setPlayer] = useState<CurrentPlayer | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = tokenStorage.getAccessToken();

        if (!token) {
          setIsAuthenticated(false);
          if (requireAuth) {
            router.replace(redirectTo);
          }
          setIsLoading(false);
          return;
        }

        // Token exists, fetch player data
        const playerData = await mockGetCurrentPlayer();

        if (!playerData) {
          setIsAuthenticated(false);
          tokenStorage.clearTokens();
          if (requireAuth) {
            router.replace(redirectTo);
          }
          setIsLoading(false);
          return;
        }

        setIsAuthenticated(true);
        setPlayer(playerData);

        // Check for starter Pokemon
        const starterSelected = await mockHasSelectedStarter();
        setHasStarter(starterSelected);

        // Redirect to starter selection if required but not selected
        if (requireStarter && !starterSelected) {
          router.replace("/starter");
          setIsLoading(false);
          return;
        }

        setIsLoading(false);
      } catch (error) {
        console.error("Auth check failed:", error);
        setIsAuthenticated(false);
        setIsLoading(false);
        if (requireAuth) {
          router.replace(redirectTo);
        }
      }
    };

    checkAuth();
  }, [requireAuth, requireStarter, redirectTo, router]);

  const logout = async () => {
    tokenStorage.clearTokens();
    setIsAuthenticated(false);
    setPlayer(null);
    setHasStarter(false);
    router.replace("/");
  };

  return {
    isLoading,
    isAuthenticated,
    hasStarter,
    player,
    logout,
  };
}

/**
 * Simple hook to check if user is logged in without redirects
 */
export function useIsLoggedIn(): boolean {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = tokenStorage.getAccessToken();
    setIsLoggedIn(!!token);
  }, []);

  return isLoggedIn;
}
