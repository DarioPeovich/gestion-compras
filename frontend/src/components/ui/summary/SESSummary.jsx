export default function SESSummary({ children, className = "" }) {
  return <div className={`ml-auto max-w-md space-y-3 ${className}`}>{children}</div>;
}

function Item({ label, value }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-slate-500">{label}</span>

      <span className="font-medium text-slate-800">{value}</span>
    </div>
  );
}

function Total({ label, value }) {
  return (
    <div className="border-t border-slate-200 pt-4">
      <div className="flex items-center justify-between text-lg font-semibold text-slate-900">
        <span>{label}</span>

        <span>{value}</span>
      </div>
    </div>
  );
}

SESSummary.Item = Item;
SESSummary.Total = Total;
