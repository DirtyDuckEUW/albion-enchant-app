import type { ItemKey } from "@/types";
import "./ItemSelect.css";

interface ItemSelectProps {
  value: ItemKey;
  onChange: (value: ItemKey) => void;
  label?: string;
}

const ITEM_OPTIONS: Array<{ value: ItemKey; label: string }> = [
  { value: "head_armor", label: "Head Armor" },
  { value: "chest_armor", label: "Chest Armor" },
  { value: "foot_armor", label: "Foot Armor" },
  { value: "off_hands", label: "Off-Hands" },
  { value: "onehand_weapons", label: "One Handed Weapon" },
  { value: "twohand_weapons", label: "Two Handed Weapon" },
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
