"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  path: string;
  icon: string;
  activeIcon: string;
  label: string;
  matchPaths?: string[];
}

const NAV_ITEMS: NavItem[] = [
  {
    path: "/dashboard",
    icon: "🏠",
    activeIcon: "🏠",
    label: "Home",
    matchPaths: ["/dashboard"],
  },
  {
    path: "/battle/new",
    icon: "⚔️",
    activeIcon: "⚔️",
    label: "Battle",
    matchPaths: ["/battle"],
  },
  {
    path: "/scoreboard",
    icon: "🏆",
    activeIcon: "🏆",
    label: "Scoreboard",
    matchPaths: ["/scoreboard"],
  },
];

export function BottomNavigation() {
  const pathname = usePathname();

  const isActive = (item: NavItem) => {
    if (item.matchPaths) {
      return item.matchPaths.some((p) => pathname.startsWith(p));
    }
    return pathname === item.path;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 lg:hidden z-50">
      <div className="flex items-center justify-around py-2 pb-safe">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item);
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`relative flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-all duration-200 ${
                active
                  ? "text-[var(--color-pokeball-red)] scale-105"
                  : "text-muted-foreground hover:text-[var(--color-pokeball-red)] hover:scale-105"
              }`}
            >
              <span className={`text-xl transition-transform duration-200 ${active ? "scale-110" : ""}`}>
                {active ? item.activeIcon : item.icon}
              </span>
              <span className={`text-xs transition-all duration-200 ${active ? "font-bold" : ""}`}>
                {item.label}
              </span>
              {active && (
                <div className="absolute -bottom-1 w-1 h-1 rounded-full bg-[var(--color-pokeball-red)] animate-pulse" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

// Desktop sidebar navigation (for future use)
export function SidebarNavigation() {
  const pathname = usePathname();

  const isActive = (item: NavItem) => {
    if (item.matchPaths) {
      return item.matchPaths.some((p) => pathname.startsWith(p));
    }
    return pathname === item.path;
  };

  return (
    <nav className="hidden lg:flex flex-col gap-1 p-4 w-64 bg-white border-r border-gray-200 h-screen sticky top-0">
      {/* Logo */}
      <div className="flex items-center gap-2 px-3 py-4 mb-4">
        <svg viewBox="0 0 40 40" className="w-8 h-8">
          <circle cx="20" cy="20" r="18" fill="#EE1515" />
          <path d="M 20 38 A 18 18 0 0 1 2 20 L 38 20 A 18 18 0 0 1 20 38" fill="white" />
          <rect x="2" y="18" width="36" height="4" fill="#2D2D2D" />
          <circle cx="20" cy="20" r="6" fill="#2D2D2D" />
          <circle cx="20" cy="20" r="4" fill="white" />
        </svg>
        <span className="font-bold text-lg">Battle Arena</span>
      </div>

      {/* Nav Items */}
      {NAV_ITEMS.map((item) => {
        const active = isActive(item);
        return (
          <Link
            key={item.path}
            href={item.path}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
              active
                ? "bg-[var(--color-pokeball-red)]/10 text-[var(--color-pokeball-red)]"
                : "text-muted-foreground hover:bg-gray-100 hover:text-foreground"
            }`}
          >
            <span className="text-xl">{item.icon}</span>
            <span className={`${active ? "font-semibold" : ""}`}>
              {item.label}
            </span>
          </Link>
        );
      })}

      {/* Secondary Links */}
      <div className="mt-auto pt-4 border-t border-gray-200">
        <Link
          href="/history"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-gray-100 hover:text-foreground transition-colors"
        >
          <span className="text-xl">📜</span>
          <span>Battle History</span>
        </Link>
      </div>
    </nav>
  );
}
