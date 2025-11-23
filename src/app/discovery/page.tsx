"use client";

import { useEffect, useState } from "react";
import "./discovery.css";
import ItemCard from "../../components/ItemCard/ItemCard";
import { getItemPrice, getArtefactPrice } from "../../services/api";
import itemsData from "../../albion-ids/foot-armor.json";
import type { ItemData, PriceData } from "@/types";
import { calculateCraftingCost } from "@/lib/calculations";
import { useResourcePrices } from "@/hooks/useResourcePrices";

export default function DiscoveryPage() {
  const [prices, setPrices] = useState<Record<string, PriceData>>({});
  const [artifactPrices, setArtifactPrices] = useState<Record<string, number>>(
    {},
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTier, setSelectedTier] = useState<string>("4");
  const [selectedLocation, setSelectedLocation] =
    useState<string>("Bridgewatch");

  const { prices: resourcePrices, loading: resourceLoading } =
    useResourcePrices();

  useEffect(() => {
    async function fetchPrices() {
      try {
        setLoading(true);
        setError(null);

        const items = itemsData as ItemData[];
        const priceMap: Record<string, PriceData> = {};
        const artifactMap: Record<string, number> = {};

        // Sende für jedes Item einen einzelnen API-Request
        for (const item of items) {
          try {
            const itemNameWithTier = `T${selectedTier}_${item.UniqueName}`;
            const itemNameWithTierAndQuality = `T${selectedTier}_${item.UniqueName}@3`;
            const data = await getItemPrice(
              itemNameWithTierAndQuality,
              selectedLocation,
            );
            if (Array.isArray(data) && data.length > 0) {
              priceMap[data[0].item_id] = data[0];
            }

            // Fetch artifact price if artifact exists
            if (item.Crafting.Artifact) {
              const artifactNameWithTier = `T${selectedTier}_${item.Crafting.Artifact}`;
              const artifactData = await getArtefactPrice(
                artifactNameWithTier,
                selectedLocation,
              );
              if (Array.isArray(artifactData) && artifactData.length > 0) {
                artifactMap[item.UniqueName] =
                  artifactData[0].sell_price_min || 0;
              }
            }
          } catch (itemError) {
            console.error(
              `Failed to fetch price for ${item.UniqueName}:`,
              itemError,
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
      }
    }

    fetchPrices();
  }, [selectedTier, selectedLocation]);

  return (
    <main className="page discovery-page">
      <h1>Discovery</h1>
      <p>Liste profitabler Crafts.</p>

      {loading && <p className="muted">Loading prices...</p>}
      {error && <p className="error">{error}</p>}

      <div className="filters">
        <div className="filter-field">
          <label>Kategorie</label>
          <select>
            <option value="">Alle</option>
            <option value="weapon">Waffen</option>
            <option value="armor">Rüstung</option>
            <option value="tool">Werkzeuge</option>
          </select>
        </div>

        <div className="filter-field">
          <label>Tier</label>
          <select
            value={selectedTier}
            onChange={(e) => setSelectedTier(e.target.value)}
          >
            <option value="4">T4</option>
            <option value="5">T5</option>
            <option value="6">T6</option>
            <option value="7">T7</option>
            <option value="8">T8</option>
          </select>
        </div>

        <div className="filter-field">
          <label>Location</label>
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
          >
            <option value="Bridgewatch">Bridgewatch</option>
            <option value="Lymhurst">Lymhurst</option>
            <option value="FortSterling">Fort Sterling</option>
            <option value="Martlock">Martlock</option>
            <option value="Thetford">Thetford</option>
            <option value="Caerleon">Caerleon</option>
          </select>
        </div>
      </div>

      <section className="example-cards" style={{ marginTop: "1rem" }}>
        {(itemsData as ItemData[]).map((item) => {
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
            resourcePrices,
          );
          const sellPrice = priceData?.sell_price_min || 0;

          return (
            <ItemCard
              key={item.UniqueName}
              uniqueName={itemNameWithTierAndQuality}
              name={item.Name}
              craftCost={craftCost}
              sellPrice={sellPrice}
            />
          );
        })}
      </section>
    </main>
  );
}
