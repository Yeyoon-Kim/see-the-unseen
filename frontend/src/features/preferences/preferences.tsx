import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { brand } from "../../config/brand";
import { cacheCollection, enqueueSync } from "../sync/syncService";

export type Language = "ko" | "en";

export interface ThemeOption {
  id: string;
  name: string;
  colors: [string, string, string, string];
  accent: string;
  border?: string;
}

interface ThemeTokens {
  background: string;
  large: string;
  card: string;
  medium: string;
  small: string;
  accent: string;
  strong: string;
  accentBg: string;
  onStrong: string;
  text: string;
  secondaryText: string;
  disabledText: string;
  muted: string;
  border: string;
}

interface PreferencesContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
  timezone: string;
  setTimezone: (timezone: string) => void;
  themeId: string;
  setThemeId: (themeId: string) => void;
  theme: ThemeOption;
  themeTokens: ThemeTokens;
  t: (key: TranslationKey) => string;
}

const preferencesStorageKey = "class-manager-preferences";

export const themes: ThemeOption[] = [
  {
    id: "theme-1",
    name: "Paper Planner",
    colors: ["#F8F7F4", "#FFFFFF", "#F2F0EA", "#E7E3D8"],
    accent: "#5E6B73",
    border: "#D8D4CB"
  },
  {
    id: "theme-2",
    name: "Warm Desk",
    colors: ["#F7F5EF", "#FFFFFF", "#EFEADF", "#DED6C7"],
    accent: "#635F55",
    border: "#D7D0C2"
  },
  {
    id: "theme-3",
    name: "Soft Ink",
    colors: ["#F6F7F5", "#FFFFFF", "#ECEFEB", "#DDE3DE"],
    accent: "#52645B",
    border: "#CDD5CE"
  },
  {
    id: "theme-4",
    name: "Calendar Mist",
    colors: ["#F6F8F8", "#FFFFFF", "#EDEFF0", "#DDE4E7"],
    accent: "#4F626B",
    border: "#CDD7DB"
  },
  {
    id: "theme-5",
    name: "Linen",
    colors: ["#F9F6F1", "#FFFFFF", "#F0E9DE", "#E2D7C8"],
    accent: "#6B5F51",
    border: "#D8CCBA"
  },
  {
    id: "theme-6",
    name: "Quiet Rose",
    colors: ["#FAF7F6", "#FFFFFF", "#F1E9E7", "#E5D8D5"],
    accent: "#715C5B",
    border: "#DCCFCC"
  },
  {
    id: "theme-7",
    name: "Sage Note",
    colors: ["#F7F8F4", "#FFFFFF", "#EEF1E8", "#DFE6D7"],
    accent: "#596B55",
    border: "#D0D9C8"
  },
  {
    id: "theme-8",
    name: "Clay Calendar",
    colors: ["#FAF6F2", "#FFFFFF", "#F1E7DE", "#E4D3C6"],
    accent: "#765D51",
    border: "#D9C8B9"
  },
  {
    id: "theme-9",
    name: "Stone Blue",
    colors: ["#F5F7F7", "#FFFFFF", "#EAEEF0", "#D9E0E3"],
    accent: "#53656F",
    border: "#CBD5D9"
  }
];

