"use client";

import { useEffect, useState } from "react";
import "./cape-crafting.css";
import CapeCard from "../../components/CapeCard/CapeCard";
import { supabase } from "@/lib/supabase";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import ReturnRateInput from "@/components/ReturnRateInput/ReturnRateInput";
import { TIER_4, TIER_5, TIER_6, TIER_7, TIER_8 } from "@/lib/constants";
import type { CityOption, TierOption, ReturnRateOption } from "@/types/shared";
import { fetchItemSellPrices, fetchArtifactPrices } from "@/lib/priceLoader";
import allItemsData from "@/albion-ids/all-items.json";
import { RETURN_RATES } from "@/types/shared";

const CAPE_DATA = allItemsData.Capes.Cape;

const CITIES: CityOption[] = [
  "Bridgewatch",
  "Fort Sterling",
  "Lymhurst",
  "Martlock",
  "Thetford",
];

export default function CapeCraftingPage() {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reloadTrigger, setReloadTrigger] = useState(0);
  const [activeTab, setActiveTab] = useState<"setup" | "results">("setup");
  const [sellPrices, setSellPrices] = useState<Record<string, number>>({});
  const [crestPrices, setCrestPrices] = useState<Record<string, number>>({});
  const [heartPrices, setHeartPrices] = useState<Record<string, number>>({});
  const [capeAmounts, setCapeAmounts] = useState<Record<string, number>>({});
  const [resourcePrices, setResourcePrices] = useState<Record<string, number>>(
    {},
  );

  const [selectedTier, setSelectedTier] = useLocalStorage<string>(
    "cape_tier",
    TIER_5,
  );
  const [selectedEnchantment, setSelectedEnchantment] = useLocalStorage<string>(
    "cape_enchantment",
    "0",
  );
  const [amount, setAmount] = useLocalStorage<number>("cape_amount", 1);
  const [returnRate, setReturnRate] = useLocalStorage<ReturnRateOption>(
    "cape_return_rate",
    "47.92",
  );

  useEffect(() => {
    setMounted(true);

    // Initialize cape amounts from localStorage or default to 0
    const savedAmounts: Record<string, number> = {};
    CAPE_DATA.slice(1).forEach((cape) => {
      const saved = localStorage.getItem(`cape_amount_${cape.UniqueName}`);
      savedAmounts[cape.UniqueName] = saved ? parseInt(saved) : 0;
    });
    setCapeAmounts(savedAmounts);
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
          console.log("Loaded resource prices:", priceMap);
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

      try {
        // Build unique names for all capes with enchantment
        const uniqueNames = CAPE_DATA.map((cape) => {
          return selectedEnchantment !== "0"
            ? `${selectedTier}_${cape.UniqueName}@${selectedEnchantment}`
            : `${selectedTier}_${cape.UniqueName}`;
        });

        // Collect crest IDs (artifacts) from capes that have them
        const crestIds = CAPE_DATA.filter(
          (cape) => (cape.Crafting as any)?.Crest,
        ).map((cape) => (cape.Crafting as any).Crest);

        // Collect heart IDs from capes that have them
        const heartIds = CAPE_DATA.filter(
          (cape) =>
            (cape.Crafting as any)?.Heart &&
            (cape.Crafting as any).Heart !== "",
        ).map((cape) => (cape.Crafting as any).Heart);

        // Collect Avalonian Energy IDs
        const avalonianEnergyIds = CAPE_DATA.filter(
          (cape) =>
            (cape.Crafting as any)?.AvalonianEnergy &&
            (cape.Crafting as any).AvalonianEnergy !== "",
        ).map((cape) => (cape.Crafting as any).AvalonianEnergy);

        // Build crest item IDs with tier
        const tierNumber = selectedTier.replace("T", "") as TierOption;
        const crestItemIds = crestIds.map((crestId) => {
          const cleanId = crestId.replace(/^T\d+_/, "");
          return `${selectedTier}_${cleanId}`;
        });

        // Build heart item IDs with tier (Heart IDs already have T1_ prefix)
        const heartItemIds = heartIds.map((heartId) => heartId);

        // Build Avalonian Energy item IDs with tier
        const avalonianEnergyItemIds = avalonianEnergyIds.map((energyId) => {
          // Avalonian Energy uses tier-based IDs
          const cleanId = energyId.replace(/^T\d+_/, "");
          return `${selectedTier}_${cleanId}`;
        });

        // Combine all artifact IDs for database query
        const allArtifactIds = [
          ...crestItemIds,
          ...heartItemIds,
          ...avalonianEnergyItemIds,
        ];

        // Fetch manually saved prices from database (artifacts and sell prices)
        const allItemIds = [...uniqueNames, ...allArtifactIds];
        const [sellPriceMap, dbPrices] = await Promise.all([
          fetchItemSellPrices(uniqueNames, "Lymhurst"),
          supabase
            .from("item_price_cache")
            .select("item_id, location, sell_price_min")
            .in("item_id", allItemIds),
        ]);

        // Map crest prices by UniqueName
        const crestsByUniqueName: Record<string, number> = {};
        const heartsByUniqueName: Record<string, number> = {};
        const manualSellPrices: Record<string, number> = {};

        // Extract manual sell prices from database
        dbPrices.data?.forEach((row) => {
          if (
            row.location === "Lymhurst" &&
            uniqueNames.includes(row.item_id)
          ) {
            manualSellPrices[row.item_id] = row.sell_price_min;
          }
        });

        CAPE_DATA.forEach((cape) => {
          const crest = (cape.Crafting as any)?.Crest;
          if (crest) {
            const crestKey = /^T\d+_/.test(crest)
              ? crest
              : `${selectedTier}_${crest}`;

            // Find price from database
            const dbPrice = dbPrices.data?.find(
              (row) => row.item_id === crestKey && row.location === "Manual",
            );
            crestsByUniqueName[cape.UniqueName] = dbPrice?.sell_price_min || 0;
          }

          // Handle hearts (faction capes)
          const heart = (cape.Crafting as any)?.Heart;
          if (heart && heart !== "") {
            // Heart IDs are used as-is (they already have T1_ prefix)
            const heartKey = heart;

            // Find price from database
            const dbPrice = dbPrices.data?.find(
              (row) => row.item_id === heartKey && row.location === "Manual",
            );
            // Store using the actual heart ID as key
            heartsByUniqueName[heartKey] = dbPrice?.sell_price_min || 0;
          }

          // Handle Avalonian Energy (Avalonian Cape)
          const avalonianEnergy = (cape.Crafting as any)?.AvalonianEnergy;
          if (avalonianEnergy && avalonianEnergy !== "") {
            // Avalonian Energy uses tier-based IDs
            const energyKey = /^T\d+_/.test(avalonianEnergy)
              ? avalonianEnergy
              : `${selectedTier}_${avalonianEnergy}`;

            // Find price from database
            const dbPrice = dbPrices.data?.find(
              (row) => row.item_id === energyKey && row.location === "Manual",
            );
            // Store using the actual energy ID as key
            heartsByUniqueName[energyKey] = dbPrice?.sell_price_min || 0;
          }
        });

        // Merge API prices with manual prices (manual prices override API)
        const finalSellPrices = { ...sellPriceMap, ...manualSellPrices };

        setSellPrices(finalSellPrices);
        setCrestPrices(crestsByUniqueName);
        setHeartPrices(heartsByUniqueName);
      } catch (error) {
        console.error("Failed to load prices:", error);
      } finally {
        setLoading(false);
      }
    };

    loadPrices();
  }, [selectedTier, selectedEnchantment, mounted, reloadTrigger]);

  if (!mounted) {
    return <div className="cape-crafting-page">Loading...</div>;
  }

  const baseCape = CAPE_DATA[0]; // First cape is the base cape
  const factionCapes = CAPE_DATA.slice(1); // All other capes

  const handleReload = () => {
    setReloadTrigger((prev) => prev + 1);
  };

  // Handle crest price change and save to database
  const handleCrestPriceChange = async (crestId: string, price: number) => {
    // Update local state immediately
    setCrestPrices((prev) => {
      const updated = { ...prev };
      // Find the cape with this crest
      const cape = factionCapes.find((c) => {
        const crest = (c.Crafting as any)?.Crest;
        const crestKey = /^T\d+_/.test(crest)
          ? crest
          : `${selectedTier}_${crest}`;
        return crestKey === crestId;
      });
      if (cape) {
        updated[cape.UniqueName] = price;
      }
      return updated;
    });

    // Save to database
    try {
      await supabase.from("item_price_cache").upsert(
        {
          item_id: crestId,
          location: "Manual",
          quality: 1,
          sell_price_min: price,
          sell_price_max: price,
          buy_price_min: 0,
          buy_price_max: 0,
          sell_price_min_date: new Date().toISOString(),
          sell_price_max_date: new Date().toISOString(),
          buy_price_min_date: new Date().toISOString(),
          buy_price_max_date: new Date().toISOString(),
          cached_at: new Date().toISOString(),
        },
        { onConflict: "item_id,location" },
      );
    } catch (error) {
      console.error("Failed to save crest price:", error);
    }
  };

  // Handle sell price change and save to database
  const handleSellPriceChange = async (uniqueName: string, price: number) => {
    // Update local state immediately
    setSellPrices((prev) => ({
      ...prev,
      [uniqueName]: price,
    }));

    // Save to database
    try {
      await supabase.from("item_price_cache").upsert(
        {
          item_id: uniqueName,
          location: "Lymhurst",
          quality: 1,
          sell_price_min: price,
          sell_price_max: price,
          buy_price_min: 0,
          buy_price_max: 0,
          sell_price_min_date: new Date().toISOString(),
          sell_price_max_date: new Date().toISOString(),
          buy_price_min_date: new Date().toISOString(),
          buy_price_max_date: new Date().toISOString(),
          cached_at: new Date().toISOString(),
        },
        { onConflict: "item_id,location" },
      );
    } catch (error) {
      console.error("Failed to save sell price:", error);
    }
  };

  // Handle heart price change and save to database
  const handleHeartPriceChange = async (heartId: string, price: number) => {
    // Update local state immediately using the actual heart/energy ID
    setHeartPrices((prev) => ({
      ...prev,
      [heartId]: price,
    }));

    // Save to database
    try {
      await supabase.from("item_price_cache").upsert(
        {
          item_id: heartId,
          location: "Manual",
          quality: 1,
          sell_price_min: price,
          sell_price_max: price,
          buy_price_min: 0,
          buy_price_max: 0,
          sell_price_min_date: new Date().toISOString(),
          sell_price_max_date: new Date().toISOString(),
          buy_price_min_date: new Date().toISOString(),
          buy_price_max_date: new Date().toISOString(),
          cached_at: new Date().toISOString(),
        },
        { onConflict: "item_id,location" },
      );
    } catch (error) {
      console.error("Failed to save heart price:", error);
    }
  };

  // Handle cape amount change
  const handleCapeAmountChange = (itemName: string, newAmount: number) => {
    // Extract the base UniqueName from itemName (remove tier and enchantment)
    const baseUniqueName = itemName.split("_").slice(1).join("_").split("@")[0];
    console.log("Saving amount:", { itemName, baseUniqueName, newAmount });
    setCapeAmounts((prev) => ({
      ...prev,
      [baseUniqueName]: newAmount,
    }));
    localStorage.setItem(`cape_amount_${baseUniqueName}`, newAmount.toString());
  };

  // Calculate base cape cost with return rate (using Focus Crafting method)
  const calculateBaseCapeCoast = () => {
    const crafting = baseCape.Crafting as any;
    const returnRateDecimal = parseFloat(returnRate) / 100;

    // Build resource keys with enchantment suffix
    const enchSuffix =
      selectedEnchantment !== "0"
        ? `_LEVEL${selectedEnchantment}@${selectedEnchantment}`
        : "";
    const clothKey = `${selectedTier}_CLOTH${enchSuffix}`;
    const leatherKey = `${selectedTier}_LEATHER${enchSuffix}`;

    // Calculate quantities with Math.ceil (like Focus Crafting)
    const clothQty = Math.ceil(
      (crafting.Cloth || 0) * amount * (1 - returnRateDecimal),
    );
    const leatherQty = Math.ceil(
      (crafting.Leather || 0) * amount * (1 - returnRateDecimal),
    );

    // Get prices
    const clothPrice = resourcePrices[clothKey] || 0;
    const leatherPrice = resourcePrices[leatherKey] || 0;

    // Calculate costs
    const clothCost = clothQty * clothPrice;
    const leatherCost = leatherQty * leatherPrice;
    const totalCost = Math.round(clothCost + leatherCost);

    console.log("Base Cape Calculation:", {
      tier: selectedTier,
      enchantment: selectedEnchantment,
      amount,
      returnRate,
      returnRateDecimal,
      clothKey,
      leatherKey,
      clothQty,
      clothPrice,
      leatherQty,
      leatherPrice,
      clothCost,
      leatherCost,
      totalCost,
    });

    return totalCost;
  };

  // Calculate faction cape cost
  const calculateFactionCapeCost = (
    cape: (typeof CAPE_DATA)[0],
    capeAmount: number,
  ) => {
    // Use base cape cost from total cost WITH return rate (cost per cape when crafted)
    const baseCapeeCraftCost = Math.round(calculateBaseCapeCoast() / amount); // Divide by amount to get single cape cost
    const crestPrice = crestPrices[cape.UniqueName] || 0;

    // Determine heart/energy ID and get price
    const heart = (cape.Crafting as any)?.Heart;
    const avalonianEnergy = (cape.Crafting as any)?.AvalonianEnergy;
    let heartId: string | undefined;

    if (heart && heart !== "") {
      heartId = heart;
    } else if (avalonianEnergy && avalonianEnergy !== "") {
      heartId = /^T\d+_/.test(avalonianEnergy)
        ? avalonianEnergy
        : `${selectedTier}_${avalonianEnergy}`;
    }

    const heartPrice = heartId ? heartPrices[heartId] || 0 : 0;

    // Determine quantity based on resource type
    let heartQuantity = 1;

    if (avalonianEnergy && avalonianEnergy !== "") {
      // Avalonian Energy quantities
      const avalonianEnergyQuantityMap: Record<string, number> = {
        T4: 15,
        T5: 15,
        T6: 45,
        T7: 75,
        T8: 150,
      };
      heartQuantity = avalonianEnergyQuantityMap[selectedTier] || 15;
    } else {
      // Regular heart quantities
      const heartQuantityMap: Record<string, number> = {
        T4: 1,
        T5: 1,
        T6: 3,
        T7: 5,
        T8: 10,
      };
      heartQuantity = heartQuantityMap[selectedTier] || 1;
    }

    const totalHeartCost = heartPrice * heartQuantity;

    return Math.round(
      (baseCapeeCraftCost + crestPrice + totalHeartCost) * capeAmount,
    );
  };

  return (
    <main className="page cape-crafting-page">
      <h1>Cape Crafting</h1>

      {loading && <p className="muted">Loading prices...</p>}

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button
          className={`tab-button ${activeTab === "setup" ? "active" : ""}`}
          onClick={() => setActiveTab("setup")}
        >
          Setup
        </button>
        <button
          className={`tab-button ${activeTab === "results" ? "active" : ""}`}
          onClick={() => setActiveTab("results")}
        >
          Results
        </button>
      </div>

      {/* Setup Tab */}
      {activeTab === "setup" && (
        <>
          <div className="filters">
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
                <option value="0">.0</option>
                <option value="1">.1</option>
                <option value="2">.2</option>
                <option value="3">.3</option>
              </select>
            </div>

            <div className="filter-field">
              <label>Amount</label>
              <input
                type="number"
                min="0"
                step="1"
                value={amount}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setAmount(isNaN(val) ? 0 : val);
                }}
              />
            </div>

            <ReturnRateInput
              returnRate={returnRate}
              setReturnRate={(value) =>
                setReturnRate(value as ReturnRateOption)
              }
            />

            <div className="filter-field">
              <label>&nbsp;</label>
              <button className="btn" onClick={handleReload} disabled={loading}>
                {loading ? "Loading..." : "Reload Prices"}
              </button>
            </div>
          </div>

          {/* Faction Capes Section */}
          <section className="cape-section">
            <h2>Faction Capes</h2>
            <div className="example-cards">
              {factionCapes.map((cape) => {
                const capeAmount = capeAmounts[cape.UniqueName] ?? 0;
                const itemName =
                  selectedEnchantment !== "0"
                    ? `${selectedTier}_${cape.UniqueName}@${selectedEnchantment}`
                    : `${selectedTier}_${cape.UniqueName}`;
                const crestPrice = crestPrices[cape.UniqueName] || 0;
                const baseCapeeCraftCost = Math.round(
                  calculateBaseCapeCoast() / amount,
                ); // Single cape craft cost from total (with return rate)
                const craftCost = calculateFactionCapeCost(cape, capeAmount);
                const sellPrice = sellPrices[itemName] || 0;

                // Get crest ID
                const crest = (cape.Crafting as any)?.Crest;
                const crestId = /^T\d+_/.test(crest)
                  ? crest
                  : `${selectedTier}_${crest}`;

                // Get heart ID or Avalonian Energy ID
                const heart = (cape.Crafting as any)?.Heart;
                const avalonianEnergy = (cape.Crafting as any)?.AvalonianEnergy;

                let heartId: string | undefined;
                let heartLabel = "Heart";

                if (heart && heart !== "") {
                  heartId = heart;
                  heartLabel = "Heart";
                } else if (avalonianEnergy && avalonianEnergy !== "") {
                  // Avalonian Energy uses tier-based IDs
                  heartId = /^T\d+_/.test(avalonianEnergy)
                    ? avalonianEnergy
                    : `${selectedTier}_${avalonianEnergy}`;
                  heartLabel = "Avalonian Energy";
                }

                // Get heart/energy price using the actual ID
                const heartPrice = heartId ? heartPrices[heartId] || 0 : 0;

                // Heart/Energy quantity depends on tier
                let heartQuantity = 1;
                if (avalonianEnergy && avalonianEnergy !== "") {
                  // Avalonian Energy has different quantities
                  const avalonianEnergyQuantityMap: Record<string, number> = {
                    T4: 15,
                    T5: 15,
                    T6: 45,
                    T7: 75,
                    T8: 150,
                  };
                  heartQuantity =
                    avalonianEnergyQuantityMap[selectedTier] || 15;
                } else {
                  // Regular hearts
                  const heartQuantityMap: Record<string, number> = {
                    T4: 1,
                    T5: 1,
                    T6: 3,
                    T7: 5,
                    T8: 10,
                  };
                  heartQuantity = heartQuantityMap[selectedTier] || 1;
                }

                // Calculate per-item craft cost for profit calculation
                const perItemCraftCost =
                  capeAmount > 0 ? Math.round(craftCost / capeAmount) : 0;

                return (
                  <CapeCard
                    key={cape.UniqueName}
                    uniqueName={itemName}
                    name={cape.Name}
                    amount={capeAmount}
                    onAmountChange={handleCapeAmountChange}
                    crestCost={crestPrice}
                    heartCost={heartId ? heartPrice : undefined}
                    heartQuantity={heartQuantity}
                    heartLabel={heartLabel}
                    baseCapePrice={baseCapeeCraftCost}
                    totalCraftCost={craftCost}
                    perItemCraftCost={perItemCraftCost}
                    sellPrice={sellPrice}
                    showSellPrice={true}
                    crestId={crestId}
                    heartId={heartId}
                    onCrestPriceChange={handleCrestPriceChange}
                    onHeartPriceChange={handleHeartPriceChange}
                    isEditableCrest={true}
                    isEditableHeart={!!heartId}
                    onSellPriceChange={handleSellPriceChange}
                    isEditableSellPrice={true}
                  />
                );
              })}
            </div>
          </section>
        </>
      )}

      {/* Results Tab */}
      {activeTab === "results" && (
        <div className="results-tab">
          {/* Summary Section */}
          <section className="results-section">
            <h3>Summary</h3>
            <div className="summary-row">
              <span>Total Investment:</span>
              <strong>
                {(() => {
                  const totalInvestment = factionCapes.reduce((sum, cape) => {
                    const capeAmount = capeAmounts[cape.UniqueName] ?? 0;
                    const craftCost = calculateFactionCapeCost(
                      cape,
                      capeAmount,
                    );
                    return sum + craftCost;
                  }, 0);
                  return totalInvestment.toLocaleString();
                })()}
              </strong>
            </div>
            <div className="summary-row">
              <span>Total Profit:</span>
              <strong
                className={(() => {
                  const totalProfit = factionCapes.reduce((sum, cape) => {
                    const capeAmount = capeAmounts[cape.UniqueName] ?? 0;
                    const itemName =
                      selectedEnchantment !== "0"
                        ? `${selectedTier}_${cape.UniqueName}@${selectedEnchantment}`
                        : `${selectedTier}_${cape.UniqueName}`;
                    const sellPrice = sellPrices[itemName] || 0;
                    const craftCost = calculateFactionCapeCost(
                      cape,
                      capeAmount,
                    );
                    const perItemCraftCost =
                      capeAmount > 0 ? Math.round(craftCost / capeAmount) : 0;
                    const sellAfterTax = Math.round(sellPrice * 0.935);
                    const profit =
                      (sellAfterTax - perItemCraftCost) * capeAmount;
                    return sum + profit;
                  }, 0);
                  return totalProfit >= 0 ? "positive" : "negative";
                })()}
              >
                {(() => {
                  const totalProfit = factionCapes.reduce((sum, cape) => {
                    const capeAmount = capeAmounts[cape.UniqueName] ?? 0;
                    const itemName =
                      selectedEnchantment !== "0"
                        ? `${selectedTier}_${cape.UniqueName}@${selectedEnchantment}`
                        : `${selectedTier}_${cape.UniqueName}`;
                    const sellPrice = sellPrices[itemName] || 0;
                    const craftCost = calculateFactionCapeCost(
                      cape,
                      capeAmount,
                    );
                    const perItemCraftCost =
                      capeAmount > 0 ? Math.round(craftCost / capeAmount) : 0;
                    const sellAfterTax = Math.round(sellPrice * 0.935);
                    const profit =
                      (sellAfterTax - perItemCraftCost) * capeAmount;
                    return sum + profit;
                  }, 0);
                  return `${totalProfit >= 0 ? "+" : ""}${totalProfit.toLocaleString()}`;
                })()}
              </strong>
            </div>
            <div className="summary-row">
              <span>Profit %:</span>
              <strong
                className={(() => {
                  const totalInvestment = factionCapes.reduce((sum, cape) => {
                    const capeAmount = capeAmounts[cape.UniqueName] ?? 0;
                    const craftCost = calculateFactionCapeCost(
                      cape,
                      capeAmount,
                    );
                    return sum + craftCost;
                  }, 0);
                  const totalProfit = factionCapes.reduce((sum, cape) => {
                    const capeAmount = capeAmounts[cape.UniqueName] ?? 0;
                    const itemName =
                      selectedEnchantment !== "0"
                        ? `${selectedTier}_${cape.UniqueName}@${selectedEnchantment}`
                        : `${selectedTier}_${cape.UniqueName}`;
                    const sellPrice = sellPrices[itemName] || 0;
                    const craftCost = calculateFactionCapeCost(
                      cape,
                      capeAmount,
                    );
                    const perItemCraftCost =
                      capeAmount > 0 ? Math.round(craftCost / capeAmount) : 0;
                    const sellAfterTax = Math.round(sellPrice * 0.935);
                    const profit =
                      (sellAfterTax - perItemCraftCost) * capeAmount;
                    return sum + profit;
                  }, 0);
                  const profitPercentage =
                    totalInvestment > 0
                      ? (totalProfit / totalInvestment) * 100
                      : 0;
                  return profitPercentage >= 0 ? "positive" : "negative";
                })()}
              >
                {(() => {
                  const totalInvestment = factionCapes.reduce((sum, cape) => {
                    const capeAmount = capeAmounts[cape.UniqueName] ?? 0;
                    const craftCost = calculateFactionCapeCost(
                      cape,
                      capeAmount,
                    );
                    return sum + craftCost;
                  }, 0);
                  const totalProfit = factionCapes.reduce((sum, cape) => {
                    const capeAmount = capeAmounts[cape.UniqueName] ?? 0;
                    const itemName =
                      selectedEnchantment !== "0"
                        ? `${selectedTier}_${cape.UniqueName}@${selectedEnchantment}`
                        : `${selectedTier}_${cape.UniqueName}`;
                    const sellPrice = sellPrices[itemName] || 0;
                    const craftCost = calculateFactionCapeCost(
                      cape,
                      capeAmount,
                    );
                    const perItemCraftCost =
                      capeAmount > 0 ? Math.round(craftCost / capeAmount) : 0;
                    const sellAfterTax = Math.round(sellPrice * 0.935);
                    const profit =
                      (sellAfterTax - perItemCraftCost) * capeAmount;
                    return sum + profit;
                  }, 0);
                  const profitPercentage =
                    totalInvestment > 0
                      ? (totalProfit / totalInvestment) * 100
                      : 0;
                  return `${profitPercentage >= 0 ? "+" : ""}${profitPercentage.toFixed(2)}%`;
                })()}
              </strong>
            </div>
            <div className="summary-row">
              <span>Silver per Focus:</span>
              <strong
                className={(() => {
                  const totalProfit = factionCapes.reduce((sum, cape) => {
                    const capeAmount = capeAmounts[cape.UniqueName] ?? 0;
                    const itemName =
                      selectedEnchantment !== "0"
                        ? `${selectedTier}_${cape.UniqueName}@${selectedEnchantment}`
                        : `${selectedTier}_${cape.UniqueName}`;
                    const sellPrice = sellPrices[itemName] || 0;
                    const craftCost = calculateFactionCapeCost(
                      cape,
                      capeAmount,
                    );
                    const perItemCraftCost =
                      capeAmount > 0 ? Math.round(craftCost / capeAmount) : 0;
                    const sellAfterTax = Math.round(sellPrice * 0.935);
                    const profit =
                      (sellAfterTax - perItemCraftCost) * capeAmount;
                    return sum + profit;
                  }, 0);
                  const silverPerFocus = totalProfit / 30000;
                  return silverPerFocus >= 0 ? "positive" : "negative";
                })()}
              >
                {(() => {
                  const totalProfit = factionCapes.reduce((sum, cape) => {
                    const capeAmount = capeAmounts[cape.UniqueName] ?? 0;
                    const itemName =
                      selectedEnchantment !== "0"
                        ? `${selectedTier}_${cape.UniqueName}@${selectedEnchantment}`
                        : `${selectedTier}_${cape.UniqueName}`;
                    const sellPrice = sellPrices[itemName] || 0;
                    const craftCost = calculateFactionCapeCost(
                      cape,
                      capeAmount,
                    );
                    const perItemCraftCost =
                      capeAmount > 0 ? Math.round(craftCost / capeAmount) : 0;
                    const sellAfterTax = Math.round(sellPrice * 0.935);
                    const profit =
                      (sellAfterTax - perItemCraftCost) * capeAmount;
                    return sum + profit;
                  }, 0);
                  const silverPerFocus = totalProfit / 30000;
                  return `${silverPerFocus >= 0 ? "+" : ""}${Math.floor(silverPerFocus)}`;
                })()}
              </strong>
            </div>
          </section>

          {/* Resources Section */}
          <section className="results-section">
            <h3>Resources Needed</h3>
            {(() => {
              const crafting = baseCape.Crafting as any;
              const returnRateDecimal = parseFloat(returnRate) / 100;

              const clothQty = Math.ceil(
                (crafting.Cloth || 0) * amount * (1 - returnRateDecimal),
              );
              const leatherQty = Math.ceil(
                (crafting.Leather || 0) * amount * (1 - returnRateDecimal),
              );

              return (
                <>
                  <div className="summary-row">
                    <span>Cloth:</span>
                    <strong>{clothQty.toLocaleString()}</strong>
                  </div>
                  <div className="summary-row">
                    <span>Leather:</span>
                    <strong>{leatherQty.toLocaleString()}</strong>
                  </div>
                </>
              );
            })()}
          </section>

          {/* Crests and Hearts Section */}
          <div className="results-columns">
            <section className="results-section">
              <h3>Crests Needed</h3>
              {(() => {
                const crestCounts: Record<
                  string,
                  { name: string; count: number }
                > = {};

                factionCapes.forEach((cape) => {
                  const capeAmount = capeAmounts[cape.UniqueName] ?? 0;
                  if (capeAmount > 0) {
                    const crest = (cape.Crafting as any)?.Crest;
                    if (crest) {
                      const crestKey = /^T\d+_/.test(crest)
                        ? crest
                        : `${selectedTier}_${crest}`;
                      if (!crestCounts[crestKey]) {
                        crestCounts[crestKey] = { name: cape.Name, count: 0 };
                      }
                      crestCounts[crestKey].count += capeAmount;
                    }
                  }
                });

                return (
                  <>
                    {Object.entries(crestCounts).length === 0 ? (
                      <div className="summary-row">
                        <span>No crests needed</span>
                      </div>
                    ) : (
                      Object.entries(crestCounts).map(([crestId, data]) => (
                        <div key={crestId} className="summary-row">
                          <span>{data.name}:</span>
                          <strong>{data.count.toLocaleString()}</strong>
                        </div>
                      ))
                    )}
                  </>
                );
              })()}
            </section>

            <section className="results-section">
              <h3>Hearts Needed</h3>
              {(() => {
                const heartCounts: Record<
                  string,
                  { name: string; count: number }
                > = {};

                factionCapes.forEach((cape) => {
                  const capeAmount = capeAmounts[cape.UniqueName] ?? 0;
                  if (capeAmount > 0) {
                    const heart = (cape.Crafting as any)?.Heart;
                    const avalonianEnergy = (cape.Crafting as any)
                      ?.AvalonianEnergy;

                    if (heart && heart !== "") {
                      const heartQuantityMap: Record<string, number> = {
                        T4: 1,
                        T5: 1,
                        T6: 3,
                        T7: 5,
                        T8: 10,
                      };
                      const heartQtyPerCape =
                        heartQuantityMap[selectedTier] || 1;

                      if (!heartCounts[heart]) {
                        heartCounts[heart] = { name: cape.Name, count: 0 };
                      }
                      heartCounts[heart].count += capeAmount * heartQtyPerCape;
                    } else if (avalonianEnergy && avalonianEnergy !== "") {
                      const avalonianEnergyQuantityMap: Record<string, number> =
                        {
                          T4: 15,
                          T5: 15,
                          T6: 45,
                          T7: 75,
                          T8: 150,
                        };
                      const energyQtyPerCape =
                        avalonianEnergyQuantityMap[selectedTier] || 15;
                      const energyKey = /^T\d+_/.test(avalonianEnergy)
                        ? avalonianEnergy
                        : `${selectedTier}_${avalonianEnergy}`;

                      if (!heartCounts[energyKey]) {
                        heartCounts[energyKey] = {
                          name: `${cape.Name} (Energy)`,
                          count: 0,
                        };
                      }
                      heartCounts[energyKey].count +=
                        capeAmount * energyQtyPerCape;
                    }
                  }
                });

                return (
                  <>
                    {Object.entries(heartCounts).length === 0 ? (
                      <div className="summary-row">
                        <span>No hearts needed</span>
                      </div>
                    ) : (
                      Object.entries(heartCounts).map(([heartId, data]) => (
                        <div key={heartId} className="summary-row">
                          <span>{data.name}:</span>
                          <strong>{data.count.toLocaleString()}</strong>
                        </div>
                      ))
                    )}
                  </>
                );
              })()}
            </section>
          </div>
        </div>
      )}
    </main>
  );
}
