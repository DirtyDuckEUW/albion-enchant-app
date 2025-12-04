/**
 * Focus Crafting Page (Refactored)
 * Single-item crafting analysis with focus bonus calculations
 */

"use client";

import { useState, useEffect } from "react";
import "./focus-crafting.css";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import type {
  TierOption,
  EnchantmentOption,
  ReturnRateOption,
} from "@/types/shared";
import { getAllItems } from "@/lib/itemsLoader";
import {
  calculateCraftCostWithReturnRate,
  formatSilver,
  formatPercentage,
  getProfitColor,
} from "@/lib/calculations";
import { fetchResourcePrices, fetchArtifactPrices } from "@/lib/priceLoader";
import ReturnRateInput from "@/components/ReturnRateInput/ReturnRateInput";
import { MARKET_TAX } from "@/lib/constants";

const ALL_ITEMS = getAllItems();

export default function FocusCraftingPage() {
  const [mounted, setMounted] = useState(false);

  // Filter states
  const [selectedItem, setSelectedItem] = useLocalStorage<string>(
    "focus_crafting_item",
    ALL_ITEMS[0]?.UniqueName || ""
  );
  const [amount, setAmount] = useLocalStorage<string>(
    "focus_crafting_amount",
    "1"
  );
  const [selectedTier, setSelectedTier] = useLocalStorage<TierOption>(
    "focus_crafting_tier",
    "8"
  );
  const [selectedEnchantment, setSelectedEnchantment] =
    useLocalStorage<EnchantmentOption>("focus_crafting_enchantment", "3");
  const [returnRate, setReturnRate] = useLocalStorage<ReturnRateOption>(
    "focus_crafting_return_rate",
    "47.92"
  );

  // Editable prices
  const [artifactPrice, setArtifactPrice] = useLocalStorage<string>(
    "focus_crafting_artifact_price",
    ""
  );
  const [sellValue, setSellValue] = useLocalStorage<string>(
    "focus_crafting_sell_value",
    ""
  );

  // Loaded prices
  const [resourcePrices, setResourcePrices] = useState<Record<string, number>>(
    {}
  );

  // Results
  const [showResults, setShowResults] = useState<boolean>(false);
  const [craftCost, setCraftCost] = useState<number>(0);
  const [profit, setProfit] = useState<number>(0);
  const [sellAfterTax, setSellAfterTax] = useState<number>(0);

  const currentItem = ALL_ITEMS.find(
    (item) => item.UniqueName === selectedItem
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-load resource prices
  useEffect(() => {
    if (!currentItem || !mounted) return;

    const loadPrices = async () => {
      // For legacy items, we need to load standard resources
      const resourceIds = ["CLOTH", "LEATHER", "METALBAR", "PLANKS"].filter(
        (id) => {
          const qty = (currentItem.Crafting as any)[
            id === "METALBAR"
              ? "Metal_Bars"
              : id.charAt(0) + id.slice(1).toLowerCase()
          ];
          return qty > 0;
        }
      );

      if (resourceIds.length > 0) {
        const prices = await fetchResourcePrices(
          resourceIds,
          selectedTier,
          selectedEnchantment
        );
        setResourcePrices(prices);
      }
    };

    loadPrices();
  }, [selectedTier, selectedEnchantment, currentItem, mounted]);

  // Auto-load artifact price
  useEffect(() => {
    const artifact = (currentItem?.Crafting as any)?.Artifact;
    if (!artifact || !mounted) {
      setArtifactPrice("");
      return;
    }

    const loadArtifactPrice = async () => {
      const prices = await fetchArtifactPrices([artifact], selectedTier);

      // fetchArtifactPrices returns keys with tier already included
      const artifactId = /^T\d+_/.test(artifact)
        ? artifact
        : `T${selectedTier}_${artifact}`;
      const price = prices[artifactId];

      console.log("Artifact price lookup:", {
        artifact,
        artifactId,
        price,
        allPrices: prices,
      });

      if (price) {
        setArtifactPrice(price.toString());
      }
    };

    loadArtifactPrice();
  }, [selectedTier, currentItem, mounted]);

  const handleCalculate = () => {
    if (!currentItem) return;

    const amountNum = parseFloat(amount) || 1;
    const artifactPriceNum = parseFloat(artifactPrice) || 0;
    const sellValueNum = parseFloat(sellValue) || 0;

    console.log("Calculate clicked:", {
      currentItem: currentItem.UniqueName,
      amount: amountNum,
      artifactPrice: artifactPriceNum,
      sellValue: sellValueNum,
      resourcePrices,
    });

    // Calculate craft cost manually for legacy structure
    const crafting = currentItem.Crafting as any;
    const returnRateDecimal = parseFloat(returnRate) / 100;

    const clothQty = Math.ceil(
      (crafting.Cloth || 0) * amountNum * (1 - returnRateDecimal)
    );
    const leatherQty = Math.ceil(
      (crafting.Leather || 0) * amountNum * (1 - returnRateDecimal)
    );
    const metalBarQty = Math.ceil(
      (crafting.Metal_Bars || 0) * amountNum * (1 - returnRateDecimal)
    );
    const planksQty = Math.ceil(
      (crafting.Planks || 0) * amountNum * (1 - returnRateDecimal)
    );

    // Build resource keys with enchantment
    const enchSuffix =
      selectedEnchantment !== "0"
        ? `_LEVEL${selectedEnchantment}@${selectedEnchantment}`
        : "";
    const clothKey = `T${selectedTier}_CLOTH${enchSuffix}`;
    const leatherKey = `T${selectedTier}_LEATHER${enchSuffix}`;
    const metalBarKey = `T${selectedTier}_METALBAR${enchSuffix}`;
    const planksKey = `T${selectedTier}_PLANKS${enchSuffix}`;

    const clothCost = clothQty * (resourcePrices[clothKey] || 0);
    const leatherCost = leatherQty * (resourcePrices[leatherKey] || 0);
    const metalBarCost = metalBarQty * (resourcePrices[metalBarKey] || 0);
    const planksCost = planksQty * (resourcePrices[planksKey] || 0);
    const artifactCost = artifactPriceNum * amountNum;

    const cost =
      clothCost + leatherCost + metalBarCost + planksCost + artifactCost;

    console.log("Calculated costs:", {
      clothKey,
      leatherKey,
      metalBarKey,
      planksKey,
      clothCost,
      leatherCost,
      metalBarCost,
      planksCost,
      artifactCost,
      totalCost: cost,
    });

    // Calculate sell value after tax
    const totalSellValue = sellValueNum * amountNum;
    const tax = Math.ceil(totalSellValue * MARKET_TAX);
    const sellAfter = totalSellValue - tax;
    const profitCalc = sellAfter - cost;

    console.log("Final results:", {
      craftCost: cost,
      sellAfterTax: sellAfter,
      profit: profitCalc,
    });

    setCraftCost(cost);
    setSellAfterTax(sellAfter);
    setProfit(profitCalc);
    setShowResults(true);
  };

  if (!mounted) {
    return <div className="focus-crafting-page">Loading...</div>;
  }

  const profitPercentage = craftCost > 0 ? (profit / craftCost) * 100 : 0;

  return (
    <main className="page focus-crafting-page">
      <h1>Focus Crafting</h1>

      {/* Filters */}
      <div className="filters">
        <div className="filter-field">
          <label>Item</label>
          <select
            value={selectedItem}
            onChange={(e) => setSelectedItem(e.target.value)}
          >
            {ALL_ITEMS.map((item) => (
              <option key={item.UniqueName} value={item.UniqueName}>
                {(item as any).Name || item.UniqueName}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-field">
          <label>Amount</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min="1"
          />
        </div>

        <div className="filter-field">
          <label>Tier</label>
          <select
            value={selectedTier}
            onChange={(e) => setSelectedTier(e.target.value as TierOption)}
          >
            <option value="4">T4</option>
            <option value="5">T5</option>
            <option value="6">T6</option>
            <option value="7">T7</option>
            <option value="8">T8</option>
          </select>
        </div>

        <div className="filter-field">
          <label>Enchantment</label>
          <select
            value={selectedEnchantment}
            onChange={(e) =>
              setSelectedEnchantment(e.target.value as EnchantmentOption)
            }
          >
            <option value="0">.0</option>
            <option value="1">.1</option>
            <option value="2">.2</option>
            <option value="3">.3</option>
            <option value="4">.4</option>
          </select>
        </div>

        <ReturnRateInput
          returnRate={returnRate}
          setReturnRate={(value) => setReturnRate(value as ReturnRateOption)}
        />
      </div>

      {/* Price Inputs */}
      <div className="price-inputs" style={{ marginTop: "1rem" }}>
        <div className="filter-field">
          <label>Artifact Price</label>
          <input
            type="number"
            value={artifactPrice}
            onChange={(e) => setArtifactPrice(e.target.value)}
            placeholder="Auto-loaded"
          />
        </div>

        <div className="filter-field">
          <label>Sell Value (per item)</label>
          <input
            type="number"
            value={sellValue}
            onChange={(e) => setSellValue(e.target.value)}
            placeholder="Enter sell price"
          />
        </div>
      </div>

      {/* Calculate Button */}
      <div className="actions" style={{ marginTop: "1rem" }}>
        <button type="button" className="btn" onClick={handleCalculate}>
          Calculate
        </button>
      </div>

      {/* Results */}
      {showResults && (
        <div className="results" style={{ marginTop: "1.5rem" }}>
          <h3>Results</h3>

          {/* Resource Price Breakdown */}
          <div className="resource-breakdown">
            <h4>Resource Prices</h4>
            <div className="resource-breakdown-items">
              {(() => {
                const crafting = currentItem?.Crafting as any;
                const returnRateDecimal = parseFloat(returnRate) / 100;
                const amountNum = parseFloat(amount) || 1;

                const enchSuffix =
                  selectedEnchantment !== "0"
                    ? `_LEVEL${selectedEnchantment}@${selectedEnchantment}`
                    : "";

                const resources = [];

                if (crafting?.Cloth) {
                  const qty = Math.ceil(
                    (crafting.Cloth || 0) * amountNum * (1 - returnRateDecimal)
                  );
                  const key = `T${selectedTier}_CLOTH${enchSuffix}`;
                  const price = resourcePrices[key] || 0;
                  resources.push({
                    name: "Cloth",
                    qty,
                    price,
                    total: qty * price,
                  });
                }

                if (crafting?.Leather) {
                  const qty = Math.ceil(
                    (crafting.Leather || 0) *
                      amountNum *
                      (1 - returnRateDecimal)
                  );
                  const key = `T${selectedTier}_LEATHER${enchSuffix}`;
                  const price = resourcePrices[key] || 0;
                  resources.push({
                    name: "Leather",
                    qty,
                    price,
                    total: qty * price,
                  });
                }

                if (crafting?.Metal_Bars) {
                  const qty = Math.ceil(
                    (crafting.Metal_Bars || 0) *
                      amountNum *
                      (1 - returnRateDecimal)
                  );
                  const key = `T${selectedTier}_METALBAR${enchSuffix}`;
                  const price = resourcePrices[key] || 0;
                  resources.push({
                    name: "Metal Bar",
                    qty,
                    price,
                    total: qty * price,
                  });
                }

                if (crafting?.Planks) {
                  const qty = Math.ceil(
                    (crafting.Planks || 0) * amountNum * (1 - returnRateDecimal)
                  );
                  const key = `T${selectedTier}_PLANKS${enchSuffix}`;
                  const price = resourcePrices[key] || 0;
                  resources.push({
                    name: "Planks",
                    qty,
                    price,
                    total: qty * price,
                  });
                }

                if (crafting?.Artifact && artifactPrice) {
                  const qty = amountNum;
                  const price = parseFloat(artifactPrice) || 0;
                  resources.push({
                    name: "Artifact",
                    qty,
                    price,
                    total: qty * price,
                  });
                }

                return resources.map((res, idx) => (
                  <div key={idx} className="resource-item">
                    <div>
                      <span className="resource-item-name">{res.name}</span>
                      <span className="resource-item-details">
                        {" "}
                        ({res.qty}x @ {formatSilver(res.price)})
                      </span>
                    </div>
                    <span className="resource-item-total">
                      {formatSilver(res.total)}
                    </span>
                  </div>
                ));
              })()}
            </div>
          </div>

          <p>
            <strong>Craft Cost ({amount}x):</strong>{" "}
            <span style={{ fontWeight: "600" }}>{formatSilver(craftCost)}</span>
          </p>
          <p>
            <strong>Sell Value After Tax:</strong>{" "}
            <span style={{ fontWeight: "600" }}>
              {formatSilver(sellAfterTax)}
            </span>
          </p>
          <p>
            <strong>Profit:</strong>{" "}
            <span style={{ color: getProfitColor(profit), fontWeight: "600" }}>
              {formatSilver(profit)} ({formatPercentage(profitPercentage)})
            </span>
          </p>
        </div>
      )}
    </main>
  );
}
