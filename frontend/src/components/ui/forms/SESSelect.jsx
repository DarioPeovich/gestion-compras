import SESControl from "./SESControl";

export default function SESSelect({
  value,
  onChange,
  children,
  disabled = false,
  error = false,
  className = "",
  ...props
}) {
  return (
    <SESControl error={error} disabled={disabled}>
      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`h-10 w-full min-w-0 bg-transparent text-sm text-slate-800 outline-none disabled:cursor-not-allowed disabled:text-slate-400 ${className}`}
        {...props}
      >
        {children}
      </select>
    </SESControl>
  );
}
