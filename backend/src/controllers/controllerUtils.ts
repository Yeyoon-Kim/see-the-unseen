import { AppError } from "../middleware/errorHandler";

export function requireString(value: unknown, name: string) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new AppError(400, `${name} 값이 필요합니다.`);
  }

  return value.trim();
}

export function optionalString(value: unknown) {
  if (value === undefined || value === null || value === "") return undefined;
  return String(value);
}

export function optionalDate(value: unknown) {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return undefined;
  return date;
}

export function optionalNumber(value: unknown) {
  if (value === undefined || value === null || value === "") return undefined;
  const number = Number(value);
  return Number.isNaN(number) ? undefined : number;
}

export function jsonString(value: unknown) {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value === "string") return value;
  return JSON.stringify(value);
}

export function dateOnly(value?: Date | null) {
  if (!value) return undefined;
  return value.toISOString().slice(0, 10);
}
