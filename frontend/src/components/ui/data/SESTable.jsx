export default function SESTable({ children, className = "" }) {
  return (
    <div
      className={[
        "overflow-x-auto rounded-xl border border-slate-200 bg-white",
        className,
      ].join(" ")}
    >
      <table className="w-full text-sm">{children}</table>
    </div>
  );
}
