import type { ThemeOption } from "../preferences/preferences";
import { themeToTokens, usePreferences } from "../preferences/preferences";

interface Props {
  theme: ThemeOption;
}

export function ThemeSwatch({ colors }: { colors: ThemeOption["colors"] }) {
  return (
    <div className="grid aspect-square w-12 shrink-0 grid-cols-2 overflow-hidden rounded-md border border-line">
      {colors.map((color) => (
        <span key={color} style={{ backgroundColor: color }} />
      ))}
    </div>
  );
}

export function ThemePreview({ theme }: Props) {
  const { t } = usePreferences();
  const tokens = themeToTokens(theme);

  return (
    <section className="card grid gap-4">
      <div className="flex items-center gap-3">
        <ThemeSwatch colors={theme.colors} />
        <div>
          <h2 className="text-base font-bold">{t("theme.preview")}</h2>
          <div className="text-sm font-semibold text-slate-500">{theme.name}</div>
        </div>
      </div>

      <div
        className="rounded-lg border p-4"
        style={{
          backgroundColor: tokens.background,
          borderColor: tokens.border,
          color: tokens.text
        }}
      >
        <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            t("dashboard.todayTasks"),
            t("dashboard.todaySchedule"),
            t("dashboard.dday"),
            t("dashboard.fileUpload")
          ].map((label, index) => (
            <div
              key={label}
              className="rounded-md border px-2 py-2 text-center text-[11px] font-bold"
              style={{
                backgroundColor: index === 0 ? tokens.strong : tokens.large,
                borderColor: index === 0 ? tokens.strong : tokens.border,
                color: index === 0 ? tokens.onStrong : tokens.text
              }}
            >
              {label}
            </div>
          ))}
        </div>

        <div
          className="grid gap-2 rounded-md border p-3"
          style={{ backgroundColor: tokens.large, borderColor: tokens.border }}
        >
          <div className="flex items-center justify-between">
            <div className="text-sm font-bold">{t("dashboard.todaySchedule")}</div>
            <div
              className="rounded-md px-2 py-1 text-[11px] font-bold"
              style={{ backgroundColor: tokens.small, color: tokens.text }}
            >
              {t("fixed.defaultClass")}
            </div>
          </div>
          <div
            className="relative h-28 rounded-md border"
            style={{ backgroundColor: tokens.medium, borderColor: tokens.border }}
          >
            <div className="absolute left-0 right-0 top-8 border-t" style={{ borderColor: tokens.border }} />
            <div className="absolute left-0 right-0 top-16 border-t" style={{ borderColor: tokens.border }} />
            <div
              className="absolute left-12 right-3 top-4 rounded-md border px-2 py-1"
              style={{
                height: 56,
                backgroundColor: tokens.small,
                borderColor: tokens.strong
              }}
            >
              <div className="text-[11px] font-bold" style={{ color: tokens.strong }}>
                09:00 - 10:30
              </div>
              <div className="truncate text-xs font-bold">Seminar</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
