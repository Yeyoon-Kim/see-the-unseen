export function LoadingState({ label = "불러오는 중" }: { label?: string }) {
  return (
    <div className="card flex min-h-32 items-center justify-center text-sm text-slate-500">
      {label}
    </div>
  );
}

