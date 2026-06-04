import { useEffect, useMemo, useState } from "react";
import type { Assignment, Course } from "../../types";
import { inputDate } from "../../utils/date";

interface Props {
  courses: Course[];
  initial?: Assignment | null;
  onSubmit: (values: Record<string, string>) => void;
  onCancel?: () => void;
  isSaving?: boolean;
}

export function AssignmentForm({ courses, initial, onSubmit, onCancel, isSaving }: Props) {
  const defaultCourseId = courses[0]?.id ?? "";
  const empty = useMemo(
    () => ({
      courseId: defaultCourseId,
      title: "",
      description: "",
      dueDate: "",
      submissionFormat: "",
      priority: "medium",
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
      description: initial.description ?? "",
      dueDate: inputDate(initial.dueDate),
      submissionFormat: initial.submissionFormat ?? "",
      priority: initial.priority ?? "medium",
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
          placeholder="과제명"
          required
        />
      </div>
      <textarea
        className="field min-h-24"
        value={form.description}
        onChange={(event) => setForm({ ...form, description: event.target.value })}
        placeholder="설명"
      />
      <div className="grid gap-3 md:grid-cols-4">
        <input
          className="field"
          type="date"
          value={form.dueDate}
          onChange={(event) => setForm({ ...form, dueDate: event.target.value })}
        />
        <input
          className="field"
          value={form.submissionFormat}
          onChange={(event) => setForm({ ...form, submissionFormat: event.target.value })}
          placeholder="제출 형식"
        />
        <select
          className="field"
          value={form.priority}
          onChange={(event) => setForm({ ...form, priority: event.target.value })}
        >
          <option value="low">낮음</option>
          <option value="medium">보통</option>
          <option value="high">높음</option>
        </select>
        <select
          className="field"
          value={form.status}
          onChange={(event) => setForm({ ...form, status: event.target.value })}
        >
          <option value="not_started">시작 전</option>
          <option value="in_progress">진행 중</option>
          <option value="completed">완료</option>
        </select>
      </div>
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
