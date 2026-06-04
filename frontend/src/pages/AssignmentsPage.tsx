import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, ListChecks, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { api } from "../api/client";
import { AssignmentForm } from "../features/assignments/AssignmentForm";
import { CourseColorDot } from "../components/CourseColorDot";
import { DateBadge } from "../components/DateBadge";
import { EmptyState } from "../components/EmptyState";
import { ErrorState } from "../components/ErrorState";
import { LoadingState } from "../components/LoadingState";
import { StatusBadge } from "../components/StatusBadge";
import type { Assignment, Course } from "../types";

export function AssignmentsPage() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<Assignment | null>(null);
  const coursesQuery = useQuery({
    queryKey: ["courses"],
    queryFn: async () => (await api.get<Course[]>("/courses")).data
  });
  const assignmentsQuery = useQuery({
    queryKey: ["assignments"],
    queryFn: async () => (await api.get<Assignment[]>("/assignments")).data
  });

  const saveMutation = useMutation({
    mutationFn: async (values: Record<string, string>) => {
      if (editing) return (await api.put(`/assignments/${editing.id}`, values)).data;
      return (await api.post("/assignments", { ...values, sourceType: "manual" })).data;
    },
    onSuccess: () => {
      setEditing(null);
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/assignments/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    }
  });

  const checklistMutation = useMutation({
    mutationFn: async (id: string) => api.post(`/assignments/${id}/generate-checklist`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["assignments"] })
  });

  const statusMutation = useMutation({
    mutationFn: async (assignment: Assignment) =>
      api.put(`/assignments/${assignment.id}`, {
        status: assignment.status === "completed" ? "in_progress" : "completed"
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    }
  });

  if (coursesQuery.isLoading || assignmentsQuery.isLoading) return <LoadingState />;
  if (coursesQuery.isError || assignmentsQuery.isError) return <ErrorState />;

  const courses = coursesQuery.data ?? [];
  const assignments = assignmentsQuery.data ?? [];

  return (
    <div className="grid gap-5">
      <div>
        <h1 className="text-2xl font-bold">과제</h1>
        <p className="mt-1 text-sm text-slate-500">마감일순으로 정렬됩니다.</p>
      </div>
      <AssignmentForm
        courses={courses}
        initial={editing}
        onSubmit={(values) => saveMutation.mutate(values)}
        onCancel={editing ? () => setEditing(null) : undefined}
        isSaving={saveMutation.isPending}
      />

      {assignments.length ? (
        <div className="grid gap-3">
          {assignments.map((assignment) => (
            <article key={assignment.id} className="card">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="mb-2 flex flex-wrap items-center gap-2 text-sm text-slate-500">
                    {assignment.course && (
                      <>
                        <CourseColorDot color={assignment.course.color} />
                        {assignment.course.courseName}
                      </>
                    )}
                  </div>
                  <h2 className="text-lg font-bold">{assignment.title}</h2>
                  {assignment.description && (
                    <p className="mt-2 text-sm text-slate-600">{assignment.description}</p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <DateBadge value={assignment.dueDate} />
                  <StatusBadge value={assignment.priority} />
                  <StatusBadge value={assignment.status} />
                </div>
              </div>
              {assignment.tasks?.length ? (
                <ul className="mt-4 grid gap-2 border-t border-line pt-3 text-sm text-slate-600">
                  {assignment.tasks.map((task) => (
                    <li key={task.id} className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                      {task.title}
                    </li>
                  ))}
                </ul>
              ) : null}
              <div className="mt-4 flex flex-wrap justify-end gap-2">
                <button className="btn-secondary" onClick={() => statusMutation.mutate(assignment)}>
                  <Check size={16} />
                  완료
                </button>
                <button
                  className="btn-secondary"
                  onClick={() => checklistMutation.mutate(assignment.id)}
                  disabled={checklistMutation.isPending}
                >
                  <ListChecks size={16} />
                  체크리스트 생성
                </button>
                <button className="btn-secondary" onClick={() => setEditing(assignment)}>
                  <Pencil size={16} />
                  수정
                </button>
                <button
                  className="btn-danger"
                  onClick={() => deleteMutation.mutate(assignment.id)}
                >
                  <Trash2 size={16} />
                  삭제
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState title="과제 없음" />
      )}
    </div>
  );
}
