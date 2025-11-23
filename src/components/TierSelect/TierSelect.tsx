import type { Tier } from "@/types";
import { TIERS } from "@/lib/utility";
import "./TierSelect.css";

interface TierSelectProps {
  value: Tier;
  onChange: (value: Tier) => void;
  label?: string;
}

export default function TierSelect({
  value,
  onChange,
  label = "Tier",
}: TierSelectProps) {
  return (
    <label className="field">
      <span>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value as Tier)}>
        {TIERS.map((tier) => (
          <option key={tier} value={tier}>
            {tier}
          </option>
        ))}
      </select>
    </label>
  );
}
