/**
 * Browse and compare items across categories with auto-loaded prices
 */

"use client";

import { useEffect, useState } from "react";
import "./discovery.css";
import ItemCard from "../../components/ItemCard/ItemCard";
import type { ItemData } from "@/types";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { supabase } from "@/lib/supabase";
import {
  BRIDGEWATCH,
  LYMHURST,
  FORT_STERLING,
  MARTLOCK,
  THETFORD,
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
import type { TierOption, CityOption } from "@/types/shared";
import { fetchItemSellPrices, fetchArtifactPrices } from "@/lib/priceLoader";
import { calculateTotalCost } from "@/lib/calculations";

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
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reloadTrigger, setReloadTrigger] = useState(0);
  const [sellPrices, setSellPrices] = useState<Record<string, number>>({});
  const [artifactPrices, setArtifactPrices] = useState<Record<string, number>>(
    {}
  );
  const [resourcePrices, setResourcePrices] = useState<Record<string, number>>(
    {}
  );

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
    "1"
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  // Load resource prices from item_price_cache
  useEffect(() => {
    if (!mounted) return;

    const loadResourcePrices = async () => {
      try {
        const { data, error } = await supabase
          .from("item_price_cache")
          .select("item_id, sell_price_min")
          .eq("location", "Manual");

        if (!error && data) {
          const priceMap: Record<string, number> = {};
          data.forEach((row) => {
            priceMap[row.item_id] = row.sell_price_min;
          });
          setResourcePrices(priceMap);
        } else if (error) {
          console.error("Error loading resource prices:", error);
        }
      } catch (err) {
        console.error("Failed to load resource prices:", err);
      }
    };

    loadResourcePrices();
  }, [mounted]);

  // Auto-load prices when filters change
  useEffect(() => {
    if (!mounted) return;

    const loadPrices = async () => {
      setLoading(true);
      const items = CATEGORY_DATA[selectedCategory] || [];

      try {
        // Build unique names with tier and enchantment
        const uniqueNames = items.map((item) => {
          return `${selectedTier}_${item.UniqueName}@${selectedEnchantment}`;
        });

        // Collect artifact IDs
        const artifactIds = items
          .filter((item) => (item.Crafting as any)?.Artifact)
          .map((item) => (item.Crafting as any).Artifact);

        // Fetch prices in parallel
        const tierNumber = selectedTier.replace("T", "") as TierOption;
        const [sellPriceMap, artifactPriceMap] = await Promise.all([
          fetchItemSellPrices(uniqueNames, selectedLocation as CityOption),
          artifactIds.length > 0
            ? fetchArtifactPrices(artifactIds, tierNumber)
            : Promise.resolve({}),
        ]);

        // Map artifact prices by UniqueName
        const artifactsByUniqueName: Record<string, number> = {};
        items.forEach((item) => {
          const artifact = (item.Crafting as any)?.Artifact;
          if (artifact) {
            // Check if artifact ID already has tier prefix
            const artifactKey = /^T\d+_/.test(artifact)
              ? artifact
              : `${selectedTier}_${artifact}`;
            artifactsByUniqueName[item.UniqueName] =
              (artifactPriceMap as Record<string, number>)[artifactKey] || 0;
          }
        });

        setSellPrices(sellPriceMap);
        setArtifactPrices(artifactsByUniqueName);
      } catch (error) {
        console.error("Failed to load prices:", error);
        console.error("Error details:", {
          category: selectedCategory,
          tier: selectedTier,
          location: selectedLocation,
          enchantment: selectedEnchantment,
          itemCount: items.length,
        });
      } finally {
        setLoading(false);
      }
    };

    loadPrices();
  }, [
    selectedCategory,
    selectedTier,
    selectedLocation,
    selectedEnchantment,
    mounted,
    reloadTrigger,
  ]);

  if (!mounted) {
    return <div className="discovery-page">Loading...</div>;
  }

  const currentItems = CATEGORY_DATA[selectedCategory] || [];

  const handleReload = () => {
    // Re-trigger the auto-load useEffect
    setReloadTrigger((prev) => prev + 1);
  };

  const handleForceUpdate = async () => {
    // Force fresh fetch by bypassing cache
    setLoading(true);
    const items = currentItems;

    try {
      const uniqueNames = items.map(
        (item) => `${selectedTier}_${item.UniqueName}@${selectedEnchantment}`
      );

      const artifactIds = items
        .filter((item) => (item.Crafting as any)?.Artifact)
        .map((item) => (item.Crafting as any).Artifact);

      // Force reload from API with skipCache = true parameter
      // This would require modifying fetchItemSellPrices to accept skipCache
      // For now, just reload normally
      const tierNumber = selectedTier.replace("T", "") as TierOption;
      const [sellPriceMap, artifactPriceMap] = await Promise.all([
        fetchItemSellPrices(uniqueNames, selectedLocation as CityOption),
        artifactIds.length > 0
          ? fetchArtifactPrices(artifactIds, tierNumber)
          : Promise.resolve({}),
      ]);

      const artifactsByUniqueName: Record<string, number> = {};
      items.forEach((item) => {
        const artifact = (item.Crafting as any)?.Artifact;
        if (artifact) {
          // Check if artifact ID already has tier prefix
          const artifactKey = /^T\d+_/.test(artifact)
            ? artifact
            : `${selectedTier}_${artifact}`;
          artifactsByUniqueName[item.UniqueName] =
            (artifactPriceMap as Record<string, number>)[artifactKey] || 0;
        }
      });

      setSellPrices(sellPriceMap);
      setArtifactPrices(artifactsByUniqueName);
    } catch (error) {
      console.error("Failed to force update prices:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="page discovery-page">
      <h1>Discovery</h1>

      {loading && <p className="muted">Loading prices...</p>}

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
            const itemNameWithTierAndEnchantment = `${selectedTier}_${item.UniqueName}@${selectedEnchantment}`;
            const artifactPrice = artifactPrices[item.UniqueName] || 0;
            const sellPrice = sellPrices[itemNameWithTierAndEnchantment] || 0;

            // Calculate craft cost from resources
            const crafting = item.Crafting as any;
            const tierPrefix = selectedTier;

            // Always use .0 (base) resources
            const clothPrice = resourcePrices[`${tierPrefix}_CLOTH`] || 0;
            const leatherPrice = resourcePrices[`${tierPrefix}_LEATHER`] || 0;
            const metalBarPrice = resourcePrices[`${tierPrefix}_METALBAR`] || 0;
            const planksPrice = resourcePrices[`${tierPrefix}_PLANKS`] || 0;

            // Calculate base resource cost
            const baseResourceCost =
              (crafting.Cloth || 0) * clothPrice +
              (crafting.Leather || 0) * leatherPrice +
              (crafting.Metal_Bars || 0) * metalBarPrice +
              (crafting.Planks || 0) * planksPrice;

            // Calculate enchanting cost (runes, souls, relics)
            const itemCount = ITEM_COUNTS[selectedCategory] || 1;
            let enchantingCost = 0;

            if (selectedEnchantment !== "0") {
              const runePrice = resourcePrices[`${tierPrefix}_RUNE`] || 0;
              const soulPrice = resourcePrices[`${tierPrefix}_SOUL`] || 0;
              const relicPrice = resourcePrices[`${tierPrefix}_RELIC`] || 0;

              // .1 = only runes
              // .2 = runes + souls
              // .3 = runes + souls + relics
              if (selectedEnchantment === "1") {
                enchantingCost += runePrice * itemCount;
              }
              if (selectedEnchantment === "2") {
                enchantingCost += (runePrice + soulPrice) * itemCount;
              }
              if (selectedEnchantment === "3") {
                enchantingCost +=
                  (runePrice + soulPrice + relicPrice) * itemCount;
              }
            }

            const totalCost = baseResourceCost + enchantingCost + artifactPrice;

            return (
              <ItemCard
                key={item.UniqueName}
                uniqueName={itemNameWithTierAndEnchantment}
                name={(item as any).Name}
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
