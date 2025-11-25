"use client";

import { useEffect, useState } from "react";
import "./discovery.css";
import ItemCard from "../../components/ItemCard/ItemCard";
import {
  getItemPriceWithCache,
  getArtefactPriceWithCache,
} from "../../services/priceService";
import type { ItemData, PriceData } from "@/types";
import { calculateCraftingCost } from "@/lib/calculations";
import { useResourcePrices } from "@/hooks/useResourcePrices";
import {
  HEAD_ARMOR,
  CHEST_ARMOR,
  FOOT_ARMOR,
  OFF_HANDS,
  BRIDGEWATCH,
  LYMHURST,
  FORT_STERLING,
  MARTLOCK,
  THETFORD,
  CAERLEON,
  TIER_4,
  TIER_5,
  TIER_6,
  TIER_7,
  TIER_8,
} from "@/lib/constants";
import headArmorData from "../../albion-ids/head-armor.json";
import chestArmorData from "../../albion-ids/chest-armor.json";
import footArmorData from "../../albion-ids/foot-armor.json";
import offHandsData from "../../albion-ids/off-hands.json";

const CATEGORY_DATA: Record<string, ItemData[]> = {
  [HEAD_ARMOR]: headArmorData as ItemData[],
  [CHEST_ARMOR]: chestArmorData as ItemData[],
  [FOOT_ARMOR]: footArmorData as ItemData[],
  [OFF_HANDS]: offHandsData as ItemData[],
};

export default function DiscoveryPage() {
  const [prices, setPrices] = useState<Record<string, PriceData>>({});
  const [artifactPrices, setArtifactPrices] = useState<Record<string, number>>(
    {}
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>(OFF_HANDS);
  const [selectedTier, setSelectedTier] = useState<string>(TIER_5);
  const [selectedLocation, setSelectedLocation] = useState<string>(LYMHURST);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const [forceUpdate, setForceUpdate] = useState<boolean>(false);

  const { prices: resourcePrices, loading: resourceLoading } =
    useResourcePrices();

  const handleReload = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleForceUpdate = () => {
    setForceUpdate(true);
    setRefreshTrigger((prev) => prev + 1);
  };

  useEffect(() => {
    async function fetchPrices() {
      try {
        setLoading(true);
        setError(null);

        const items = CATEGORY_DATA[selectedCategory] || [];
        const priceMap: Record<string, PriceData> = {};
        const artifactMap: Record<string, number> = {};

        // Sende für jedes Item einen einzelnen API-Request
        for (const item of items) {
          try {
            const itemNameWithTier = `T${selectedTier}_${item.UniqueName}`;
            const itemNameWithTierAndQuality = `T${selectedTier}_${item.UniqueName}@3`;

            // Use cached price service (skip cache if force update)
            const data = await getItemPriceWithCache(
              itemNameWithTierAndQuality,
              selectedLocation,
              forceUpdate
            );

            if (data) {
              priceMap[data.item_id] = data;
            }

            // Fetch artifact price if artifact exists
            if (item.Crafting.Artifact) {
              const artifactNameWithTier = `T${selectedTier}_${item.Crafting.Artifact}`;

              // Use cached artifact price service (skip cache if force update)
              const artifactPrice = await getArtefactPriceWithCache(
                artifactNameWithTier,
                selectedLocation,
                forceUpdate
              );

              artifactMap[item.UniqueName] = artifactPrice;
            }
          } catch (itemError) {
            console.error(
              `Failed to fetch price for ${item.UniqueName}:`,
              itemError
            );
            // Weiter mit nächstem Item
          }
        }
        console.log(priceMap);
        setPrices(priceMap);
        setArtifactPrices(artifactMap);
      } catch (e: any) {
        console.error("Failed to fetch prices:", e);
        setError(e?.message || "Failed to load prices");
      } finally {
        setLoading(false);
        setForceUpdate(false); // Reset force update flag
      }
    }

    fetchPrices();
  }, [selectedCategory, selectedTier, selectedLocation, refreshTrigger]);

  return (
    <main className="page discovery-page">
      <h1>Discovery</h1>

      {loading && <p className="muted">Loading prices...</p>}
      {error && <p className="error">{error}</p>}

      <div className="filters">
        <div className="filter-field">
          <label>Category</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value={HEAD_ARMOR}>Head Armor</option>
            <option value={CHEST_ARMOR}>Chest Armor</option>
            <option value={FOOT_ARMOR}>Foot Armor</option>
            <option value={OFF_HANDS}>Off Hands</option>
          </select>
        </div>

        <div className="filter-field">
          <label>Tier</label>
          <select
            value={selectedTier}
            onChange={(e) => setSelectedTier(e.target.value)}
          >
            <option value={TIER_4}>T4</option>
            <option value={TIER_5}>T5</option>
            <option value={TIER_6}>T6</option>
            <option value={TIER_7}>T7</option>
            <option value={TIER_8}>T8</option>
          </select>
        </div>

        <div className="filter-field">
          <label>Location</label>
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
          >
            <option value={BRIDGEWATCH}>Bridgewatch</option>
            <option value={LYMHURST}>Lymhurst</option>
            <option value={FORT_STERLING}>Fort Sterling</option>
            <option value={MARTLOCK}>Martlock</option>
            <option value={THETFORD}>Thetford</option>
            <option value={CAERLEON}>Caerleon</option>
          </select>
        </div>

        <div className="filter-field">
          <label>&nbsp;</label>
          <button className="btn" onClick={handleReload} disabled={loading}>
            {loading ? "Loading..." : "Reload Prices"}
          </button>
        </div>

        <div className="filter-field">
          <label>&nbsp;</label>
          <button
            className="btn"
            onClick={handleForceUpdate}
            disabled={loading}
          >
            {loading ? "Loading..." : "Force Update"}
          </button>
        </div>
      </div>

      <section className="example-cards" style={{ marginTop: "1rem" }}>
        {(CATEGORY_DATA[selectedCategory] || []).map((item) => {
          const itemNameWithTierAndQuality = `T${selectedTier}_${item.UniqueName}@3`;
          const priceData = prices[itemNameWithTierAndQuality];
          const artifactPrice = artifactPrices[item.UniqueName] || 0;

          const craftCost = calculateCraftingCost(
            `T${selectedTier}` as any,
            {
              cloth: item.Crafting.Cloth,
              leather: item.Crafting.Leather,
              metalBar: item.Crafting.Metal_Bars,
              planks: item.Crafting.Planks,
              artifact: artifactPrice,
            },
            resourcePrices
          );
          const sellPrice = priceData?.sell_price_min || 0;

          return (
            <ItemCard
              key={item.UniqueName}
              uniqueName={itemNameWithTierAndQuality}
              name={item.Name}
              artefactCost={artifactPrice}
              craftCost={craftCost}
              sellPrice={sellPrice}
            />
          );
        })}
      </section>
    </main>
  );
}
