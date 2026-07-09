import { Search, X } from "lucide-react";
import SESControl from "./SESControl";

export default function SESSearchBox({
  value = "",
  onChange,
  onSearch,
  onClear,
  placeholder = "Buscar...",
  disabled = false,
  autoFocus = false,
  className = "",
  ...props
}) {
  const handleClear = () => {
    if (onClear) {
      onClear();
      return;
    }

    if (onChange) {
      onChange({ target: { value: "" } });
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && onSearch) {
      onSearch(value);
    }

    if (e.key === "Escape" && value) {
      handleClear();
    }

    if (props.onKeyDown) {
      props.onKeyDown(e);
    }
  };

  return (
    <SESControl disabled={disabled} className={className}>
      <Search size={16} className="shrink-0 text-slate-400" />

      <input
        type="text"
        value={value}
        onChange={onChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        autoFocus={autoFocus}
        className="h-10 w-full min-w-0 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:text-slate-400"
        {...props}
      />

      {value && !disabled && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Limpiar búsqueda"
          title="Limpiar búsqueda"
          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-all duration-150 hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
        >
          <X size={15} className="shrink-0" />
        </button>
      )}
    </SESControl>
  );
}
