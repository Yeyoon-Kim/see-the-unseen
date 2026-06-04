import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileSearch, Search, Trash2 } from "lucide-react";
import { useState } from "react";
import { api } from "../api/client";
import { CourseColorDot } from "../components/CourseColorDot";
import { EmptyState } from "../components/EmptyState";
import { ErrorState } from "../components/ErrorState";
import { LoadingState } from "../components/LoadingState";
import { MaterialUploadForm } from "../features/materials/MaterialUploadForm";
import type { Course, Material } from "../types";
import { formatDate } from "../utils/date";
import { parseJsonList } from "../utils/format";

export function MaterialsPage() {
  const queryClient = useQueryClient();
  const [q, setQ] = useState("");
  const coursesQuery = useQuery({
    queryKey: ["courses"],
    queryFn: async () => (await api.get<Course[]>("/courses")).data
  });
  const materialsQuery = useQuery({
    queryKey: ["materials", q],
    queryFn: async () => (await api.get<Material[]>("/materials", { params: { q } })).data
  });

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) =>
      api.post("/materials/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["materials"] })
  });

  const summarizeMutation = useMutation({
    mutationFn: async (id: string) => api.post(`/materials/${id}/summarize`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["materials"] })
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/materials/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["materials"] })
  });

  if (coursesQuery.isLoading || materialsQuery.isLoading) return <LoadingState />;
  if (coursesQuery.isError || materialsQuery.isError) return <ErrorState />;

  const courses = coursesQuery.data ?? [];
  const materials = materialsQuery.data ?? [];

  return (
    <div className="grid gap-5">
      <div>
        <h1 className="text-2xl font-bold">자료</h1>
        <p className="mt-1 text-sm text-slate-500">자료를 일정별로 저장하고 요약합니다.</p>
      </div>
      <MaterialUploadForm
        courses={courses}
        onSubmit={(formData) => uploadMutation.mutate(formData)}
        isSaving={uploadMutation.isPending}
      />
      <div className="card flex items-center gap-2">
        <Search size={18} className="text-slate-500" />
        <input
          className="w-full bg-transparent text-sm outline-none"
          value={q}
          onChange={(event) => setQ(event.target.value)}
          placeholder="검색"
        />
      </div>

      {materials.length ? (
        <div className="grid gap-3 md:grid-cols-2">
          {materials.map((material) => (
            <article key={material.id} className="card">
              <div className="mb-2 flex flex-wrap items-center gap-2 text-sm text-slate-500">
                {material.course && (
                  <>
                    <CourseColorDot color={material.course.color} />
                    {material.course.courseName}
                  </>
                )}
              </div>
              <h2 className="text-lg font-bold">{material.title}</h2>
              <div className="mt-2 text-sm text-slate-500">
                {material.fileName || "텍스트 자료"} · {formatDate(material.uploadedAt)}
              </div>
              {material.aiSummary && (
                <p className="mt-4 rounded-md border border-line bg-paper p-3 text-sm text-slate-600">
                  {material.aiSummary}
                </p>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                {parseJsonList(material.tags).map((tag) => (
                  <span key={tag} className="rounded-md bg-slate-100 px-2 py-1 text-xs">
                    {tag}
                  </span>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap justify-end gap-2">
                <button
                  className="btn-secondary"
                  onClick={() => summarizeMutation.mutate(material.id)}
                  disabled={summarizeMutation.isPending}
                >
                  <FileSearch size={16} />
                  요약 생성
                </button>
                <button
                  className="btn-danger"
                  onClick={() => deleteMutation.mutate(material.id)}
                >
                  <Trash2 size={16} />
                  삭제
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState title="자료 없음" />
      )}
    </div>
  );
}
