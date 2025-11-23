import { MARKET_TAX } from './constants';
import type { ItemKey, Tier, ResourceType } from '@/types';

// Calculate sell price after market tax
export function calculateSellAfterTax(sellPrice: number): number {
  if (!Number.isFinite(sellPrice)) return 0;
  const taxAmount = calculateTaxAmount(sellPrice);
  return sellPrice - taxAmount;
}

// Calculate tax amount only
export function calculateTaxAmount(sellPrice: number): number {
  if (!Number.isFinite(sellPrice)) return 0;
  return Math.ceil(sellPrice * MARKET_TAX);
}

// Parse string or number to a valid number
export function parseNumber(value: string | number): number {
  if (typeof value === 'number') return value;
  const n = Number(value.replaceAll(",", "."));
  return Number.isFinite(n) ? n : NaN;
}

// Format number with thousand separators
export function formatNumber(value: number): string {
  return value.toLocaleString();
}

// Item category rune/soul/relic counts
export const ITEM_COUNTS: Record<ItemKey, number> = {
  head_boots_offhand_cape: 96,
  armor_bag: 192,
  one_handed_weapon: 288,
  two_handed_weapon: 384,
};

// All tiers
export const TIERS: Tier[] = ["T4", "T5", "T6", "T7", "T8"];

// All resource types
export const RESOURCE_TYPES: ResourceType[] = [
  "runes",
  "souls", 
  "relics",
  "cloth",
  "leather",
  "metalBar",
  "planks"
];

// Create default tier values
export function createDefaultTierValues(): Record<Tier, string> {
  return { T4: "0", T5: "0", T6: "0", T7: "0", T8: "0" };
}
