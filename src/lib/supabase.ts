import { createClient } from "@supabase/supabase-js";
import type { ResourceType, Tier, ResourcePrice } from "@/types";

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_KEY!
);

// Re-export types for backward compatibility
export type { ResourceType, Tier, ResourcePrice };

// CRUD functions for resource_prices
export async function getAllResourcePrices(): Promise<ResourcePrice[]> {
  const { data, error } = await supabase.from("resource_prices").select("*");

  if (error) {
    console.error("Error fetching resource prices:", error);
    return [];
  }

  return data || [];
}

export async function upsertResourcePrice(
  resourceType: ResourceType,
  tier: Tier,
  price: number
): Promise<boolean> {
  const { error } = await supabase
    .from("resource_prices")
    .upsert(
      { resource_type: resourceType, tier, price },
      { onConflict: "resource_type,tier" }
    );

  if (error) {
    console.error("Error upserting resource price:", error);
    return false;
  }

  return true;
}

export async function upsertMultipleResourcePrices(
  prices: Array<{ resourceType: ResourceType; tier: Tier; price: number }>
): Promise<boolean> {
  const records = prices.map((p) => ({
    resource_type: p.resourceType,
    tier: p.tier,
    price: p.price,
  }));

  console.log("Attempting to upsert records:", records);

  const { data, error } = await supabase
    .from("resource_prices")
    .upsert(records, { onConflict: "resource_type,tier" })
    .select();

  if (error) {
    console.error("Error upserting multiple resource prices:", error);
    console.error("Error details:", JSON.stringify(error, null, 2));
    return false;
  }

  console.log("Upsert successful, affected rows:", data?.length);
  return true;
}

// Item price cache functions
export interface CachedItemPrice {
  item_id: string;
  location: string;
  quality: number;
  sell_price_min: number;
  sell_price_min_date: string;
  sell_price_max: number;
  sell_price_max_date: string;
  buy_price_min: number;
  buy_price_min_date: string;
  buy_price_max: number;
  buy_price_max_date: string;
  cached_at: string;
}

const CACHE_EXPIRY_HOURS = 72; // Cache expires after 72 hours

export async function getCachedItemPrice(
  itemId: string,
  location: string
): Promise<CachedItemPrice | null> {
  const { data, error } = await supabase
    .from("item_price_cache")
    .select("*")
    .eq("item_id", itemId)
    .eq("location", location)
    .single();

  if (error || !data) {
    console.log(error);
    return null;
  }

  // Check if cache is expired
  const cachedAt = new Date(data.cached_at);
  const now = new Date();
  const hoursDiff = (now.getTime() - cachedAt.getTime()) / (1000 * 60 * 60);

  if (hoursDiff > CACHE_EXPIRY_HOURS) {
    return null; // Cache expired
  }

  return data;
}

export async function upsertItemPriceCache(priceData: {
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
}): Promise<boolean> {
  const { error } = await supabase.from("item_price_cache").upsert(
    {
      item_id: priceData.item_id,
      location: priceData.city,
      quality: priceData.quality,
      sell_price_min: priceData.sell_price_min,
      sell_price_min_date: priceData.sell_price_min_date,
      sell_price_max: priceData.sell_price_max,
      sell_price_max_date: priceData.sell_price_max_date,
      buy_price_min: priceData.buy_price_min,
      buy_price_min_date: priceData.buy_price_min_date,
      buy_price_max: priceData.buy_price_max,
      buy_price_max_date: priceData.buy_price_max_date,
      cached_at: new Date().toISOString(),
    },
    { onConflict: "item_id,location" }
  );

  if (error) {
    console.error("Error upserting item price cache:", error);
    return false;
  }

  return true;
}
