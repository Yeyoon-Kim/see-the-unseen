import {
  differenceInCalendarDays,
  format,
  isValid,
  parseISO
} from "date-fns";

export function asDate(value?: string | null) {
  if (!value) return null;
  const date = parseISO(value);
  return isValid(date) ? date : null;
}

export function formatDate(value?: string | null) {
  const date = asDate(value);
  return date ? format(date, "yyyy-MM-dd") : "날짜 없음";
}

export function inputDate(value?: string | null) {
  const date = asDate(value);
  return date ? format(date, "yyyy-MM-dd") : "";
}

export function daysUntil(value?: string | null) {
  const date = asDate(value);
  if (!date) return null;
  return differenceInCalendarDays(date, new Date());
}

export function isUrgent(value?: string | null) {
  const days = daysUntil(value);
  return days !== null && days >= 0 && days <= 3;
}

export function dDay(value?: string | null) {
  const days = daysUntil(value);
  if (days === null) return "D-?";
  if (days === 0) return "D-Day";
  return days > 0 ? `D-${days}` : `D+${Math.abs(days)}`;
}

