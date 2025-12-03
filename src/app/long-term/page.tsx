"use client";

import { useState, useEffect } from "react";
import "./long-term.css";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import type { Tier, ItemData, PriceData, Enchantment } from "@/types";
import allItemsData from "@/albion-ids/all-items.json";
import type { AllItemsStructure } from "@/lib/itemsLoader";
import { useResourcePrices } from "@/hooks/useResourcePrices";
import { getResourcePrice } from "@/lib/supabase";
import LongTermItemCard from "@/components/LongTermItemCard/LongTermItemCard";
import ReturnRateInput from "@/components/ReturnRateInput/ReturnRateInput";
import {
  getItemPriceWithCache,
  getArtefactMedianPriceWithCache,
} from "@/services/priceService";
import { TIER_4, TIER_5, TIER_6, TIER_7, TIER_8 } from "@/lib/constants";

const typedAllItems = allItemsData as AllItemsStructure;

// Get all subcategories from the JSON structure
const getAllSubcategories = (): { label: string; key: string }[] => {
  const categories: { label: string; key: string }[] = [];

  // Add weapon types
  Object.keys(typedAllItems.Weapons).forEach((weaponType) => {
    categories.push({
      label: `Weapon: ${weaponType}`,
      key: `Weapons.${weaponType}`,
    });
  });

  // Add armor types
  Object.keys(typedAllItems["Head Armor"]).forEach((armorType) => {
    categories.push({
      label: `Head: ${armorType}`,
      key: `Head Armor.${armorType}`,
    });
  });
  Object.keys(typedAllItems["Chest Armor"]).forEach((armorType) => {
    categories.push({
      label: `Chest: ${armorType}`,
      key: `Chest Armor.${armorType}`,
    });
  });
  Object.keys(typedAllItems["Foot Armor"]).forEach((armorType) => {
    categories.push({
      label: `Foot: ${armorType}`,
      key: `Foot Armor.${armorType}`,
    });
  });

  // Add off-hands
  Object.keys(typedAllItems["Off-Hands"]).forEach((offhandType) => {
    categories.push({
      label: `Off-Hand: ${offhandType}`,
      key: `Off-Hands.${offhandType}`,
    });
  });

  return categories;
};

// Get items for a category key
const getItemsForCategory = (categoryKey: string): ItemData[] => {
  const [mainCategory, subCategory] = categoryKey.split(".");

  if (mainCategory === "Weapons") {
    return typedAllItems.Weapons[subCategory] || [];
  } else if (mainCategory === "Head Armor") {
    return typedAllItems["Head Armor"][subCategory] || [];
  } else if (mainCategory === "Chest Armor") {
    return typedAllItems["Chest Armor"][subCategory] || [];
  } else if (mainCategory === "Foot Armor") {
    return typedAllItems["Foot Armor"][subCategory] || [];
  } else if (mainCategory === "Off-Hands") {
    return typedAllItems["Off-Hands"][subCategory] || [];
  }

  return [];
};

// Get item count for category
const getItemCountForCategory = (categoryKey: string): number => {
  const [mainCategory] = categoryKey.split(".");

  if (mainCategory === "Weapons") return 1;
  if (mainCategory === "Head Armor") return 1;
  if (mainCategory === "Chest Armor") return 1;
  if (mainCategory === "Foot Armor") return 1;
  if (mainCategory === "Off-Hands") return 1;

  return 1;
};

