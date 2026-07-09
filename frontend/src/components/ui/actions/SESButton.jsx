import { cn } from "@/lib/utils";

export default function SESButton({
  children,
  variant = "primary",
  size = "md",
  type = "button",
  disabled = false,
  icon: Icon,
  className,
  ...props
}) {
  const variants = {
    primary:
      "border-blue-700 bg-blue-700 text-white hover:bg-blue-800 focus:ring-blue-100",
    secondary:
      "border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50 focus:ring-blue-100",
    ghost:
      "border-transparent bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:ring-blue-100",
    danger: "border-red-600 bg-red-600 text-white hover:bg-red-700 focus:ring-red-100",
  };

  const sizes = {
    sm: "min-h-9 px-3 text-xs",
    md: "min-h-11 px-4 text-sm",
    lg: "min-h-12 px-5 text-sm",
  };

  return (
    <button
      type={type}
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl border font-medium",
        "transition-all duration-150",
        "focus:outline-none focus:ring-2 focus:ring-offset-0",
        "disabled:pointer-events-none disabled:opacity-50",
        sizes[size] || sizes.md,
        variants[variant] || variants.primary,
        className
      )}
      {...props}
    >
      {Icon && <Icon size={16} className="shrink-0" />}
      {children}
    </button>
  );
}
