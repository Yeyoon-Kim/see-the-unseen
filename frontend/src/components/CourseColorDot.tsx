export function CourseColorDot({ color }: { color?: string | null }) {
  return (
    <span
      className="inline-block h-2.5 w-2.5 rounded-full"
      style={{ backgroundColor: color ?? "#5E6B73" }}
    />
  );
}
