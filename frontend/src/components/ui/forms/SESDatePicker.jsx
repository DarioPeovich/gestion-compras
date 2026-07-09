import SESInput from "./SESInput";

export default function SESDatePicker({
  value,
  onChange,
  min,
  max,
  disabled = false,
  readOnly = false,
  className = "",
  ...props
}) {
  return (
    <SESInput
      type="date"
      value={value}
      onChange={onChange}
      min={min}
      max={max}
      disabled={disabled}
      readOnly={readOnly}
      className={className}
      {...props}
    />
  );
}
