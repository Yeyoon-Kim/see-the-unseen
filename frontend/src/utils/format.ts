export function parseJsonList(value?: string | null): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.map(String);
    if (Array.isArray(parsed.checklist)) return parsed.checklist.map(String);
    if (Array.isArray(parsed.questions)) return parsed.questions.map(String);
    if (Array.isArray(parsed.tags)) return parsed.tags.map(String);
    return [];
  } catch {
    return value
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
  }
}

export function parseJsonObject<T>(value?: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export function courseTypeLabel(type?: string) {
  const labels: Record<string, string> = {
    undergraduate: "일정",
    graduate: "일정",
    seminar: "세미나",
    research: "프로젝트"
  };
  return labels[type ?? ""] ?? type ?? "일정";
}
