import SESControl from "./SESControl";

export default function SESInput({
  value,
  onChange,
  placeholder,
  type = "text",
  readOnly = false,
  disabled = false,
  error = false,
  className = "",
  ...props
}) {
  return (
    <SESControl error={error} disabled={disabled}>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        readOnly={readOnly}
        disabled={disabled}
        className={`h-10 w-full min-w-0 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:text-slate-400 ${className}`}
        {...props}
      />
    </SESControl>
  );
}
