export function EmptyState({ title }: { title: string }) {
  return (
    <div className="rounded-lg border border-dashed border-line bg-white p-6 text-center text-sm text-slate-500">
      {title}
    </div>
  );
}

