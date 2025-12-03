/**
 * Centralized price loading utilities for Albion Online items
 * Handles resource prices, artifact prices, and sell prices with caching
 */

import { supabase } from "./supabase";
import type {
  ResourcePriceMap,
  MedianPriceData,
  AlbionDataAPIResponse,
  CityOption,
  TierOption,
  EnchantmentOption,
} from "@/types/shared";

// ============================================================================
// Constants
// ============================================================================

const ALBION_DATA_API = "https://www.albion-online-data.com/api/v2/stats";
const DEFAULT_CITY: CityOption = "Lymhurst";
const CACHE_EXPIRY_HOURS = 72;

// ============================================================================
// Resource Price Loading
// ============================================================================

/**
 * Fetch resource prices from Supabase cache or Albion Data API
 * Returns a map of itemId -> price for quick lookups
 */
export async function fetchResourcePrices(
  resourceIds: string[],
  tier: TierOption,
  enchantment: EnchantmentOption
): Promise<ResourcePriceMap> {
  if (resourceIds.length === 0) return {};

  const prices: ResourcePriceMap = {};

  // Build item IDs with tier and enchantment
  const itemIds = resourceIds.map((id) => {
    const baseId = id.replace(/T\d+_/, "");
    return `T${tier}_${baseId}${enchantment !== "0" ? `@${enchantment}` : ""}`;
  });

  try {
    // Check cache first
    const { data: cachedPrices, error: cacheError } = await supabase
      .from("resource_prices")
      .select("*")
      .in("item_id", itemIds)
      .gte(
        "created_at",
        new Date(Date.now() - CACHE_EXPIRY_HOURS * 60 * 60 * 1000).toISOString()
      );

    if (cacheError) throw cacheError;

    // Map cached prices
    const cachedItemIds = new Set<string>();
    if (cachedPrices) {
      cachedPrices.forEach((row) => {
        prices[row.item_id] = row.sell_price_min;
        cachedItemIds.add(row.item_id);
      });
    }

    // Find missing items
    const missingItemIds = itemIds.filter((id) => !cachedItemIds.has(id));

    // Fetch missing prices from API
    if (missingItemIds.length > 0) {
      const itemIdsParam = missingItemIds.join(",");
      const url = `${ALBION_DATA_API}/prices/${itemIdsParam}.json?locations=${DEFAULT_CITY}&qualities=1`;

      const response = await fetch(url);
      if (!response.ok)
        throw new Error(`API request failed: ${response.status}`);

      const apiData: AlbionDataAPIResponse[] = await response.json();

      // Process API data
      for (const item of apiData) {
        prices[item.item_id] = item.sell_price_min;

        // Cache the price
        await supabase.from("resource_prices").upsert({
          item_id: item.item_id,
          city: item.city,
          quality: item.quality,
          sell_price_min: item.sell_price_min,
          sell_price_max: item.sell_price_max,
          buy_price_min: item.buy_price_min,
          buy_price_max: item.buy_price_max,
          created_at: new Date().toISOString(),
        });
      }
    }

    return prices;
  } catch (error) {
    console.error("Error fetching resource prices:", error);
    return prices;
  }
}

// ============================================================================
// Artifact Price Loading
// ============================================================================

/**
 * Fetch artifact prices using median prices (cross-city)
 * Returns a map of itemId -> median price
 */
export async function fetchArtifactPrices(
  artifactIds: string[],
  tier: TierOption
): Promise<ResourcePriceMap> {
  if (artifactIds.length === 0) return {};

  const prices: ResourcePriceMap = {};

  // Build full item IDs with tier
  const itemIds = artifactIds.map((id) => {
    const baseId = id.replace(/T\d+_/, "");
    return `T${tier}_${baseId}`;
  });

  try {
    // Check cache first
    const { data: cachedPrices, error: cacheError } = await supabase
      .from("item_price_cache")
      .select("*")
      .in("item_id", itemIds)
      .gte(
        "created_at",
        new Date(Date.now() - CACHE_EXPIRY_HOURS * 60 * 60 * 1000).toISOString()
      );

    if (cacheError) throw cacheError;

    // Map cached prices
    const cachedItemIds = new Set<string>();
    if (cachedPrices) {
      cachedPrices.forEach((row) => {
        const medianPrice = Math.round(
          (row.sell_price_min + row.sell_price_max) / 2
        );
        prices[row.item_id] = medianPrice;
        cachedItemIds.add(row.item_id);
      });
    }

    // Find missing items
    const missingItemIds = itemIds.filter((id) => !cachedItemIds.has(id));

    // Fetch missing prices from API
    if (missingItemIds.length > 0) {
      const itemIdsParam = missingItemIds.join(",");
      const url = `${ALBION_DATA_API}/prices/${itemIdsParam}.json?qualities=1`;

      const response = await fetch(url);
      if (!response.ok)
        throw new Error(`API request failed: ${response.status}`);

      const apiData: MedianPriceData[] = await response.json();

      // Group by item_id and calculate median
      const groupedData = new Map<string, MedianPriceData[]>();
      apiData.forEach((item) => {
        if (!groupedData.has(item.item_id)) {
          groupedData.set(item.item_id, []);
        }
        groupedData.get(item.item_id)!.push(item);
      });

      // Calculate median for each item
      for (const [itemId, items] of groupedData) {
        const validPrices = items.filter((item) => item.sell_price_min > 0);
        if (validPrices.length === 0) continue;

        const avgMin =
          validPrices.reduce((sum, item) => sum + item.sell_price_min, 0) /
          validPrices.length;
        const avgMax =
          validPrices.reduce((sum, item) => sum + item.sell_price_max, 0) /
          validPrices.length;
        const medianPrice = Math.round((avgMin + avgMax) / 2);

        prices[itemId] = medianPrice;

        // Cache the median price
        await supabase.from("item_price_cache").upsert({
          item_id: itemId,
          city: "Median",
          quality: 1,
          sell_price_min: Math.round(avgMin),
          sell_price_max: Math.round(avgMax),
          buy_price_min: 0,
          buy_price_max: 0,
          created_at: new Date().toISOString(),
        });
      }
    }

    return prices;
  } catch (error) {
    console.error("Error fetching artifact prices:", error);
    return prices;
  }
}

