"use client";

import { useEffect, useState } from "react";
import "./prices.css";
import { supabase } from "@/lib/supabase";
import resourcesData from "@/albion-ids/resources.json";

type ResourceCategory = "Cloth" | "Leather" | "Metal Bars" | "Planks";
type PriceMap = Record<string, string>; // item_id -> price

export default function PricesPage() {
  const [prices, setPrices] = useState<PriceMap>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load prices from item_price_cache
  useEffect(() => {
    async function loadPrices() {
      setLoading(true);

      try {
        const { data, error } = await supabase
          .from("item_price_cache")
          .select("item_id, sell_price_min")
          .eq("location", "Manual"); // Use "Manual" location for manually entered prices

        if (error) {
          console.error("Error loading prices:", error);
        } else if (data) {
          const priceMap: PriceMap = {};
          data.forEach((row) => {
            priceMap[row.item_id] = row.sell_price_min.toString();
          });
          setPrices(priceMap);
          console.log("Loaded prices:", priceMap);
        }
      } catch (err) {
        console.error("Failed to load prices:", err);
      }

      setLoading(false);
    }

    loadPrices();
  }, []);

  const handleChange = (itemId: string, value: string) => {
    setPrices((prev) => ({
      ...prev,
      [itemId]: value,
    }));
  };

  const saveAll = async () => {
    setSaving(true);

    try {
      const records = Object.entries(prices)
        .filter(([_, price]) => price && !isNaN(parseFloat(price)))
        .map(([itemId, price]) => ({
          item_id: itemId,
          location: "Manual",
          quality: 1,
          sell_price_min: parseFloat(price),
          sell_price_max: parseFloat(price),
          buy_price_min: 0,
          buy_price_max: 0,
          sell_price_min_date: new Date().toISOString(),
          sell_price_max_date: new Date().toISOString(),
          buy_price_min_date: new Date().toISOString(),
          buy_price_max_date: new Date().toISOString(),
          cached_at: new Date().toISOString(),
        }));

      console.log("Saving records:", records.length);

      const { error } = await supabase
        .from("item_price_cache")
        .upsert(records, { onConflict: "item_id,location" });

      if (error) {
        console.error("Error saving prices:", error);
        alert("Failed to save prices. Check console for errors.");
      } else {
        alert(`Successfully saved ${records.length} prices to database.`);
      }
    } catch (err) {
      console.error("Save failed:", err);
      alert("Failed to save prices.");
    }

    setSaving(false);
  };

  const resetAll = () => {
    setPrices({});
  };

  const renderResourceSection = (category: ResourceCategory) => {
    const resources = resourcesData.Resources[category];

    return (
      <div key={category} className="price-section">
        <h3>{category}</h3>
        <div className="price-inputs-grid">
          {resources.map((resource) => (
            <div key={resource.UniqueName} className="price-input-item">
              <img
                src={`https://render.albiononline.com/v1/item/${resource.UniqueName}.png`}
                alt={resource.Name}
                className="item-icon"
              />
              <label>{resource.Name}</label>
              <input
                type="number"
                value={prices[resource.UniqueName] || ""}
                onChange={(e) =>
                  handleChange(resource.UniqueName, e.target.value)
                }
                placeholder="0"
              />
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderArtifactSection = () => {
    const artifacts = resourcesData.Artifacts;
    const runes = artifacts.filter((a) => a.UniqueName.includes("RUNE"));
    const souls = artifacts.filter((a) => a.UniqueName.includes("SOUL"));
    const relics = artifacts.filter((a) => a.UniqueName.includes("RELIC"));

    const renderArtifactColumn = (items: typeof artifacts, title: string) => (
      <div className="price-section">
        <h3>{title}</h3>
        <div className="price-inputs-grid">
          {items.map((artifact) => (
            <div key={artifact.UniqueName} className="price-input-item">
              <img
                src={`https://render.albiononline.com/v1/item/${artifact.UniqueName}.png`}
                alt={artifact.Name}
                className="item-icon"
              />
              <label>{artifact.Name}</label>
              <input
                type="number"
                value={prices[artifact.UniqueName] || ""}
                onChange={(e) =>
                  handleChange(artifact.UniqueName, e.target.value)
                }
                placeholder="0"
              />
            </div>
          ))}
        </div>
      </div>
    );

    return (
      <>
        {renderArtifactColumn(runes, "Runes")}
        {renderArtifactColumn(souls, "Souls")}
        {renderArtifactColumn(relics, "Relics")}
      </>
    );
  };

  return (
    <main className="page prices-page">
      <h1>Prices</h1>
      <h2>Manual resource price input for artifacts (T4–T8).</h2>

      {loading && <p className="loading">Loading prices from database...</p>}

      <div className="artifacts-grid">{renderArtifactSection()}</div>

      <br />
      <h2>Manual resource price input.</h2>

      <div className="prices-grid">
        {renderResourceSection("Cloth")}
        {renderResourceSection("Leather")}
        {renderResourceSection("Metal Bars")}
        {renderResourceSection("Planks")}
      </div>

      <div className="actions">
        <button className="btn" onClick={saveAll} disabled={saving}>
          {saving ? "Saving..." : "Save All Prices"}
        </button>
        <button className="btn btn-ghost" onClick={resetAll} disabled={saving}>
          Reset All
        </button>
      </div>
    </main>
  );
}
