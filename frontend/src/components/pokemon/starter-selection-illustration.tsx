"use client";

export function StarterSelectionIllustration() {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Floating sparkles */}
        <div className="absolute top-[15%] left-[20%] w-3 h-3 bg-[var(--color-pokemon-yellow)] rounded-full animate-sparkle opacity-70" />
        <div className="absolute top-[30%] right-[15%] w-2 h-2 bg-[var(--color-pokemon-mint)] rounded-full animate-sparkle delay-300 opacity-60" />
        <div className="absolute bottom-[25%] left-[15%] w-4 h-4 bg-[var(--color-pokemon-light-blue)] rounded-full animate-sparkle delay-500 opacity-50" />
        <div className="absolute top-[55%] right-[20%] w-2 h-2 bg-[var(--color-pokeball-red)] rounded-full animate-sparkle delay-700 opacity-70" />

        {/* Background circles */}
        <div className="absolute top-[10%] left-[5%] w-40 h-40 bg-[var(--color-pokemon-mint)]/25 rounded-full blur-xl" />
        <div className="absolute bottom-[5%] right-[10%] w-56 h-56 bg-[var(--color-pokemon-light-blue)]/20 rounded-full blur-xl" />
        <div className="absolute top-[50%] left-[30%] w-32 h-32 bg-[var(--color-pokemon-yellow)]/15 rounded-full blur-lg" />
      </div>

      {/* Professor Oak style figure (silhouette) */}
      <div className="absolute top-[8%] left-1/2 transform -translate-x-1/2 opacity-20">
        <svg viewBox="0 0 100 120" className="w-24 h-28">
          <defs>
            <linearGradient id="coatGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#F5F5F5" />
              <stop offset="100%" stopColor="#E0E0E0" />
            </linearGradient>
          </defs>
          {/* Head */}
          <ellipse cx="50" cy="20" rx="18" ry="20" fill="#8B7355" />
          {/* Hair */}
          <path d="M 32 15 Q 35 5 50 8 Q 65 5 68 15 Q 70 10 65 20 L 35 20 Q 30 10 32 15" fill="#808080" />
          {/* Body/Lab coat */}
          <path d="M 30 40 Q 25 35 30 30 L 70 30 Q 75 35 70 40 L 75 100 L 25 100 Z" fill="url(#coatGradient)" />
          {/* Arms */}
          <path d="M 25 45 Q 15 50 20 70 L 28 68 Q 25 55 30 50" fill="url(#coatGradient)" />
          <path d="M 75 45 Q 85 50 80 70 L 72 68 Q 75 55 70 50" fill="url(#coatGradient)" />
          {/* Welcoming gesture */}
          <ellipse cx="18" cy="72" rx="8" ry="6" fill="#DEB887" />
          <ellipse cx="82" cy="72" rx="8" ry="6" fill="#DEB887" />
        </svg>
      </div>

      {/* "Choose Your Starter" text area */}
      <div className="absolute top-[28%] left-1/2 transform -translate-x-1/2 text-center">
        <p className="text-lg font-bold text-muted-foreground/40 tracking-wider">
          BEGIN YOUR JOURNEY
        </p>
      </div>

      {/* Three starter Pokemon on pedestals */}
      <div className="flex items-end justify-center gap-8 mt-16">
        {/* Grass starter - Left */}
        <div className="flex flex-col items-center animate-float delay-100">
          <svg viewBox="0 0 80 90" className="w-20 h-24 drop-shadow-lg">
            <defs>
              <linearGradient id="greenStarterBody" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#8FD9A8" />
                <stop offset="100%" stopColor="#52B788" />
              </linearGradient>
              <linearGradient id="bulbGradient2" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#52B788" />
                <stop offset="100%" stopColor="#95D5B2" />
              </linearGradient>
            </defs>
            {/* Body */}
            <ellipse cx="40" cy="60" rx="28" ry="22" fill="url(#greenStarterBody)" />
            {/* Spots */}
            <ellipse cx="28" cy="55" rx="7" ry="5" fill="#40916C" opacity="0.5" />
            <ellipse cx="52" cy="60" rx="6" ry="4" fill="#40916C" opacity="0.5" />
            {/* Bulb */}
            <ellipse cx="40" cy="32" rx="20" ry="24" fill="url(#bulbGradient2)" />
            {/* Bulb leaves */}
            <path d="M 40 10 Q 28 18 34 35 Q 40 22 40 10 Z" fill="#2D6A4F" />
            <path d="M 40 10 Q 52 18 46 35 Q 40 22 40 10 Z" fill="#40916C" />
            <path d="M 40 5 Q 38 -2 42 8 Q 40 4 38 8 Q 42 -2 40 5 Z" fill="#52B788" />
            {/* Face */}
            <circle cx="32" cy="55" r="4" fill="#2D2D2D" />
            <circle cx="48" cy="55" r="4" fill="#2D2D2D" />
            <circle cx="31" cy="54" r="1.5" fill="white" />
            <circle cx="47" cy="54" r="1.5" fill="white" />
            {/* Smile */}
            <path d="M 36 62 Q 40 66 44 62" stroke="#2D2D2D" strokeWidth="2" fill="none" />
            {/* Legs */}
            <ellipse cx="22" cy="78" rx="8" ry="5" fill="url(#greenStarterBody)" />
            <ellipse cx="58" cy="78" rx="8" ry="5" fill="url(#greenStarterBody)" />
          </svg>
          {/* Pedestal */}
          <div className="w-24 h-4 bg-gradient-to-b from-emerald-400/60 to-emerald-600/60 rounded-full mt-2 shadow-lg shadow-emerald-500/30" />
          <div className="w-20 h-8 bg-gradient-to-b from-emerald-500/50 to-emerald-700/50 rounded-b-lg -mt-1" />
        </div>

        {/* Fire starter - Center (slightly elevated) */}
        <div className="flex flex-col items-center animate-float -mt-8">
          <svg viewBox="0 0 90 100" className="w-24 h-28 drop-shadow-lg">
            <defs>
              <linearGradient id="orangeStarterBody" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FF8C42" />
                <stop offset="100%" stopColor="#E85D04" />
              </linearGradient>
              <linearGradient id="flameGradient2" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#FF6B35" />
                <stop offset="50%" stopColor="#FFB627" />
                <stop offset="100%" stopColor="#FFE066" />
              </linearGradient>
            </defs>
            {/* Body */}
            <ellipse cx="45" cy="58" rx="30" ry="32" fill="url(#orangeStarterBody)" />
            {/* Belly */}
            <ellipse cx="45" cy="62" rx="20" ry="22" fill="#FFF3C4" opacity="0.8" />
            {/* Head */}
            <circle cx="45" cy="28" r="24" fill="url(#orangeStarterBody)" />
            {/* Eyes */}
            <ellipse cx="36" cy="24" rx="6" ry="7" fill="white" />
            <ellipse cx="54" cy="24" rx="6" ry="7" fill="white" />
            <circle cx="37" cy="25" r="4" fill="#2D2D2D" />
            <circle cx="55" cy="25" r="4" fill="#2D2D2D" />
            <circle cx="36" cy="23" r="1.5" fill="white" />
            <circle cx="54" cy="23" r="1.5" fill="white" />
            {/* Snout */}
            <ellipse cx="45" cy="35" rx="8" ry="6" fill="url(#orangeStarterBody)" />
            <circle cx="42" cy="34" r="2" fill="#2D2D2D" />
            <circle cx="48" cy="34" r="2" fill="#2D2D2D" />
            {/* Smile */}
            <path d="M 40 40 Q 45 44 50 40" stroke="#2D2D2D" strokeWidth="2" fill="none" />
            {/* Flame tail */}
            <path d="M 75 55 Q 90 48 86 35 Q 82 42 84 28 Q 78 38 82 22 Q 74 35 72 45 Z" fill="url(#flameGradient2)" />
            {/* Arms */}
            <ellipse cx="18" cy="55" rx="8" ry="10" fill="url(#orangeStarterBody)" />
            <ellipse cx="72" cy="55" rx="8" ry="10" fill="url(#orangeStarterBody)" />
          </svg>
          {/* Pedestal */}
          <div className="w-28 h-5 bg-gradient-to-b from-orange-400/60 to-orange-600/60 rounded-full mt-2 shadow-lg shadow-orange-500/30" />
          <div className="w-24 h-10 bg-gradient-to-b from-orange-500/50 to-orange-700/50 rounded-b-lg -mt-1" />
        </div>

        {/* Water starter - Right */}
        <div className="flex flex-col items-center animate-float delay-200">
          <svg viewBox="0 0 85 95" className="w-20 h-24 drop-shadow-lg">
            <defs>
              <linearGradient id="blueStarterBody" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#74C0FC" />
                <stop offset="100%" stopColor="#339AF0" />
              </linearGradient>
              <linearGradient id="shellGradient2" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#8B5A2B" />
                <stop offset="100%" stopColor="#5D3A1A" />
              </linearGradient>
            </defs>
            {/* Shell */}
            <ellipse cx="42" cy="50" rx="32" ry="28" fill="url(#shellGradient2)" />
            <ellipse cx="42" cy="48" rx="26" ry="22" fill="#C4956A" />
            {/* Shell pattern */}
            <path d="M 42 30 L 32 48 L 42 65 L 52 48 Z" fill="url(#shellGradient2)" opacity="0.6" />
            <path d="M 22 42 L 32 48 L 26 62 Z" fill="url(#shellGradient2)" opacity="0.6" />
            <path d="M 62 42 L 52 48 L 58 62 Z" fill="url(#shellGradient2)" opacity="0.6" />
            {/* Head */}
            <circle cx="42" cy="22" r="18" fill="url(#blueStarterBody)" />
            {/* Eyes */}
            <circle cx="35" cy="20" r="5" fill="white" />
            <circle cx="49" cy="20" r="5" fill="white" />
            <circle cx="36" cy="20" r="3" fill="#2D2D2D" />
            <circle cx="50" cy="20" r="3" fill="#2D2D2D" />
            <circle cx="35" cy="19" r="1" fill="white" />
            <circle cx="49" cy="19" r="1" fill="white" />
            {/* Smile */}
            <path d="M 38 28 Q 42 32 46 28" stroke="#2D2D2D" strokeWidth="2" fill="none" />
            {/* Tail */}
            <path d="M 42 78 Q 42 88 50 85 Q 42 82 42 78" fill="url(#blueStarterBody)" />
            {/* Legs/Flippers */}
            <ellipse cx="18" cy="58" rx="10" ry="8" fill="url(#blueStarterBody)" />
            <ellipse cx="66" cy="58" rx="10" ry="8" fill="url(#blueStarterBody)" />
          </svg>
          {/* Pedestal */}
          <div className="w-24 h-4 bg-gradient-to-b from-blue-400/60 to-blue-600/60 rounded-full mt-2 shadow-lg shadow-blue-500/30" />
          <div className="w-20 h-8 bg-gradient-to-b from-blue-500/50 to-blue-700/50 rounded-b-lg -mt-1" />
        </div>
      </div>

      {/* Bottom text */}
      <div className="absolute bottom-[8%] left-1/2 transform -translate-x-1/2 text-center">
        <p className="text-sm text-muted-foreground/50 font-medium">
          Every champion was once a beginner
        </p>
      </div>

      {/* Decorative Pokeballs */}
      <div className="absolute bottom-[20%] left-[8%] opacity-20">
        <svg viewBox="0 0 40 40" className="w-10 h-10">
          <circle cx="20" cy="20" r="18" fill="#EE1515" />
          <path d="M 20 38 A 18 18 0 0 1 2 20 L 38 20 A 18 18 0 0 1 20 38" fill="white" />
          <rect x="2" y="18" width="36" height="4" fill="#2D2D2D" />
          <circle cx="20" cy="20" r="6" fill="#2D2D2D" />
          <circle cx="20" cy="20" r="4" fill="white" />
        </svg>
      </div>

      <div className="absolute bottom-[25%] right-[10%] opacity-15">
        <svg viewBox="0 0 40 40" className="w-8 h-8">
          <circle cx="20" cy="20" r="18" fill="#EE1515" />
          <path d="M 20 38 A 18 18 0 0 1 2 20 L 38 20 A 18 18 0 0 1 20 38" fill="white" />
          <rect x="2" y="18" width="36" height="4" fill="#2D2D2D" />
          <circle cx="20" cy="20" r="6" fill="#2D2D2D" />
          <circle cx="20" cy="20" r="4" fill="white" />
        </svg>
      </div>
    </div>
  );
}
