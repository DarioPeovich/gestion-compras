import { cn } from "@/lib/utils";

export default function SESControl({
  children,
  className,
  error = false,
  disabled = false,
}) {
  return (
    <div
      className={cn(
        "flex w-full min-w-0 items-center",
        "min-h-11 rounded-xl border bg-white px-3",
        "transition-colors duration-150",
        "focus-within:ring-2 focus-within:ring-offset-0",
        disabled
          ? "border-slate-200 bg-slate-100 text-slate-400"
          : "border-slate-300 text-slate-800 hover:border-slate-400",
        error
          ? "border-red-400 focus-within:ring-red-100"
          : "focus-within:border-blue-600 focus-within:ring-blue-100",
        className
      )}
    >
      {children}
    </div>
  );
}
