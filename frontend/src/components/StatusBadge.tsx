import clsx from "clsx";

const labels: Record<string, string> = {
  not_started: "시작 전",
  in_progress: "진행 중",
  completed: "완료",
  reading: "읽는 중",
  summarized: "요약 완료",
  discussed: "토론 완료",
  low: "낮음",
  medium: "보통",
  high: "높음"
};

export function StatusBadge({ value }: { value?: string | null }) {
  const status = value ?? "not_started";
  return (
    <span
      className={clsx(
        "inline-flex rounded-md px-2 py-1 text-xs font-semibold",
        status === "completed" || status === "summarized" || status === "discussed"
          ? "bg-emerald-50 text-emerald-700"
          : status === "high"
            ? "bg-red-50 text-red-700"
            : status === "in_progress" || status === "reading"
              ? "bg-blue-50 text-blue-700"
              : "bg-slate-100 text-slate-600"
      )}
    >
      {labels[status] ?? status}
    </span>
  );
}

