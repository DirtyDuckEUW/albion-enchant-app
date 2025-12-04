/**
 * Centralized price loading utilities for Albion Online items
 * Handles resource prices, artifact prices, and sell prices with Supabase caching
 */

import { supabase } from "./supabase";
import { getArtefactMedianPrice, getPrice, getItemPrice } from "@/services/api";
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

const DEFAULT_CITY: CityOption = "Lymhurst";
const CACHE_EXPIRY_HOURS = 72;

// ============================================================================
// Resource Price Loading
// ============================================================================

/**
 * Fetch resource prices from item_price_cache (manually entered prices)
 * Returns a map of itemId -> price
 */
export async function fetchResourcePrices(
  resourceIds: string[],
  tier: TierOption,
  enchantment: EnchantmentOption = "0"
): Promise<ResourcePriceMap> {
  const prices: ResourcePriceMap = {};

  try {
    const tierNumber = tier.toString().replace(/^T/, "");
    // Build full item IDs with tier and enchantment
    const itemIds = resourceIds.map((id) => {
      const baseId = id.replace(/T\d+_/, "");
      return enchantment !== "0"
        ? `T${tierNumber}_${baseId}_LEVEL${enchantment}@${enchantment}`
        : `T${tierNumber}_${baseId}`;
    });

    // Query item_price_cache for manually entered prices
    const { data, error } = await supabase
      .from("item_price_cache")
      .select("item_id, sell_price_min")
      .in("item_id", itemIds)
      .eq("location", "Manual");

    if (!error && data) {
      data.forEach((row) => {
        prices[row.item_id] = row.sell_price_min;
      });
      console.log("Loaded resource prices from cache:", prices);
    } else if (error) {
      console.error("Error loading resource prices:", error);
    }

    return prices;
  } catch (error) {
    console.error("Error fetching resource prices from database:", error);
    return prices;
  }
}

// ============================================================================
// Artifact Price Loading
// ============================================================================

/**
 * Fetch artifact prices using median prices (cross-city)
 * Returns a map of itemId -> median price
 * @param artifactIds - Array of artifact IDs (without tier prefix, e.g., "CAPEITEM_FW_CAERLEON_BP")
 * @param tier - Tier number (e.g., "4", "5", "6", "7", "8")
 */
