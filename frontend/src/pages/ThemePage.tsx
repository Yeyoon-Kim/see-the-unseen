import { Check } from "lucide-react";
import { useState } from "react";
import { themes, usePreferences } from "../features/preferences/preferences";
import { ThemePreview, ThemeSwatch } from "../features/theme/ThemePreview";

export function ThemePage() {
  const { setThemeId, t, themeId } = usePreferences();
  const [previewId, setPreviewId] = useState(themeId);
  const previewTheme = themes.find((theme) => theme.id === previewId) ?? themes[0];

  return (
    <div className="grid gap-5">
      <div>
        <h1 className="text-2xl font-bold">{t("theme.title")}</h1>
        <p className="mt-1 text-sm text-slate-500">{t("theme.description")}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {themes.map((theme) => {
          const selected = previewId === theme.id;
          const active = themeId === theme.id;

          return (
            <button
              key={theme.id}
              className={`card flex items-center justify-between gap-3 text-left transition ${
                selected ? "border-blue-600" : ""
              }`}
              type="button"
              onClick={() => setPreviewId(theme.id)}
            >
              <div className="flex min-w-0 items-center gap-3">
                <ThemeSwatch colors={theme.colors} />
                <div className="min-w-0">
                  <div className="font-bold">{theme.name}</div>
                  <div className="mt-1 flex gap-1">
                    {theme.colors.map((color) => (
                      <span key={color} className="h-2 w-6 rounded-sm" style={{ backgroundColor: color }} />
                    ))}
                  </div>
                </div>
              </div>
              {active && (
                <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-1 text-xs font-bold text-blue-700">
                  <Check size={13} />
                  {t("theme.current")}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <ThemePreview theme={previewTheme} />

      <div className="flex justify-end">
        <button className="btn-primary" type="button" onClick={() => setThemeId(previewTheme.id)}>
          <Check size={16} />
          {t("button.apply")}
        </button>
      </div>
    </div>
  );
}
