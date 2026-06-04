import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  BookOpen,
  CalendarDays,
  CheckSquare,
  Clock,
  Pencil,
  Presentation,
  Save,
  ScrollText,
  TimerReset,
  Trash2,
  UploadCloud,
  X
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { api } from "../api/client";
import { CourseColorDot } from "../components/CourseColorDot";
import { DateBadge } from "../components/DateBadge";
import { EmptyState } from "../components/EmptyState";
import { ErrorState } from "../components/ErrorState";
import { LoadingState } from "../components/LoadingState";
import { StatusBadge } from "../components/StatusBadge";
import { DailyScheduleView } from "../features/schedule/DailyScheduleView";
import { TodayTasksPanel, type TodayTaskItem } from "../features/tasks/TodayTasksPanel";
import { ScreenshotCaptureCard } from "../features/upload/ScreenshotCaptureCard";
import { usePreferences } from "../features/preferences/preferences";
import type { Assignment, Course, Exam, PresentationItem, ReadingItem } from "../types";

interface DeadlineItem {
  id: string;
  title: string;
  type: "assignment" | "exam" | "presentation" | "reading";
  date?: string | null;
  status?: string | null;
  priority?: string | null;
  course?: Course;
}

interface DashboardData {
  todayClasses: Course[];
  todayTasks: TodayTaskItem[];
  upcomingDeadlines: Array<(Assignment | ReadingItem) & { itemType: string; course?: Course }>;
  weekEvents: Array<(Exam | PresentationItem) & { itemType: string; course?: Course }>;
  readingsToRead: ReadingItem[];
  deadlineItems: DeadlineItem[];
  riskAlerts: Array<{
    id: string;
    title: string;
    courseName: string;
    dueDate?: string | null;
    priority: string;
  }>;
}

const typeMeta = {
  assignment: { label: "과제", icon: CheckSquare, color: "text-blue-600" },
  exam: { label: "시험", icon: CalendarDays, color: "text-red-600" },
  presentation: { label: "발표", icon: Presentation, color: "text-violet-600" },
  reading: { label: "읽기", icon: BookOpen, color: "text-emerald-600" }
};

const statusOptions = {
  assignment: [
    ["not_started", "시작 전"],
    ["in_progress", "진행 중"],
    ["completed", "완료"]
  ],
  exam: [
    ["not_started", "시작 전"],
    ["in_progress", "준비 중"],
    ["completed", "완료"]
  ],
  presentation: [
    ["not_started", "시작 전"],
    ["in_progress", "준비 중"],
    ["completed", "완료"]
  ],
  reading: [
    ["not_started", "시작 전"],
    ["reading", "읽는 중"],
    ["summarized", "요약 완료"],
    ["discussed", "토론 완료"]
  ]
} satisfies Record<DeadlineItem["type"], string[][]>;

const priorityOptions = [
  ["low", "낮음"],
  ["medium", "보통"],
  ["high", "높음"]
];

const endpointByType = {
  assignment: "/assignments",
  exam: "/exams",
  presentation: "/presentations",
  reading: "/readings"
} satisfies Record<DeadlineItem["type"], string>;

const dateFieldByType = {
  assignment: "dueDate",
  exam: "examDate",
  presentation: "presentationDate",
  reading: "dueDate"
} satisfies Record<DeadlineItem["type"], string>;

interface DeadlineEditState {
  item: DeadlineItem;
  values: {
    title: string;
    date: string;
    status: string;
    priority: string;
  };
}

type DashboardView = "tasks" | "classes" | "deadlines" | "screenshot";

function toDateInput(value?: string | null) {
  if (!value) return "";
  return value.slice(0, 10);
}

