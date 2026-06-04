import {
  GraduationCap,
  Home,
  LayoutDashboard,
  Palette,
  Settings,
  X
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

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { t } = usePreferences();

  return (
    <aside
      aria-hidden={!isOpen}
      className={clsx(
        "drawer-panel fixed bottom-0 left-0 top-0 z-40 flex w-[min(82vw,280px)] flex-col border-r border-line bg-white px-4 py-5 shadow-soft transition-transform duration-200",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >
      <div className="mb-6 flex items-center justify-between gap-3 px-2">
        <NavLink to="/" className="flex min-w-0 items-center gap-3" onClick={onClose}>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-ink text-white">
            <Home size={18} />
          </span>
          <div className="min-w-0">
            <div className="truncate text-sm font-bold">{brand.fullName}</div>
          </div>
        </NavLink>
        <button
          type="button"
          className="btn-secondary min-h-9 px-2"
          aria-label="메뉴 닫기"
          onMouseDown={onClose}
          onClick={onClose}
        >
          <X size={16} />
          <span className="sr-only">메뉴 닫기</span>
        </button>
      </div>
      <nav className="space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
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
