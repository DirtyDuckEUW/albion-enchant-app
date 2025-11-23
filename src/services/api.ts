// Default to the official Albion data API for Europe
let BASE_URL = "https://europe.albion-online-data.com";

export const getItemPrice = async (itemIds: string, locations: string) => {
  return getPrice(itemIds, locations, "4");
};

export const getArtefactPrice = async (itemIds: string, locations: string) => {
  return getPrice(itemIds, locations, "1");
};

/**
 * Convenience helper for the Albion data API price endpoint.
 * Calls GET on `${BASE_URL}/api/v2/stats/prices` with required `itemIds` and `locations` query parameters.
 *
 * @param itemIds - item identifier string (e.g. `T5_ARMOR_PLATE_KEEPER` or comma-separated list)
 * @param locations - location string (e.g. `Bridgewatch`, or comma-separated list)
 */
export const getPrice = async (
  itemIds: string,
  locations: string,
  qualities: string,
) => {
  if (!itemIds) throw new Error("getPrice: itemId is required");
  if (!locations) throw new Error("getPrice: location is required");
  if (!qualities) throw new Error("getPrice: qualities is required");

  console.log("Sending api request for " + itemIds + " in " + locations);
  const response = await fetch(
    `${BASE_URL}/api/v2/stats/Prices/${encodeURIComponent(itemIds)}.json?locations=${encodeURIComponent(locations)}&qualities=${qualities}`,
  );
  const data = await response.json();
  console.log(data);
  return data;
};
