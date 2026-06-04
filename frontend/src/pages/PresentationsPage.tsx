import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ListChecks, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { api } from "../api/client";
import { CourseColorDot } from "../components/CourseColorDot";
import { DateBadge } from "../components/DateBadge";
import { EmptyState } from "../components/EmptyState";
import { ErrorState } from "../components/ErrorState";
import { LoadingState } from "../components/LoadingState";
import { StatusBadge } from "../components/StatusBadge";
import { PresentationForm } from "../features/presentations/PresentationForm";
import type { Course, PresentationItem } from "../types";
import { parseJsonList } from "../utils/format";

export function PresentationsPage() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<PresentationItem | null>(null);
  const coursesQuery = useQuery({
    queryKey: ["courses"],
    queryFn: async () => (await api.get<Course[]>("/courses")).data
  });
  const presentationsQuery = useQuery({
    queryKey: ["presentations"],
    queryFn: async () => (await api.get<PresentationItem[]>("/presentations")).data
  });

  const saveMutation = useMutation({
    mutationFn: async (values: Record<string, string>) => {
      if (editing) return (await api.put(`/presentations/${editing.id}`, values)).data;
      return (await api.post("/presentations", values)).data;
    },
    onSuccess: () => {
      setEditing(null);
      queryClient.invalidateQueries({ queryKey: ["presentations"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/presentations/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["presentations"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    }
  });

  const checklistMutation = useMutation({
    mutationFn: async (id: string) => api.post(`/presentations/${id}/generate-checklist`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["presentations"] })
  });

  if (coursesQuery.isLoading || presentationsQuery.isLoading) return <LoadingState />;
  if (coursesQuery.isError || presentationsQuery.isError) return <ErrorState />;

  const courses = coursesQuery.data ?? [];
  const presentations = presentationsQuery.data ?? [];

  return (
    <div className="grid gap-5">
      <div>
        <h1 className="text-2xl font-bold">발표/팀플</h1>
        <p className="mt-1 text-sm text-slate-500">일정, 역할, 준비 단계를 관리합니다.</p>
      </div>
      <PresentationForm
        courses={courses}
        initial={editing}
        onSubmit={(values) => saveMutation.mutate(values)}
        onCancel={editing ? () => setEditing(null) : undefined}
        isSaving={saveMutation.isPending}
      />

      {presentations.length ? (
        <div className="grid gap-3">
          {presentations.map((item) => (
            <article key={item.id} className="card">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="mb-2 flex flex-wrap items-center gap-2 text-sm text-slate-500">
                    {item.course && (
                      <>
                        <CourseColorDot color={item.course.color} />
                        {item.course.courseName}
                      </>
                    )}
                  </div>
                  <h2 className="text-lg font-bold">{item.title}</h2>
                  <div className="mt-2 text-sm text-slate-600">
                    {item.topic || "주제 없음"} · {item.myRole || "역할 없음"}
                  </div>
                  {item.teamMembers && (
                    <div className="mt-1 text-sm text-slate-500">{item.teamMembers}</div>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <DateBadge value={item.presentationDate} />
                  <StatusBadge value={item.status} />
                </div>
              </div>
              {parseJsonList(item.checklist).length ? (
                <ul className="mt-4 grid gap-2 border-t border-line pt-3 text-sm text-slate-600">
                  {parseJsonList(item.checklist).map((task) => (
                    <li key={task} className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                      {task}
                    </li>
                  ))}
                </ul>
              ) : null}
              {item.tasks?.length ? (
                <ul className="mt-3 grid gap-2 text-sm text-slate-600">
                  {item.tasks.map((task) => (
                    <li key={task.id}>- {task.title}</li>
                  ))}
                </ul>
              ) : null}
              <div className="mt-4 flex flex-wrap justify-end gap-2">
                <button
                  className="btn-secondary"
                  onClick={() => checklistMutation.mutate(item.id)}
                  disabled={checklistMutation.isPending}
                >
                  <ListChecks size={16} />
                  체크리스트 생성
                </button>
                <button className="btn-secondary" onClick={() => setEditing(item)}>
                  <Pencil size={16} />
                  수정
                </button>
                <button className="btn-danger" onClick={() => deleteMutation.mutate(item.id)}>
                  <Trash2 size={16} />
                  삭제
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState title="발표 없음" />
      )}
    </div>
  );
}
