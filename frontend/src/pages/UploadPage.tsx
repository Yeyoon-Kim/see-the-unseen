import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { UploadCloud } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { EmptyState } from "../components/EmptyState";
import { ErrorState } from "../components/ErrorState";
import { LoadingState } from "../components/LoadingState";
import { NoticeAnalysisReview } from "../features/upload/NoticeAnalysisReview";
import { SyllabusAnalysisReview } from "../features/upload/SyllabusAnalysisReview";
import type { Course } from "../types";

type UploadMode = "syllabus" | "notice" | "material";

interface UploadResponse {
  uploadedFile?: { id: string };
  extractedText?: string;
  analysis?: unknown;
}

interface NoticeAnalysis {
  assignments?: Array<Record<string, unknown>>;
}

export function UploadPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [mode, setMode] = useState<UploadMode>("syllabus");
  const [courseId, setCourseId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("");
  const [title, setTitle] = useState("");
  const [result, setResult] = useState<UploadResponse | null>(null);
  const [saveMessage, setSaveMessage] = useState("");

  const coursesQuery = useQuery({
    queryKey: ["courses"],
    queryFn: async () => (await api.get<Course[]>("/courses")).data
  });

  useEffect(() => {
    if (!courseId && coursesQuery.data?.[0]) setCourseId(coursesQuery.data[0].id);
  }, [courseId, coursesQuery.data]);

  const analyzeMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      formData.append("text", text);
      if (file) formData.append("file", file);
      if (courseId) formData.append("courseId", courseId);
      if (title) formData.append("title", title);

      if (mode === "material") {
        return (
          await api.post("/materials/upload", formData, {
            headers: { "Content-Type": "multipart/form-data" }
          })
        ).data;
      }

      return (
        await api.post(`/upload/${mode}`, formData, {
          headers: { "Content-Type": "multipart/form-data" }
        })
      ).data;
    },
    onSuccess: (data) => {
      setResult(data);
      if (mode === "material") {
        queryClient.invalidateQueries({ queryKey: ["materials"] });
        setSaveMessage("자료 저장 완료");
      }
    }
  });

  const saveSyllabusMutation = useMutation({
    mutationFn: async (analysis: unknown) =>
      (
        await api.post("/upload/syllabus/save", {
          analysis,
          uploadedFileId: result?.uploadedFile?.id
        })
      ).data as Course,
    onSuccess: (course) => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      navigate(`/courses/${course.id}`);
    }
  });

  const saveNoticeMutation = useMutation({
    mutationFn: async (analysis: NoticeAnalysis) => {
      return api.post("/upload/notice/save", {
        courseId,
        analysis,
        uploadedFileId: result?.uploadedFile?.id,
        extractedText: result?.extractedText
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setSaveMessage("과제 저장 완료");
    }
  });

  if (coursesQuery.isLoading) return <LoadingState />;
  if (coursesQuery.isError) return <ErrorState />;

  const courses = coursesQuery.data ?? [];

  return (
    <div className="grid gap-5">
      <div>
        <h1 className="text-2xl font-bold">업로드</h1>
        <p className="mt-1 text-sm text-slate-500">
          스크린샷, PDF, Word 파일을 올리면 읽고 정리합니다.
        </p>
      </div>
      <section className="card grid gap-4">
        <div className="flex flex-wrap gap-2">
          {[
            ["syllabus", "계획서"],
            ["notice", "과제 공지"],
            ["material", "자료"]
          ].map(([value, label]) => (
            <button
              key={value}
              className={mode === value ? "btn-primary" : "btn-secondary"}
              type="button"
              onClick={() => {
                setMode(value as UploadMode);
                setResult(null);
                setSaveMessage("");
              }}
            >
              {label}
            </button>
          ))}
        </div>
        {(mode === "notice" || mode === "material") && (
          <>
            {courses.length ? (
              <select
                className="field"
                value={courseId}
                onChange={(event) => setCourseId(event.target.value)}
              >
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.courseName}
                  </option>
                ))}
              </select>
            ) : (
              <EmptyState title="고정 일정 없음" />
            )}
          </>
        )}
        {mode === "material" && (
          <input
            className="field"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="자료명"
          />
        )}
        <input
          className="field"
          type="file"
          accept=".pdf,.doc,.docx,.txt,image/png,image/jpeg,image/webp,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
        />
        <div className="text-xs font-semibold text-slate-500">
          계획서, 공지, 자료는 이미지·PDF·Word·TXT로 올릴 수 있습니다. 텍스트
          입력은 추출이 실패했을 때만 보정용으로 쓰면 됩니다.
        </div>
        <textarea
          className="field min-h-40"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="OCR 보정용 텍스트"
        />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm font-semibold text-emerald-700">{saveMessage}</div>
          <button
            className="btn-primary"
            onClick={() => {
              setResult(null);
              setSaveMessage("");
              analyzeMutation.mutate();
            }}
            disabled={analyzeMutation.isPending || (!text && !file)}
          >
            <UploadCloud size={16} />
            {mode === "material" ? "저장" : "분석"}
          </button>
        </div>
      </section>

      {analyzeMutation.isPending && <LoadingState label="분석 중" />}
      {analyzeMutation.isError && <ErrorState title="분석에 실패했습니다" />}

      {mode === "syllabus" && result?.analysis !== undefined && (
        <SyllabusAnalysisReview
          analysis={result.analysis}
          onSave={(analysis) => saveSyllabusMutation.mutate(analysis)}
          isSaving={saveSyllabusMutation.isPending}
        />
      )}

      {mode === "notice" && result?.analysis !== undefined && (
        <NoticeAnalysisReview
          analysis={result.analysis}
          onSave={(analysis) => saveNoticeMutation.mutate(analysis as NoticeAnalysis)}
          isSaving={saveNoticeMutation.isPending}
        />
      )}
    </div>
  );
}
