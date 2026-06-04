import type { Course } from "../types";

export const dayLabels = ["월", "화", "수", "목", "금", "토", "일"];

export interface FixedScheduleInfo {
  selectedDays: string[];
  startTime: string;
  endTime: string;
  memo?: string;
}

const oldCourseTypes = new Set(["undergraduate", "graduate", "seminar", "research"]);

const legacyDayTokens: Record<string, string[]> = {
  월: ["월", "mon", "monday"],
  화: ["화", "tue", "tuesday"],
  수: ["수", "wed", "wednesday"],
  목: ["목", "thu", "thursday"],
  금: ["금", "fri", "friday"],
  토: ["토", "sat", "saturday"],
  일: ["일", "sun", "sunday"]
};

export function normalizeFixedCategory(courseType?: string | null) {
  if (!courseType || oldCourseTypes.has(courseType)) return "일정";
  return courseType;
}

export function isValidTime(value: string) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

export function timeToMinutes(value: string) {
  if (!isValidTime(value)) return null;
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

export function isValidTimeRange(startTime: string, endTime: string) {
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);
  return start !== null && end !== null && start < end;
}

export function buildClassTime(info: FixedScheduleInfo) {
  return JSON.stringify({
    selectedDays: info.selectedDays,
    startTime: info.startTime,
    endTime: info.endTime,
    memo: info.memo ?? ""
  });
}

export function parseClassTime(value?: string | null): FixedScheduleInfo | null {
  if (!value) return null;

  try {
    const parsed = JSON.parse(value) as Partial<FixedScheduleInfo>;
    const selectedDays = Array.isArray(parsed.selectedDays)
      ? parsed.selectedDays.filter((day): day is string => dayLabels.includes(String(day)))
      : [];

    if (
      selectedDays.length &&
      typeof parsed.startTime === "string" &&
      typeof parsed.endTime === "string" &&
      isValidTimeRange(parsed.startTime, parsed.endTime)
    ) {
      return {
        selectedDays,
        startTime: parsed.startTime,
        endTime: parsed.endTime,
        memo: typeof parsed.memo === "string" ? parsed.memo : ""
      };
    }
  } catch {
    // Older schedules were stored as plain text. The fallback below keeps them readable.
  }

  const lower = value.toLowerCase();
  const selectedDays = dayLabels.filter((day) =>
    legacyDayTokens[day].some((token) => lower.includes(token))
  );
  const timeMatch = value.match(/(\d{1,2}):(\d{2})\s*[-~]\s*(\d{1,2}):(\d{2})/);

  if (!selectedDays.length || !timeMatch) return null;

  const startTime = `${timeMatch[1].padStart(2, "0")}:${timeMatch[2]}`;
  const endTime = `${timeMatch[3].padStart(2, "0")}:${timeMatch[4]}`;

  if (!isValidTimeRange(startTime, endTime)) return null;
  return { selectedDays, startTime, endTime };
}

export function formatClassTime(value?: string | null) {
  const schedule = parseClassTime(value);
  if (!schedule) return value || "시간 없음";
  return `${schedule.selectedDays.join(", ")} ${schedule.startTime}-${schedule.endTime}`;
}

export function todayDayLabel(date = new Date()) {
  return ["일", "월", "화", "수", "목", "금", "토"][date.getDay()];
}

export function courseToFixedSchedule(course: Course) {
  const schedule = parseClassTime(course.classTime);
  if (!schedule) return null;

  return {
    id: course.id,
    category: normalizeFixedCategory(course.courseType),
    title: course.courseName,
    selectedDays: schedule.selectedDays,
    startTime: schedule.startTime,
    endTime: schedule.endTime,
    memo: schedule.memo || course.semester || "",
    location: course.classroom || "",
    color: course.color
  };
}
