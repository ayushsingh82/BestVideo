export function ColorRow({
  label,
  value,
  presets,
  onChange,
}: {
  label: string;
  value: string;
  presets: string[];
  onChange: (c: string) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-medium text-neutral-500">{label}</p>
      <div className="flex flex-wrap items-center gap-2">
        {presets.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => onChange(c)}
            aria-label={c}
            style={{ backgroundColor: c }}
            className={`h-8 w-8 rounded-full transition ${
              value.toLowerCase() === c.toLowerCase()
                ? "ring-2 ring-neutral-950 ring-offset-2"
                : "ring-1 ring-inset ring-neutral-300"
            }`}
          />
        ))}
        <label className="relative grid h-8 w-8 cursor-pointer place-items-center rounded-full border border-dashed border-neutral-300 text-neutral-500 transition hover:border-neutral-500">
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 cursor-pointer opacity-0"
          />
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
          </svg>
        </label>
      </div>
    </div>
  );
}
