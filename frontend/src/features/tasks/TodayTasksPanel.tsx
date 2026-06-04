import clsx from "clsx";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { api } from "../../api/client";
import { CourseColorDot } from "../../components/CourseColorDot";
import { EmptyState } from "../../components/EmptyState";
import { usePreferences } from "../preferences/preferences";
import { cacheCollection, enqueueSync } from "../sync/syncService";
import type { Assignment, Task } from "../../types";

export type TodayTaskItem =
  | (Assignment & { itemType?: "assignment"; carryoverLabel?: string | null })
  | (Task & { itemType?: "task"; carryoverLabel?: string | null });

type LocalTodayTask = Task & { itemType: "task" };

const localStorageKey = "class-manager-local-today-tasks";
const memoryStorageKey = "class-manager-today-task-field-memory";

interface FieldMemory {
  priorities: string[];
  tags: string[];
}

function todayDate() {
  const now = new Date();
  const timezoneOffsetMs = now.getTimezoneOffset() * 60 * 1000;
  return new Date(now.getTime() - timezoneOffsetMs).toISOString().slice(0, 10);
}

function isBeforeToday(value?: string | null) {
  if (!value) return false;
  return value.slice(0, 10) < todayDate();
}

function readLocalTasks() {
  try {
    if (typeof window.localStorage === "undefined") return [];
    const raw = window.localStorage.getItem(localStorageKey);
    return raw ? (JSON.parse(raw) as LocalTodayTask[]) : [];
  } catch {
    return [];
  }
}

function writeLocalTasks(tasks: LocalTodayTask[]) {
  try {
    if (typeof window.localStorage !== "undefined") {
      window.localStorage.setItem(localStorageKey, JSON.stringify(tasks));
    }
  } catch {
    // Browser storage can be unavailable in embedded previews. In-memory state still works.
  }
  cacheCollection("local-device", "today-tasks", tasks);
  enqueueSync("local-device", "today-tasks", "upsert", tasks);
}

function readFieldMemory(): FieldMemory {
  try {
    if (typeof window.localStorage === "undefined") return { priorities: [], tags: [] };
    const raw = window.localStorage.getItem(memoryStorageKey);
    return raw ? (JSON.parse(raw) as FieldMemory) : { priorities: [], tags: [] };
  } catch {
    return { priorities: [], tags: [] };
  }
}

function writeFieldMemory(memory: FieldMemory) {
  try {
    if (typeof window.localStorage !== "undefined") {
      window.localStorage.setItem(memoryStorageKey, JSON.stringify(memory));
    }
  } catch {
    // Suggestions are a convenience; the task itself can still be edited.
  }
  cacheCollection("local-device", "field-memory", memory);
  enqueueSync("local-device", "field-memory", "upsert", memory);
}

function uniqueRecent(values: Array<string | null | undefined>) {
  const seen = new Set<string>();
  const result: string[] = [];

  values
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value))
    .forEach((value) => {
      const key = value.toLocaleLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        result.push(value);
      }
    });

  return result.slice(0, 8);
}

function isTaskItem(item: TodayTaskItem): item is Task & { itemType?: "task" } {
  return item.itemType === "task" || "sortOrder" in item;
}

function isLocalTask(item: TodayTaskItem) {
  return isTaskItem(item) && item.id.startsWith("local-");
}

function endpointFor(item: TodayTaskItem) {
  return isTaskItem(item) ? "/tasks" : "/assignments";
}

function createLocalTask(title: string, priority: string, tag: string): LocalTodayTask {
  const now = new Date().toISOString();
  return {
    id: `local-${Date.now()}`,
    courseId: null,
    title,
    status: "not_started",
    dueDate: todayDate(),
    priority,
    tag,
    completionTotal: null,
    completionLeft: null,
    sourceType: "manual",
    sortOrder: 0,
    createdAt: now,
    updatedAt: now,
    itemType: "task"
  };
}

