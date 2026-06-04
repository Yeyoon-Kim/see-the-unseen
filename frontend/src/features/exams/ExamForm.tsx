import { useEffect, useMemo, useState } from "react";
import type { Course, Exam } from "../../types";
import { inputDate } from "../../utils/date";

interface Props {
  courses: Course[];
  initial?: Exam | null;
  onSubmit: (values: Record<string, string>) => void;
  onCancel?: () => void;
  isSaving?: boolean;
}

export function ExamForm({ courses, initial, onSubmit, onCancel, isSaving }: Props) {
  const defaultCourseId = courses[0]?.id ?? "";
  const empty = useMemo(
    () => ({
      courseId: defaultCourseId,
      title: "",
      examDate: "",
      scope: "",
      format: "",
      weight: "",
      status: "not_started"
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
      examDate: inputDate(initial.examDate),
      scope: initial.scope ?? "",
      format: initial.format ?? "",
      weight: initial.weight ? String(initial.weight) : "",
      status: initial.status
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
          placeholder="시험명"
          required
        />
      </div>
      <div className="grid gap-3 md:grid-cols-4">
        <input
          className="field"
          type="date"
          value={form.examDate}
          onChange={(event) => setForm({ ...form, examDate: event.target.value })}
        />
        <input
          className="field"
          value={form.scope}
          onChange={(event) => setForm({ ...form, scope: event.target.value })}
          placeholder="범위"
        />
        <input
          className="field"
          value={form.format}
          onChange={(event) => setForm({ ...form, format: event.target.value })}
          placeholder="형식"
        />
        <input
          className="field"
          type="number"
          min="0"
          value={form.weight}
          onChange={(event) => setForm({ ...form, weight: event.target.value })}
          placeholder="비중"
        />
      </div>
      <select
        className="field"
        value={form.status}
        onChange={(event) => setForm({ ...form, status: event.target.value })}
      >
        <option value="not_started">시작 전</option>
        <option value="in_progress">진행 중</option>
        <option value="completed">완료</option>
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

