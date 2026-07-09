import { NumericFormat } from "react-number-format";
import SESControl from "./SESControl";

export default function SESNumberInput({
  value,
  onChange,
  onValueChange,
  decimals = 3,
  placeholder,
  disabled = false,
  readOnly = false,
  className = "",
  align = "right",
  ...props
}) {
  const handleValueChange = (values) => {
    if (onValueChange) {
      onValueChange(values);
      return;
    }

    if (onChange) {
      onChange(values.floatValue ?? 0);
    }
  };

  const alignClass = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  };

  return (
    <SESControl className={className}>
      <NumericFormat
        value={value}
        thousandSeparator="."
        decimalSeparator=","
        decimalScale={decimals}
        fixedDecimalScale={false}
        allowNegative={false}
        disabled={disabled}
        readOnly={readOnly}
        placeholder={placeholder || `0,${"0".repeat(decimals)}`}
        onValueChange={handleValueChange}
        className={[
          "h-10 w-full bg-transparent text-sm outline-none",
          alignClass[align] || alignClass.right,
          disabled ? "cursor-not-allowed text-slate-400" : "",
          readOnly ? "text-slate-500" : "",
        ].join(" ")}
        {...props}
      />
    </SESControl>
  );
}