export function TodayTasksPanel({
  items,
  onChange
}: {
  items: TodayTaskItem[];
  onChange: () => void;
}) {
  const { t } = usePreferences();
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("");
  const [tag, setTag] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [localTasks, setLocalTasks] = useState<LocalTodayTask[]>(readLocalTasks);
  const [fieldMemory, setFieldMemory] = useState<FieldMemory>(readFieldMemory);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [metaEditor, setMetaEditor] = useState<{
    id: string;
    priority: string;
    tag: string;
  } | null>(null);
  const [splitEditor, setSplitEditor] = useState<{
    id: string;
    item: TodayTaskItem;
    value: string;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const allItems = useMemo(
    () =>
      [
        ...items,
        ...localTasks.map((task) => ({
          ...task,
          carryoverLabel:
            task.status !== "completed" && isBeforeToday(task.dueDate) ? "어제 미완료" : null
        }))
      ].sort((a, b) => {
        if (a.status === "completed" && b.status !== "completed") return 1;
        if (a.status !== "completed" && b.status === "completed") return -1;
        return 0;
      }),
    [items, localTasks]
  );

  const prioritySuggestions = useMemo(
    () => uniqueRecent([...fieldMemory.priorities, ...allItems.map((item) => item.priority)]),
    [allItems, fieldMemory.priorities]
  );
  const tagSuggestions = useMemo(
    () =>
      uniqueRecent([
        ...fieldMemory.tags,
        ...allItems.map((item) => item.tag)
      ]),
    [allItems, fieldMemory.tags]
  );

  function updateLocalTasks(updater: (tasks: LocalTodayTask[]) => LocalTodayTask[]) {
    setLocalTasks((current) => {
      const next = updater(current);
      writeLocalTasks(next);
      return next;
    });
  }

  function rememberFields(nextPriority?: string | null, nextTag?: string | null) {
    const trimmedPriority = nextPriority?.trim();
    const trimmedTag = nextTag?.trim();

    if (!trimmedPriority && !trimmedTag) return;

    setFieldMemory((current) => {
      const next = {
        priorities: uniqueRecent([trimmedPriority, ...current.priorities]),
        tags: uniqueRecent([trimmedTag, ...current.tags])
      };
      writeFieldMemory(next);
      return next;
    });
  }

  async function addTask() {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;
    const trimmedPriority = priority.trim();
    const trimmedTag = tag.trim();

    setErrorMessage(null);
    const payload = {
      title: trimmedTitle,
      priority: trimmedPriority,
      tag: trimmedTag,
      dueDate: todayDate(),
      sourceType: "manual"
    };

    try {
      await api.post("/tasks", payload);
      onChange();
      rememberFields(trimmedPriority, trimmedTag);
    } catch {
      updateLocalTasks((current) => [...current, createLocalTask(trimmedTitle, trimmedPriority, trimmedTag)]);
      rememberFields(trimmedPriority, trimmedTag);
    } finally {
      setTitle("");
      setPriority("");
      setTag("");
      setShowCreateForm(false);
    }
  }

  async function updateItem(item: TodayTaskItem, patch: Record<string, string>) {
    setErrorMessage(null);
    setBusyId(item.id);

    try {
      if (isLocalTask(item)) {
        updateLocalTasks((current) =>
          current.map((task) => (task.id === item.id ? { ...task, ...patch } : task))
        );
      } else {
        await api.put(`${endpointFor(item)}/${item.id}`, patch);
        onChange();
      }
      rememberFields(patch.priority, patch.tag);
    } catch {
      setErrorMessage("변경 내용을 저장하지 못했습니다.");
    } finally {
      setBusyId(null);
    }
  }

  async function updateItemValues(
    item: TodayTaskItem,
    patch: Record<string, string | number | null>
  ) {
    setErrorMessage(null);
    setBusyId(item.id);

    try {
      if (isLocalTask(item)) {
        updateLocalTasks((current) =>
          current.map((task) => (task.id === item.id ? { ...task, ...patch } : task))
        );
      } else {
        await api.put(`${endpointFor(item)}/${item.id}`, patch);
        onChange();
      }
      rememberFields(
        typeof patch.priority === "string" ? patch.priority : undefined,
        typeof patch.tag === "string" ? patch.tag : undefined
      );
    } catch {
      setErrorMessage("변경 내용을 저장하지 못했습니다.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleCheck(item: TodayTaskItem) {
    const completed = item.status === "completed";
    const total = item.completionTotal ?? 0;
    const left = item.completionLeft ?? total;

    if (!total || total <= 1) {
      await updateItemValues(item, {
        status: completed ? "not_started" : "completed",
        completionLeft: completed ? null : 0
      });
      return;
    }

    if (completed) {
      await updateItemValues(item, {
        status: "not_started",
        completionLeft: total
      });
      return;
    }

    const nextLeft = Math.max(left - 1, 0);
    await updateItemValues(item, {
      status: nextLeft === 0 ? "completed" : "in_progress",
      completionLeft: nextLeft
    });
  }

  async function saveSplitSetting() {
    if (!splitEditor) return;
    const total = Number(splitEditor.value);
    const item = splitEditor.item;

    if (!Number.isFinite(total) || total <= 1) {
      await updateItemValues(item, {
        completionTotal: null,
        completionLeft: null,
        status: item.status === "completed" ? "completed" : "not_started"
      });
    } else {
      await updateItemValues(item, {
        completionTotal: Math.floor(total),
        completionLeft: Math.floor(total),
        status: "not_started"
      });
    }

    setSplitEditor(null);
  }

  async function deleteItem(item: TodayTaskItem) {
    setErrorMessage(null);
    setBusyId(item.id);

    try {
      if (isLocalTask(item)) {
        updateLocalTasks((current) => current.filter((task) => task.id !== item.id));
      } else {
        await api.delete(`${endpointFor(item)}/${item.id}`);
        onChange();
      }
    } catch {
      setErrorMessage("할 일을 삭제하지 못했습니다.");
    } finally {
      setBusyId(null);
    }
  }

  async function saveMetadata(item: TodayTaskItem) {
    if (!metaEditor) return;
    await updateItem(item, {
      priority: metaEditor.priority.trim(),
      tag: metaEditor.tag.trim()
    });
    setMetaEditor(null);
  }

  return (
    <div className="grid gap-3">
      <div className="flex justify-end">
        <button
          className="btn-secondary px-2 py-1 text-xs"
          type="button"
          onClick={() => setShowCreateForm((current) => !current)}
        >
          <Plus size={14} />
          {t("button.add")}
        </button>
      </div>

      {showCreateForm && (
        <>
          <form
            className="grid gap-2 md:grid-cols-[1fr_140px_140px_auto]"
            onSubmit={(event) => {
              event.preventDefault();
              void addTask();
            }}
          >
            <input
              className="field"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="예: DELF 발표 연습"
            />
            <input
              className="field"
              value={priority}
              onChange={(event) => setPriority(event.target.value)}
              placeholder="우선순위"
            />
            <input
              className="field"
              value={tag}
              onChange={(event) => setTag(event.target.value)}
              placeholder="태그"
            />
            <button className="btn-primary" type="submit" disabled={!title.trim()}>
              <Plus size={16} />
              {t("button.add")}
            </button>
          </form>

          {(prioritySuggestions.length > 0 || tagSuggestions.length > 0) && (
            <div className="grid gap-2 rounded-md bg-slate-50 p-3 text-sm">
              {prioritySuggestions.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-slate-600">우선순위</span>
                  {prioritySuggestions.map((value) => (
                    <button
                      key={`priority-${value}`}
                      className="rounded-md border border-line bg-white px-2 py-1 text-xs font-semibold text-slate-600 hover:border-blue-300 hover:text-blue-700"
                      type="button"
                      onClick={() => setPriority(value)}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              )}
              {tagSuggestions.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-slate-600">태그</span>
                  {tagSuggestions.map((value) => (
                    <button
                      key={`tag-${value}`}
                      className="rounded-md border border-line bg-white px-2 py-1 text-xs font-semibold text-slate-600 hover:border-blue-300 hover:text-blue-700"
                      type="button"
                      onClick={() => setTag(value)}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {errorMessage && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      {allItems.length ? (
        <div className="grid gap-2">
          {allItems.map((item) => {
            const isTask = isTaskItem(item);
            const completed = item.status === "completed";
            const itemPriority = item.priority ?? "";
            const itemTag = item.tag ?? "";
            const completionTotal = item.completionTotal ?? 0;
            const completionLeft =
              item.completionLeft ?? (completionTotal > 1 && !completed ? completionTotal : 0);
            const splitActive = completionTotal > 1 && !completed;

            return (
              <div
                key={`${isTask ? "task" : "assignment"}-${item.id}`}
                className={clsx(
                  "grid gap-3 rounded-md border border-line p-3",
                  completed && "bg-slate-50 opacity-70"
                )}
              >
                <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="grid justify-items-center gap-1">
                      <input
                        className="mt-1 h-4 w-4 rounded border-line"
                        type="checkbox"
                        checked={completed}
                        disabled={busyId === item.id}
                        onContextMenu={(event) => {
                          event.preventDefault();
                          setSplitEditor({
                            id: item.id,
                            item,
                            value: String(item.completionTotal ?? "")
                          });
                        }}
                        onChange={() => void handleCheck(item)}
                        title="우클릭해서 나눠 하기 설정"
                      />
                      {splitActive && (
                        <span className="rounded-md bg-blue-50 px-1.5 py-0.5 text-[11px] font-bold text-blue-700">
                          {completionLeft}
                        </span>
                      )}
                    </div>
                    <span className="min-w-0">
                      <span className="flex flex-wrap items-center gap-1.5">
                        <span
                          className={clsx(
                            "min-w-0 break-words font-semibold",
                            completed && "text-slate-500 line-through"
                          )}
                        >
                          {completed ? "✓ " : ""}
                          {item.title}
                        </span>
                        {itemPriority && (
                          <span
                            className="rounded-md border border-line bg-white px-1.5 py-0.5 text-[11px] font-bold leading-tight text-slate-500"
                            title={`우선순위: ${itemPriority}`}
                          >
                            {itemPriority}
                          </span>
                        )}
                        {itemTag && (
                          <span
                            className="rounded-md border border-line bg-white px-1.5 py-0.5 text-[11px] font-bold leading-tight text-slate-500"
                            title={`태그: ${itemTag}`}
                          >
                            {itemTag}
                          </span>
                        )}
                      </span>
                      <span className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-slate-500">
                        {item.carryoverLabel && (
                          <span className="rounded-md bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700">
                            {item.carryoverLabel}
                          </span>
                        )}
                        {item.course && (
                          <span className="inline-flex items-center gap-2">
                            <CourseColorDot color={item.course.color} />
                            {item.course.courseName}
                          </span>
                        )}
                        {splitActive && (
                          <span className="text-xs font-semibold text-slate-500">
                            {completionTotal}회 중 {completionLeft}회 남음
                          </span>
                        )}
                      </span>
                      {splitEditor?.id === item.id && (
                        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-md bg-slate-50 p-2 text-sm">
                          <span className="font-semibold text-slate-600">나눠 하기</span>
                          <input
                            className="field w-24"
                            min={2}
                            type="number"
                            value={splitEditor.value}
                            onChange={(event) =>
                              setSplitEditor({ ...splitEditor, value: event.target.value })
                            }
                            placeholder="횟수"
                          />
                          <button
                            className="btn-primary px-2 py-1"
                            type="button"
                            onClick={() => void saveSplitSetting()}
                          >
                            {t("button.save")}
                          </button>
                          <button
                            className="btn-secondary px-2 py-1"
                            type="button"
                            onClick={() => setSplitEditor(null)}
                          >
                            {t("button.cancel")}
                          </button>
                        </div>
                      )}
                      {metaEditor?.id === item.id && (
                        <div className="mt-3 grid gap-2 rounded-md bg-slate-50 p-2 text-sm md:grid-cols-[1fr_1fr_auto_auto]">
                          <input
                            className="field"
                            value={metaEditor.priority}
                            onChange={(event) =>
                              setMetaEditor({ ...metaEditor, priority: event.target.value })
                            }
                            placeholder="우선순위"
                          />
                          <input
                            className="field"
                            value={metaEditor.tag}
                            onChange={(event) =>
                              setMetaEditor({ ...metaEditor, tag: event.target.value })
                            }
                            placeholder="태그"
                          />
                          <button
                            className="btn-primary px-2 py-1"
                            type="button"
                            onClick={() => void saveMetadata(item)}
                          >
                            {t("button.save")}
                          </button>
                          <button
                            className="btn-secondary px-2 py-1"
                            type="button"
                            onClick={() => setMetaEditor(null)}
                          >
                            {t("button.cancel")}
                          </button>
                        </div>
                      )}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-start justify-end gap-2">
                    <button
                      className="btn-secondary px-2 py-1"
                      type="button"
                      title="우선순위/태그 수정"
                      disabled={busyId === item.id}
                      onClick={() =>
                        setMetaEditor({
                          id: item.id,
                          priority: itemPriority,
                          tag: itemTag
                        })
                      }
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      className="btn-danger px-2 py-1"
                      type="button"
                      title="삭제"
                      disabled={busyId === item.id}
                      onClick={() => void deleteItem(item)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState title="오늘 할 일이 없습니다. 새로운 할 일을 추가해보세요." />
      )}
    </div>
  );
}
