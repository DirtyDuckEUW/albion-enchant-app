"use client";

import { useState, useEffect } from "react";
import "./focus-crafting.css";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { getResourcePrice } from "@/lib/supabase";
import { getArtefactMedianPriceWithCache } from "@/services/priceService";
import {
  TIER_4,
  TIER_5,
  TIER_6,
  TIER_7,
  TIER_8,
  MARKET_TAX,
} from "@/lib/constants";
import type { ItemData, Tier, Enchantment } from "@/types";
import { getAllItems } from "@/lib/itemsLoader";
import ReturnRateInput from "@/components/ReturnRateInput/ReturnRateInput";

// Combine all items for selection
const ALL_ITEMS: ItemData[] = getAllItems();

export default function FocusCraftingPage() {
  const [selectedItem, setSelectedItem] = useLocalStorage<string>(
    "focus_crafting_item",
    ALL_ITEMS[0]?.UniqueName || ""
  );
  const [amount, setAmount] = useLocalStorage<string>(
    "focus_crafting_amount",
    "1"
  );
  const [selectedTier, setSelectedTier] = useLocalStorage<string>(
    "focus_crafting_tier",
    TIER_8
  );
  const [selectedEnchantment, setSelectedEnchantment] = useLocalStorage<string>(
    "focus_crafting_enchantment",
    "3"
  );
  const [returnRate, setReturnRate] = useLocalStorage<string>(
    "focus_crafting_return_rate",
    "47.92"
  );
  const [returnRateInput, setReturnRateInput] = useLocalStorage<string>(
    "focus_crafting_return_rate_input",
    ""
  );

  // Resource price inputs
  const [clothPrice, setClothPrice] = useLocalStorage<string>(
    "focus_crafting_cloth_price",
    ""
  );
  const [leatherPrice, setLeatherPrice] = useLocalStorage<string>(
    "focus_crafting_leather_price",
    ""
  );
  const [metalBarPrice, setMetalBarPrice] = useLocalStorage<string>(
    "focus_crafting_metalbar_price",
    ""
  );
  const [planksPrice, setPlanksPrice] = useLocalStorage<string>(
    "focus_crafting_planks_price",
    ""
  );
  const [artifactPrice, setArtifactPrice] = useLocalStorage<string>(
    "focus_crafting_artifact_price",
    ""
  );
  const [sellValue, setSellValue] = useLocalStorage<string>(
    "focus_crafting_sell_value",
    ""
  );

  // Calculation state
  const [totalCost, setTotalCost] = useState<number | null>(null);
  const [totalResources, setTotalResources] = useState<{
    cloth: number;
    leather: number;
    metalBar: number;
    planks: number;
    artifact: number;
  } | null>(null);
  const [profit, setProfit] = useState<number | null>(null);
  const [sellAfterTax, setSellAfterTax] = useState<number | null>(null);
  const [taxAmount, setTaxAmount] = useState<number | null>(null);

  // Find the selected item to get resource quantities
  const currentItem = ALL_ITEMS.find(
    (item) => item.UniqueName === selectedItem
  );
  const clothQty = currentItem?.Crafting.Cloth || 0;
  const leatherQty = currentItem?.Crafting.Leather || 0;
  const metalBarQty = currentItem?.Crafting.Metal_Bars || 0;
  const planksQty = currentItem?.Crafting.Planks || 0;
  const hasArtifact = currentItem?.Crafting.Artifact ? true : false;

  // Auto-fetch prices from Supabase when tier or enchantment changes
  useEffect(() => {
    async function fetchPrices() {
      const tier = selectedTier as Tier;
      const enchantment = selectedEnchantment as Enchantment;

      console.log(`Fetching prices for ${tier}.${enchantment}`);

      const [cloth, leather, metalBar, planks] = await Promise.all([
        getResourcePrice("cloth", tier, enchantment),
        getResourcePrice("leather", tier, enchantment),
        getResourcePrice("metalBar", tier, enchantment),
        getResourcePrice("planks", tier, enchantment),
      ]);

      console.log("Fetched prices:", { cloth, leather, metalBar, planks });

      if (cloth !== null) {
        console.log("Setting cloth price to:", cloth);
        setClothPrice(cloth.toString());
      }
      if (leather !== null) {
        console.log("Setting leather price to:", leather);
        setLeatherPrice(leather.toString());
      }
      if (metalBar !== null) {
        console.log("Setting metalBar price to:", metalBar);
        setMetalBarPrice(metalBar.toString());
      }
      if (planks !== null) {
        console.log("Setting planks price to:", planks);
        setPlanksPrice(planks.toString());
      }
    }

    fetchPrices();
  }, [
    selectedTier,
    selectedEnchantment,
    setClothPrice,
    setLeatherPrice,
    setMetalBarPrice,
    setPlanksPrice,
  ]);

  // Auto-fetch artifact price when tier or selected item changes
  useEffect(() => {
    async function fetchArtifactPrice() {
      if (!hasArtifact || !currentItem?.Crafting.Artifact) {
        setArtifactPrice("");
        return;
      }

      const artifactId = `${selectedTier}_${currentItem.Crafting.Artifact}`;
      console.log(`Fetching median artifact price for ${artifactId}`);

      const price = await getArtefactMedianPriceWithCache(artifactId);
      console.log(`Fetched median artifact price: ${price}`);

      if (price > 0) {
        setArtifactPrice(price.toString());
      }
    }

    fetchArtifactPrice();
  }, [selectedTier, selectedItem, hasArtifact, currentItem, setArtifactPrice]);

  const handleCalculate = () => {
    const amountNum = parseFloat(amount) || 0;

    // Get return rate
    const rateValue = parseFloat(returnRate) || 0;
    const returnRateDecimal = rateValue / 100;

    // Calculate total quantities with return rate applied and rounded up
    const totalCloth = Math.ceil(
      clothQty * amountNum * (1 - returnRateDecimal)
    );
    const totalLeather = Math.ceil(
      leatherQty * amountNum * (1 - returnRateDecimal)
    );
    const totalMetalBar = Math.ceil(
      metalBarQty * amountNum * (1 - returnRateDecimal)
    );
    const totalPlanks = Math.ceil(
      planksQty * amountNum * (1 - returnRateDecimal)
    );
    const totalArtifact = hasArtifact ? Math.ceil(1 * amountNum) : 0;

    setTotalResources({
      cloth: totalCloth,
      leather: totalLeather,
      metalBar: totalMetalBar,
      planks: totalPlanks,
      artifact: totalArtifact,
    });

    // Calculate total cost
    const clothCost = totalCloth * (parseFloat(clothPrice) || 0);
    const leatherCost = totalLeather * (parseFloat(leatherPrice) || 0);
    const metalBarCost = totalMetalBar * (parseFloat(metalBarPrice) || 0);
    const planksCost = totalPlanks * (parseFloat(planksPrice) || 0);
    const artifactCost = totalArtifact * (parseFloat(artifactPrice) || 0);

    const total =
      clothCost + leatherCost + metalBarCost + planksCost + artifactCost;
    setTotalCost(total);

    // Calculate sell value after tax and profit
    const sellValueNum = parseFloat(sellValue) * amountNum || 0;
    const tax = Math.ceil(sellValueNum * MARKET_TAX);
    const sellAfterTaxValue = sellValueNum - tax;
    const profitValue = sellAfterTaxValue - total;

    setTaxAmount(tax);
    setSellAfterTax(sellAfterTaxValue);
    setProfit(profitValue);
  };

  return (
    <main className="page focus-crafting-page">
      <h1>Focus Crafting</h1>

      <div className="filters">
        <div className="filter-field">
          <label>Item</label>
          <div className="filter-combo">
            <select
              value={selectedItem}
              onChange={(e) => setSelectedItem(e.target.value)}
            >
              {ALL_ITEMS.map((item) => (
                <option key={item.UniqueName} value={item.UniqueName}>
                  {item.Name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="filter-field">
          <label>Amount</label>
          <input
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="1"
          />
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
            <option value="0">0</option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
          </select>
        </div>

        <ReturnRateInput
          returnRate={returnRate}
          setReturnRate={setReturnRate}
        />
      </div>

      <div className="resource-counts">
        <p className="muted">Resource quantities</p>
        <div className="resource-grid">
          <label className="resource-field">
            <span>Cloth</span>
            <input inputMode="decimal" value={clothQty} readOnly />
            <input
              inputMode="decimal"
              value={clothPrice}
              onChange={(e) => setClothPrice(e.target.value)}
              placeholder="Price"
            />
          </label>
          <label className="resource-field">
            <span>Leather</span>
            <input inputMode="decimal" value={leatherQty} readOnly />
            <input
              inputMode="decimal"
              value={leatherPrice}
              onChange={(e) => setLeatherPrice(e.target.value)}
              placeholder="Price"
            />
          </label>
          <label className="resource-field">
            <span>Metal Bar</span>
            <input inputMode="decimal" value={metalBarQty} readOnly />
            <input
              inputMode="decimal"
              value={metalBarPrice}
              onChange={(e) => setMetalBarPrice(e.target.value)}
              placeholder="Price"
            />
          </label>
          <label className="resource-field">
            <span>Planks</span>
            <input inputMode="decimal" value={planksQty} readOnly />
            <input
              inputMode="decimal"
              value={planksPrice}
              onChange={(e) => setPlanksPrice(e.target.value)}
              placeholder="Price"
            />
          </label>
          <label className="resource-field">
            <span>Artifact</span>
            <input
              inputMode="decimal"
              value={hasArtifact ? "1" : "0"}
              readOnly
            />
            <input
              inputMode="decimal"
              value={artifactPrice}
              onChange={(e) => setArtifactPrice(e.target.value)}
              placeholder="Price"
            />
          </label>
        </div>
      </div>

      <label className="field">
        <span>Sell Value</span>
        <input
          inputMode="decimal"
          value={sellValue}
          onChange={(e) => setSellValue(e.target.value)}
          placeholder="Enter sell price"
        />
      </label>

      <div className="actions">
        <button type="button" className="btn" onClick={handleCalculate}>
          Calculate
        </button>
      </div>

      {totalCost !== null && totalResources && (
        <section className="result">
          <h2>Results</h2>
          <p>Total Resources Needed:</p>
          <p>
            Cloth: <strong>{totalResources.cloth.toLocaleString()}</strong> |
            Leather: <strong>{totalResources.leather.toLocaleString()}</strong>{" "}
            | Metal Bar:{" "}
            <strong>{totalResources.metalBar.toLocaleString()}</strong> |
            Planks: <strong>{totalResources.planks.toLocaleString()}</strong> |
            Artifact:{" "}
            <strong>{totalResources.artifact.toLocaleString()}</strong>
          </p>
          <hr className="sep" />
          <p>
            Total Cost: <strong>{totalCost.toLocaleString()}</strong>
          </p>
          <p>
            Market Tax (6.5%):{" "}
            <strong>{taxAmount?.toLocaleString() || "0"}</strong>
          </p>
          <p>
            Sell After Tax:{" "}
            <strong>{sellAfterTax?.toLocaleString() || "0"}</strong>
          </p>
          <hr className="sep" />
          <p>
            Profit: <strong>{profit?.toLocaleString() || "0"}</strong>
          </p>
          <p>
            Profit %:{" "}
            <strong>
              {totalCost > 0 && profit !== null
                ? ((profit / totalCost) * 100).toFixed(2) + "%"
                : "N/A"}
            </strong>
          </p>
        </section>
      )}
    </main>
  );
}
