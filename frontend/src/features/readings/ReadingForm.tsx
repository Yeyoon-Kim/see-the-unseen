import { useEffect, useMemo, useState } from "react";
import type { Course, ReadingItem } from "../../types";
import { inputDate } from "../../utils/date";

interface Props {
  courses: Course[];
  initial?: ReadingItem | null;
  onSubmit: (values: Record<string, string>) => void;
  onCancel?: () => void;
  isSaving?: boolean;
}

export function ReadingForm({ courses, initial, onSubmit, onCancel, isSaving }: Props) {
  const defaultCourseId = courses[0]?.id ?? "";
  const empty = useMemo(
    () => ({
      courseId: defaultCourseId,
      title: "",
      authors: "",
      year: "",
      source: "",
      dueDate: "",
      readingStatus: "not_started",
      notes: ""
    }),
    [defaultCourseId]
  );
  const [form, setForm] = useState(empty);

  useEffect(() => {
    if (!initial) {
      setForm(empty);
      return;
    }
    setForm({
      courseId: initial.courseId,
      title: initial.title,
      authors: initial.authors ?? "",
      year: initial.year ?? "",
      source: initial.source ?? "",
      dueDate: inputDate(initial.dueDate),
      readingStatus: initial.readingStatus,
      notes: initial.notes ?? ""
    });
  }, [empty, initial]);

  return (
    <form
      className="card grid gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(form);
        if (!initial) setForm(empty);
      }}
    >
      <div className="grid gap-3 md:grid-cols-2">
        <select
          className="field"
          value={form.courseId}
          onChange={(event) => setForm({ ...form, courseId: event.target.value })}
          required
        >
          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.courseName}
            </option>
          ))}
        </select>
        <input
          className="field"
          value={form.title}
          onChange={(event) => setForm({ ...form, title: event.target.value })}
          placeholder="논문/자료 제목"
          required
        />
      </div>
      <div className="grid gap-3 md:grid-cols-4">
        <input
          className="field"
          value={form.authors}
          onChange={(event) => setForm({ ...form, authors: event.target.value })}
          placeholder="저자"
        />
        <input
          className="field"
          value={form.year}
          onChange={(event) => setForm({ ...form, year: event.target.value })}
          placeholder="연도"
        />
        <input
          className="field"
          value={form.source}
          onChange={(event) => setForm({ ...form, source: event.target.value })}
          placeholder="출처"
        />
        <input
          className="field"
          type="date"
          value={form.dueDate}
          onChange={(event) => setForm({ ...form, dueDate: event.target.value })}
        />
      </div>
      <textarea
        className="field min-h-24"
        value={form.notes}
        onChange={(event) => setForm({ ...form, notes: event.target.value })}
        placeholder="메모"
      />
      <select
        className="field"
        value={form.readingStatus}
        onChange={(event) => setForm({ ...form, readingStatus: event.target.value })}
      >
        <option value="not_started">시작 전</option>
        <option value="reading">읽는 중</option>
        <option value="summarized">요약 완료</option>
        <option value="discussed">토론 완료</option>
      </select>
      <div className="flex flex-wrap justify-end gap-2">
        {onCancel && (
          <button className="btn-secondary" type="button" onClick={onCancel}>
            취소
          </button>
        )}
        <button className="btn-primary" disabled={isSaving || !courses.length}>
          {initial ? "수정" : "추가"}
        </button>
      </div>
    </form>
  );
}

