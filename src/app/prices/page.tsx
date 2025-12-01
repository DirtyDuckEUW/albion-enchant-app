"use client";

import { useEffect, useState } from "react";
import "./prices.css";
import {
  getAllResourcePrices,
  upsertMultipleResourcePrices,
} from "@/lib/supabase";
import type {
  ResourceType,
  Tier,
  ResourceInputMap,
  Enchantment,
} from "@/types";
import {
  TIERS,
  RESOURCE_TYPES,
  ENCHANTMENTS,
  createDefaultTierEnchantmentValues,
  parseNumber,
} from "@/lib/utility";
import PriceInputSection from "@/components/PriceInputSection/PriceInputSection";

export default function PricesPage() {
  const defaultTierValues = createDefaultTierEnchantmentValues();

  const [resourcePrices, setResourcePrices] = useState<ResourceInputMap>({
    runes: { ...defaultTierValues },
    souls: { ...defaultTierValues },
    relics: { ...defaultTierValues },
    cloth: { ...defaultTierValues },
    leather: { ...defaultTierValues },
    metalBar: { ...defaultTierValues },
    planks: { ...defaultTierValues },
  });
  const [loading, setLoading] = useState(true);

  // Load prices from Supabase on mount
  useEffect(() => {
    async function loadPrices() {
      setLoading(true);
      const prices = await getAllResourcePrices();

      console.log("Loaded prices from Supabase:", prices);

      const newPrices: ResourceInputMap = {
        runes: createDefaultTierEnchantmentValues(),
        souls: createDefaultTierEnchantmentValues(),
        relics: createDefaultTierEnchantmentValues(),
        cloth: createDefaultTierEnchantmentValues(),
        leather: createDefaultTierEnchantmentValues(),
        metalBar: createDefaultTierEnchantmentValues(),
        planks: createDefaultTierEnchantmentValues(),
      };

      prices.forEach((p) => {
        if (newPrices[p.resource_type]) {
          console.log(
            `Setting price for ${p.resource_type} ${p.tier}.${p.enchantment}: ${p.price}`
          );
          newPrices[p.resource_type][p.tier][p.enchantment] =
            p.price.toString();
        }
      });

      console.log("Final prices state:", newPrices);
      setResourcePrices(newPrices);
      setLoading(false);
    }

    loadPrices();
  }, []);

  function handleChange(
    resource: ResourceType,
    tier: Tier,
    enchantment: Enchantment,
    value: string
  ) {
    setResourcePrices((prev) => ({
      ...prev,
      [resource]: {
        ...prev[resource],
        [tier]: {
          ...prev[resource][tier],
          [enchantment]: value,
        },
      },
    }));
  }

  async function saveAll() {
    const allPrices: Array<{
      resourceType: ResourceType;
      tier: Tier;
      enchantment: Enchantment;
      price: number;
    }> = [];

    RESOURCE_TYPES.forEach((resourceType) => {
      TIERS.forEach((tier) => {
        ENCHANTMENTS.forEach((enchantment) => {
          const price = parseNumber(
            resourcePrices[resourceType][tier][enchantment]
          );
          if (Number.isFinite(price)) {
            allPrices.push({ resourceType, tier, enchantment, price });
          }
        });
      });
    });

    if (allPrices.length === 0) {
      alert("No valid prices to save.");
      return;
    }

    console.log("Saving prices:", allPrices);
    const success = await upsertMultipleResourcePrices(allPrices);
    console.log("Save result:", success);

    if (success) {
      alert(`Successfully saved ${allPrices.length} prices to database.`);
    } else {
      alert("Failed to save prices. Check console for errors.");
    }
  }

  function resetAll() {
    setResourcePrices({
      runes: createDefaultTierEnchantmentValues(),
      souls: createDefaultTierEnchantmentValues(),
      relics: createDefaultTierEnchantmentValues(),
      cloth: createDefaultTierEnchantmentValues(),
      leather: createDefaultTierEnchantmentValues(),
      metalBar: createDefaultTierEnchantmentValues(),
      planks: createDefaultTierEnchantmentValues(),
    });
  }

  return (
    <main className="page prices-page">
      <h1>Prices</h1>
      <h2>Manual resource price input for artifacts (T4–T8).</h2>

      {loading && <p className="muted">Loading prices from database...</p>}

      <div className="prices-grid">
        <PriceInputSection
          title="Runes"
          resourceKey="runes"
          values={resourcePrices.runes}
          onChange={(tier, enchantment, value) =>
            handleChange("runes", tier, enchantment, value)
          }
        />
        <PriceInputSection
          title="Souls"
          resourceKey="souls"
          values={resourcePrices.souls}
          onChange={(tier, enchantment, value) =>
            handleChange("souls", tier, enchantment, value)
          }
        />
        <PriceInputSection
          title="Relics"
          resourceKey="relics"
          values={resourcePrices.relics}
          onChange={(tier, enchantment, value) =>
            handleChange("relics", tier, enchantment, value)
          }
        />
      </div>
      <br />
      <h2>Manual resource price input.</h2>

      <div className="prices-grid">
        <PriceInputSection
          title="Cloth"
          resourceKey="cloth"
          values={resourcePrices.cloth}
          onChange={(tier, enchantment, value) =>
            handleChange("cloth", tier, enchantment, value)
          }
          showEnchantments
        />
        <PriceInputSection
          title="Leather"
          resourceKey="leather"
          values={resourcePrices.leather}
          onChange={(tier, enchantment, value) =>
            handleChange("leather", tier, enchantment, value)
          }
          showEnchantments
        />
        <PriceInputSection
          title="Metal Bar"
          resourceKey="metalBar"
          values={resourcePrices.metalBar}
          onChange={(tier, enchantment, value) =>
            handleChange("metalBar", tier, enchantment, value)
          }
          showEnchantments
        />
        <PriceInputSection
          title="Planks"
          resourceKey="planks"
          values={resourcePrices.planks}
          onChange={(tier, enchantment, value) =>
            handleChange("planks", tier, enchantment, value)
          }
          showEnchantments
        />
      </div>

      <div className="actions">
        <button className="btn" onClick={saveAll}>
          Save
        </button>
        <button className="btn btn-ghost" onClick={resetAll}>
          Reset
        </button>
      </div>
    </main>
  );
}
