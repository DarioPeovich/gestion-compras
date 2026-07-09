export default function SESToggleGroup({
  value,
  onChange,
  options = [],
  disabled = false,
  size = "md",
  className = "",
}) {
  const sizes = {
    sm: "h-8 px-3 text-xs",
    md: "h-10 px-4 text-sm",
    lg: "h-11 px-5 text-sm",
  };

  return (
    <div
      className={[
        "inline-flex items-center rounded-xl border border-slate-300 bg-white p-0.5",
        disabled ? "opacity-60" : "",
        className,
      ].join(" ")}
    >
      {options.map((option) => {
        const active = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            disabled={disabled || option.disabled}
            onClick={() => onChange?.(option.value)}
            className={[
              "inline-flex items-center justify-center whitespace-nowrap rounded-lg font-medium transition-all duration-150",
              sizes[size] || sizes.md,
              active
                ? "bg-blue-700 text-white shadow-sm"
                : "bg-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900",
              "focus:outline-none focus:ring-2 focus:ring-blue-100",
              "disabled:pointer-events-none disabled:opacity-50",
            ].join(" ")}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