const translations = {
  ko: {
    "nav.dashboard": "대시보드",
    "nav.fixedSchedule": "고정 일정",
    "nav.theme": "테마",
    "nav.settings": "설정",
    "dashboard.title": "Today",
    "dashboard.description": brand.tagline.ko,
    "dashboard.todayTasks": "오늘 할 일",
    "dashboard.todaySchedule": "오늘 일정",
    "dashboard.dday": "디데이",
    "dashboard.fileUpload": "파일 업로드",
    "dashboard.risk": "마감 위험",
    "dashboard.openHint": "선택된 박스를 한 번 더 누르면 열립니다.",
    "fixed.title": "고정 일정",
    "fixed.description": "반복되는 일정과 루틴을 요일·시간 기준으로 관리합니다.",
    "fixed.defaultClass": "일정",
    "fixed.defaultSeminar": "세미나",
    "fixed.newBox": "새 고정 일정 박스 이름",
    "fixed.addBox": "박스 추가",
    "fixed.days": "요일",
    "fixed.startTime": "시작 시간",
    "fixed.endTime": "종료 시간",
    "fixed.place": "장소",
    "fixed.memo": "메모",
    "fixed.noSchedule": "일정 없음",
    "fixed.enterHint": "선택한 박스를 한 번 더 누르면 입력 화면이 열립니다.",
    "button.add": "추가",
    "button.save": "저장",
    "button.cancel": "취소",
    "button.apply": "적용",
    "button.edit": "수정",
    "button.delete": "삭제",
    "theme.title": "테마",
    "theme.description": "앱 전체 색감에 사용할 4색 테마를 고릅니다.",
    "theme.preview": "미리보기",
    "theme.current": "적용 중",
    "settings.title": "설정",
    "settings.description": "언어와 시간대 값을 관리합니다.",
    "settings.language": "언어",
    "settings.timezone": "시간대",
    "settings.korean": "한국어",
    "settings.english": "영어",
    "settings.calendar": "캘린더 export",
    "settings.all": "전체",
    "settings.assignments": "과제",
    "settings.events": "시험/발표"
  },
  en: {
    "nav.dashboard": "Dashboard",
    "nav.fixedSchedule": "Fixed Schedule",
    "nav.theme": "Theme",
    "nav.settings": "Settings",
    "dashboard.title": "Today",
    "dashboard.description": brand.tagline.en,
    "dashboard.todayTasks": "Today",
    "dashboard.todaySchedule": "Schedule",
    "dashboard.dday": "D-Day",
    "dashboard.fileUpload": "Upload",
    "dashboard.risk": "Deadline Risk",
    "dashboard.openHint": "Click the selected box again to open it.",
    "fixed.title": "Fixed Schedule",
    "fixed.description": "Manage recurring events and routines by day and time.",
    "fixed.defaultClass": "Event",
    "fixed.defaultSeminar": "Seminar",
    "fixed.newBox": "New fixed schedule box",
    "fixed.addBox": "Add Box",
    "fixed.days": "Days",
    "fixed.startTime": "Start Time",
    "fixed.endTime": "End Time",
    "fixed.place": "Place",
    "fixed.memo": "Memo",
    "fixed.noSchedule": "No schedules",
    "fixed.enterHint": "Click the selected box again to open the form.",
    "button.add": "Add",
    "button.save": "Save",
    "button.cancel": "Cancel",
    "button.apply": "Apply",
    "button.edit": "Edit",
    "button.delete": "Delete",
    "theme.title": "Theme",
    "theme.description": "Choose a four-color theme for the whole app.",
    "theme.preview": "Preview",
    "theme.current": "Active",
    "settings.title": "Settings",
    "settings.description": "Manage language and timezone preferences.",
    "settings.language": "Language",
    "settings.timezone": "Timezone",
    "settings.korean": "Korean",
    "settings.english": "English",
    "settings.calendar": "Calendar Export",
    "settings.all": "All",
    "settings.assignments": "Assignments",
    "settings.events": "Exams/Presentations"
  }
} as const;

export type TranslationKey = keyof typeof translations.ko;

function hexToRgb(hex: string) {
  const cleaned = hex.replace("#", "");
  return {
    r: Number.parseInt(cleaned.slice(0, 2), 16),
    g: Number.parseInt(cleaned.slice(2, 4), 16),
    b: Number.parseInt(cleaned.slice(4, 6), 16)
  };
}

