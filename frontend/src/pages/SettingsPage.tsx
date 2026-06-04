import { Download } from "lucide-react";
import { calendarUrl } from "../api/client";
import { usePreferences, type Language } from "../features/preferences/preferences";
import { readSyncQueue } from "../features/sync/syncService";
import { useOnlineStatus } from "../features/sync/useOnlineStatus";

const timezones = [
  "Asia/Seoul",
  "UTC",
  "Asia/Tokyo",
  "America/New_York",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris"
];

export function SettingsPage() {
  const { language, setLanguage, setTimezone, timezone, t } = usePreferences();
  const isOnline = useOnlineStatus();
  const pendingSyncCount = readSyncQueue().length;

  return (
    <div className="grid gap-5">
      <div>
        <h1 className="text-2xl font-bold">{t("settings.title")}</h1>
        <p className="mt-1 text-sm text-slate-500">{t("settings.description")}</p>
      </div>

      <section className="card grid gap-4">
        <label className="grid gap-2 text-sm font-bold">
          {t("settings.language")}
          <select
            className="field"
            value={language}
            onChange={(event) => setLanguage(event.target.value as Language)}
          >
            <option value="ko">{t("settings.korean")}</option>
            <option value="en">{t("settings.english")}</option>
          </select>
        </label>

        <label className="grid gap-2 text-sm font-bold">
          {t("settings.timezone")}
          <select
            className="field"
            value={timezone}
            onChange={(event) => setTimezone(event.target.value)}
          >
            {timezones.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className="card grid gap-2">
        <h2 className="text-base font-bold">Sync</h2>
        <div className="flex flex-wrap gap-2 text-sm font-semibold text-slate-600">
          <span className="rounded-md bg-slate-100 px-2 py-1">
            {isOnline ? "Online" : "Offline"}
          </span>
          <span className="rounded-md bg-slate-100 px-2 py-1">
            Pending {pendingSyncCount}
          </span>
        </div>
      </section>

      <section className="card grid gap-3">
        <h2 className="text-base font-bold">{t("settings.calendar")}</h2>
        <div className="flex flex-wrap gap-2">
          <a className="btn-secondary" href={calendarUrl("/calendar/export")}>
            <Download size={16} />
            {t("settings.all")}
          </a>
          <a className="btn-secondary" href={calendarUrl("/calendar/export?type=assignments")}>
            <Download size={16} />
            {t("settings.assignments")}
          </a>
          <a className="btn-secondary" href={calendarUrl("/calendar/export?type=events")}>
            <Download size={16} />
            {t("settings.events")}
          </a>
        </div>
      </section>
    </div>
  );
}
