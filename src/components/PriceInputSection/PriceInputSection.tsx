import type { Tier } from "@/types";
import { TIERS } from "@/lib/utility";
import "./PriceInputSection.css";

interface PriceInputSectionProps {
  title: string;
  resourceKey: string;
  values: Record<Tier, string>;
  onChange: (tier: Tier, value: string) => void;
  showDecimal?: boolean;
}

export default function PriceInputSection({
  title,
  resourceKey,
  values,
  onChange,
  showDecimal = false,
}: PriceInputSectionProps) {
  return (
    <section className="price-block">
      <h2>{title}</h2>
      <div className="tiers">
        {TIERS.map((tier) => (
          <label key={`${resourceKey}-${tier}`} className="tier-field">
            <span>{showDecimal ? `${tier}.0` : tier}</span>
            <input
              inputMode="decimal"
              value={values[tier]}
              onChange={(e) => onChange(tier, e.target.value)}
            />
          </label>
        ))}
      </div>
    </section>
  );
}
