import type { ItemKey } from "@/types";
import "./ItemSelect.css";

interface ItemSelectProps {
  value: ItemKey;
  onChange: (value: ItemKey) => void;
  label?: string;
}

const ITEM_OPTIONS: Array<{ value: ItemKey; label: string }> = [
  {
    value: "head_boots_offhand_cape",
    label: "Helmet / Boots / Off-Hand / Cape",
  },
  { value: "armor_bag", label: "Armor / Bag" },
  { value: "one_handed_weapon", label: "One Handed Weapon" },
  { value: "two_handed_weapon", label: "Two Handed Weapon" },
];

export default function ItemSelect({
  value,
  onChange,
  label = "Item-Kategorie",
}: ItemSelectProps) {
  return (
    <label className="field">
      <span>{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as ItemKey)}
      >
        {ITEM_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
