"use client";

export function PokeballIllustration() {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Floating sparkles */}
        <div className="absolute top-[10%] left-[15%] w-3 h-3 bg-[var(--color-pokemon-yellow)] rounded-full animate-sparkle opacity-70" />
        <div className="absolute top-[25%] right-[20%] w-2 h-2 bg-[var(--color-pokemon-yellow)] rounded-full animate-sparkle delay-300 opacity-60" />
        <div className="absolute bottom-[30%] left-[25%] w-4 h-4 bg-[var(--color-pokemon-yellow)] rounded-full animate-sparkle delay-500 opacity-50" />
        <div className="absolute top-[60%] right-[15%] w-2 h-2 bg-[var(--color-pokemon-yellow)] rounded-full animate-sparkle delay-700 opacity-70" />
        <div className="absolute bottom-[15%] right-[30%] w-3 h-3 bg-[var(--color-pokemon-yellow)] rounded-full animate-sparkle delay-1000 opacity-60" />

        {/* Background circles */}
        <div className="absolute top-[5%] left-[10%] w-32 h-32 bg-[var(--color-pokemon-mint)]/20 rounded-full blur-xl" />
        <div className="absolute bottom-[10%] right-[5%] w-48 h-48 bg-[var(--color-pokemon-light-blue)]/20 rounded-full blur-xl" />
        <div className="absolute top-[40%] right-[25%] w-24 h-24 bg-[var(--color-pokeball-red)]/10 rounded-full blur-lg" />
      </div>

      {/* Main Pokeball */}
      <div className="relative animate-float">
        <svg
          viewBox="0 0 200 200"
          className="w-64 h-64 md:w-80 md:h-80 lg:w-96 lg:h-96 drop-shadow-2xl"
        >
          {/* Outer glow */}
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <linearGradient id="redGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FF3B3B" />
              <stop offset="100%" stopColor="#CC0000" />
            </linearGradient>
            <linearGradient id="whiteGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#E8E8E8" />
            </linearGradient>
            <linearGradient id="buttonGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="50%" stopColor="#F0F0F0" />
              <stop offset="100%" stopColor="#D0D0D0" />
            </linearGradient>
          </defs>

          {/* Main ball body - top half (red) */}
          <path
            d="M 100 10 A 90 90 0 0 1 190 100 L 10 100 A 90 90 0 0 1 100 10"
            fill="url(#redGradient)"
            filter="url(#glow)"
          />

          {/* Main ball body - bottom half (white) */}
          <path
            d="M 100 190 A 90 90 0 0 1 10 100 L 190 100 A 90 90 0 0 1 100 190"
            fill="url(#whiteGradient)"
            filter="url(#glow)"
          />

          {/* Center band */}
          <rect x="10" y="94" width="180" height="12" fill="#2D2D2D" />

          {/* Center button outer ring */}
          <circle cx="100" cy="100" r="28" fill="#2D2D2D" />
          <circle cx="100" cy="100" r="22" fill="#4A4A4A" />

          {/* Center button */}
          <circle
            cx="100"
            cy="100"
            r="16"
            fill="url(#buttonGradient)"
            className="animate-pulse-glow"
          />

          {/* Highlight on top */}
          <ellipse
            cx="70"
            cy="50"
            rx="25"
            ry="15"
            fill="white"
            opacity="0.4"
          />
          <ellipse
            cx="60"
            cy="45"
            rx="10"
            ry="6"
            fill="white"
            opacity="0.6"
          />
        </svg>

        {/* Battle arena platform */}
        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 w-48 h-6 bg-gradient-to-r from-transparent via-[var(--color-pokemon-blue)]/30 to-transparent rounded-full blur-sm" />
      </div>

      {/* Left creature - Pikachu-style electric mouse */}
      <div className="absolute bottom-[12%] left-[5%] opacity-30 hover:opacity-50 transition-opacity">
        <svg viewBox="0 0 80 90" className="w-20 h-24 drop-shadow-lg">
          <defs>
            <linearGradient id="yellowBody" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFE066" />
              <stop offset="100%" stopColor="#F5C518" />
            </linearGradient>
          </defs>
          {/* Body */}
          <ellipse cx="40" cy="55" rx="25" ry="28" fill="url(#yellowBody)" />
          {/* Head */}
          <circle cx="40" cy="32" r="22" fill="url(#yellowBody)" />
          {/* Left ear */}
          <path d="M 20 25 L 12 2 L 28 18 Z" fill="url(#yellowBody)" />
          <path d="M 14 8 L 12 2 L 20 12 Z" fill="#2D2D2D" />
          {/* Right ear */}
          <path d="M 60 25 L 68 2 L 52 18 Z" fill="url(#yellowBody)" />
          <path d="M 66 8 L 68 2 L 60 12 Z" fill="#2D2D2D" />
          {/* Eyes */}
          <circle cx="32" cy="30" r="5" fill="#2D2D2D" />
          <circle cx="48" cy="30" r="5" fill="#2D2D2D" />
          <circle cx="33" cy="28" r="2" fill="white" />
          <circle cx="49" cy="28" r="2" fill="white" />
          {/* Cheeks */}
          <circle cx="22" cy="38" r="6" fill="#EE6B6B" opacity="0.8" />
          <circle cx="58" cy="38" r="6" fill="#EE6B6B" opacity="0.8" />
          {/* Nose */}
          <ellipse cx="40" cy="35" rx="2" ry="1.5" fill="#2D2D2D" />
          {/* Mouth */}
          <path d="M 36 40 Q 40 44 44 40" stroke="#2D2D2D" strokeWidth="1.5" fill="none" />
          {/* Tail */}
          <path d="M 65 55 L 78 45 L 75 38 L 72 48 L 68 42 L 65 50 Z" fill="url(#yellowBody)" stroke="#C9A227" strokeWidth="1" />
        </svg>
      </div>

      {/* Right creature - Fire dragon style */}
      <div className="absolute bottom-[12%] right-[5%] opacity-30 hover:opacity-50 transition-opacity transform scale-x-[-1]">
        <svg viewBox="0 0 90 100" className="w-24 h-28 drop-shadow-lg">
          <defs>
            <linearGradient id="orangeBody" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FF8C42" />
              <stop offset="100%" stopColor="#E85D04" />
            </linearGradient>
            <linearGradient id="flameGradient" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#FF6B35" />
              <stop offset="50%" stopColor="#FFB627" />
              <stop offset="100%" stopColor="#FFE066" />
            </linearGradient>
          </defs>
          {/* Body */}
          <ellipse cx="45" cy="60" rx="28" ry="30" fill="url(#orangeBody)" />
          {/* Belly */}
          <ellipse cx="45" cy="65" rx="18" ry="20" fill="#FFF3C4" opacity="0.7" />
          {/* Head */}
          <circle cx="45" cy="30" r="22" fill="url(#orangeBody)" />
          {/* Snout */}
          <ellipse cx="45" cy="38" rx="10" ry="8" fill="url(#orangeBody)" />
          {/* Eyes */}
          <ellipse cx="36" cy="26" rx="5" ry="6" fill="white" />
          <ellipse cx="54" cy="26" rx="5" ry="6" fill="white" />
          <circle cx="37" cy="27" r="3" fill="#2D2D2D" />
          <circle cx="55" cy="27" r="3" fill="#2D2D2D" />
          <circle cx="36" cy="26" r="1" fill="white" />
          <circle cx="54" cy="26" r="1" fill="white" />
          {/* Nostrils */}
          <circle cx="41" cy="38" r="2" fill="#2D2D2D" />
          <circle cx="49" cy="38" r="2" fill="#2D2D2D" />
          {/* Flame tail */}
          <path d="M 73 55 Q 85 50 82 40 Q 78 45 80 35 Q 75 42 78 30 Q 72 40 70 48 Z" fill="url(#flameGradient)" />
          {/* Wings */}
          <path d="M 18 45 Q 5 35 8 50 Q 12 42 15 55 Z" fill="url(#orangeBody)" opacity="0.8" />
          <path d="M 72 45 Q 85 35 82 50 Q 78 42 75 55 Z" fill="url(#orangeBody)" opacity="0.8" />
          {/* Horns */}
          <path d="M 30 12 L 25 0 L 35 10 Z" fill="url(#orangeBody)" />
          <path d="M 60 12 L 65 0 L 55 10 Z" fill="url(#orangeBody)" />
        </svg>
      </div>

      {/* Top creature - Water turtle style */}
      <div className="absolute top-[8%] right-[15%] opacity-25 hover:opacity-45 transition-opacity">
        <svg viewBox="0 0 80 70" className="w-18 h-16 drop-shadow-lg">
          <defs>
            <linearGradient id="blueBody" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#74C0FC" />
              <stop offset="100%" stopColor="#339AF0" />
            </linearGradient>
            <linearGradient id="shellGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#8B5A2B" />
              <stop offset="100%" stopColor="#5D3A1A" />
            </linearGradient>
          </defs>
          {/* Shell */}
          <ellipse cx="40" cy="40" rx="28" ry="22" fill="url(#shellGradient)" />
          <ellipse cx="40" cy="38" rx="22" ry="16" fill="#C4956A" />
          {/* Shell pattern */}
          <path d="M 40 25 L 32 38 L 40 50 L 48 38 Z" fill="url(#shellGradient)" opacity="0.6" />
          <path d="M 25 35 L 32 38 L 28 48 Z" fill="url(#shellGradient)" opacity="0.6" />
          <path d="M 55 35 L 48 38 L 52 48 Z" fill="url(#shellGradient)" opacity="0.6" />
          {/* Head */}
          <circle cx="40" cy="18" r="14" fill="url(#blueBody)" />
          {/* Eyes */}
          <circle cx="35" cy="16" r="4" fill="white" />
          <circle cx="45" cy="16" r="4" fill="white" />
          <circle cx="36" cy="16" r="2" fill="#2D2D2D" />
          <circle cx="46" cy="16" r="2" fill="#2D2D2D" />
          {/* Mouth */}
          <path d="M 36 23 Q 40 26 44 23" stroke="#2D2D2D" strokeWidth="1.5" fill="none" />
          {/* Legs */}
          <ellipse cx="18" cy="45" rx="8" ry="6" fill="url(#blueBody)" />
          <ellipse cx="62" cy="45" rx="8" ry="6" fill="url(#blueBody)" />
          {/* Tail */}
          <ellipse cx="40" cy="62" rx="6" ry="4" fill="url(#blueBody)" />
        </svg>
      </div>

      {/* Top left - Grass bulb creature */}
      <div className="absolute top-[15%] left-[10%] opacity-25 hover:opacity-45 transition-opacity">
        <svg viewBox="0 0 70 80" className="w-16 h-20 drop-shadow-lg">
          <defs>
            <linearGradient id="greenBody" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#8FD9A8" />
              <stop offset="100%" stopColor="#52B788" />
            </linearGradient>
            <linearGradient id="bulbGradient" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#52B788" />
              <stop offset="100%" stopColor="#95D5B2" />
            </linearGradient>
          </defs>
          {/* Body */}
          <ellipse cx="35" cy="55" rx="25" ry="20" fill="url(#greenBody)" />
          {/* Spots */}
          <ellipse cx="25" cy="50" rx="6" ry="5" fill="#40916C" opacity="0.5" />
          <ellipse cx="45" cy="55" rx="5" ry="4" fill="#40916C" opacity="0.5" />
          {/* Bulb */}
          <ellipse cx="35" cy="28" rx="18" ry="22" fill="url(#bulbGradient)" />
          {/* Bulb leaves */}
          <path d="M 35 8 Q 25 15 30 28 Q 35 18 35 8 Z" fill="#2D6A4F" />
          <path d="M 35 8 Q 45 15 40 28 Q 35 18 35 8 Z" fill="#40916C" />
          <path d="M 35 5 Q 35 0 38 8 Q 35 6 32 8 Q 35 0 35 5 Z" fill="#52B788" />
          {/* Face */}
          <circle cx="28" cy="50" r="3" fill="#2D2D2D" />
          <circle cx="42" cy="50" r="3" fill="#2D2D2D" />
          <circle cx="27" cy="49" r="1" fill="white" />
          <circle cx="41" cy="49" r="1" fill="white" />
          {/* Mouth */}
          <path d="M 32 56 Q 35 58 38 56" stroke="#2D2D2D" strokeWidth="1.5" fill="none" />
          {/* Legs */}
          <ellipse cx="20" cy="70" rx="6" ry="4" fill="url(#greenBody)" />
          <ellipse cx="50" cy="70" rx="6" ry="4" fill="url(#greenBody)" />
        </svg>
      </div>
    </div>
  );
}