function Section({
  title,
  description,
  icon,
  children
}: {
  title: string;
  description?: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="card">
      <div className="mb-4 flex items-start gap-2">
        <span className="mt-0.5 text-blue-600">{icon}</span>
        <div>
          <h2 className="text-base font-bold">{title}</h2>
          {description && <p className="mt-1 text-xs font-medium text-slate-500">{description}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

const fallbackDashboardData: DashboardData = {
  todayClasses: [],
  todayTasks: [],
  upcomingDeadlines: [],
  weekEvents: [],
  readingsToRead: [],
  deadlineItems: [],
  riskAlerts: []
};

function logDashboardLoadError(error: unknown) {
  if (!import.meta.env.DEV) return;

  console.error(
    "[dashboard] Failed to load /api/dashboard. Rendering fallback dashboard data.",
    error
  );
}

export function DashboardPage() {
  const queryClient = useQueryClient();
  const location = useLocation();
  const { language, t } = usePreferences();
  const [editingDeadline, setEditingDeadline] = useState<DeadlineEditState | null>(null);
  const [dashboardLoadError, setDashboardLoadError] = useState<string | null>(null);
  const initialView: DashboardView = location.pathname === "/today" ? "classes" : "tasks";
  const [selectedView, setSelectedView] = useState<DashboardView>(initialView);
  const [enteredView, setEnteredView] = useState<DashboardView>(initialView);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const { data, isLoading, isError } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      try {
        const response = await api.get<DashboardData>("/dashboard");
        setDashboardLoadError(null);
        return response.data;
      } catch (error) {
        logDashboardLoadError(error);
        setDashboardLoadError(t("dashboard.loadError"));
        return fallbackDashboardData;
      }
    }
  });
  const coursesQuery = useQuery({
    queryKey: ["courses"],
    queryFn: async () => (await api.get<Course[]>("/courses")).data,
    enabled: Boolean(data)
  });

  useEffect(() => {
    const nextView: DashboardView = location.pathname === "/today" ? "classes" : "tasks";
    setSelectedView(nextView);
    setEnteredView(nextView);
  }, [location.pathname]);

  const refreshScheduleViews = () => {
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    queryClient.invalidateQueries({ queryKey: ["courses"] });
    queryClient.invalidateQueries({ queryKey: ["course"] });
    queryClient.invalidateQueries({ queryKey: ["assignments"] });
    queryClient.invalidateQueries({ queryKey: ["exams"] });
    queryClient.invalidateQueries({ queryKey: ["presentations"] });
    queryClient.invalidateQueries({ queryKey: ["readings"] });
  };

  const saveDeadlineMutation = useMutation({
    mutationFn: async ({ item, values }: DeadlineEditState) => {
      const payload: Record<string, string | null> = {
        title: values.title.trim(),
        [dateFieldByType[item.type]]: values.date || null
      };

      if (item.type === "reading") {
        payload.readingStatus = values.status;
      } else {
        payload.status = values.status;
      }

      if (item.type === "assignment") {
        payload.priority = values.priority;
      }

      return (await api.put(`${endpointByType[item.type]}/${item.id}`, payload)).data;
    },
    onSuccess: () => {
      setEditingDeadline(null);
      refreshScheduleViews();
    }
  });

  const deleteDeadlineMutation = useMutation({
    mutationFn: async (item: DeadlineItem) => api.delete(`${endpointByType[item.type]}/${item.id}`),
    onSuccess: refreshScheduleViews
  });

  if (isLoading) return <LoadingState />;
  if (isError || !data) return <ErrorState title={t("dashboard.loadError")} />;

  const deadlines = Array.isArray(data.deadlineItems) ? data.deadlineItems : [];
  const riskAlerts = Array.isArray(data.riskAlerts) ? data.riskAlerts : [];
  const todayTasks = Array.isArray(data.todayTasks) ? data.todayTasks : [];
  const todayClasses = Array.isArray(data.todayClasses) ? data.todayClasses : [];
  const startEditing = (item: DeadlineItem) => {
    setEditingDeadline({
      item,
      values: {
        title: item.title,
        date: toDateInput(item.date),
        status: item.status ?? statusOptions[item.type][0][0],
        priority: item.priority ?? "medium"
      }
    });
  };

  const viewCards = [
    { id: "tasks" as const, label: t("dashboard.quickTasks"), icon: CheckSquare },
    { id: "classes" as const, label: t("dashboard.quickSchedule"), icon: Clock },
    { id: "deadlines" as const, label: t("dashboard.quickDday"), icon: TimerReset },
    { id: "screenshot" as const, label: t("dashboard.quickUpload"), icon: UploadCloud }
  ];
  const fixedScheduleCourses = Array.isArray(coursesQuery.data) ? coursesQuery.data : todayClasses;

  const handleViewClick = (view: DashboardView) => {
    setSelectedView(view);
    setEnteredView(view);
    window.requestAnimationFrame(() => {
      contentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  return (
    <div className="grid gap-5">
      <div>
        <h1 className="text-2xl font-bold tracking-normal">{t("dashboard.title")}</h1>
        <p className="mt-1 text-sm text-slate-500">{t("dashboard.description")}</p>
      </div>

      {dashboardLoadError && (
        <section className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {dashboardLoadError}
        </section>
      )}

      {riskAlerts.length > 0 && (
        <section className="rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="mb-3 flex items-center gap-2 font-bold text-red-800">
            <AlertTriangle size={18} />
            {t("dashboard.risk")}
          </div>
          <div className="grid gap-2 md:grid-cols-2">
            {riskAlerts.map((alert) => (
              <div key={alert.id} className="rounded-md bg-white p-3 text-sm shadow-sm">
                <div className="font-semibold">{alert.title}</div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="text-slate-500">{alert.courseName}</span>
                  <DateBadge value={alert.dueDate} />
                  <StatusBadge value={alert.priority} />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="rounded-lg border border-line bg-white/70 p-3">
        <div className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
          {t("dashboard.quickMenu")}
        </div>
        <div className="grid grid-cols-4 gap-2">
          {viewCards.map((view) => {
            const Icon = view.icon;
            const isActive = selectedView === view.id;

            return (
              <button
                key={view.id}
                type="button"
                className={`min-h-9 rounded-md border px-2 py-1.5 text-center shadow-soft transition sm:min-h-10 ${
                  isActive
                    ? "border-blue-600 bg-blue-600 text-white"
                    : "border-line bg-white text-ink hover:border-blue-300"
                }`}
                onClick={() => handleViewClick(view.id)}
              >
                <div className="flex items-center justify-center gap-1.5 text-xs font-bold">
                  <Icon size={14} />
                  <span className="truncate">{view.label}</span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <div ref={contentRef} className="scroll-mt-24 pt-2">
        {enteredView === "tasks" && (
          <Section
            title={t("dashboard.taskManagerTitle")}
            description={t("dashboard.taskManagerDescription")}
            icon={<ScrollText size={18} />}
          >
            <TodayTasksPanel items={todayTasks} onChange={refreshScheduleViews} />
          </Section>
        )}

        {enteredView === "classes" && (
          <Section
            title={t("dashboard.scheduleManagerTitle")}
            description={t("dashboard.scheduleManagerDescription")}
            icon={<CalendarDays size={18} />}
          >
            <DailyScheduleView
              courses={fixedScheduleCourses}
              emptyTitle={t("dashboard.todayScheduleEmpty")}
              locale={language === "ko" ? "ko-KR" : "en-US"}
            />
          </Section>
        )}

        {enteredView === "deadlines" && (
          <Section
            title={t("dashboard.deadlineManagerTitle")}
            description={t("dashboard.deadlineManagerDescription")}
            icon={<ScrollText size={18} />}
          >
            {deadlines.length ? (
              <div className="grid gap-2">
                {deadlines.slice(0, 16).map((item) => {
                  const meta = typeMeta[item.type];
                  const Icon = meta.icon;
                  const editKey = `${item.type}-${item.id}`;
                  const isEditing =
                    editingDeadline &&
                    editingDeadline.item.id === item.id &&
                    editingDeadline.item.type === item.type;
                  return (
                    <div key={editKey} className="rounded-md border border-line p-3">
                      {isEditing ? (
                        <form
                          className="grid gap-3 md:grid-cols-[120px_1fr_160px_150px_auto]"
                          onSubmit={(event) => {
                            event.preventDefault();
                            if (editingDeadline.values.title.trim()) {
                              saveDeadlineMutation.mutate(editingDeadline);
                            }
                          }}
                        >
                          <div className="flex items-center gap-2 text-sm font-bold">
                            <Icon size={16} className={meta.color} />
                            {meta.label}
                          </div>
                          <input
                            className="field"
                            value={editingDeadline.values.title}
                            onChange={(event) =>
                              setEditingDeadline({
                                ...editingDeadline,
                                values: {
                                  ...editingDeadline.values,
                                  title: event.target.value
                                }
                              })
                            }
                            required
                          />
                          <input
                            className="field"
                            type="date"
                            value={editingDeadline.values.date}
                            onChange={(event) =>
                              setEditingDeadline({
                                ...editingDeadline,
                                values: {
                                  ...editingDeadline.values,
                                  date: event.target.value
                                }
                              })
                            }
                          />
                          <select
                            className="field"
                            value={editingDeadline.values.status}
                            onChange={(event) =>
                              setEditingDeadline({
                                ...editingDeadline,
                                values: {
                                  ...editingDeadline.values,
                                  status: event.target.value
                                }
                              })
                            }
                          >
                            {statusOptions[item.type].map(([value, label]) => (
                              <option key={value} value={value}>
                                {label}
                              </option>
                            ))}
                          </select>
                          <div className="flex flex-wrap justify-end gap-2">
                            {item.type === "assignment" && (
                              <select
                                className="field min-w-[104px]"
                                value={editingDeadline.values.priority}
                                onChange={(event) =>
                                  setEditingDeadline({
                                    ...editingDeadline,
                                    values: {
                                      ...editingDeadline.values,
                                      priority: event.target.value
                                    }
                                  })
                                }
                              >
                                {priorityOptions.map(([value, label]) => (
                                  <option key={value} value={value}>
                                    {label}
                                  </option>
                                ))}
                              </select>
                            )}
                            <button
                              className="btn-primary px-2"
                              type="submit"
                              title={t("button.save")}
                              disabled={saveDeadlineMutation.isPending}
                            >
                              <Save size={16} />
                            </button>
                            <button
                              className="btn-secondary px-2"
                              type="button"
                              title={t("button.cancel")}
                              onClick={() => setEditingDeadline(null)}
                            >
                              <X size={16} />
                            </button>
                          </div>
                        </form>
                      ) : (
                        <div className="grid gap-3 md:grid-cols-[120px_1fr_auto_auto]">
                          <div className="flex items-center gap-2 text-sm font-bold">
                            <Icon size={16} className={meta.color} />
                            {meta.label}
                          </div>
                          <div>
                            <div className="font-semibold">{item.title}</div>
                            <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                              {item.course && <CourseColorDot color={item.course.color} />}
                              {item.course?.courseName}
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 md:justify-end">
                            <DateBadge value={item.date} />
                            {item.status && <StatusBadge value={item.status} />}
                          </div>
                          <div className="flex justify-end gap-2">
                            <button
                              className="btn-secondary px-2"
                              type="button"
                              title={t("button.edit")}
                              onClick={() => startEditing(item)}
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              className="btn-danger px-2"
                              type="button"
                              title={t("button.delete")}
                              disabled={deleteDeadlineMutation.isPending}
                              onClick={() => {
                                if (window.confirm("이 일정을 삭제할까요?")) {
                                  deleteDeadlineMutation.mutate(item);
                                }
                              }}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState title={`${t("dashboard.dday")} 없음`} />
            )}
          </Section>
        )}

        {enteredView === "screenshot" && (
          <div className="max-w-3xl">
            <ScreenshotCaptureCard />
          </div>
        )}
      </div>
    </div>
  );
}
