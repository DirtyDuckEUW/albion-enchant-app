import { useState, useEffect } from 'react';
import { getAllResourcePrices } from '@/lib/supabase';
import type { Tier, ResourcePriceMap } from '@/types';

export function useResourcePrices() {
  const [prices, setPrices] = useState<ResourcePriceMap>({
    runes: { T4: 0, T5: 0, T6: 0, T7: 0, T8: 0 },
    souls: { T4: 0, T5: 0, T6: 0, T7: 0, T8: 0 },
    relics: { T4: 0, T5: 0, T6: 0, T7: 0, T8: 0 },
    cloth: { T4: 0, T5: 0, T6: 0, T7: 0, T8: 0 },
    leather: { T4: 0, T5: 0, T6: 0, T7: 0, T8: 0 },
    metalBar: { T4: 0, T5: 0, T6: 0, T7: 0, T8: 0 },
    planks: { T4: 0, T5: 0, T6: 0, T7: 0, T8: 0 },
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPrices() {
      setLoading(true);
      const allPrices = await getAllResourcePrices();
      const priceMap: ResourcePriceMap = {
        runes: { T4: 0, T5: 0, T6: 0, T7: 0, T8: 0 },
        souls: { T4: 0, T5: 0, T6: 0, T7: 0, T8: 0 },
        relics: { T4: 0, T5: 0, T6: 0, T7: 0, T8: 0 },
        cloth: { T4: 0, T5: 0, T6: 0, T7: 0, T8: 0 },
        leather: { T4: 0, T5: 0, T6: 0, T7: 0, T8: 0 },
        metalBar: { T4: 0, T5: 0, T6: 0, T7: 0, T8: 0 },
        planks: { T4: 0, T5: 0, T6: 0, T7: 0, T8: 0 },
      };

      allPrices.forEach((p) => {
        if (priceMap[p.resource_type]) {
          priceMap[p.resource_type][p.tier] = p.price;
        }
      });

      setPrices(priceMap);
      setLoading(false);
    }

    loadPrices();
  }, []);

  return { prices, loading };
}
