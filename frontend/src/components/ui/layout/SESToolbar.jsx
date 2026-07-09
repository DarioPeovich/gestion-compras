export default function SESToolbar({ children, className = "" }) {
  return (
    <div className={["flex flex-wrap items-center gap-3 py-4", className].join(" ")}>
      {children}
    </div>
  );
}