export default function LongTermPage() {
  const [mounted, setMounted] = useState(false);
  const subcategories = getAllSubcategories();

  const [selectedCategory, setSelectedCategory] = useLocalStorage<string>(
    "longterm_category",
    subcategories[0]?.key || "Weapons.Sword"
  );
  const [selectedTier, setSelectedTier] = useLocalStorage<string>(
    "longterm_tier",
    TIER_5
  );
  const [selectedEnchantment, setSelectedEnchantment] = useLocalStorage<string>(
    "longterm_enchantment",
    "1"
  );
  const [days, setDays] = useLocalStorage<string>("longterm_days", "30");
  const [premiumCost, setPremiumCost] = useLocalStorage<string>(
    "longterm_premium_cost",
    "30000000"
  );
  const [returnRate, setReturnRate] = useLocalStorage<string>(
    "longterm_return_rate",
    "47.92"
  );

  const [prices, setPrices] = useState<Record<string, PriceData>>({});
  const [artifactPrices, setArtifactPrices] = useState<Record<string, number>>(
    {}
  );
  const [editableArtifactPrices, setEditableArtifactPrices] = useState<
    Record<string, number>
  >({});
  const [editableSellPrices, setEditableSellPrices] = useState<
    Record<string, number>
  >({});
  const [amountsPerDay, setAmountsPerDay] = useState<Record<string, number>>(
    {}
  );
  const [loading, setLoading] = useState(false);
  const [totalProfitPerDay, setTotalProfitPerDay] = useState<number>(0);
  const [totalProfitForDays, setTotalProfitForDays] = useState<number>(0);
  const [totalInvestmentPerDay, setTotalInvestmentPerDay] = useState<number>(0);
  const [totalInvestmentForDays, setTotalInvestmentForDays] =
    useState<number>(0);

  const { prices: resourcePrices, loading: resourceLoading } =
    useResourcePrices();

  // Resource price inputs (loaded from database based on tier/enchantment)
  const [clothPrice, setClothPrice] = useState<string>("");
  const [leatherPrice, setLeatherPrice] = useState<string>("");
  const [metalBarPrice, setMetalBarPrice] = useState<string>("");
  const [planksPrice, setPlanksPrice] = useState<string>("");

  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-fetch resource prices when tier or enchantment changes
  useEffect(() => {
    async function fetchResourcePrices() {
      const tier = selectedTier as Tier;
      const enchantment = selectedEnchantment as Enchantment;

      const [cloth, leather, metalBar, planks] = await Promise.all([
        getResourcePrice("cloth", tier, enchantment),
        getResourcePrice("leather", tier, enchantment),
        getResourcePrice("metalBar", tier, enchantment),
        getResourcePrice("planks", tier, enchantment),
      ]);

      if (cloth !== null) setClothPrice(cloth.toString());
      if (leather !== null) setLeatherPrice(leather.toString());
      if (metalBar !== null) setMetalBarPrice(metalBar.toString());
      if (planks !== null) setPlanksPrice(planks.toString());
    }

    if (mounted) {
      fetchResourcePrices();
    }
  }, [selectedTier, selectedEnchantment, mounted]);

  // Auto-fetch artifact prices when tier or category changes
  useEffect(() => {
    async function fetchArtifactPrices() {
      const items = getItemsForCategory(selectedCategory);
      const artifactMap: Record<string, number> = {};

      for (const item of items) {
        if (item.Crafting.Artifact) {
          const artifactNameWithTier = `${selectedTier}_${item.Crafting.Artifact}`;
          const artifactPrice = await getArtefactMedianPriceWithCache(
            artifactNameWithTier,
            false
          );
          artifactMap[item.UniqueName] = artifactPrice;
        }
      }

      setArtifactPrices(artifactMap);
      setEditableArtifactPrices(artifactMap);
    }

    if (mounted) {
      fetchArtifactPrices();
    }
  }, [selectedTier, selectedCategory, mounted]);

  // Auto-fetch sell prices when tier, category, or enchantment changes
  useEffect(() => {
    async function fetchSellPrices() {
      const items = getItemsForCategory(selectedCategory);
      const sellPriceMap: Record<string, number> = {};
      const amountMap: Record<string, number> = {};

      for (const item of items) {
        try {
          const itemNameWithTierAndEnchantment = `${selectedTier}_${item.UniqueName}@${selectedEnchantment}`;
          const data = await getItemPriceWithCache(
            itemNameWithTierAndEnchantment,
            "Lymhurst",
            false
          );
          sellPriceMap[item.UniqueName] = data?.sell_price_min || 0;
          amountMap[item.UniqueName] = 1;
        } catch (error) {
          console.error(`Failed to fetch price for ${item.UniqueName}:`, error);
        }
      }

      setEditableSellPrices(sellPriceMap);
      setAmountsPerDay(amountMap);
    }

    if (mounted) {
      fetchSellPrices();
    }
  }, [selectedTier, selectedCategory, selectedEnchantment, mounted]);

  const handleCalculate = async () => {
    setLoading(true);

    const items = getItemsForCategory(selectedCategory);
    const priceMap: Record<string, PriceData> = {};
    const artifactMap: Record<string, number> = {};

    for (const item of items) {
      try {
        const itemNameWithTierAndEnchantment = `${selectedTier}_${item.UniqueName}@${selectedEnchantment}`;

        const data = await getItemPriceWithCache(
          itemNameWithTierAndEnchantment,
          "Lymhurst",
          false
        );

        if (data) {
          priceMap[itemNameWithTierAndEnchantment] = data;
        }

        if (item.Crafting.Artifact) {
          const artifactNameWithTier = `${selectedTier}_${item.Crafting.Artifact}`;
          const artifactPrice = await getArtefactMedianPriceWithCache(
            artifactNameWithTier,
            false
          );
          artifactMap[item.UniqueName] = artifactPrice;
        }
      } catch (error) {
        console.error(`Failed to fetch price for ${item.UniqueName}:`, error);
      }
    }

    setPrices(priceMap);
    setArtifactPrices(artifactMap);

    // Initialize editable prices only if not already set
    setEditableSellPrices((prev) => {
      const sellPriceMap: Record<string, number> = { ...prev };
      for (const item of items) {
        if (
          prev[item.UniqueName] === undefined ||
          prev[item.UniqueName] === 0
        ) {
          const itemNameWithTierAndEnchantment = `${selectedTier}_${item.UniqueName}@${selectedEnchantment}`;
          const priceData = priceMap[itemNameWithTierAndEnchantment];
          sellPriceMap[item.UniqueName] = priceData?.sell_price_min || 0;
        }
      }
      return sellPriceMap;
    });

    setEditableArtifactPrices((prev) => {
      const updatedMap: Record<string, number> = { ...prev };
      for (const item of items) {
        if (
          prev[item.UniqueName] === undefined ||
          prev[item.UniqueName] === 0
        ) {
          updatedMap[item.UniqueName] = artifactMap[item.UniqueName] || 0;
        }
      }
      return updatedMap;
    });

    // Calculate total profit per day and for X days
    let profitPerDay = 0;
    let investmentPerDay = 0;

    const rateValue = parseFloat(returnRate) || 0;
    const returnRateDecimal = rateValue / 100;

    for (const item of items) {
      const artifactPrice = editableArtifactPrices[item.UniqueName] || 0;
      const sellPrice = editableSellPrices[item.UniqueName] || 0;
      const amountPerDay = amountsPerDay[item.UniqueName] || 0;

      // Calculate craft cost for total amount with return rate applied to total
      const totalCloth = Math.ceil(
        item.Crafting.Cloth * amountPerDay * (1 - returnRateDecimal)
      );
      const totalLeather = Math.ceil(
        item.Crafting.Leather * amountPerDay * (1 - returnRateDecimal)
      );
      const totalMetalBar = Math.ceil(
        item.Crafting.Metal_Bars * amountPerDay * (1 - returnRateDecimal)
      );
      const totalPlanks = Math.ceil(
        item.Crafting.Planks * amountPerDay * (1 - returnRateDecimal)
      );

      const clothCost = totalCloth * (parseFloat(clothPrice) || 0);
      const leatherCost = totalLeather * (parseFloat(leatherPrice) || 0);
      const metalBarCost = totalMetalBar * (parseFloat(metalBarPrice) || 0);
      const planksCost = totalPlanks * (parseFloat(planksPrice) || 0);

      const totalCraftCost =
        clothCost +
        leatherCost +
        metalBarCost +
        planksCost +
        artifactPrice * amountPerDay;

      // Profit for total amount per day
      const totalSellValue = sellPrice * amountPerDay;
      const profitForThisItem = totalSellValue - totalCraftCost;
      profitPerDay += profitForThisItem;
      investmentPerDay += totalCraftCost;
    }

    const daysNum = parseFloat(days) || 0;
    const premiumCostNum = parseFloat(premiumCost) || 0;
    const profitForDays = profitPerDay * daysNum - premiumCostNum;
    const investmentForDays = investmentPerDay * daysNum + premiumCostNum;

    setTotalProfitPerDay(profitPerDay);
    setTotalProfitForDays(profitForDays);
    setTotalInvestmentPerDay(investmentPerDay);
    setTotalInvestmentForDays(investmentForDays);

    setLoading(false);
  };

  if (!mounted) {
    return (
      <main className="page long-term-page">
        <h1>Long Term</h1>
        <p className="muted">Loading...</p>
      </main>
    );
  }

  const currentItems = getItemsForCategory(selectedCategory);
  const itemCount = getItemCountForCategory(selectedCategory);

  return (
    <main className="page long-term-page">
      <h1>Long Term Analysis</h1>

      <div className="filters">
        <div className="filter-field">
          <label>Category</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            {subcategories.map((cat) => (
              <option key={cat.key} value={cat.key}>
                {cat.label}
              </option>
            ))}
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
            <option value="0">0</option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
          </select>
        </div>

        <div className="filter-field">
          <label>Days</label>
          <input
            type="text"
            inputMode="decimal"
            value={days}
            onChange={(e) => setDays(e.target.value)}
            placeholder="30"
          />
        </div>

        <div className="filter-field">
          <label>Premium Cost</label>
          <input
            type="text"
            inputMode="decimal"
            value={premiumCost}
            onChange={(e) => setPremiumCost(e.target.value)}
            placeholder="15000000"
          />
        </div>

        <ReturnRateInput
          returnRate={returnRate}
          setReturnRate={setReturnRate}
        />
      </div>

      <div className="resource-counts" style={{ marginTop: "1rem" }}>
        <p className="muted">Resource Prices</p>
        <div className="resource-grid">
          <label className="resource-field">
            <span>Cloth</span>
            <input inputMode="decimal" value={clothPrice} readOnly />
          </label>
          <label className="resource-field">
            <span>Leather</span>
            <input inputMode="decimal" value={leatherPrice} readOnly />
          </label>
          <label className="resource-field">
            <span>Metal Bar</span>
            <input inputMode="decimal" value={metalBarPrice} readOnly />
          </label>
          <label className="resource-field">
            <span>Planks</span>
            <input inputMode="decimal" value={planksPrice} readOnly />
          </label>
        </div>
      </div>

      <div className="actions">
        <button
          type="button"
          className="btn"
          onClick={handleCalculate}
          disabled={loading}
        >
          {loading ? "Loading..." : "Calculate"}
        </button>
      </div>

      {totalProfitPerDay !== 0 && (
        <div className="results" style={{ marginTop: "1rem" }}>
          <h3>Results</h3>
          <p>
            <strong>Investment per Day:</strong>{" "}
            <span style={{ color: "var(--cp-blue)", fontWeight: "600" }}>
              {totalInvestmentPerDay.toLocaleString("en-US", {
                maximumFractionDigits: 0,
              })}
            </span>
          </p>
          <p>
            <strong>Profit per Day:</strong>{" "}
            <span
              style={{
                color: totalProfitPerDay >= 0 ? "#a6e3a1" : "#f38ba8",
                fontWeight: "600",
              }}
            >
              {totalProfitPerDay.toLocaleString("en-US", {
                maximumFractionDigits: 0,
              })}
            </span>
            {totalInvestmentPerDay > 0 && (
              <span
                style={{
                  marginLeft: "0.5rem",
                  color:
                    (totalProfitPerDay / totalInvestmentPerDay) * 100 >= 0
                      ? "#a6e3a1"
                      : "#f38ba8",
                  fontSize: "0.9rem",
                  fontWeight: "600",
                }}
              >
                (
                {((totalProfitPerDay / totalInvestmentPerDay) * 100).toFixed(2)}
                %)
              </span>
            )}
          </p>
          <p>
            <strong>Total Investment for {days} Days:</strong>{" "}
            <span style={{ color: "var(--cp-blue)", fontWeight: "600" }}>
              {totalInvestmentForDays.toLocaleString("en-US", {
                maximumFractionDigits: 0,
              })}
            </span>{" "}
            <span style={{ color: "var(--cp-subtext0)", fontSize: "0.9rem" }}>
              (including premium cost)
            </span>
          </p>
          <p>
            <strong>Profit for {days} Days:</strong>{" "}
            <span
              style={{
                color: totalProfitForDays >= 0 ? "#a6e3a1" : "#f38ba8",
                fontWeight: "600",
              }}
            >
              {totalProfitForDays.toLocaleString("en-US", {
                maximumFractionDigits: 0,
              })}{" "}
            </span>
            {totalInvestmentForDays > 0 && (
              <span
                style={{
                  marginLeft: "0.5rem",
                  color:
                    (totalProfitForDays / totalInvestmentForDays) * 100 >= 0
                      ? "#a6e3a1"
                      : "#f38ba8",
                  fontSize: "0.9rem",
                  fontWeight: "600",
                }}
              >
                (
                {((totalProfitForDays / totalInvestmentForDays) * 100).toFixed(
                  2
                )}
                %)
              </span>
            )}
            <span style={{ color: "var(--cp-subtext0)", fontSize: "0.9rem" }}>
              {" "}
              (after premium cost)
            </span>
          </p>
        </div>
      )}

      <section className="long-term-items" style={{ marginTop: "2rem" }}>
        {currentItems.map((item) => {
          const itemNameWithTierAndEnchantment = `${selectedTier}_${item.UniqueName}@${selectedEnchantment}`;

          const artifactPrice = editableArtifactPrices[item.UniqueName] || 0;

          // Calculate crafting cost with return rate (same as Focus Craft)
          const rateValue = parseFloat(returnRate) || 0;
          const returnRateDecimal = rateValue / 100;

          const sellPrice = editableSellPrices[item.UniqueName] || 0;
          const amountPerDay = amountsPerDay[item.UniqueName] || 0;

          // Calculate total quantities with return rate applied and rounded up (with amount)
          const totalClothWithAmount = Math.ceil(
            item.Crafting.Cloth * amountPerDay * (1 - returnRateDecimal)
          );
          const totalLeatherWithAmount = Math.ceil(
            item.Crafting.Leather * amountPerDay * (1 - returnRateDecimal)
          );
          const totalMetalBarWithAmount = Math.ceil(
            item.Crafting.Metal_Bars * amountPerDay * (1 - returnRateDecimal)
          );
          const totalPlanksWithAmount = Math.ceil(
            item.Crafting.Planks * amountPerDay * (1 - returnRateDecimal)
          );

          // Calculate costs using fetched resource prices
          const clothCost =
            totalClothWithAmount * (parseFloat(clothPrice) || 0);
          const leatherCost =
            totalLeatherWithAmount * (parseFloat(leatherPrice) || 0);
          const metalBarCost =
            totalMetalBarWithAmount * (parseFloat(metalBarPrice) || 0);
          const planksCost =
            totalPlanksWithAmount * (parseFloat(planksPrice) || 0);

          const totalCraftCostWithAmount =
            clothCost +
            leatherCost +
            metalBarCost +
            planksCost +
            artifactPrice * amountPerDay;

          // Calculate profit for total amount
          const totalSellValue = sellPrice * amountPerDay;
          const profit = totalSellValue - totalCraftCostWithAmount;
          const profitPercentage =
            totalCraftCostWithAmount > 0
              ? (profit / totalCraftCostWithAmount) * 100
              : 0;

          return (
            <LongTermItemCard
              key={item.UniqueName}
              uniqueName={itemNameWithTierAndEnchantment}
              name={item.Name}
              artefactCost={artifactPrice}
              onArtefactCostChange={(value) =>
                setEditableArtifactPrices((prev) => ({
                  ...prev,
                  [item.UniqueName]: value,
                }))
              }
              craftCost={Math.round(totalCraftCostWithAmount)}
              sellPrice={sellPrice}
              onSellPriceChange={(value) =>
                setEditableSellPrices((prev) => ({
                  ...prev,
                  [item.UniqueName]: value,
                }))
              }
              amountPerDay={amountPerDay}
              onAmountPerDayChange={(value) =>
                setAmountsPerDay((prev) => ({
                  ...prev,
                  [item.UniqueName]: value,
                }))
              }
              profit={Math.round(profit)}
              profitPercentage={profitPercentage}
            />
          );
        })}
      </section>
    </main>
  );
}
