import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileImage, Save, UploadCloud } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api/client";
import { EmptyState } from "../../components/EmptyState";
import { usePreferences } from "../preferences/preferences";
import type { Course } from "../../types";

type CaptureMode = "notice" | "syllabus";

interface UploadResponse {
  uploadedFile?: { id: string };
  extractedText?: string;
  analysis?: unknown;
}

export function ScreenshotCaptureCard() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { t } = usePreferences();
  const [mode, setMode] = useState<CaptureMode>("syllabus");
  const [courseId, setCourseId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<UploadResponse | null>(null);
  const [json, setJson] = useState("");
  const [message, setMessage] = useState("");

  const coursesQuery = useQuery({
    queryKey: ["courses"],
    queryFn: async () => (await api.get<Course[]>("/courses")).data
  });

  useEffect(() => {
    if (!courseId && coursesQuery.data?.[0]) setCourseId(coursesQuery.data[0].id);
  }, [courseId, coursesQuery.data]);

  useEffect(() => {
    setJson(result?.analysis ? JSON.stringify(result.analysis, null, 2) : "");
  }, [result]);

  const analyzeMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      if (file) formData.append("file", file);
      return (
        await api.post(`/upload/${mode}`, formData, {
          headers: { "Content-Type": "multipart/form-data" }
        })
      ).data as UploadResponse;
    },
    onSuccess: (data) => {
      setResult(data);
      setMessage("분석 완료");
    }
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const analysis = JSON.parse(json);
      if (mode === "syllabus") {
        return (
          await api.post("/upload/syllabus/save", {
            analysis,
            uploadedFileId: result?.uploadedFile?.id
          })
        ).data as Course;
      }

      return (
        await api.post("/upload/notice/save", {
          courseId,
          analysis,
          uploadedFileId: result?.uploadedFile?.id,
          extractedText: result?.extractedText
        })
      ).data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
      setMessage("저장 완료");
      setFile(null);
      setResult(null);
      setJson("");
      if (mode === "syllabus" && data?.id) navigate(`/courses/${data.id}`);
    }
  });

  const courses = coursesQuery.data ?? [];

  return (
    <section className="card grid gap-4">
      <div className="flex items-center gap-2">
        <FileImage size={18} className="text-blue-600" />
        <h2 className="text-base font-bold">{t("dashboard.fileUpload")}</h2>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={mode === "syllabus" ? "btn-primary" : "btn-secondary"}
          onClick={() => {
            setMode("syllabus");
            setResult(null);
          }}
        >
          계획서
        </button>
        <button
          type="button"
          className={mode === "notice" ? "btn-primary" : "btn-secondary"}
          onClick={() => {
            setMode("notice");
            setResult(null);
          }}
        >
          공지/과제
        </button>
      </div>

      {mode === "notice" &&
        (courses.length ? (
          <select className="field" value={courseId} onChange={(e) => setCourseId(e.target.value)}>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.courseName}
              </option>
            ))}
          </select>
        ) : (
          <EmptyState title="공지 저장 전 고정 일정을 먼저 추가해 주세요" />
        ))}

      <input
        className="field"
        type="file"
        accept=".pdf,.doc,.docx,.txt,image/png,image/jpeg,image/webp,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        onChange={(event) => {
          setFile(event.target.files?.[0] ?? null);
          setResult(null);
          setMessage("");
        }}
      />
      <div className="text-xs font-semibold text-slate-500">
        계획서부터 분석합니다. 스크린샷, PDF, Word(.doc/.docx), TXT 파일을 올릴 수 있습니다.
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm font-semibold text-emerald-700">{message}</div>
        <button
          className="btn-primary"
          disabled={!file || analyzeMutation.isPending}
          onClick={() => analyzeMutation.mutate()}
        >
          <UploadCloud size={16} />
          읽기
        </button>
      </div>

      {result?.extractedText && (
        <div className="rounded-md border border-line bg-paper p-3">
          <div className="mb-2 text-sm font-bold">읽은 텍스트</div>
          <p className="max-h-36 overflow-auto whitespace-pre-wrap text-sm text-slate-600">
            {result.extractedText}
          </p>
        </div>
      )}

      {json && (
        <div className="grid gap-3">
          <textarea
            className="field min-h-56 font-mono text-xs"
            value={json}
            onChange={(event) => setJson(event.target.value)}
          />
          <div className="flex justify-end">
            <button
              className="btn-primary"
              disabled={saveMutation.isPending || (mode === "notice" && !courseId)}
              onClick={() => saveMutation.mutate()}
            >
              <Save size={16} />
              저장
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
