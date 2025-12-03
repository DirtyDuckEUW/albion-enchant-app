"use client";

import { useEffect, useState } from "react";
import "./discovery.css";
import ItemCard from "../../components/ItemCard/ItemCard";
import {
  getItemPriceWithCache,
  getArtefactPriceWithCache,
} from "../../services/priceService";
import type { ItemData, PriceData } from "@/types";
import { calculateTotalCost } from "@/lib/calculations";
import { useResourcePrices } from "@/hooks/useResourcePrices";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import {
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
import {
  getHeadArmorItems,
  getChestArmorItems,
  getFootArmorItems,
  getOffHandItems,
  getOneHandWeapons,
  getTwoHandWeapons,
} from "@/lib/itemsLoader";
import { ITEM_COUNTS } from "@/lib/utility";
import type { ItemKey } from "@/types";

type CategoryKey = Extract<
  ItemKey,
  | "head_armor"
  | "chest_armor"
  | "foot_armor"
  | "off_hands"
  | "onehand_weapons"
  | "twohand_weapons"
>;

const CATEGORY_DATA: Record<CategoryKey, ItemData[]> = {
  head_armor: getHeadArmorItems(),
  chest_armor: getChestArmorItems(),
  foot_armor: getFootArmorItems(),
  off_hands: getOffHandItems(),
  onehand_weapons: getOneHandWeapons(),
  twohand_weapons: getTwoHandWeapons(),
};

export default function DiscoveryPage() {
  const [prices, setPrices] = useState<Record<string, PriceData>>({});
  const [artifactPrices, setArtifactPrices] = useState<Record<string, number>>(
    {}
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const [selectedCategory, setSelectedCategory] = useLocalStorage<CategoryKey>(
    "discovery_category",
    "off_hands" as CategoryKey
  );
  const [selectedTier, setSelectedTier] = useLocalStorage<string>(
    "discovery_tier",
    TIER_5
  );
  const [selectedLocation, setSelectedLocation] = useLocalStorage<string>(
    "discovery_location",
    LYMHURST
  );
  const [selectedEnchantment, setSelectedEnchantment] = useLocalStorage<string>(
    "discovery_enchantment",
    "0"
  );
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const [forceUpdate, setForceUpdate] = useState<boolean>(false);

  const { prices: resourcePrices, loading: resourceLoading } =
    useResourcePrices();

  useEffect(() => {
    setMounted(true);
  }, []);

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
            // For enchanted items, use @X
            const itemNameWithTierAndEnchantment = `${selectedTier}_${item.UniqueName}@${selectedEnchantment}`;

            // Use cached price service (skip cache if force update)
            const data = await getItemPriceWithCache(
              itemNameWithTierAndEnchantment,
              selectedLocation,
              forceUpdate
            );

            if (data) {
              priceMap[data.item_id] = data;
            }

            // Fetch artifact price if artifact exists
            if (item.Crafting.Artifact) {
              const artifactNameWithTier = `${selectedTier}_${item.Crafting.Artifact}`;

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
  }, [
    selectedCategory,
    selectedTier,
    selectedLocation,
    selectedEnchantment,
    refreshTrigger,
  ]);

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
            onChange={(e) => setSelectedCategory(e.target.value as CategoryKey)}
          >
            <option value="head_armor">Head Armor</option>
            <option value="chest_armor">Chest Armor</option>
            <option value="foot_armor">Foot Armor</option>
            <option value="off_hands">Off Hands</option>
            <option value="onehand_weapons">One Handed Weapons</option>
            <option value="twohand_weapons">Two Handed Weapons</option>
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
          <label>Enchantment</label>
          <select
            value={selectedEnchantment}
            onChange={(e) => setSelectedEnchantment(e.target.value)}
          >
            <option value="1">.1</option>
            <option value="2">.2</option>
            <option value="3">.3</option>
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

      {!mounted ? (
        <p className="muted">Loading...</p>
      ) : (
        <section className="example-cards" style={{ marginTop: "1rem" }}>
          {(CATEGORY_DATA[selectedCategory] || []).map((item) => {
            // For enchanted items, use @X
            const itemNameWithTierAndEnchantment = `${selectedTier}_${item.UniqueName}@${selectedEnchantment}`;
            const priceData = prices[itemNameWithTierAndEnchantment];
            const artifactPrice = artifactPrices[item.UniqueName] || 0;

            const totalCost = calculateTotalCost(
              selectedTier as any,
              ITEM_COUNTS[selectedCategory],
              {
                cloth: item.Crafting.Cloth,
                leather: item.Crafting.Leather,
                metalBar: item.Crafting.Metal_Bars,
                planks: item.Crafting.Planks,
                artifact: artifactPrice,
              },
              resourcePrices,
              selectedEnchantment
            );
            const sellPrice = priceData?.sell_price_min || 0;

            return (
              <ItemCard
                key={item.UniqueName}
                uniqueName={itemNameWithTierAndEnchantment}
                name={item.Name}
                artefactCost={artifactPrice}
                craftCost={totalCost}
                sellPrice={sellPrice}
              />
            );
          })}
        </section>
      )}
    </main>
  );
}
