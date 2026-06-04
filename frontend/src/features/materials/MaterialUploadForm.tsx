import { useEffect, useState } from "react";
import type { Course } from "../../types";

interface Props {
  courses: Course[];
  onSubmit: (formData: FormData) => void;
  isSaving?: boolean;
}

export function MaterialUploadForm({ courses, onSubmit, isSaving }: Props) {
  const [courseId, setCourseId] = useState(courses[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    if (!courseId && courses[0]) setCourseId(courses[0].id);
  }, [courseId, courses]);

  return (
    <form
      className="card grid gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData();
        data.append("courseId", courseId);
        data.append("title", title);
        data.append("text", text);
        if (file) data.append("file", file);
        onSubmit(data);
        setTitle("");
        setText("");
        setFile(null);
      }}
    >
      <div className="grid gap-3 md:grid-cols-2">
        <select
          className="field"
          value={courseId}
          onChange={(event) => setCourseId(event.target.value)}
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
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="자료명"
        />
      </div>
      <input
        className="field"
        type="file"
        accept=".pdf,.doc,.docx,.txt,image/png,image/jpeg,image/webp,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        onChange={(event) => setFile(event.target.files?.[0] ?? null)}
      />
      <textarea
        className="field min-h-28"
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="텍스트"
      />
      <div className="flex justify-end">
        <button className="btn-primary" disabled={isSaving || !courses.length}>
          업로드
        </button>
      </div>
    </form>
  );
}
