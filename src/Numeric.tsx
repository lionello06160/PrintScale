import { useState } from "react";
export default function Numeric({
  label,
  value,
  onChange,
  suffix,
  min,
  max,
  step = "any",
  id,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  suffix?: string;
  min?: number;
  max?: number;
  step?: string;
  id?: string;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  return (
    <label className="field">
      {label}
      <span className="input-wrap">
        <input
          id={id}
          type="number"
          inputMode="decimal"
          min={min}
          max={max}
          step={step}
          value={
            draft ?? (Number.isFinite(value) ? Number(value.toFixed(4)) : "")
          }
          onFocus={() =>
            setDraft(
              Number.isFinite(value) ? String(Number(value.toFixed(4))) : "",
            )
          }
          onChange={(e) => {
            setDraft(e.target.value);
            onChange(e.target.value === "" ? NaN : Number(e.target.value));
          }}
          onBlur={() => setDraft(null)}
        />
        {suffix && <span>{suffix}</span>}
      </span>
    </label>
  );
}
