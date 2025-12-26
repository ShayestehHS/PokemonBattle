"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { tokenStorage } from "@/lib/api";

export default function LandingPage() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      const token = tokenStorage.getAccessToken();
      if (token) {
        // User has token, redirect to dashboard
        router.replace("/dashboard");
      } else {
        setIsChecking(false);
      }
    };

    checkAuth();
  }, [router]);

  const handleContinue = () => {
    setIsNavigating(true);
    router.push("/");
  };

  const handleSignIn = () => {
    setIsNavigating(true);
    router.push("/");
  };

  if (isChecking) {
    return (
      <div className="min-h-screen landing-bg flex items-center justify-center">
        <div className="animate-pokeball-spin">
          <PokeballIcon className="w-16 h-16" />
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen landing-bg relative overflow-hidden">
      {/* Floating background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-[var(--color-pokeball-red)]/10 blur-3xl animate-blob-drift"
        />
        <div
          className="absolute top-1/4 -right-20 w-80 h-80 rounded-full bg-[var(--color-pokemon-blue)]/10 blur-3xl animate-blob-drift delay-700"
        />
        <div
          className="absolute -bottom-32 left-1/3 w-96 h-96 rounded-full bg-[var(--color-pokemon-yellow)]/15 blur-3xl animate-blob-drift delay-300"
        />

        {/* Floating Pokeballs */}
        <FloatingPokeball className="absolute top-[10%] left-[15%] w-12 h-12 opacity-20" delay={0} />
        <FloatingPokeball className="absolute top-[30%] right-[10%] w-8 h-8 opacity-15" delay={500} />
        <FloatingPokeball className="absolute bottom-[20%] left-[8%] w-10 h-10 opacity-10" delay={300} />
        <FloatingPokeball className="absolute bottom-[35%] right-[20%] w-6 h-6 opacity-20" delay={800} />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 py-12">
        {/* Logo and Header */}
        <div className="animate-slide-in-up">
          <div className="flex items-center gap-3 mb-8">
            <PokeballIcon className="w-12 h-12 md:w-14 md:h-14" />
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-[var(--color-pokeball-red)] to-[var(--color-pokemon-blue)] bg-clip-text text-transparent">
              Pokémon Battle Arena
            </h1>
          </div>
        </div>

        {/* Hero Illustration */}
        <div className="animate-slide-in-up delay-100 my-8 md:my-12">
          <div className="relative">
            <div className="animate-gentle-bounce">
              <LargePokeballIllustration />
            </div>
            {/* Sparkles around the Pokeball */}
            <Sparkle className="absolute -top-4 left-1/4 w-4 h-4 text-[var(--color-pokemon-yellow)] animate-sparkle" />
            <Sparkle className="absolute top-1/3 -right-8 w-3 h-3 text-[var(--color-pokemon-yellow)] animate-sparkle delay-300" />
            <Sparkle className="absolute -bottom-2 right-1/4 w-5 h-5 text-[var(--color-pokemon-yellow)] animate-sparkle delay-500" />
          </div>
        </div>

        {/* Value Proposition */}
        <div className="animate-slide-in-up delay-200 text-center max-w-md mb-10">
          <h2 className="text-3xl md:text-4xl font-bold text-[var(--color-pokeball-black)] mb-4">
            Battle simulator for Trainers.
          </h2>
          <p className="text-lg text-muted-foreground">
            Choose Pokémon. Run a turn-based simulation. See the outcome instantly.
          </p>
        </div>

        {/* CTAs */}
        <div className="animate-slide-in-up delay-300 flex flex-col items-center gap-4 w-full max-w-xs">
          <Button
            onClick={handleContinue}
            disabled={isNavigating}
            className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-[var(--color-pokeball-red)] to-[var(--color-pokeball-dark-red)] hover:from-[var(--color-pokeball-dark-red)] hover:to-[var(--color-pokeball-red)] text-white shadow-lg shadow-red-500/25 transition-all duration-300 hover:shadow-red-500/40 hover:scale-[1.02] active:scale-[0.98] animate-pulse-glow group"
          >
            {isNavigating ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Loading...
              </span>
            ) : (
              <>
                Continue
                <svg className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </>
            )}
          </Button>

          <button
            onClick={handleSignIn}
            disabled={isNavigating}
            className="text-muted-foreground hover:text-[var(--color-pokemon-blue)] transition-colors underline-offset-4 hover:underline text-sm"
          >
            Already a Trainer? Sign in
          </button>
        </div>

        {/* Footer tagline */}
        <p className="animate-slide-in-up delay-500 absolute bottom-8 text-sm text-muted-foreground/60">
          Catch &apos;em all. Battle &apos;em all.
        </p>
      </div>
    </main>
  );
}