export async function fetchArtifactPrices(
  artifactIds: string[],
  tier: TierOption
): Promise<ResourcePriceMap> {
  const prices: ResourcePriceMap = {};

  // Ensure tier is just the number (remove 'T' if present)
  const tierNumber = tier.toString().replace(/^T/, "");

  // Build full item IDs with tier prefix
  const itemIds = artifactIds.map((id) => {
    // Remove any existing tier prefix first
    const cleanId = id.replace(/^T\d+_/, "");
    return `T${tierNumber}_${cleanId}`;
  });

  try {
    // Split into batches of 10 to avoid URL length limits
    const BATCH_SIZE = 10;
    const batches: string[][] = [];
    for (let i = 0; i < itemIds.length; i += BATCH_SIZE) {
      batches.push(itemIds.slice(i, i + BATCH_SIZE));
    }

    // Check cache first
    const cachedItemIds = new Set<string>();
    for (const batch of batches) {
      try {
        const { data: cachedPrices, error: cacheError } = await supabase
          .from("item_price_cache")
          .select("*")
          .in("item_id", batch)
          .in("location", [
            "Bridgewatch",
            "Lymhurst",
            "FortSterling",
            "Martlock",
            "Thetford",
          ])
          .gte(
            "cached_at",
            new Date(
              Date.now() - CACHE_EXPIRY_HOURS * 60 * 60 * 1000
            ).toISOString()
          );

        if (!cacheError && cachedPrices) {
          // Group by item_id and calculate median from cached data
          const cachedItemPriceMap = new Map<string, number[]>();

          cachedPrices.forEach((row: any) => {
            if (!cachedItemPriceMap.has(row.item_id)) {
              cachedItemPriceMap.set(row.item_id, []);
            }

            const avgPrice = Math.round(
              (row.sell_price_min + row.sell_price_max) / 2
            );
            if (avgPrice > 0) {
              cachedItemPriceMap.get(row.item_id)!.push(avgPrice);
            }
          });

          // Calculate median for items with data from all 5 cities
          for (const [itemId, cityPrices] of cachedItemPriceMap.entries()) {
            if (cityPrices.length === 5) {
              // Only use if we have all 5 cities
              cityPrices.sort((a, b) => a - b);
              const mid = Math.floor(cityPrices.length / 2);
              const medianPrice =
                cityPrices.length % 2 === 0
                  ? Math.round((cityPrices[mid - 1] + cityPrices[mid]) / 2)
                  : cityPrices[mid];

              // Only use cached price if median is not 0
              if (medianPrice > 0) {
                prices[itemId] = medianPrice;
                cachedItemIds.add(itemId);
              }
            }
          }
        }
      } catch (cacheReadError) {
        console.warn("Cache read error (continuing with API):", cacheReadError);
      }
    }

    // Find missing items
    const missingItemIds = itemIds.filter((id) => !cachedItemIds.has(id));

    // Fetch missing prices from API
    if (missingItemIds.length > 0) {
      const missingBatches: string[][] = [];
      for (let i = 0; i < missingItemIds.length; i += BATCH_SIZE) {
        missingBatches.push(missingItemIds.slice(i, i + BATCH_SIZE));
      }

      for (const batch of missingBatches) {
        const itemIdsParam = batch.join(",");

        console.log("Fetching artifact prices:", {
          itemIds: itemIdsParam,
          count: batch.length,
        });

        try {
          const apiData = await getArtefactMedianPrice(itemIdsParam);

          console.log("Received artifact prices:", {
            count: apiData.length,
            batchSize: batch.length,
            rawData: apiData,
          });

          // Group by item_id and calculate median across all cities
          const itemPriceMap = new Map<string, number[]>();

          for (const item of apiData) {
            if (!itemPriceMap.has(item.item_id)) {
              itemPriceMap.set(item.item_id, []);
            }

            // Collect all non-zero sell prices
            if (item.sell_price_min > 0 || item.sell_price_max > 0) {
              const avgPrice = Math.round(
                (item.sell_price_min + item.sell_price_max) / 2
              );
              if (avgPrice > 0) {
                itemPriceMap.get(item.item_id)!.push(avgPrice);
              }
            }
          }

          // Calculate median for each item across all cities
          for (const [itemId, cityPrices] of itemPriceMap.entries()) {
            if (cityPrices.length > 0) {
              cityPrices.sort((a, b) => a - b);
              const mid = Math.floor(cityPrices.length / 2);
              const medianPrice =
                cityPrices.length % 2 === 0
                  ? Math.round((cityPrices[mid - 1] + cityPrices[mid]) / 2)
                  : cityPrices[mid];

              prices[itemId] = medianPrice;

              console.log("Calculated median for", itemId, {
                cityPrices,
                medianPrice,
              });
            }
          }

          // Cache the aggregated results
          for (const item of apiData) {
            const medianPrice = prices[item.item_id] || 0;

            // Cache each city's data separately
            try {
              const { error: upsertError } = await supabase
                .from("item_price_cache")
                .upsert(
                  {
                    item_id: item.item_id,
                    location: item.city, // Store actual city name
                    quality: 1, // Artifacts are always quality 1
                    sell_price_min: item.sell_price_min,
                    sell_price_max: item.sell_price_max,
                    buy_price_min: item.buy_price_min,
                    buy_price_max: item.buy_price_max,
                    sell_price_min_date: item.sell_price_min_date,
                    sell_price_max_date: item.sell_price_max_date,
                    buy_price_min_date: item.buy_price_min_date,
                    buy_price_max_date: item.buy_price_max_date,
                    cached_at: new Date().toISOString(),
                  },
                  { onConflict: "item_id,location" }
                );
              if (upsertError) {
                console.error("Cache upsert error:", {
                  item_id: item.item_id,
                  location: item.city,
                  error: upsertError.message,
                  code: upsertError.code,
                  details: upsertError.details,
                  hint: upsertError.hint,
                });
              }
            } catch (cacheWriteError) {
              console.warn(
                "Failed to cache artifact price:",
                item.item_id,
                item.city,
                cacheWriteError
              );
            }
          }
        } catch (fetchError) {
          console.error("Artifact fetch error:", {
            error: fetchError,
            message:
              fetchError instanceof Error
                ? fetchError.message
                : "Unknown error",
            type: typeof fetchError,
            itemIds: itemIdsParam,
          });
        }
      }
    }

    return prices;
  } catch (error) {
    console.error("Error fetching artifact prices:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
    }
    return prices;
  }
}

// ============================================================================
// Item Sell Price Loading
// ============================================================================

/**
 * Fetch sell prices for finished items
 * Returns a map of itemId -> median sell price
 */
