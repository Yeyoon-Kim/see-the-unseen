export function ErrorState({ title = "오류가 발생했습니다" }: { title?: string }) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
      {title}
    </div>
  );
}

