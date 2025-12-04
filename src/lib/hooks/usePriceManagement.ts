/**
 * Custom React hooks for price management and auto-loading
 * Centralizes editable price state and automatic price fetching logic
 */

import { useState, useEffect } from "react";
import type {
  ItemData,
  EditablePriceMap,
  ResourcePriceMap,
  TierOption,
  EnchantmentOption,
  CityOption,
} from "@/types/shared";
import {
  fetchResourcePrices,
  fetchArtifactPrices,
  fetchItemSellPrices,
} from "@/lib/priceLoader";

// ============================================================================
// Editable Prices Hook
// ============================================================================

export interface EditablePricesState {
  artifactPrices: EditablePriceMap;
  sellPrices: EditablePriceMap;
  amountsPerDay: EditablePriceMap;
  setArtifactPrice: (uniqueName: string, price: number) => void;
  setSellPrice: (uniqueName: string, price: number) => void;
  setAmountPerDay: (uniqueName: string, amount: number) => void;
  bulkSetArtifactPrices: (prices: EditablePriceMap) => void;
  bulkSetSellPrices: (prices: EditablePriceMap) => void;
  bulkSetAmountsPerDay: (amounts: EditablePriceMap) => void;
}

/**
 * Hook for managing editable artifact prices, sell prices, and amounts per day
 */
export function useEditablePrices(): EditablePricesState {
  const [artifactPrices, setArtifactPrices] = useState<EditablePriceMap>({});
  const [sellPrices, setSellPrices] = useState<EditablePriceMap>({});
  const [amountsPerDay, setAmountsPerDay] = useState<EditablePriceMap>({});

  const setArtifactPrice = (uniqueName: string, price: number) => {
    setArtifactPrices((prev) => ({ ...prev, [uniqueName]: price }));
  };

  const setSellPrice = (uniqueName: string, price: number) => {
    setSellPrices((prev) => ({ ...prev, [uniqueName]: price }));
  };

  const setAmountPerDay = (uniqueName: string, amount: number) => {
    setAmountsPerDay((prev) => ({ ...prev, [uniqueName]: amount }));
  };

  const bulkSetArtifactPrices = (prices: EditablePriceMap) => {
    setArtifactPrices((prev) => {
      const updated = { ...prev };
      Object.entries(prices).forEach(([key, value]) => {
        // Only set if not already manually edited (undefined or 0)
        if (updated[key] === undefined || updated[key] === 0) {
          updated[key] = value;
        }
      });
      return updated;
    });
  };

  const bulkSetSellPrices = (prices: EditablePriceMap) => {
    setSellPrices((prev) => {
      const updated = { ...prev };
      Object.entries(prices).forEach(([key, value]) => {
        // Only set if not already manually edited (undefined or 0)
        if (updated[key] === undefined || updated[key] === 0) {
          updated[key] = value;
        }
      });
      return updated;
    });
  };

  const bulkSetAmountsPerDay = (amounts: EditablePriceMap) => {
    setAmountsPerDay((prev) => {
      const updated = { ...prev };
      Object.entries(amounts).forEach(([key, value]) => {
        // Only set if not already set (don't override existing values, even if 0)
        if (!(key in updated)) {
          updated[key] = value;
        }
      });
      return updated;
    });
  };

  return {
    artifactPrices,
    sellPrices,
    amountsPerDay,
    setArtifactPrice,
    setSellPrice,
    setAmountPerDay,
    bulkSetArtifactPrices,
    bulkSetSellPrices,
    bulkSetAmountsPerDay,
  };
}

// ============================================================================
// Auto-Loading Hooks
// ============================================================================

/**
 * Hook to auto-load resource prices when tier or enchantment changes
 */
export function useAutoLoadResourcePrices(
  items: ItemData[],
  tier: TierOption,
  enchantment: EnchantmentOption,
  onPricesLoaded?: (prices: ResourcePriceMap) => void
) {
  useEffect(() => {
    if (!items || items.length === 0) return;

    const loadPrices = async () => {
      // Collect all resource IDs
      const resourceIds = new Set<string>();
      items.forEach((item) => {
        // Check for legacy format (Cloth, Leather, Metal_Bars, Planks)
        if (item.Crafting) {
          const crafting = item.Crafting as any;
          if (crafting.Cloth !== undefined || crafting.Leather !== undefined) {
            // Legacy format
            if (crafting.Cloth > 0) resourceIds.add("CLOTH");
            if (crafting.Leather > 0) resourceIds.add("LEATHER");
            if (crafting.Metal_Bars > 0) resourceIds.add("METALBAR");
            if (crafting.Planks > 0) resourceIds.add("PLANKS");
          } else if (crafting.AdditionalResources) {
            // New format
            crafting.AdditionalResources.forEach((res: any) => {
              resourceIds.add(res.Resource);
            });
          }
        }
      });

      // Fetch prices
      const prices = await fetchResourcePrices(
        Array.from(resourceIds),
        tier,
        enchantment
      );

      // Callback with loaded prices
      if (onPricesLoaded) {
        onPricesLoaded(prices);
      }
    };

    loadPrices();
  }, [items, tier, enchantment]);
}

