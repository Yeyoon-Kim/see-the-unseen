import { useQuery } from "@tanstack/react-query";
import { Download } from "lucide-react";
import { useParams } from "react-router-dom";
import { api, calendarUrl } from "../api/client";
import { CourseColorDot } from "../components/CourseColorDot";
import { DateBadge } from "../components/DateBadge";
import { EmptyState } from "../components/EmptyState";
import { ErrorState } from "../components/ErrorState";
import { LoadingState } from "../components/LoadingState";
import { StatusBadge } from "../components/StatusBadge";
import type { Course } from "../types";
import { formatClassTime, normalizeFixedCategory } from "../utils/fixedSchedule";
import { parseJsonList, parseJsonObject } from "../utils/format";

interface StudyPlan {
  studyPlan?: string;
  checklist?: string[];
}

export function CourseDetailPage() {
  const { id } = useParams();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["course", id],
    queryFn: async () => (await api.get<Course>(`/courses/${id}`)).data,
    enabled: Boolean(id)
  });

  if (isLoading) return <LoadingState />;
  if (isError || !data) return <ErrorState title="일정을 불러오지 못했습니다" />;

  const studyPlans =
    data.exams
      ?.map((exam) => ({
        title: exam.title,
        plan: parseJsonObject<StudyPlan>(exam.studyPlan)
      }))
      .filter((item) => item.plan) ?? [];
  const syllabusFiles = data.uploadedFiles?.filter((file) => file.sourceType === "syllabus") ?? [];

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <CourseColorDot color={data.color} />
            <span className="text-sm font-semibold text-slate-500">{data.semester}</span>
          </div>
          <h1 className="text-2xl font-bold">{data.courseName}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {normalizeFixedCategory(data.courseType)} · {formatClassTime(data.classTime)} ·{" "}
            {data.classroom || "장소 없음"}
          </p>
        </div>
        <a className="btn-secondary" href={calendarUrl(`/calendar/export/course/${data.id}`)}>
          <Download size={16} />
          ICS
        </a>
      </div>

      <section className="card">
        <h2 className="mb-3 text-base font-bold">연결된 계획서</h2>
        {syllabusFiles.length ? (
          <div className="grid gap-2">
            {syllabusFiles.map((file) => (
              <div key={file.id} className="rounded-md border border-line p-3 text-sm">
                {file.originalName}
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="계획서 없음" />
        )}
      </section>

      <section className="card">
        <h2 className="mb-3 text-base font-bold">공지</h2>
        {data.notices?.length ? (
          <div className="grid gap-2">
            {data.notices.map((notice) => (
              <div
                key={notice.id}
                className="rounded-md border border-line p-3"
              >
                <div className="font-semibold">{notice.title}</div>
                <div className="mt-2 flex flex-wrap gap-2 text-sm text-slate-500">
                  <DateBadge value={notice.postedAt ?? notice.createdAt} />
                  {notice.sourceType}
                </div>
                {notice.body && <p className="mt-2 text-sm text-slate-600">{notice.body}</p>}
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="공지 없음" />
        )}
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="card">
          <h2 className="mb-3 text-base font-bold">과제 마감</h2>
          {data.assignments?.length ? (
            <div className="grid gap-2">
              {data.assignments.map((item) => (
                <div key={item.id} className="rounded-md border border-line p-3">
                  <div className="font-semibold">{item.title}</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <DateBadge value={item.dueDate} />
                    <StatusBadge value={item.priority} />
                    <StatusBadge value={item.status} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="과제 없음" />
          )}
        </section>

        <section className="card">
          <h2 className="mb-3 text-base font-bold">시험</h2>
          {data.exams?.length ? (
            <div className="grid gap-2">
              {data.exams.map((item) => (
                <div key={item.id} className="rounded-md border border-line p-3">
                  <div className="font-semibold">{item.title}</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <DateBadge value={item.examDate} />
                    <StatusBadge value={item.status} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="시험 없음" />
          )}
        </section>

        <section className="card">
          <h2 className="mb-3 text-base font-bold">발표</h2>
          {data.presentations?.length ? (
            <div className="grid gap-2">
              {data.presentations.map((item) => (
                <div key={item.id} className="rounded-md border border-line p-3">
                  <div className="font-semibold">{item.title}</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <DateBadge value={item.presentationDate} />
                    <StatusBadge value={item.status} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="발표 없음" />
          )}
        </section>

        <section className="card">
          <h2 className="mb-3 text-base font-bold">논문/읽기 목록</h2>
          {data.readings?.length ? (
            <div className="grid gap-2">
              {data.readings.map((item) => (
                <div key={item.id} className="rounded-md border border-line p-3">
                  <div className="font-semibold">{item.title}</div>
                  <div className="mt-1 text-sm text-slate-500">
                    {[item.authors, item.year, item.source].filter(Boolean).join(" · ")}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <DateBadge value={item.dueDate} />
                    <StatusBadge value={item.readingStatus} />
                  </div>
                  {item.summary && <p className="mt-2 text-sm text-slate-600">{item.summary}</p>}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="읽기 항목 없음" />
          )}
        </section>
      </div>

      <section className="card">
        <h2 className="mb-3 text-base font-bold">자료</h2>
        {data.materials?.length ? (
          <div className="grid gap-2 md:grid-cols-2">
            {data.materials.map((item) => (
              <div key={item.id} className="rounded-md border border-line p-3">
                <div className="font-semibold">{item.title}</div>
                {item.aiSummary && <p className="mt-2 text-sm text-slate-600">{item.aiSummary}</p>}
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
                  {parseJsonList(item.tags).map((tag) => (
                    <span key={tag} className="rounded-md bg-slate-100 px-2 py-1">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="자료 없음" />
        )}
      </section>

      <section className="card">
        <h2 className="mb-3 text-base font-bold">자동 생성된 준비 계획</h2>
        {studyPlans.length ? (
          <div className="grid gap-3">
            {studyPlans.map((item) => (
              <div key={item.title} className="rounded-md border border-line p-3">
                <div className="font-semibold">{item.title}</div>
                <p className="mt-2 text-sm text-slate-600">{item.plan?.studyPlan}</p>
                <ul className="mt-3 grid gap-1 text-sm text-slate-600">
                  {item.plan?.checklist?.map((task) => <li key={task}>- {task}</li>)}
                </ul>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="준비 계획 없음" />
        )}
      </section>
    </div>
  );
}