function luminance(hex: string) {
  const { r, g, b } = hexToRgb(hex);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

function mix(hex: string, other: string, weight = 0.2) {
  const a = hexToRgb(hex);
  const b = hexToRgb(other);
  const blend = (first: number, second: number) =>
    Math.round(first * (1 - weight) + second * weight)
      .toString(16)
      .padStart(2, "0");
  return `#${blend(a.r, b.r)}${blend(a.g, b.g)}${blend(a.b, b.b)}`;
}

export function themeToTokens(theme: ThemeOption): ThemeTokens {
  const [background, large, medium, small] = theme.colors;
  const strong = theme.accent;

  return {
    background,
    large,
    card: large,
    medium,
    small,
    accent: medium,
    strong,
    accentBg: medium,
    onStrong: luminance(strong) > 0.62 ? "#111111" : "#FFFFFF",
    text: "#111111",
    secondaryText: "#333333",
    disabledText: "#666666",
    muted: "#333333",
    border: theme.border ?? mix(small, "#ffffff", 0.35)
  };
}

function readPreferences(): { language: Language; timezone: string; themeId: string } {
  try {
    if (typeof window.localStorage === "undefined") {
      return { language: "ko" as Language, timezone: "Asia/Seoul", themeId: themes[0].id };
    }
    const raw = window.localStorage.getItem(preferencesStorageKey);
    const parsed = raw ? JSON.parse(raw) : {};
    return {
      language: parsed.language === "en" ? "en" : "ko",
      timezone: typeof parsed.timezone === "string" ? parsed.timezone : "Asia/Seoul",
      themeId:
        typeof parsed.themeId === "string" && themes.some((theme) => theme.id === parsed.themeId)
          ? parsed.themeId
          : themes[0].id
    };
  } catch {
    return { language: "ko" as Language, timezone: "Asia/Seoul", themeId: themes[0].id };
  }
}

function writePreferences(value: { language: Language; timezone: string; themeId: string }) {
  try {
    if (typeof window.localStorage !== "undefined") {
      window.localStorage.setItem(preferencesStorageKey, JSON.stringify(value));
    }
  } catch {
    // Preferences are progressive enhancement; the app still works without storage.
  }

  cacheCollection("local-device", "preferences", value);
  enqueueSync("local-device", "preferences", "upsert", value);
}

function applyThemeTokens(tokens: ThemeTokens) {
  const root = document.documentElement;
  root.style.setProperty("--app-bg", tokens.background);
  root.style.setProperty("--app-large", tokens.large);
  root.style.setProperty("--app-card", tokens.card);
  root.style.setProperty("--app-medium", tokens.medium);
  root.style.setProperty("--app-small", tokens.small);
  root.style.setProperty("--app-accent", tokens.accent);
  root.style.setProperty("--app-accent-bg", tokens.accentBg);
  root.style.setProperty("--app-strong", tokens.strong);
  root.style.setProperty("--app-on-strong", tokens.onStrong);
  root.style.setProperty("--app-text", tokens.text);
  root.style.setProperty("--app-secondary-text", tokens.secondaryText);
  root.style.setProperty("--app-disabled-text", tokens.disabledText);
  root.style.setProperty("--app-muted", tokens.muted);
  root.style.setProperty("--app-border", tokens.border);
}

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const initial = useMemo(readPreferences, []);
  const [language, setLanguage] = useState<Language>(initial.language);
  const [timezone, setTimezone] = useState(initial.timezone);
  const [themeId, setThemeId] = useState(initial.themeId);

  const theme = themes.find((item) => item.id === themeId) ?? themes[0];
  const themeTokens = useMemo(() => themeToTokens(theme), [theme]);

  useEffect(() => {
    writePreferences({ language, timezone, themeId });
  }, [language, timezone, themeId]);

  useEffect(() => {
    applyThemeTokens(themeTokens);
  }, [themeTokens]);

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      timezone,
      setTimezone,
      themeId,
      setThemeId,
      theme,
      themeTokens,
      t: (key: TranslationKey) => translations[language][key] ?? translations.ko[key]
    }),
    [language, theme, themeId, themeTokens, timezone]
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (!context) throw new Error("usePreferences must be used within PreferencesProvider");
  return context;
}
