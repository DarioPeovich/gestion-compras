export default function SESIconButton({
  icon: Icon,
  label,
  variant = "ghost",
  size = "md",
  disabled = false,
  type = "button",
  className = "",
  ...props
}) {
  const variants = {
    ghost:
      "border-transparent bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-800 focus:ring-blue-100",
    secondary:
      "border-slate-300 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 focus:ring-blue-100",
    danger:
      "border-transparent bg-transparent text-red-400 hover:bg-red-50 hover:text-red-600 focus:ring-red-100",
    primary:
      "border-blue-700 bg-blue-700 text-white hover:bg-blue-800 focus:ring-blue-100",
  };

  const sizes = {
    sm: "h-8 w-8",
    md: "h-9 w-9",
    lg: "h-10 w-10",
  };

  const iconSizes = {
    sm: 14,
    md: 16,
    lg: 18,
  };

  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      disabled={disabled}
      className={[
        "inline-flex items-center justify-center rounded-xl border",
        "transition-all duration-150",
        "focus:outline-none focus:ring-2 focus:ring-offset-0",
        "disabled:pointer-events-none disabled:opacity-50",
        sizes[size] || sizes.md,
        variants[variant] || variants.ghost,
        className,
      ].join(" ")}
      {...props}
    >
      {Icon && <Icon size={iconSizes[size] || iconSizes.md} className="shrink-0" />}
    </button>
  );
}
