import { cn } from "@/lib/utils";

export default function SESFormRow({ children, className, cols = 12, gap = "md" }) {
  const gaps = {
    sm: "gap-3",
    md: "gap-4",
    lg: "gap-6",
  };

  const colsMap = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 xl:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 xl:grid-cols-4",
    6: "grid-cols-1 md:grid-cols-3 xl:grid-cols-6",
    12: "grid-cols-12",
  };

  return (
    <div
      className={cn(
        "grid",
        colsMap[cols] || colsMap[12],
        gaps[gap] || gaps.md,
        className
      )}
    >
      {children}
    </div>
  );
}
