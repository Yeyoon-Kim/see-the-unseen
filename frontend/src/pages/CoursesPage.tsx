import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { CourseColorDot } from "../components/CourseColorDot";
import { EmptyState } from "../components/EmptyState";
import { ErrorState } from "../components/ErrorState";
import { LoadingState } from "../components/LoadingState";
import { defaultEventCategories } from "../features/events/eventTypes";
import { usePreferences } from "../features/preferences/preferences";
import { cacheCollection, enqueueSync } from "../features/sync/syncService";
import type { Course } from "../types";
import {
  buildClassTime,
  dayLabels,
  formatClassTime,
  isValidTimeRange,
  normalizeFixedCategory
} from "../utils/fixedSchedule";

const colors = ["#5E6B73", "#6B665C", "#6A7464", "#71685F", "#66727A", "#7A6A68"];
const categoryStorageKey = "class-manager-fixed-schedule-categories";
const defaultCategories = defaultEventCategories;

interface FixedScheduleForm {
  title: string;
  selectedDays: string[];
  startTime: string;
  endTime: string;
  place: string;
  memo: string;
  color: string;
}

function readCategories() {
  try {
    if (typeof window.localStorage === "undefined") return defaultCategories;
    const raw = window.localStorage.getItem(categoryStorageKey);
    const parsed = raw ? (JSON.parse(raw) as string[]) : defaultCategories;
    const cleaned = parsed.map((item) => item.trim()).filter(Boolean);
    return cleaned.length ? cleaned : defaultCategories;
  } catch {
    return defaultCategories;
  }
}

function writeCategories(categories: string[]) {
  try {
    if (typeof window.localStorage !== "undefined") {
      window.localStorage.setItem(categoryStorageKey, JSON.stringify(categories));
    }
  } catch {
    // Category boxes are UI preferences. Existing schedules still remain in the database.
  }
  cacheCollection("local-device", "categories", categories);
  enqueueSync("local-device", "categories", "upsert", categories);
}

function createEmptyForm(): FixedScheduleForm {
  return {
    title: "",
    selectedDays: [],
    startTime: "09:00",
    endTime: "10:30",
    place: "",
    memo: "",
    color: colors[0]
  };
}

