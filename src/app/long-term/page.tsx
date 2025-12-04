/**
 * Long-Term Profitability Analysis Page (Refactored)
 * Uses centralized utilities and hooks for cleaner code
 */

"use client";

import { useState, useEffect } from "react";
import "./long-term.css";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import type {
  TierOption,
  EnchantmentOption,
  ReturnRateOption,
  ResourcePriceMap,
} from "@/types/shared";
import {
  getItemsByCategoryKey,
  getAllCategoryOptions,
} from "@/lib/itemsLoader";
import {
  useEditablePrices,
  useAutoLoadAllPrices,
} from "@/lib/hooks/usePriceManagement";
import {
  calculateCraftCostWithReturnRate,
  calculateTotalProfits,
  formatSilver,
  formatPercentage,
  getProfitColor,
  getInvestmentColor,
} from "@/lib/calculations";
import LongTermItemCard from "@/components/LongTermItemCard/LongTermItemCard";
import ReturnRateInput from "@/components/ReturnRateInput/ReturnRateInput";

export default function LongTermPage() {
  const [mounted, setMounted] = useState(false);
  const categoryOptions = getAllCategoryOptions();

  // Filter states
  const [selectedCategory, setSelectedCategory] = useLocalStorage<string>(
    "longterm_category",
    categoryOptions[0]?.key || "Weapons.Sword"
  );
  const [selectedTier, setSelectedTier] = useLocalStorage<TierOption>(
    "longterm_tier",
    "5"
  );
  const [selectedEnchantment, setSelectedEnchantment] =
    useLocalStorage<EnchantmentOption>("longterm_enchantment", "1");
  const [days, setDays] = useLocalStorage<string>("longterm_days", "30");
  const [premiumCost, setPremiumCost] = useLocalStorage<string>(
    "longterm_premium_cost",
    "30000000"
  );
  const [returnRate, setReturnRate] = useLocalStorage<ReturnRateOption>(
    "longterm_return_rate",
    "47.92"
  );

  // Result states
  const [totalProfitPerDay, setTotalProfitPerDay] = useState<number>(0);
  const [totalProfitForDays, setTotalProfitForDays] = useState<number>(0);
  const [totalInvestmentPerDay, setTotalInvestmentPerDay] = useState<number>(0);
  const [totalInvestmentForDays, setTotalInvestmentForDays] =
    useState<number>(0);

  // Get items for selected category
  const items = mounted ? getItemsByCategoryKey(selectedCategory) : [];

  // Editable prices hook
  const editablePrices = useEditablePrices();

  // Auto-load all prices
  const { resourcePrices } = useAutoLoadAllPrices(
    items as any,
    selectedTier,
    selectedEnchantment,
    editablePrices,
    "Lymhurst"
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-calculate when return rate, amounts, artifact prices, or sell prices change
  useEffect(() => {
    if (mounted && items.length > 0) {
      handleCalculate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    returnRate,
    JSON.stringify(editablePrices.amountsPerDay),
    JSON.stringify(editablePrices.artifactPrices),
    JSON.stringify(editablePrices.sellPrices),
    days,
    premiumCost,
    items.length,
  ]);

  // Calculate results
  const handleCalculate = () => {
    if (!items || items.length === 0) return;

    const daysNum = parseInt(days) || 1;
    const premiumNum = parseInt(premiumCost) || 0;

    const itemsWithCalculations = items.map((item) => {
      const amountPerDay = editablePrices.amountsPerDay[item.UniqueName] ?? 1;
      const artifactPrice = editablePrices.artifactPrices[item.UniqueName] || 0;
      const sellPrice = editablePrices.sellPrices[item.UniqueName] || 0;

      // Calculate craft cost with return rate
      const craftCost = calculateCraftCostWithReturnRate(
        item,
        resourcePrices,
        artifactPrice,
        amountPerDay,
        returnRate
      );

      return {
        craftCost,
        sellPrice: sellPrice * amountPerDay,
        amountPerDay,
      };
    });

    // Calculate totals
    const totals = calculateTotalProfits(
      itemsWithCalculations,
      daysNum,
      premiumNum
    );

    setTotalInvestmentPerDay(totals.totalInvestmentPerDay);
    setTotalProfitPerDay(totals.totalProfitPerDay);
    setTotalInvestmentForDays(totals.totalInvestmentForDays);
    setTotalProfitForDays(totals.totalProfitForDays);
  };

  if (!mounted) {
    return <div className="long-term-page">Loading...</div>;
  }

  return (
    <div className="long-term-page">
      <h1>Long-Term Profitability Analysis</h1>

      {/* Filters */}
      <div className="filters">
        {/* Category */}
        <div className="filter-group">
          <label htmlFor="category-select">Category:</label>
          <select
            id="category-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            {categoryOptions.map((opt) => (
              <option key={opt.key} value={opt.key}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Tier */}
        <div className="filter-group">
          <label htmlFor="tier-select">Tier:</label>
          <select
            id="tier-select"
            value={selectedTier}
            onChange={(e) => setSelectedTier(e.target.value as TierOption)}
          >
            <option value="4">Tier 4</option>
            <option value="5">Tier 5</option>
            <option value="6">Tier 6</option>
            <option value="7">Tier 7</option>
            <option value="8">Tier 8</option>
          </select>
        </div>

        {/* Enchantment */}
        <div className="filter-group">
          <label htmlFor="enchantment-select">Enchantment:</label>
          <select
            id="enchantment-select"
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

        {/* Days */}
        <div className="filter-group">
          <label htmlFor="days-input">Days:</label>
          <input
            id="days-input"
            type="number"
            value={days}
            onChange={(e) => setDays(e.target.value)}
            min="1"
          />
        </div>

        {/* Premium Cost */}
        <div className="filter-group">
          <label htmlFor="premium-cost-input">Premium Cost:</label>
          <input
            id="premium-cost-input"
            type="number"
            value={premiumCost}
            onChange={(e) => setPremiumCost(e.target.value)}
          />
        </div>

        {/* Return Rate */}
        <ReturnRateInput
          returnRate={returnRate}
          setReturnRate={(value) => setReturnRate(value as ReturnRateOption)}
        />
      </div>

      {/* Results Summary */}
      <div className="results-summary">
        <div className="result-item">
          <span className="result-label">Daily Investment:</span>
          <span
            className="result-value"
            style={{ color: getInvestmentColor() }}
          >
            {formatSilver(totalInvestmentPerDay)}
          </span>
        </div>
        <div className="result-item">
          <span className="result-label">Daily Profit:</span>
          <span
            className="result-value"
            style={{ color: getProfitColor(totalProfitPerDay) }}
          >
            {formatSilver(totalProfitPerDay)} (
            {formatPercentage(
              totalInvestmentPerDay > 0
                ? (totalProfitPerDay / totalInvestmentPerDay) * 100
                : 0
            )}
            )
          </span>
        </div>
        <div className="result-item">
          <span className="result-label">Total Investment ({days} days):</span>
          <span
            className="result-value"
            style={{ color: getInvestmentColor() }}
          >
            {formatSilver(totalInvestmentForDays)}
          </span>
        </div>
        <div className="result-item">
          <span className="result-label">Total Profit ({days} days):</span>
          <span
            className="result-value"
            style={{ color: getProfitColor(totalProfitForDays) }}
          >
            {formatSilver(totalProfitForDays)} (
            {formatPercentage(
              totalInvestmentForDays > 0
                ? (totalProfitForDays / totalInvestmentForDays) * 100
                : 0
            )}
            )
          </span>
        </div>
      </div>

      {/* Item Cards */}
      <div className="long-term-items">
        {items.map((item) => {
          const amountPerDay =
            editablePrices.amountsPerDay[item.UniqueName] ?? 1;
          const artifactPrice =
            editablePrices.artifactPrices[item.UniqueName] || 0;
          const sellPrice = editablePrices.sellPrices[item.UniqueName] || 0;

          const craftCost = calculateCraftCostWithReturnRate(
            item,
            resourcePrices,
            artifactPrice,
            amountPerDay,
            returnRate
          );

          const totalSellPrice = sellPrice * amountPerDay;
          const profit = totalSellPrice - craftCost;
          const profitPercentage =
            craftCost > 0 ? (profit / craftCost) * 100 : 0;

          // Build unique name with tier and enchantment for image
          const tierNumber = selectedTier.toString().replace(/^T/, "");
          const uniqueNameWithTier = `T${tierNumber}_${item.UniqueName}${selectedEnchantment !== "0" ? `@${selectedEnchantment}` : ""}`;

          return (
            <LongTermItemCard
              key={item.UniqueName}
              uniqueName={uniqueNameWithTier}
              name={(item as any).Name || item.UniqueName}
              artefactCost={artifactPrice}
              craftCost={craftCost}
              sellPrice={sellPrice}
              amountPerDay={amountPerDay}
              profit={profit}
              profitPercentage={profitPercentage}
              onArtefactCostChange={(value) =>
                editablePrices.setArtifactPrice(item.UniqueName, value)
              }
              onSellPriceChange={(value) =>
                editablePrices.setSellPrice(item.UniqueName, value)
              }
              onAmountPerDayChange={(value) =>
                editablePrices.setAmountPerDay(item.UniqueName, value)
              }
            />
          );
        })}
      </div>
    </div>
  );
}
