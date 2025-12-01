import { useState, useEffect } from "react";
import { getAllResourcePrices } from "@/lib/supabase";
import type { Tier, ResourcePriceMap, Enchantment } from "@/types";

function createDefaultEnchantmentValues(): Record<Enchantment, number> {
  return { "0": 0, "1": 0, "2": 0, "3": 0, "4": 0 };
}

export function useResourcePrices() {
  const [prices, setPrices] = useState<ResourcePriceMap>({
    runes: {
      T4: createDefaultEnchantmentValues(),
      T5: createDefaultEnchantmentValues(),
      T6: createDefaultEnchantmentValues(),
      T7: createDefaultEnchantmentValues(),
      T8: createDefaultEnchantmentValues(),
    },
    souls: {
      T4: createDefaultEnchantmentValues(),
      T5: createDefaultEnchantmentValues(),
      T6: createDefaultEnchantmentValues(),
      T7: createDefaultEnchantmentValues(),
      T8: createDefaultEnchantmentValues(),
    },
    relics: {
      T4: createDefaultEnchantmentValues(),
      T5: createDefaultEnchantmentValues(),
      T6: createDefaultEnchantmentValues(),
      T7: createDefaultEnchantmentValues(),
      T8: createDefaultEnchantmentValues(),
    },
    cloth: {
      T4: createDefaultEnchantmentValues(),
      T5: createDefaultEnchantmentValues(),
      T6: createDefaultEnchantmentValues(),
      T7: createDefaultEnchantmentValues(),
      T8: createDefaultEnchantmentValues(),
    },
    leather: {
      T4: createDefaultEnchantmentValues(),
      T5: createDefaultEnchantmentValues(),
      T6: createDefaultEnchantmentValues(),
      T7: createDefaultEnchantmentValues(),
      T8: createDefaultEnchantmentValues(),
    },
    metalBar: {
      T4: createDefaultEnchantmentValues(),
      T5: createDefaultEnchantmentValues(),
      T6: createDefaultEnchantmentValues(),
      T7: createDefaultEnchantmentValues(),
      T8: createDefaultEnchantmentValues(),
    },
    planks: {
      T4: createDefaultEnchantmentValues(),
      T5: createDefaultEnchantmentValues(),
      T6: createDefaultEnchantmentValues(),
      T7: createDefaultEnchantmentValues(),
      T8: createDefaultEnchantmentValues(),
    },
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPrices() {
      setLoading(true);
      const allPrices = await getAllResourcePrices();
      const priceMap: ResourcePriceMap = {
        runes: {
          T4: createDefaultEnchantmentValues(),
          T5: createDefaultEnchantmentValues(),
          T6: createDefaultEnchantmentValues(),
          T7: createDefaultEnchantmentValues(),
          T8: createDefaultEnchantmentValues(),
        },
        souls: {
          T4: createDefaultEnchantmentValues(),
          T5: createDefaultEnchantmentValues(),
          T6: createDefaultEnchantmentValues(),
          T7: createDefaultEnchantmentValues(),
          T8: createDefaultEnchantmentValues(),
        },
        relics: {
          T4: createDefaultEnchantmentValues(),
          T5: createDefaultEnchantmentValues(),
          T6: createDefaultEnchantmentValues(),
          T7: createDefaultEnchantmentValues(),
          T8: createDefaultEnchantmentValues(),
        },
        cloth: {
          T4: createDefaultEnchantmentValues(),
          T5: createDefaultEnchantmentValues(),
          T6: createDefaultEnchantmentValues(),
          T7: createDefaultEnchantmentValues(),
          T8: createDefaultEnchantmentValues(),
        },
        leather: {
          T4: createDefaultEnchantmentValues(),
          T5: createDefaultEnchantmentValues(),
          T6: createDefaultEnchantmentValues(),
          T7: createDefaultEnchantmentValues(),
          T8: createDefaultEnchantmentValues(),
        },
        metalBar: {
          T4: createDefaultEnchantmentValues(),
          T5: createDefaultEnchantmentValues(),
          T6: createDefaultEnchantmentValues(),
          T7: createDefaultEnchantmentValues(),
          T8: createDefaultEnchantmentValues(),
        },
        planks: {
          T4: createDefaultEnchantmentValues(),
          T5: createDefaultEnchantmentValues(),
          T6: createDefaultEnchantmentValues(),
          T7: createDefaultEnchantmentValues(),
          T8: createDefaultEnchantmentValues(),
        },
      };

      allPrices.forEach((p) => {
        if (priceMap[p.resource_type] && priceMap[p.resource_type][p.tier]) {
          priceMap[p.resource_type][p.tier][p.enchantment] = p.price;
        }
      });

      setPrices(priceMap);
      setLoading(false);
    }

    loadPrices();
  }, []);

  return { prices, loading };
}