function uniqueCategories(values: string[]) {
  const seen = new Set<string>();
  return values.filter((value) => {
    const key = value.trim().toLocaleLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function CoursesPage() {
  const queryClient = useQueryClient();
  const { t } = usePreferences();
  const [categories, setCategories] = useState<string[]>(readCategories);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [enteredCategory, setEnteredCategory] = useState<string | null>(null);
  const [newCategory, setNewCategory] = useState("");
  const [editingCategory, setEditingCategory] = useState<{ previous: string; value: string } | null>(
    null
  );
  const [form, setForm] = useState<FixedScheduleForm>(createEmptyForm);
  const [timeError, setTimeError] = useState("");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["courses"],
    queryFn: async () => (await api.get<Course[]>("/courses")).data
  });

  const persistedCategories = useMemo(() => {
    const courseCategories = (data ?? []).map((course) => normalizeFixedCategory(course.courseType));
    return uniqueCategories([...categories, ...courseCategories]);
  }, [categories, data]);

  const filteredCourses = useMemo(
    () =>
      (data ?? []).filter(
        (course) => enteredCategory && normalizeFixedCategory(course.courseType) === enteredCategory
      ),
    [data, enteredCategory]
  );

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["courses"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!enteredCategory) return null;
      return (
        await api.post("/courses", {
          courseName: form.title.trim(),
          professorName: null,
          semester: form.memo.trim(),
          classTime: buildClassTime({
            selectedDays: form.selectedDays,
            startTime: form.startTime,
            endTime: form.endTime,
            memo: form.memo.trim()
          }),
          classroom: form.place.trim(),
          courseType: enteredCategory,
          color: form.color
        })
      ).data;
    },
    onSuccess: () => {
      setForm(createEmptyForm());
      setTimeError("");
      refresh();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/courses/${id}`),
    onSuccess: refresh
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (category: string) => {
      const matches = (data ?? []).filter(
        (course) => normalizeFixedCategory(course.courseType) === category
      );
      await Promise.all(matches.map((course) => api.delete(`/courses/${course.id}`)));
      return category;
    },
    onSuccess: (category) => {
      const next = categories.filter((item) => item !== category);
      setCategories(next.length ? next : defaultCategories);
      writeCategories(next.length ? next : defaultCategories);
      if (selectedCategory === category) setSelectedCategory(null);
      if (enteredCategory === category) setEnteredCategory(null);
      refresh();
    }
  });

  const renameCategoryMutation = useMutation({
    mutationFn: async ({ previous, next }: { previous: string; next: string }) => {
      const matches = (data ?? []).filter(
        (course) => normalizeFixedCategory(course.courseType) === previous
      );
      await Promise.all(matches.map((course) => api.put(`/courses/${course.id}`, { courseType: next })));
    },
    onSuccess: refresh
  });

  if (isLoading) return <LoadingState />;
  if (isError || !data) return <ErrorState />;

  const canSubmit =
    Boolean(enteredCategory) &&
    Boolean(form.title.trim()) &&
    form.selectedDays.length > 0 &&
    isValidTimeRange(form.startTime, form.endTime);

  const addCategory = () => {
    const trimmed = newCategory.trim();
    if (!trimmed) return;
    const next = uniqueCategories([...persistedCategories, trimmed]);
    setCategories(next);
    writeCategories(next);
    setSelectedCategory(trimmed);
    setEnteredCategory(null);
    setNewCategory("");
  };

  const saveCategoryTitle = () => {
    if (!editingCategory) return;
    const nextTitle = editingCategory.value.trim();
    if (!nextTitle) {
      setEditingCategory(null);
      return;
    }

    const next = uniqueCategories(
      persistedCategories.map((category) =>
        category === editingCategory.previous ? nextTitle : category
      )
    );
    setCategories(next);
    writeCategories(next);
    setSelectedCategory((current) =>
      current === editingCategory.previous ? nextTitle : current
    );
    setEnteredCategory((current) =>
      current === editingCategory.previous ? nextTitle : current
    );
    renameCategoryMutation.mutate({ previous: editingCategory.previous, next: nextTitle });
    setEditingCategory(null);
  };

  const handleCategoryClick = (category: string) => {
    if (selectedCategory === category) {
      setEnteredCategory(category);
      return;
    }

    setSelectedCategory(category);
    setEnteredCategory(null);
  };

  const toggleDay = (day: string) => {
    setForm((current) => ({
      ...current,
      selectedDays: current.selectedDays.includes(day)
        ? current.selectedDays.filter((item) => item !== day)
        : [...current.selectedDays, day]
    }));
  };

  const handleTimeChange = (key: "startTime" | "endTime", value: string) => {
    const next = { ...form, [key]: value };
    setForm(next);
    setTimeError(
      isValidTimeRange(next.startTime, next.endTime)
        ? ""
        : "시작 시간은 종료 시간보다 빨라야 합니다."
    );
  };

  return (
    <div className="grid gap-5">
      <div>
        <h1 className="text-2xl font-bold">{t("fixed.title")}</h1>
        <p className="mt-1 text-sm text-slate-500">{t("fixed.description")}</p>
      </div>

      <section className="card grid gap-3">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {persistedCategories.map((category) => {
            const isActive = selectedCategory === category;
            const isEditing = editingCategory?.previous === category;

            return (
              <div
                key={category}
                className={`rounded-md border p-2 transition ${
                  isActive ? "border-blue-600 bg-blue-50" : "border-line bg-white"
                }`}
              >
                {isEditing ? (
                  <div className="flex items-center gap-1">
                    <input
                      className="field px-2 py-1 text-xs"
                      value={editingCategory.value}
                      onChange={(event) =>
                        setEditingCategory({ ...editingCategory, value: event.target.value })
                      }
                    />
                    <button
                      className="rounded-md p-1 text-blue-700 hover:bg-blue-100"
                      type="button"
                      onClick={saveCategoryTitle}
                      title="저장"
                    >
                      <Save size={14} />
                    </button>
                    <button
                      className="rounded-md p-1 text-slate-500 hover:bg-slate-100"
                      type="button"
                      onClick={() => setEditingCategory(null)}
                      title="취소"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <button
                      className="flex min-w-0 flex-1 items-center gap-2 text-left text-sm font-bold"
                      type="button"
                      onClick={() => handleCategoryClick(category)}
                    >
                      <span className="truncate">{category}</span>
                      {isActive && <Check size={14} className="text-blue-700" />}
                    </button>
                    <button
                      className="rounded-md p-1 text-slate-500 hover:bg-white"
                      type="button"
                      title="제목 수정"
                      onClick={() => setEditingCategory({ previous: category, value: category })}
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      className="rounded-md p-1 text-red-600 hover:bg-red-50"
                      type="button"
                      title="카테고리 삭제"
                      disabled={deleteCategoryMutation.isPending}
                      onClick={() => {
                        if (window.confirm(`${category} 카테고리를 삭제할까요?`)) {
                          deleteCategoryMutation.mutate(category);
                        }
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <form
          className="grid gap-2 sm:grid-cols-[1fr_auto]"
          onSubmit={(event) => {
            event.preventDefault();
            addCategory();
          }}
        >
          <input
            className="field"
            value={newCategory}
            onChange={(event) => setNewCategory(event.target.value)}
            placeholder={t("fixed.newBox")}
          />
          <button className="btn-secondary" type="submit" disabled={!newCategory.trim()}>
            <Plus size={16} />
            {t("fixed.addBox")}
          </button>
        </form>
      </section>

      {selectedCategory && selectedCategory !== enteredCategory && (
        <div className="rounded-md border border-line bg-white px-3 py-2 text-sm font-semibold text-slate-500">
          {t("fixed.enterHint")}
        </div>
      )}

      {enteredCategory && (
        <section className="card grid gap-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-bold">
              {enteredCategory} {t("button.add")}
            </h2>
            <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">
              {enteredCategory}
            </span>
          </div>

          <form
            className="grid gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              if (canSubmit) createMutation.mutate();
            }}
          >
            <input
              className="field"
              value={form.title}
              onChange={(event) => setForm({ ...form, title: event.target.value })}
              placeholder={`${enteredCategory} 제목`}
              required
            />

            <div className="grid gap-2">
              <div className="text-sm font-bold">{t("fixed.days")}</div>
              <div className="grid grid-cols-7 gap-1">
                {dayLabels.map((day) => {
                  const selected = form.selectedDays.includes(day);
                  return (
                    <button
                      key={day}
                      className={`rounded-md border px-2 py-2 text-sm font-bold transition ${
                        selected
                          ? "border-blue-600 bg-blue-600 text-white"
                          : "border-line bg-white text-slate-600 hover:border-blue-300"
                      }`}
                      type="button"
                      onClick={() => toggleDay(day)}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <label className="grid gap-1 text-sm font-bold">
                {t("fixed.startTime")}
                <input
                  className="field"
                  type="time"
                  value={form.startTime}
                  onChange={(event) => handleTimeChange("startTime", event.target.value)}
                  required
                />
              </label>
              <label className="grid gap-1 text-sm font-bold">
                {t("fixed.endTime")}
                <input
                  className="field"
                  type="time"
                  value={form.endTime}
                  onChange={(event) => handleTimeChange("endTime", event.target.value)}
                  required
                />
              </label>
            </div>
            {timeError && <div className="text-sm font-semibold text-red-600">{timeError}</div>}

            <div className="grid gap-3 md:grid-cols-2">
              <input
                className="field"
                value={form.place}
                onChange={(event) => setForm({ ...form, place: event.target.value })}
                placeholder={t("fixed.place")}
              />
              <input
                className="field"
                value={form.memo}
                onChange={(event) => setForm({ ...form, memo: event.target.value })}
                placeholder={t("fixed.memo")}
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex gap-2">
                {colors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className="h-7 w-7 rounded-full border-2"
                    style={{
                      backgroundColor: color,
                      borderColor: form.color === color ? "#111111" : "white"
                    }}
                    onClick={() => setForm({ ...form, color })}
                    aria-label={color}
                  />
                ))}
              </div>
              <button className="btn-primary" disabled={createMutation.isPending || !canSubmit}>
                <Plus size={16} />
                {t("button.add")}
              </button>
            </div>
          </form>
        </section>
      )}

      {enteredCategory && (
        <>
          {filteredCourses.length ? (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {filteredCourses.map((course) => (
                <article key={course.id} className="card">
                  <Link to={`/courses/${course.id}`} className="block">
                    <div className="mb-3 flex items-center gap-2">
                      <CourseColorDot color={course.color} />
                      <h2 className="font-bold">{course.courseName}</h2>
                    </div>
                    <div className="grid gap-1 text-sm text-slate-500">
                      <div>{formatClassTime(course.classTime)}</div>
                      <div>{course.classroom || "장소 없음"}</div>
                      <div>{course.semester || "메모 없음"}</div>
                    </div>
                  </Link>
                  <div className="mt-4 flex items-center justify-between border-t border-line pt-3 text-xs text-slate-500">
                    <span>{normalizeFixedCategory(course.courseType)}</span>
                    <button
                      className="rounded-md p-2 text-red-600 hover:bg-red-50"
                      onClick={() => deleteMutation.mutate(course.id)}
                      aria-label="고정 일정 삭제"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState title={`${enteredCategory} ${t("fixed.noSchedule")}`} />
          )}
        </>
      )}
    </div>
  );
}
