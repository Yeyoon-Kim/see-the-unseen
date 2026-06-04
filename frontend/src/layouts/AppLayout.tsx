import { CalendarDays, Home, Menu, Palette, Settings, Timer } from "lucide-react";
import { useEffect, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { AuthButton } from "../features/auth/AuthButton";
import { brand } from "../config/brand";
import { usePreferences, type TranslationKey } from "../features/preferences/preferences";
import { Sidebar } from "./Sidebar";

const bottomLinks = [
  { to: "/", labelKey: "nav.dashboard", icon: Home },
  { to: "/today", labelKey: "dashboard.todaySchedule", icon: CalendarDays },
  { to: "/courses", labelKey: "nav.fixedSchedule", icon: Timer },
  { to: "/theme", labelKey: "nav.theme", icon: Palette },
  { to: "/settings", labelKey: "nav.settings", icon: Settings }
] satisfies Array<{ to: string; labelKey: TranslationKey; icon: typeof Home }>;

export function AppLayout() {
  const { t } = usePreferences();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    if (!isMenuOpen) return undefined;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMenuOpen]);

  return (
    <div className="min-h-screen bg-paper">
      {isMenuOpen && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/20"
          aria-label="메뉴 닫기"
          onMouseDown={() => setIsMenuOpen(false)}
          onClick={() => setIsMenuOpen(false)}
        />
      )}
      {isMenuOpen && <Sidebar isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />}
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 border-b border-line bg-white/95 px-4 py-3 backdrop-blur md:px-8">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              className="flex min-h-11 min-w-0 items-center gap-2 rounded-md px-2 text-left font-bold transition hover:bg-slate-50"
              aria-label="메뉴 열기"
              aria-expanded={isMenuOpen}
              onClick={() => setIsMenuOpen(true)}
            >
              <Menu size={18} />
              <span className="truncate">{brand.fullName}</span>
            </button>
            <div className="w-28">
              <AuthButton />
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl px-4 pb-24 pt-5 md:px-8 md:py-8">
          <Outlet />
        </main>
        <nav className="mobile-safe-bottom fixed bottom-0 left-0 right-0 z-20 grid grid-cols-5 border-t border-line bg-white md:hidden">
          {bottomLinks.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-bold ${
                    isActive ? "text-blue-700" : "text-slate-500"
                  }`
                }
              >
                <Icon size={18} />
                {t(item.labelKey)}
              </NavLink>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
