import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarCheck, ListChecks, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { api } from "../api/client";
import { CourseColorDot } from "../components/CourseColorDot";
import { DateBadge } from "../components/DateBadge";
import { EmptyState } from "../components/EmptyState";
import { ErrorState } from "../components/ErrorState";
import { LoadingState } from "../components/LoadingState";
import { StatusBadge } from "../components/StatusBadge";
import { ExamForm } from "../features/exams/ExamForm";
import type { Course, Exam } from "../types";
import { daysUntil } from "../utils/date";
import { parseJsonObject } from "../utils/format";

interface StudyPlan {
  studyPlan?: string;
  checklist?: string[];
}

export function ExamsPage() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<Exam | null>(null);
  const coursesQuery = useQuery({
    queryKey: ["courses"],
    queryFn: async () => (await api.get<Course[]>("/courses")).data
  });
  const examsQuery = useQuery({
    queryKey: ["exams"],
    queryFn: async () => (await api.get<Exam[]>("/exams")).data
  });

  const saveMutation = useMutation({
    mutationFn: async (values: Record<string, string>) => {
      if (editing) return (await api.put(`/exams/${editing.id}`, values)).data;
      return (await api.post("/exams", values)).data;
    },
    onSuccess: () => {
      setEditing(null);
      queryClient.invalidateQueries({ queryKey: ["exams"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/exams/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exams"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    }
  });

  const planMutation = useMutation({
    mutationFn: async (id: string) => api.post(`/exams/${id}/generate-study-plan`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["exams"] })
  });

  if (coursesQuery.isLoading || examsQuery.isLoading) return <LoadingState />;
  if (coursesQuery.isError || examsQuery.isError) return <ErrorState />;

  const courses = coursesQuery.data ?? [];
  const exams = examsQuery.data ?? [];

  return (
    <div className="grid gap-5">
      <div>
        <h1 className="text-2xl font-bold">시험</h1>
        <p className="mt-1 text-sm text-slate-500">남은 날짜와 공부 계획을 함께 봅니다.</p>
      </div>
      <ExamForm
        courses={courses}
        initial={editing}
        onSubmit={(values) => saveMutation.mutate(values)}
        onCancel={editing ? () => setEditing(null) : undefined}
        isSaving={saveMutation.isPending}
      />

      {exams.length ? (
        <div className="grid gap-3">
          {exams.map((exam) => {
            const plan = parseJsonObject<StudyPlan>(exam.studyPlan);
            return (
              <article key={exam.id} className="card">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="mb-2 flex flex-wrap items-center gap-2 text-sm text-slate-500">
                      {exam.course && (
                        <>
                          <CourseColorDot color={exam.course.color} />
                          {exam.course.courseName}
                        </>
                      )}
                    </div>
                    <h2 className="text-lg font-bold">{exam.title}</h2>
                    <div className="mt-2 text-sm text-slate-600">
                      {exam.scope || "범위 없음"} · {exam.format || "형식 없음"} ·{" "}
                      {exam.weight ?? 0}%
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <DateBadge value={exam.examDate} />
                    <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                      {daysUntil(exam.examDate) ?? "?"}일
                    </span>
                    <StatusBadge value={exam.status} />
                  </div>
                </div>
                {plan?.studyPlan && (
                  <div className="mt-4 rounded-md border border-line bg-paper p-3 text-sm text-slate-600">
                    <div className="mb-2 font-semibold text-ink">공부 계획</div>
                    <p>{plan.studyPlan}</p>
                    <ul className="mt-2 grid gap-1">
                      {plan.checklist?.map((item) => <li key={item}>- {item}</li>)}
                    </ul>
                  </div>
                )}
                {exam.tasks?.length ? (
                  <ul className="mt-4 grid gap-2 border-t border-line pt-3 text-sm text-slate-600">
                    {exam.tasks.map((task) => (
                      <li key={task.id} className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                        {task.title}
                      </li>
                    ))}
                  </ul>
                ) : null}
                <div className="mt-4 flex flex-wrap justify-end gap-2">
                  <button
                    className="btn-secondary"
                    onClick={() => planMutation.mutate(exam.id)}
                    disabled={planMutation.isPending}
                  >
                    <CalendarCheck size={16} />
                    준비 계획 생성
                  </button>
                  <button className="btn-secondary" onClick={() => setEditing(exam)}>
                    <Pencil size={16} />
                    수정
                  </button>
                  <button className="btn-danger" onClick={() => deleteMutation.mutate(exam.id)}>
                    <Trash2 size={16} />
                    삭제
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <EmptyState title="시험 없음" />
      )}
    </div>
  );
}
