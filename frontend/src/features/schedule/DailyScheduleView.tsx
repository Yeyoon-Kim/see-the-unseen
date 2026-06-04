import type { Course } from "../../types";
import { courseToFixedSchedule, timeToMinutes, todayDayLabel } from "../../utils/fixedSchedule";

interface Props {
  courses: Course[];
  date?: Date;
  emptyTitle?: string;
  locale?: string;
}

const hourHeight = 64;

function colorWithAlpha(color: string, alphaHex: string) {
  return /^#[0-9a-fA-F]{6}$/.test(color) ? `${color}${alphaHex}` : "#5E6B7314";
}

export function DailyScheduleView({
  courses,
  date = new Date(),
  emptyTitle = "오늘 등록된 일정이 없습니다.",
  locale = "ko-KR"
}: Props) {
  const today = todayDayLabel(date);
  const dateLabel = new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long"
  }).format(date);
  const events = courses
    .map(courseToFixedSchedule)
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .filter((item) => item.selectedDays.includes(today))
    .map((item) => ({
      ...item,
      startMinutes: timeToMinutes(item.startTime) ?? 0,
      endMinutes: timeToMinutes(item.endTime) ?? 0
    }))
    .sort((a, b) => a.startMinutes - b.startMinutes);

  if (!events.length) {
    return (
      <div className="grid gap-3">
        <div className="text-sm font-bold text-ink">{dateLabel}</div>
        <div className="flex min-h-64 items-center justify-center rounded-md border border-line bg-white px-4 text-center text-sm font-semibold text-slate-500">
          {emptyTitle}
        </div>
      </div>
    );
  }

  const startHour = Math.min(7, Math.floor(Math.min(...events.map((item) => item.startMinutes)) / 60));
  const endHour = Math.max(22, Math.ceil(Math.max(...events.map((item) => item.endMinutes)) / 60));
  const hours = Array.from({ length: endHour - startHour + 1 }, (_, index) => startHour + index);
  const canvasHeight = (endHour - startHour) * hourHeight;

  return (
    <div className="grid gap-3">
      <div className="text-sm font-bold text-ink">{dateLabel}</div>
      <div className="overflow-x-auto rounded-md border border-line bg-white">
        <div className="relative min-w-[520px]" style={{ height: canvasHeight }}>
          {hours.map((hour) => {
            const top = (hour - startHour) * hourHeight;
            return (
              <div key={hour} className="absolute left-0 right-0" style={{ top }}>
                <div className="grid grid-cols-[64px_1fr] text-xs text-slate-400">
                  <div className="-translate-y-2 pr-3 text-right">
                    {String(hour).padStart(2, "0")}:00
                  </div>
                  <div className="border-t border-slate-100" />
                </div>
              </div>
            );
          })}

          {events.map((event) => {
            const top = ((event.startMinutes - startHour * 60) / 60) * hourHeight;
            const height = Math.max(((event.endMinutes - event.startMinutes) / 60) * hourHeight, 36);

            return (
              <div
                key={event.id}
                className="absolute left-[76px] right-3 overflow-hidden rounded-md border px-3 py-2 shadow-sm"
                style={{
                  top,
                  height,
                  borderColor: event.color,
                  backgroundColor: colorWithAlpha(event.color, "18")
                }}
              >
                <div className="flex items-center justify-between gap-2 text-xs font-bold">
                  <span className="truncate" style={{ color: event.color }}>
                    {event.startTime} - {event.endTime}
                  </span>
                  <span className="shrink-0 rounded-md bg-white/80 px-1.5 py-0.5 text-[11px] text-slate-500">
                    {event.category}
                  </span>
                </div>
                <div className="mt-1 truncate text-sm font-bold text-ink">{event.title}</div>
                {(event.location || event.memo) && (
                  <div className="mt-1 truncate text-xs text-slate-500">
                    {[event.location, event.memo].filter(Boolean).join(" · ")}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
