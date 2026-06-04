import { CalendarDays, Home, Menu, Palette, Settings, Timer } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import { AuthButton } from "../features/auth/AuthButton";
import { brand } from "../config/brand";
import { usePreferences, type TranslationKey } from "../features/preferences/preferences";
import { Sidebar } from "./Sidebar";

const mobileLinks = [
  ["/", "nav.dashboard"],
  ["/courses", "nav.fixedSchedule"],
  ["/theme", "nav.theme"],
  ["/settings", "nav.settings"]
] satisfies Array<[string, TranslationKey]>;

const bottomLinks = [
  { to: "/", labelKey: "nav.dashboard", icon: Home },
  { to: "/today", labelKey: "dashboard.todaySchedule", icon: CalendarDays },
  { to: "/courses", labelKey: "nav.fixedSchedule", icon: Timer },
  { to: "/theme", labelKey: "nav.theme", icon: Palette },
  { to: "/settings", labelKey: "nav.settings", icon: Settings }
] satisfies Array<{ to: string; labelKey: TranslationKey; icon: typeof Home }>;

export function AppLayout() {
  const { t } = usePreferences();

  return (
    <div className="min-h-screen bg-paper md:flex">
      <Sidebar />
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-10 border-b border-line bg-white/95 px-4 py-3 backdrop-blur md:hidden">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2 font-bold">
              <Menu size={18} />
              <span className="truncate">{brand.shortName}</span>
            </div>
            <div className="w-28">
              <AuthButton />
            </div>
          </div>
          <nav className="flex gap-2 overflow-x-auto pb-1">
            {mobileLinks.map(([to, labelKey]) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-semibold ${
                    isActive ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700"
                  }`
                }
              >
                {t(labelKey)}
              </NavLink>
            ))}
          </nav>
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
