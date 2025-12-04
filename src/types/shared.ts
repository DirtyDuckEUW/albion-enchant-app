/**
 * Shared TypeScript types and interfaces for the Albion Enchanting App
 */

// ============================================================================
// Price Related Types
// ============================================================================

export interface PriceData {
  item_id: string;
  city: string;
  quality: number;
  sell_price_min: number;
  sell_price_max: number;
  buy_price_min: number;
  buy_price_max: number;
}

export interface MedianPriceData {
  item_id: string;
  city: string;
  quality: number;
  sell_price_min: number;
  sell_price_max: number;
  sell_price_min_date: string;
  sell_price_max_date: string;
  buy_price_min: number;
  buy_price_max: number;
  buy_price_min_date: string;
  buy_price_max_date: string;
}

export interface ResourcePrice {
  itemId: string;
  price: number;
}

export interface ResourcePriceMap {
  [itemId: string]: number;
}

export interface EditablePriceMap {
  [uniqueName: string]: number;
}

// ============================================================================
// Item and Crafting Types
// ============================================================================

export interface CraftingRequirement {
  Resource: string;
  Count: number;
}

export interface ItemCrafting {
  Resource: string;
  Count: number;
  Silver: number;
  AdditionalResources: CraftingRequirement[];
  // Legacy fields for backward compatibility
  Cloth?: number;
  Leather?: number;
  Metal_Bars?: number;
  Planks?: number;
  Artifact?: string;
}

export interface ItemData {
  UniqueName: string;
  LocalizationNameVariable: string;
  LocalizationDescriptionVariable: string;
  LocalizedNames: {
    "EN-US": string;
  };
  Index: string;
  Tier: number;
  Category?: string;
  Crafting?: ItemCrafting;
  // Legacy field for backward compatibility
  Name?: string;
}

// ============================================================================
// Calculation Types
// ============================================================================

export interface CraftCostBreakdown {
  mainResourceCost: number;
  additionalResourcesCost: number;
  silverCost: number;
  totalCost: number;
}

export interface ProfitCalculation {
  sellPrice: number;
  craftCost: number;
  profit: number;
  profitPercentage: number;
}

export interface InvestmentCalculation {
  perDay: number;
  total: number;
  totalWithPremium: number;
}

export interface BulkProfitCalculation {
  profitPerDay: number;
  profitForDays: number;
  profitPercentagePerDay: number;
  profitPercentageTotal: number;
  investmentPerDay: number;
  investmentTotal: number;
}

// ============================================================================
// Return Rate Types
// ============================================================================

export type ReturnRateOption = "15.25" | "24.81" | "43.50" | "47.92" | "57.49";

export interface ReturnRateInfo {
  value: ReturnRateOption;
  decimal: number;
  percentage: string;
}

export const RETURN_RATES: Record<ReturnRateOption, ReturnRateInfo> = {
  "15.25": { value: "15.25", decimal: 0.1525, percentage: "15.25%" },
  "24.81": { value: "24.81", decimal: 0.2481, percentage: "24.81%" },
  "43.50": { value: "43.50", decimal: 0.435, percentage: "43.50%" },
  "47.92": { value: "47.92", decimal: 0.4792, percentage: "47.92%" },
  "57.49": { value: "57.49", decimal: 0.5749, percentage: "57.49%" },
};

// ============================================================================
// Filter and Selection Types
// ============================================================================

export type TierOption = "4" | "5" | "6" | "7" | "8";
export type EnchantmentOption = "0" | "1" | "2" | "3" | "4";
export type CityOption =
  | "Lymhurst"
  | "Bridgewatch"
  | "Martlock"
  | "Thetford"
  | "Fort Sterling"
  | "Caerleon";

export interface FilterState {
  selectedCategory: string;
  selectedTier: TierOption;
  selectedEnchantment: EnchantmentOption;
  selectedCity?: CityOption;
}

// ============================================================================
// Component Props Types
// ============================================================================

export interface ItemCardBaseProps {
  uniqueName: string;
  name: string;
  tier: number;
  enchantment: number;
}

export interface EditableItemCardProps extends ItemCardBaseProps {
  artefactCost: number;
  craftCost: number;
  sellPrice: number;
  onArtefactCostChange: (value: number) => void;
  onSellPriceChange: (value: number) => void;
}

export interface LongTermItemCardProps extends EditableItemCardProps {
  amountPerDay: number;
  profit: number;
  profitPercentage: number;
  onAmountPerDayChange: (value: number) => void;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface SupabasePriceRow {
  item_id: string;
  city: string;
  quality: number;
  sell_price_min: number;
  sell_price_max: number;
  buy_price_min: number;
  buy_price_max: number;
  sell_price_min_date?: string;
  sell_price_max_date?: string;
  buy_price_min_date?: string;
  buy_price_max_date?: string;
  created_at?: string;
}

export interface AlbionDataAPIResponse {
  item_id: string;
  city: string;
  quality: number;
  sell_price_min: number;
  sell_price_max: number;
  buy_price_min: number;
  buy_price_max: number;
  sell_price_min_date: string;
  sell_price_max_date: string;
  buy_price_min_date: string;
  buy_price_max_date: string;
}

// ============================================================================
// Utility Types
// ============================================================================

export interface ItemWithCalculations extends ItemData {
  artefactCost: number;
  craftCost: number;
  sellPrice: number;
  amountPerDay: number;
  profit: number;
  profitPercentage: number;
}

export type LoadingState = "idle" | "loading" | "success" | "error";

export interface AsyncState<T> {
  data: T | null;
  loading: LoadingState;
  error: string | null;
}
