import { useEffect, useMemo, useState } from "react";
import type { Course, PresentationItem } from "../../types";
import { inputDate } from "../../utils/date";

interface Props {
  courses: Course[];
  initial?: PresentationItem | null;
  onSubmit: (values: Record<string, string>) => void;
  onCancel?: () => void;
  isSaving?: boolean;
}

export function PresentationForm({
  courses,
  initial,
  onSubmit,
  onCancel,
  isSaving
}: Props) {
  const defaultCourseId = courses[0]?.id ?? "";
  const empty = useMemo(
    () => ({
      courseId: defaultCourseId,
      title: "",
      presentationDate: "",
      topic: "",
      teamMembers: "",
      myRole: "",
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
      presentationDate: inputDate(initial.presentationDate),
      topic: initial.topic ?? "",
      teamMembers: initial.teamMembers ?? "",
      myRole: initial.myRole ?? "",
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
          placeholder="발표명"
          required
        />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <input
          className="field"
          type="date"
          value={form.presentationDate}
          onChange={(event) => setForm({ ...form, presentationDate: event.target.value })}
        />
        <input
          className="field"
          value={form.topic}
          onChange={(event) => setForm({ ...form, topic: event.target.value })}
          placeholder="주제"
        />
        <input
          className="field"
          value={form.teamMembers}
          onChange={(event) => setForm({ ...form, teamMembers: event.target.value })}
          placeholder="팀원"
        />
        <input
          className="field"
          value={form.myRole}
          onChange={(event) => setForm({ ...form, myRole: event.target.value })}
          placeholder="내 역할"
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