export async function fetchItemSellPrices(
  itemIds: string[],
  city: CityOption = DEFAULT_CITY
): Promise<ResourcePriceMap> {
  const prices: ResourcePriceMap = {};

  try {
    // Split into batches of 10 to avoid URL length limits
    const BATCH_SIZE = 10;
    const batches: string[][] = [];
    for (let i = 0; i < itemIds.length; i += BATCH_SIZE) {
      batches.push(itemIds.slice(i, i + BATCH_SIZE));
    }

    // Check cache first
    const cachedItemIds = new Set<string>();
    for (const batch of batches) {
      try {
        const { data: cachedPrices, error: cacheError } = await supabase
          .from("item_price_cache")
          .select("*")
          .in("item_id", batch)
          .eq("location", city)
          .eq("quality", 4)
          .gte(
            "cached_at",
            new Date(
              Date.now() - CACHE_EXPIRY_HOURS * 60 * 60 * 1000
            ).toISOString()
          );

        if (!cacheError && cachedPrices) {
          cachedPrices.forEach((row: any) => {
            const sellPrice = row.sell_price_min;
            if (sellPrice > 0) {
              prices[row.item_id] = sellPrice;
              cachedItemIds.add(row.item_id);
            }
          });
        }
      } catch (cacheReadError) {
        console.warn("Cache read error (continuing with API):", cacheReadError);
      }
    }

    // Find missing items
    const missingItemIds = itemIds.filter((id) => !cachedItemIds.has(id));

    // Fetch missing prices from API
    if (missingItemIds.length > 0) {
      const missingBatches: string[][] = [];
      for (let i = 0; i < missingItemIds.length; i += BATCH_SIZE) {
        missingBatches.push(missingItemIds.slice(i, i + BATCH_SIZE));
      }

      for (const batch of missingBatches) {
        const itemIdsParam = batch.join(",");

        try {
          const apiData: AlbionDataAPIResponse[] = await getItemPrice(
            itemIdsParam,
            city
          );

          // Process API data and cache
          for (const item of apiData) {
            const sellPrice = item.sell_price_min;
            if (batch.includes(item.item_id)) {
              prices[item.item_id] = sellPrice;
            }

            // Cache the result
            try {
              const { error: upsertError } = await supabase
                .from("item_price_cache")
                .upsert(
                  {
                    item_id: item.item_id,
                    location: item.city,
                    quality: item.quality,
                    sell_price_min: item.sell_price_min,
                    sell_price_max: item.sell_price_max,
                    buy_price_min: item.buy_price_min,
                    buy_price_max: item.buy_price_max,
                    sell_price_min_date: item.sell_price_min_date,
                    sell_price_max_date: item.sell_price_max_date,
                    buy_price_min_date: item.buy_price_min_date,
                    buy_price_max_date: item.buy_price_max_date,
                    cached_at: new Date().toISOString(),
                  },
                  { onConflict: "item_id,location" }
                );
              if (upsertError) {
                console.error("Cache upsert error:", {
                  item_id: item.item_id,
                  error: upsertError.message,
                  code: upsertError.code,
                  details: upsertError.details,
                  hint: upsertError.hint,
                });
              }
            } catch (cacheWriteError) {
              console.warn(
                "Failed to cache item sell price:",
                item.item_id,
                cacheWriteError
              );
            }
          }
        } catch (fetchError) {
          console.error("Item sell price fetch error:", {
            error: fetchError,
            message:
              fetchError instanceof Error
                ? fetchError.message
                : "Unknown error",
            type: typeof fetchError,
            itemIds: itemIdsParam,
          });
        }
      }
    }

    return prices;
  } catch (error) {
    console.error("Error fetching item sell prices:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
    }
    return prices;
  }
}

// ============================================================================
// Combined Price Loading
// ============================================================================

/**
 * Fetch all prices for a list of items (resources + artifacts + item sell prices)
 * This is a convenience function that combines all price loading operations
 */
export async function fetchAllPricesForItems(
  resourceIds: string[],
  artifactIds: string[],
  itemIds: string[],
  tier: TierOption,
  enchantment: EnchantmentOption = "0",
  city: CityOption = DEFAULT_CITY
): Promise<{
  resourcePrices: ResourcePriceMap;
  artifactPrices: ResourcePriceMap;
  itemSellPrices: ResourcePriceMap;
}> {
  const [resourcePrices, artifactPrices, itemSellPrices] = await Promise.all([
    fetchResourcePrices(resourceIds, tier, enchantment),
    fetchArtifactPrices(artifactIds, tier),
    fetchItemSellPrices(itemIds, city),
  ]);

  return {
    resourcePrices,
    artifactPrices,
    itemSellPrices,
  };
}
