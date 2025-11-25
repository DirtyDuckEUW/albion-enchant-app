import { getItemPrice, getArtefactPrice } from "./api";
import { getCachedItemPrice, upsertItemPriceCache } from "@/lib/supabase";
import type { PriceData } from "@/types";

/**
 * Fetches item price with Supabase caching.
 * First checks cache, only calls API if cache is expired or missing.
 */
export async function getItemPriceWithCache(
  itemId: string,
  location: string,
  skipCache: boolean = false
): Promise<PriceData | null> {
  // 1. Try to get from cache (unless skipCache is true)
  if (!skipCache) {
    const cached = await getCachedItemPrice(itemId, location);

    if (cached && cached.sell_price_min > 0) {
      console.log(`Using cached price for ${itemId} at ${location}`);
      return {
        item_id: cached.item_id,
        city: cached.location,
        quality: cached.quality,
        sell_price_min: cached.sell_price_min,
        sell_price_min_date: cached.sell_price_min_date,
        sell_price_max: cached.sell_price_max,
        sell_price_max_date: cached.sell_price_max_date,
        buy_price_min: cached.buy_price_min,
        buy_price_min_date: cached.buy_price_min_date,
        buy_price_max: cached.buy_price_max,
        buy_price_max_date: cached.buy_price_max_date,
      };
    }
  }

  // 2. Cache miss, expired, price is 0, or skipCache - fetch from API
  console.log(`Fetching fresh price from API for ${itemId} at ${location}`);
  const apiData = await getItemPrice(itemId, location);

  if (Array.isArray(apiData) && apiData.length > 0) {
    const priceData = apiData[0];

    // 3. Cache the result
    await upsertItemPriceCache(priceData);

    return priceData;
  }

  return null;
}

/**
 * Fetches artifact price with Supabase caching.
 */
export async function getArtefactPriceWithCache(
  artifactId: string,
  location: string,
  skipCache: boolean = false
): Promise<number> {
  // 1. Try to get from cache (unless skipCache is true)
  if (!skipCache) {
    const cached = await getCachedItemPrice(artifactId, location);

    if (cached && cached.sell_price_min > 0) {
      console.log(
        `Using cached artifact price for ${artifactId} at ${location}`
      );
      return cached.sell_price_min;
    }
  }

  // 2. Cache miss, expired, price is 0, or skipCache - fetch from API
  console.log(
    `Fetching fresh artifact price from API for ${artifactId} at ${location}`
  );
  const apiData = await getArtefactPrice(artifactId, location);

  if (Array.isArray(apiData) && apiData.length > 0) {
    const priceData = apiData[0];

    // 3. Cache the result
    await upsertItemPriceCache(priceData);

    return priceData.sell_price_min || 0;
  }

  return 0;
}