/**
 * Hook to auto-load artifact prices when tier or category changes
 */
export function useAutoLoadArtifactPrices(
  items: ItemData[],
  tier: TierOption,
  bulkSetPrices: (prices: EditablePriceMap) => void
) {
  useEffect(() => {
    if (!items || items.length === 0) return;

    const loadPrices = async () => {
      // Collect unique artifact IDs
      const artifactIds = new Set<string>();
      items.forEach((item) => {
        if (item.Crafting) {
          const crafting = item.Crafting as any;
          // Check legacy format (Artifact field)
          if (crafting.Artifact && crafting.Artifact !== "") {
            artifactIds.add(crafting.Artifact);
          }
          // Check new format (Resource field)
          else if (crafting.Resource) {
            artifactIds.add(crafting.Resource);
          }
        }
      });

      if (artifactIds.size === 0) return;

      // Fetch artifact prices
      const artifactPriceMap = await fetchArtifactPrices(
        Array.from(artifactIds),
        tier
      );

      // Map to unique names
      const pricesByUniqueName: EditablePriceMap = {};
      const tierNumber = tier.toString().replace(/^T/, "");
      items.forEach((item) => {
        if (item.Crafting) {
          const crafting = item.Crafting as any;
          let artifactId = "";

          // Get artifact ID from either format
          if (crafting.Artifact && crafting.Artifact !== "") {
            artifactId = `T${tierNumber}_${crafting.Artifact.replace(/T\d+_/, "")}`;
          } else if (crafting.Resource) {
            artifactId = `T${tierNumber}_${crafting.Resource.replace(/T\d+_/, "")}`;
          }

          if (artifactId) {
            const price = artifactPriceMap[artifactId];
            if (price) {
              pricesByUniqueName[item.UniqueName] = price;
            }
          }
        }
      });

      // Bulk set prices
      bulkSetPrices(pricesByUniqueName);
    };

    loadPrices();
  }, [items, tier]);
}

/**
 * Hook to auto-load sell prices when tier, category, or enchantment changes
 */
export function useAutoLoadSellPrices(
  items: ItemData[],
  tier: TierOption,
  enchantment: EnchantmentOption,
  bulkSetPrices: (prices: EditablePriceMap) => void,
  bulkSetAmounts: (amounts: EditablePriceMap) => void,
  city: CityOption = "Lymhurst"
) {
  useEffect(() => {
    if (!items || items.length === 0) return;

    const loadPrices = async () => {
      const tierNumber = tier.toString().replace(/^T/, "");
      // Build unique names with tier and enchantment
      const uniqueNames = items.map((item) => {
        const baseId = item.UniqueName.replace(/T\d+_/, "").replace(
          /@\d+$/,
          ""
        );
        return `T${tierNumber}_${baseId}${enchantment !== "0" ? `@${enchantment}` : ""}`;
      });

      // Fetch sell prices
      const sellPriceMap = await fetchItemSellPrices(uniqueNames, city);

      // Map to item unique names (without tier/enchantment)
      const pricesByUniqueName: EditablePriceMap = {};
      const amountsByUniqueName: EditablePriceMap = {};

      items.forEach((item) => {
        const baseId = item.UniqueName.replace(/T\d+_/, "").replace(
          /@\d+$/,
          ""
        );
        const fullId = `T${tierNumber}_${baseId}${enchantment !== "0" ? `@${enchantment}` : ""}`;
        const price = sellPriceMap[fullId];

        if (price) {
          pricesByUniqueName[item.UniqueName] = price;
        }

        // Set default amount to 1
        amountsByUniqueName[item.UniqueName] = 1;
      });

      // Bulk set prices and amounts
      bulkSetPrices(pricesByUniqueName);
      bulkSetAmounts(amountsByUniqueName);
    };

    loadPrices();
  }, [items, tier, enchantment, city]);
}

// ============================================================================
// Combined Auto-Loading Hook
// ============================================================================

/**
 * Hook that combines all auto-loading functionality for a crafting page
 */
export function useAutoLoadAllPrices(
  items: ItemData[],
  tier: TierOption,
  enchantment: EnchantmentOption,
  editablePrices: EditablePricesState,
  city: CityOption = "Lymhurst"
): {
  resourcePrices: ResourcePriceMap;
} {
  const [resourcePrices, setResourcePrices] = useState<ResourcePriceMap>({});

  // Auto-load resource prices
  useAutoLoadResourcePrices(items, tier, enchantment, setResourcePrices);

  // Auto-load artifact prices
  useAutoLoadArtifactPrices(items, tier, editablePrices.bulkSetArtifactPrices);

  // Auto-load sell prices
  useAutoLoadSellPrices(
    items,
    tier,
    enchantment,
    editablePrices.bulkSetSellPrices,
    editablePrices.bulkSetAmountsPerDay,
    city
  );

  return { resourcePrices };
}
