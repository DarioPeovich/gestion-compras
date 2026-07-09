import { cn } from "@/lib/utils";

export default function SESField({
  label,

  hint,

  required = false,

  error,

  className,

  children,
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2",

        className
      )}
    >
      {(label || required) && (
        <div className="flex items-center gap-1">
          {label && (
            <label
              className="
                                text-sm
                                font-medium
                                tracking-wide
                                text-slate-700
                            "
            >
              {label}
            </label>
          )}

          {required && (
            <span
              className="
                                text-red-500
                                text-sm
                            "
            >
              *
            </span>
          )}
        </div>
      )}

      {children}

      {hint && !error && (
        <span
          className="
                        text-xs
                        text-slate-500
                    "
        >
          {hint}
        </span>
      )}

      {error && (
        <span
          className="
                        text-xs
                        font-medium
                        text-red-600
                    "
        >
          {error}
        </span>
      )}
    </div>
  );
}
