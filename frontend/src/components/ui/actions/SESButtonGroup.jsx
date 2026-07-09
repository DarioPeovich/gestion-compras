export default function SESButtonGroup({ children, className = "" }) {
  return (
    <div className={["inline-flex items-center gap-2", className].join(" ")}>
      {children}
    </div>
  );
}
