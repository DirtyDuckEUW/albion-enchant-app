// Shared type definitions for the Albion Enchanting app

export type Tier = "T4" | "T5" | "T6" | "T7" | "T8";

export type ResourceType =
  | "runes"
  | "souls"
  | "relics"
  | "cloth"
  | "leather"
  | "metalBar"
  | "planks";

export type ItemKey =
  | "head_boots_offhand_cape"
  | "armor_bag"
  | "one_handed_weapon"
  | "two_handed_weapon";

export interface PriceBreakdown {
  runeCost: number;
  soulCost: number;
  relicCost: number;
  resourceTotal: number;
  materialTotal: number;
  manualCost: number;
  totalCost: number;
  taxAmount: number;
  sellAfterTax: number;
}

export interface ResourcePrice {
  id?: string;
  resource_type: ResourceType;
  tier: Tier;
  price: number;
  updated_at?: string;
}

export interface ItemData {
  Name: string;
  UniqueName: string;
  Crafting: {
    Cloth: number;
    Leather: number;
    Metal_Bars: number;
    Planks: number;
    Artifact: string;
  };
}

export interface PriceData {
  item_id: string;
  city: string;
  quality: number;
  sell_price_min: number;
  sell_price_min_date: string;
  sell_price_max: number;
  sell_price_max_date: string;
  buy_price_min: number;
  buy_price_min_date: string;
  buy_price_max: number;
  buy_price_max_date: string;
}

export type ResourcePriceMap = Record<ResourceType, Record<Tier, number>>;
export type ResourceInputMap = Record<ResourceType, Record<Tier, string>>;
