"use client";

import { useEffect, useState } from "react";
import "./prices.css";
import {
  getAllResourcePrices,
  upsertMultipleResourcePrices,
} from "@/lib/supabase";
import type { ResourceType, Tier, ResourceInputMap } from "@/types";
import {
  TIERS,
  RESOURCE_TYPES,
  createDefaultTierValues,
  parseNumber,
} from "@/lib/utility";
import PriceInputSection from "@/components/PriceInputSection/PriceInputSection";

export default function PricesPage() {
  const defaultTierValues = createDefaultTierValues();

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

      const newPrices: ResourceInputMap = {
        runes: { ...defaultTierValues },
        souls: { ...defaultTierValues },
        relics: { ...defaultTierValues },
        cloth: { ...defaultTierValues },
        leather: { ...defaultTierValues },
        metalBar: { ...defaultTierValues },
        planks: { ...defaultTierValues },
      };

      prices.forEach((p) => {
        if (newPrices[p.resource_type]) {
          newPrices[p.resource_type][p.tier] = p.price.toString();
        }
      });

      setResourcePrices(newPrices);
      setLoading(false);
    }

    loadPrices();
  }, []);

  function handleChange(resource: ResourceType, tier: Tier, value: string) {
    setResourcePrices((prev) => ({
      ...prev,
      [resource]: {
        ...prev[resource],
        [tier]: value,
      },
    }));
  }

  async function saveAll() {
    const allPrices: Array<{
      resourceType: ResourceType;
      tier: Tier;
      price: number;
    }> = [];

    RESOURCE_TYPES.forEach((resourceType) => {
      TIERS.forEach((tier) => {
        const price = parseNumber(resourcePrices[resourceType][tier]);
        if (Number.isFinite(price)) {
          allPrices.push({ resourceType, tier, price });
        }
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
      runes: { ...defaultTierValues },
      souls: { ...defaultTierValues },
      relics: { ...defaultTierValues },
      cloth: { ...defaultTierValues },
      leather: { ...defaultTierValues },
      metalBar: { ...defaultTierValues },
      planks: { ...defaultTierValues },
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
          onChange={(tier, value) => handleChange("runes", tier, value)}
        />
        <PriceInputSection
          title="Souls"
          resourceKey="souls"
          values={resourcePrices.souls}
          onChange={(tier, value) => handleChange("souls", tier, value)}
        />
        <PriceInputSection
          title="Relics"
          resourceKey="relics"
          values={resourcePrices.relics}
          onChange={(tier, value) => handleChange("relics", tier, value)}
        />
      </div>
      <br />
      <h2>Manual resource price input.</h2>

      <div className="prices-grid">
        <PriceInputSection
          title="Cloth"
          resourceKey="cloth"
          values={resourcePrices.cloth}
          onChange={(tier, value) => handleChange("cloth", tier, value)}
          showDecimal
        />
        <PriceInputSection
          title="Leather"
          resourceKey="leather"
          values={resourcePrices.leather}
          onChange={(tier, value) => handleChange("leather", tier, value)}
          showDecimal
        />
        <PriceInputSection
          title="Metal Bar"
          resourceKey="metalBar"
          values={resourcePrices.metalBar}
          onChange={(tier, value) => handleChange("metalBar", tier, value)}
          showDecimal
        />
        <PriceInputSection
          title="Planks"
          resourceKey="planks"
          values={resourcePrices.planks}
          onChange={(tier, value) => handleChange("planks", tier, value)}
          showDecimal
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