// ============================================================================
// Item Sell Price Loading
// ============================================================================

/**
 * Fetch sell prices for crafted items from a specific city
 * Returns a map of uniqueName -> sell price
 */
export async function fetchItemSellPrices(
  uniqueNames: string[],
  city: CityOption = DEFAULT_CITY
): Promise<ResourcePriceMap> {
  if (uniqueNames.length === 0) return {};

  const prices: ResourcePriceMap = {};

  try {
    // Check cache first
    const { data: cachedPrices, error: cacheError } = await supabase
      .from("item_price_cache")
      .select("*")
      .in("item_id", uniqueNames)
      .eq("city", city)
      .gte(
        "created_at",
        new Date(Date.now() - CACHE_EXPIRY_HOURS * 60 * 60 * 1000).toISOString()
      );

    if (cacheError) throw cacheError;

    // Map cached prices
    const cachedItemIds = new Set<string>();
    if (cachedPrices) {
      cachedPrices.forEach((row) => {
        prices[row.item_id] = row.sell_price_min;
        cachedItemIds.add(row.item_id);
      });
    }

    // Find missing items
    const missingItemIds = uniqueNames.filter((id) => !cachedItemIds.has(id));

    // Fetch missing prices from API
    if (missingItemIds.length > 0) {
      const itemIdsParam = missingItemIds.join(",");
      const url = `${ALBION_DATA_API}/prices/${itemIdsParam}.json?locations=${city}&qualities=1`;

      const response = await fetch(url);
      if (!response.ok)
        throw new Error(`API request failed: ${response.status}`);

      const apiData: AlbionDataAPIResponse[] = await response.json();

      // Process API data
      for (const item of apiData) {
        prices[item.item_id] = item.sell_price_min;

        // Cache the price
        await supabase.from("item_price_cache").upsert({
          item_id: item.item_id,
          city: item.city,
          quality: item.quality,
          sell_price_min: item.sell_price_min,
          sell_price_max: item.sell_price_max,
          buy_price_min: item.buy_price_min,
          buy_price_max: item.buy_price_max,
          created_at: new Date().toISOString(),
        });
      }
    }

    return prices;
  } catch (error) {
    console.error("Error fetching item sell prices:", error);
    return prices;
  }
}

// ============================================================================
// Batch Price Loading
// ============================================================================

/**
 * Fetch all prices needed for crafting calculations in one go
 */
export async function fetchAllPricesForItems(
  items: Array<{
    uniqueName: string;
    resourceIds: string[];
    artifactId?: string;
  }>,
  tier: TierOption,
  enchantment: EnchantmentOption,
  city: CityOption = DEFAULT_CITY
): Promise<{
  resourcePrices: ResourcePriceMap;
  artifactPrices: ResourcePriceMap;
  sellPrices: ResourcePriceMap;
}> {
  // Collect unique IDs
  const allResourceIds = new Set<string>();
  const allArtifactIds = new Set<string>();
  const allUniqueNames: string[] = [];

  items.forEach((item) => {
    item.resourceIds.forEach((id) => allResourceIds.add(id));
    if (item.artifactId) allArtifactIds.add(item.artifactId);
    allUniqueNames.push(item.uniqueName);
  });

  // Fetch all prices in parallel
  const [resourcePrices, artifactPrices, sellPrices] = await Promise.all([
    fetchResourcePrices(Array.from(allResourceIds), tier, enchantment),
    fetchArtifactPrices(Array.from(allArtifactIds), tier),
    fetchItemSellPrices(allUniqueNames, city),
  ]);

  return { resourcePrices, artifactPrices, sellPrices };
}
