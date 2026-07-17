import { X } from "lucide-react";

const VARIANT_STYLES = {
  error: "border-red-300 bg-red-50 text-red-800",
  success: "border-emerald-300 bg-emerald-50 text-emerald-800",
  warning: "border-amber-300 bg-amber-50 text-amber-800",
  info: "border-blue-300 bg-blue-50 text-blue-800",
};

export default function SESToast({ toast, onClose }) {
  const type = VARIANT_STYLES[toast.type] ? toast.type : "info";

  return (
    <div
      role={type === "error" ? "alert" : "status"}
      className={`pointer-events-auto flex w-full items-start gap-3 rounded-lg border px-4 py-3 shadow-lg ${VARIANT_STYLES[type]}`}
    >
      <p className="min-w-0 flex-1 text-sm font-medium leading-5">{toast.message}</p>
      <button
        type="button"
        onClick={() => onClose(toast.id)}
        aria-label="Cerrar notificación"
        className="shrink-0 rounded p-0.5 opacity-70 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-current"
      >
        <X aria-hidden="true" className="h-4 w-4" />
      </button>
    </div>
  );
}
