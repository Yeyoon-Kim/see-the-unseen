import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileText, MessageSquare, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { api } from "../api/client";
import { CourseColorDot } from "../components/CourseColorDot";
import { DateBadge } from "../components/DateBadge";
import { EmptyState } from "../components/EmptyState";
import { ErrorState } from "../components/ErrorState";
import { LoadingState } from "../components/LoadingState";
import { StatusBadge } from "../components/StatusBadge";
import { ReadingForm } from "../features/readings/ReadingForm";
import type { Course, ReadingItem } from "../types";
import { parseJsonList, parseJsonObject } from "../utils/format";

interface QuestionResult {
  questions?: string[];
  keyConcepts?: string[];
}

export function ReadingsPage() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<ReadingItem | null>(null);
  const coursesQuery = useQuery({
    queryKey: ["courses"],
    queryFn: async () => (await api.get<Course[]>("/courses")).data
  });
  const readingsQuery = useQuery({
    queryKey: ["readings"],
    queryFn: async () => (await api.get<ReadingItem[]>("/readings")).data
  });

  const saveMutation = useMutation({
    mutationFn: async (values: Record<string, string>) => {
      if (editing) return (await api.put(`/readings/${editing.id}`, values)).data;
      return (await api.post("/readings", values)).data;
    },
    onSuccess: () => {
      setEditing(null);
      queryClient.invalidateQueries({ queryKey: ["readings"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/readings/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["readings"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    }
  });

  const questionsMutation = useMutation({
    mutationFn: async (id: string) => api.post(`/readings/${id}/generate-questions`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["readings"] })
  });

  const summaryMutation = useMutation({
    mutationFn: async (id: string) => api.post(`/readings/${id}/generate-summary`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["readings"] })
  });

  if (coursesQuery.isLoading || readingsQuery.isLoading) return <LoadingState />;
  if (coursesQuery.isError || readingsQuery.isError) return <ErrorState />;

  const courses = coursesQuery.data ?? [];
  const readings = readingsQuery.data ?? [];

  return (
    <div className="grid gap-5">
      <div>
        <h1 className="text-2xl font-bold">논문/읽기</h1>
        <p className="mt-1 text-sm text-slate-500">세미나 준비와 읽기 마감일을 관리합니다.</p>
      </div>
      <ReadingForm
        courses={courses}
        initial={editing}
        onSubmit={(values) => saveMutation.mutate(values)}
        onCancel={editing ? () => setEditing(null) : undefined}
        isSaving={saveMutation.isPending}
      />

      {readings.length ? (
        <div className="grid gap-3">
          {readings.map((reading) => {
            const questionObject = parseJsonObject<QuestionResult>(reading.keyQuestions);
            const questions = questionObject?.questions ?? parseJsonList(reading.keyQuestions);
            const concepts = questionObject?.keyConcepts ?? [];
            return (
              <article key={reading.id} className="card">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="mb-2 flex flex-wrap items-center gap-2 text-sm text-slate-500">
                      {reading.course && (
                        <>
                          <CourseColorDot color={reading.course.color} />
                          {reading.course.courseName}
                        </>
                      )}
                    </div>
                    <h2 className="text-lg font-bold">{reading.title}</h2>
                    <div className="mt-2 text-sm text-slate-600">
                      {reading.authors || "저자 없음"} · {reading.year || "연도 없음"} ·{" "}
                      {reading.source || "출처 없음"}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <DateBadge value={reading.dueDate} />
                    <StatusBadge value={reading.readingStatus} />
                  </div>
                </div>
                {reading.summary && (
                  <div className="mt-4 rounded-md border border-line bg-paper p-3 text-sm text-slate-600">
                    {reading.summary}
                  </div>
                )}
                {questions.length ? (
                  <div className="mt-4 grid gap-2 border-t border-line pt-3 text-sm text-slate-600">
                    <div className="font-semibold text-ink">토론 질문</div>
                    {questions.map((question) => (
                      <div key={question}>- {question}</div>
                    ))}
                  </div>
                ) : null}
                {concepts.length ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {concepts.map((concept) => (
                      <span key={concept} className="rounded-md bg-slate-100 px-2 py-1 text-xs">
                        {concept}
                      </span>
                    ))}
                  </div>
                ) : null}
                <div className="mt-4 flex flex-wrap justify-end gap-2">
                  <button
                    className="btn-secondary"
                    onClick={() => summaryMutation.mutate(reading.id)}
                    disabled={summaryMutation.isPending}
                  >
                    <FileText size={16} />
                    요약 생성
                  </button>
                  <button
                    className="btn-secondary"
                    onClick={() => questionsMutation.mutate(reading.id)}
                    disabled={questionsMutation.isPending}
                  >
                    <MessageSquare size={16} />
                    토론 질문
                  </button>
                  <button className="btn-secondary" onClick={() => setEditing(reading)}>
                    <Pencil size={16} />
                    수정
                  </button>
                  <button className="btn-danger" onClick={() => deleteMutation.mutate(reading.id)}>
                    <Trash2 size={16} />
                    삭제
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <EmptyState title="읽기 항목 없음" />
      )}
    </div>
  );
}
