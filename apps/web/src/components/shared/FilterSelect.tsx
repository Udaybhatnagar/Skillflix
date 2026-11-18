export function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="block min-w-36 flex-1 text-xs font-semibold text-muted">
      {label}
      <select value={value} onChange={(e) => onChange(e.target.value)} className="input mt-2">
        <option value="">All {label.toLowerCase()}</option>
        {options.map((x) => (
          <option key={x} value={x}>
            {x}
          </option>
        ))}
      </select>
    </label>
  );
}
