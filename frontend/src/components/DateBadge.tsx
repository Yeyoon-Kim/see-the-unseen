import clsx from "clsx";
import { dDay, formatDate, isUrgent } from "../utils/date";

export function DateBadge({ value }: { value?: string | null }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold",
        isUrgent(value) ? "bg-red-50 text-red-700" : "bg-slate-100 text-slate-600"
      )}
      title={formatDate(value)}
    >
      {formatDate(value)} · {dDay(value)}
    </span>
  );
}

