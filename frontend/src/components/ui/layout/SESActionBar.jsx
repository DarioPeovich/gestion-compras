import { cn } from "@/lib/utils";

export default function SESActionBar({ children, align = "end", className }) {
  const alignments = {
    start: "justify-start",
    center: "justify-center",
    end: "justify-end",
    between: "justify-between",
  };

  return (
    <section
      className={cn(
        "flex flex-wrap items-center gap-2 pt-4",
        alignments[align] || alignments.end,
        className
      )}
    >
      {children}
    </section>
  );
}
