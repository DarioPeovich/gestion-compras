export default function SESCheckbox({
  label,
  checked = false,
  onChange,
  disabled = false,
  className = "",
  ...props
}) {
  return (
    <label
      className={[
        "inline-flex items-center gap-2 select-none",
        disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
        className,
      ].join(" ")}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="
            h-4 w-4
            rounded
            border-slate-300
            text-blue-600
            focus:ring-2
            focus:ring-blue-100
          "
        {...props}
      />

      {label && <span className="text-sm text-slate-700">{label}</span>}
    </label>
  );
}
