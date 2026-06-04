import {
  GraduationCap,
  Home,
  LayoutDashboard,
  Palette,
  Settings
} from "lucide-react";
import { NavLink } from "react-router-dom";
import clsx from "clsx";
import { AuthButton } from "../features/auth/AuthButton";
import { usePreferences, type TranslationKey } from "../features/preferences/preferences";
import { brand } from "../config/brand";

const navItems = [
  { to: "/", labelKey: "nav.dashboard", icon: LayoutDashboard },
  { to: "/courses", labelKey: "nav.fixedSchedule", icon: GraduationCap },
  { to: "/theme", labelKey: "nav.theme", icon: Palette },
  { to: "/settings", labelKey: "nav.settings", icon: Settings }
] satisfies Array<{
  to: string;
  labelKey: TranslationKey;
  icon: typeof LayoutDashboard;
}>;

export function Sidebar() {
  const { t } = usePreferences();

  return (
    <aside className="sticky top-0 hidden h-screen w-64 border-r border-line bg-white px-4 py-5 md:flex md:flex-col">
      <NavLink to="/" className="mb-6 flex items-center gap-3 px-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-md bg-ink text-white">
          <Home size={18} />
        </span>
        <div>
          <div className="text-sm font-bold">{brand.shortName}</div>
        </div>
      </NavLink>
      <nav className="space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                clsx(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold transition",
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-ink"
                )
              }
            >
              <Icon size={18} />
              {t(item.labelKey)}
            </NavLink>
          );
        })}
      </nav>
      <div className="mt-auto">
        <AuthButton />
      </div>
    </aside>
  );
}