// ===========================================
// Component: Pokeball Icon
// ===========================================

function PokeballIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className}>
      <circle cx="20" cy="20" r="18" fill="#EE1515" />
      <path d="M 20 38 A 18 18 0 0 1 2 20 L 38 20 A 18 18 0 0 1 20 38" fill="white" />
      <rect x="2" y="18" width="36" height="4" fill="#2D2D2D" />
      <circle cx="20" cy="20" r="6" fill="#2D2D2D" />
      <circle cx="20" cy="20" r="4" fill="white" />
    </svg>
  );
}

// ===========================================
// Component: Floating Pokeball
// ===========================================

function FloatingPokeball({ className, delay }: { className?: string; delay: number }) {
  return (
    <div
      className={`animate-float ${className}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <PokeballIcon className="w-full h-full" />
    </div>
  );
}

// ===========================================
// Component: Large Pokeball Illustration
// ===========================================

function LargePokeballIllustration() {
  return (
    <div className="relative w-48 h-48 md:w-64 md:h-64">
      {/* Outer glow */}
      <div className="absolute inset-0 rounded-full bg-[var(--color-pokeball-red)]/20 blur-xl" />

      {/* Main Pokeball */}
      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-2xl">
        {/* Red top half */}
        <defs>
          <linearGradient id="redGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FF3333" />
            <stop offset="100%" stopColor="#CC0000" />
          </linearGradient>
          <linearGradient id="whiteGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#E8E8E8" />
          </linearGradient>
          <filter id="innerShadow">
            <feOffset dx="0" dy="2" />
            <feGaussianBlur stdDeviation="2" result="offset-blur" />
            <feComposite operator="out" in="SourceGraphic" in2="offset-blur" result="inverse" />
            <feFlood floodColor="black" floodOpacity="0.2" result="color" />
            <feComposite operator="in" in="color" in2="inverse" result="shadow" />
            <feComposite operator="over" in="shadow" in2="SourceGraphic" />
          </filter>
        </defs>

        {/* Outer circle */}
        <circle cx="50" cy="50" r="48" fill="url(#redGradient)" filter="url(#innerShadow)" />

        {/* White bottom half */}
        <path
          d="M 50 98 A 48 48 0 0 1 2 50 L 98 50 A 48 48 0 0 1 50 98"
          fill="url(#whiteGradient)"
        />

        {/* Center band */}
        <rect x="2" y="46" width="96" height="8" fill="#2D2D2D" />

        {/* Center button outer */}
        <circle cx="50" cy="50" r="14" fill="#2D2D2D" />

        {/* Center button inner */}
        <circle cx="50" cy="50" r="10" fill="white" />

        {/* Center button highlight */}
        <circle cx="47" cy="47" r="3" fill="#F0F0F0" opacity="0.8" />

        {/* Top highlight */}
        <ellipse cx="35" cy="25" rx="15" ry="8" fill="white" opacity="0.3" />
      </svg>

      {/* Pokemon silhouettes around */}
      <div className="absolute -bottom-4 -left-8 opacity-30">
        <svg viewBox="0 0 40 40" className="w-12 h-12 text-[var(--color-type-fire)]" fill="currentColor">
          <path d="M20,5 Q30,15 25,25 Q30,30 20,38 Q10,30 15,25 Q10,15 20,5" />
        </svg>
      </div>
      <div className="absolute -top-4 -right-8 opacity-30">
        <svg viewBox="0 0 40 40" className="w-10 h-10 text-[var(--color-type-water)]" fill="currentColor">
          <circle cx="20" cy="20" r="15" />
          <circle cx="20" cy="25" r="8" fill="white" opacity="0.3" />
        </svg>
      </div>
      <div className="absolute bottom-0 -right-12 opacity-30">
        <svg viewBox="0 0 40 40" className="w-11 h-11 text-[var(--color-type-grass)]" fill="currentColor">
          <path d="M20,5 L30,35 L20,28 L10,35 Z" />
        </svg>
      </div>
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
