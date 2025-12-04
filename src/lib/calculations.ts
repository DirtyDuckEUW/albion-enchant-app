/**
 * Calculation utilities for crafting costs, profits, and investments
 * Handles return rates, bulk calculations, and percentage computations
 */

import type {
  ItemData,
  ResourcePriceMap as NewResourcePriceMap,
  CraftCostBreakdown,
  ProfitCalculation,
  BulkProfitCalculation,
  ReturnRateOption,
} from "@/types/shared";

import { RETURN_RATES } from "@/types/shared";

// Legacy imports for backward compatibility
import type { Tier, ItemKey, PriceBreakdown, ResourcePriceMap } from "@/types";
import {
  calculateSellAfterTax,
  calculateTaxAmount,
  parseNumber,
  ITEM_COUNTS,
} from "./utility";

// ============================================================================
// Return Rate Utilities
// ============================================================================

/**
 * Get decimal return rate from option
 */
export function getReturnRateDecimal(returnRate: ReturnRateOption): number {
  if (!returnRate) {
    console.warn("returnRate is undefined, using default 47.92");
    returnRate = "47.92";
  }

  return RETURN_RATES[returnRate]?.decimal || 0.4792;
}

/**
 * Calculate resource quantity needed after return rate
 * For bulk crafting: applies return rate to total quantity
 */
export function calculateResourceWithReturnRate(
  baseCount: number,
  amount: number,
  returnRate: ReturnRateOption
): number {
  const returnRateDecimal = getReturnRateDecimal(returnRate);
  const totalQuantity = baseCount * amount;
  return Math.ceil(totalQuantity * (1 - returnRateDecimal));
}

// ============================================================================
// Craft Cost Calculations (New System)
// ============================================================================

/**
 * Calculate total craft cost for a single item
 */
export function calculateCraftCost(
  item: ItemData | any,
  resourcePrices: NewResourcePriceMap,
  artifactPrice: number = 0
): CraftCostBreakdown {
  if (!item.Crafting) {
    return {
      mainResourceCost: 0,
      additionalResourcesCost: 0,
      silverCost: 0,
      totalCost: 0,
    };
  }

  // Main resource cost (artifact)
  const mainResourceCost = artifactPrice;

  // Additional resources cost
  const additionalResourcesCost = (
    item.Crafting.AdditionalResources || []
  ).reduce((sum: number, resource: any) => {
    const price = resourcePrices[resource.Resource] || 0;
    return sum + price * resource.Count;
  }, 0);

  // Silver cost
  const silverCost = item.Crafting.Silver || 0;

  // Total cost
  const totalCost = mainResourceCost + additionalResourcesCost + silverCost;

  return {
    mainResourceCost,
    additionalResourcesCost,
    silverCost,
    totalCost,
  };
}

/**
 * Calculate craft cost with return rate applied
 * For bulk crafting: amount should be total quantity
 */
export function calculateCraftCostWithReturnRate(
  item: ItemData | any,
  resourcePrices: NewResourcePriceMap,
  artifactPrice: number,
  amount: number,
  returnRate: ReturnRateOption
): number {
  if (!item.Crafting) return 0;

  const crafting = item.Crafting;
  const returnRateDecimal = getReturnRateDecimal(returnRate);

  // Main resource (artifact) - no return rate
  const mainResourceCost = artifactPrice * amount;

  // Calculate resource costs with return rate
  let resourceCost = 0;

  // Check if using legacy format (Cloth, Leather, Metal_Bars, Planks)
  if (crafting.Cloth !== undefined || crafting.Leather !== undefined) {
    // Legacy format from all-items.json
    const resourceTypes = [
      { key: "CLOTH", count: crafting.Cloth || 0 },
      { key: "LEATHER", count: crafting.Leather || 0 },
      { key: "METALBAR", count: crafting.Metal_Bars || 0 },
      { key: "PLANKS", count: crafting.Planks || 0 },
    ];

    resourceTypes.forEach(({ key, count }) => {
      if (count > 0) {
        // Build resource key - need tier and enchantment from resourcePrices
        // Find matching key in resourcePrices
        const matchingKey = Object.keys(resourcePrices).find((k) =>
          k.includes(key)
        );
        if (matchingKey) {
          const price = resourcePrices[matchingKey] || 0;
          const quantityNeeded = calculateResourceWithReturnRate(
            count,
            amount,
            returnRate
          );
          resourceCost += price * quantityNeeded;
        }
      }
    });
  } else if (crafting.AdditionalResources) {
    // New format with AdditionalResources
    resourceCost = crafting.AdditionalResources.reduce(
      (sum: number, resource: any) => {
        const price = resourcePrices[resource.Resource] || 0;
        const quantityNeeded = calculateResourceWithReturnRate(
          resource.Count,
          amount,
          returnRate
        );
        return sum + price * quantityNeeded;
      },
      0
    );
  }

  // Silver cost
  const silverCost = (crafting.Silver || 0) * amount;

  return mainResourceCost + resourceCost + silverCost;
}

// ============================================================================
// Profit Calculations (New System)
// ============================================================================

/**
 * Calculate profit for a single item
 */
export function calculateProfitNew(
  sellPrice: number,
  craftCost: number
): ProfitCalculation {
  const profit = sellPrice - craftCost;
  const profitPercentage = craftCost > 0 ? (profit / craftCost) * 100 : 0;

  return {
    sellPrice,
    craftCost,
    profit,
    profitPercentage,
  };
}

/**
 * Calculate bulk profit (per day and total)
 */
export function calculateBulkProfit(
  sellPrice: number,
  craftCost: number,
  amountPerDay: number,
  days: number,
  premiumCost: number = 0
): BulkProfitCalculation {
  // Per day calculations
  const investmentPerDay = craftCost;
  const profitPerDay = sellPrice - craftCost;
  const profitPercentagePerDay =
    investmentPerDay > 0 ? (profitPerDay / investmentPerDay) * 100 : 0;

  // Total calculations
  const investmentTotal = investmentPerDay * days + premiumCost;
  const profitForDays = profitPerDay * days - premiumCost;
  const profitPercentageTotal =
    investmentTotal > 0 ? (profitForDays / investmentTotal) * 100 : 0;

  return {
    profitPerDay,
    profitForDays,
    profitPercentagePerDay,
    profitPercentageTotal,
    investmentPerDay,
    investmentTotal,
  };
}

// ============================================================================
// Aggregate Calculations
// ============================================================================

/**
 * Calculate total investment and profit across multiple items
 */
export function calculateTotalProfits(
  items: Array<{
    craftCost: number;
    sellPrice: number;
    amountPerDay: number;
  }>,
  days: number,
  premiumCost: number = 0
): {
  totalInvestmentPerDay: number;
  totalProfitPerDay: number;
  totalInvestmentForDays: number;
  totalProfitForDays: number;
  profitPercentagePerDay: number;
  profitPercentageTotal: number;
} {
  // Calculate per-day totals
  const totalInvestmentPerDay = items.reduce(
    (sum, item) => sum + item.craftCost,
    0
  );
  const totalProfitPerDay = items.reduce(
    (sum, item) => sum + (item.sellPrice - item.craftCost),
    0
  );

  // Calculate total for all days
  const totalInvestmentForDays = totalInvestmentPerDay * days + premiumCost;
  const totalProfitForDays = totalProfitPerDay * days - premiumCost;

  // Calculate percentages
  const profitPercentagePerDay =
    totalInvestmentPerDay > 0
      ? (totalProfitPerDay / totalInvestmentPerDay) * 100
      : 0;
  const profitPercentageTotal =
    totalInvestmentForDays > 0
      ? (totalProfitForDays / totalInvestmentForDays) * 100
      : 0;

  return {
    totalInvestmentPerDay,
    totalProfitPerDay,
    totalInvestmentForDays,
    totalProfitForDays,
    profitPercentagePerDay,
    profitPercentageTotal,
  };
}

// ============================================================================
// Formatting Utilities
// ============================================================================

/**
 * Format number as silver with thousands separators
 */
export function formatSilver(amount: number): string {
  return Math.round(amount).toLocaleString("de-DE");
}

/**
 * Format percentage with color indicator
 */
export function formatPercentage(
  percentage: number,
  decimals: number = 2
): string {
  return `${percentage >= 0 ? "+" : ""}${percentage.toFixed(decimals)}%`;
}

/**
 * Get color for profit/loss display
 */
export function getProfitColor(amount: number): string {
  if (amount > 0) return "var(--cp-green)";
  if (amount < 0) return "var(--cp-red)";
  return "var(--cp-text)";
}

/**
 * Get color for investment display
 */
export function getInvestmentColor(): string {
  return "var(--cp-blue)";
}

// ============================================================================
// Legacy Functions (Backward Compatibility)
// ============================================================================

interface CalculationInput {
  itemCost: string;
  sellPrice: string;
  item: ItemKey;
  tier: Tier;
  clothCount: string;
  leatherCount: string;
  metalBarCount: string;
  planksCount: string;
  artifactCount: string;
  prices: ResourcePriceMap;
}

interface CraftingCosts {
  cloth: number;
  leather: number;
  metalBar: number;
  planks: number;
  artifact: number;
}

export function calculateTotalCost(
  tier: Tier,
  count: number,
  costs: CraftingCosts,
  prices: ResourcePriceMap,
  enchantment: string = "0"
) {
  return (
    calculateArtifactCost(tier, count, prices, enchantment) +
    calculateCraftingCostLegacy(tier, costs, prices)
  );
}

export function calculateArtifactCost(
  tier: Tier,
  count: number,
  prices: ResourcePriceMap,
  enchantment: string = "0"
): number {
  const runePriceForTier = parseNumber(prices.runes?.[tier]?.["0"] ?? 0);
  const soulPriceForTier = parseNumber(prices.souls?.[tier]?.["0"] ?? 0);
  const relicPriceForTier = parseNumber(prices.relics?.[tier]?.["0"] ?? 0);

  let runeCost = 0;
  let soulCost = 0;
  let relicCost = 0;

  // Based on enchantment level:
  // .0 = no runes/souls/relics
  // .1 = only runes
  // .2 = runes + souls
  // .3 = runes + souls + relics
  if (enchantment === "1" || enchantment === "2" || enchantment === "3") {
    runeCost = runePriceForTier * count;
  }
  if (enchantment === "2" || enchantment === "3") {
    soulCost = soulPriceForTier * count;
  }
  if (enchantment === "3") {
    relicCost = relicPriceForTier * count;
  }

  return runeCost + soulCost + relicCost;
}

export function calculateCraftingCostLegacy(
  tier: Tier,
  costs: CraftingCosts,
  prices: ResourcePriceMap
): number {
  const clothPriceForTier = parseNumber(prices.cloth?.[tier]?.["0"] ?? 0);
  const leatherPriceForTier = parseNumber(prices.leather?.[tier]?.["0"] ?? 0);
  const metalBarPriceForTier = parseNumber(prices.metalBar?.[tier]?.["0"] ?? 0);
  const planksPriceForTier = parseNumber(prices.planks?.[tier]?.["0"] ?? 0);

  const clothCost = costs.cloth * clothPriceForTier;
  const leatherCost = costs.leather * leatherPriceForTier;
  const metalBarCost = costs.metalBar * metalBarPriceForTier;
  const planksCost = costs.planks * planksPriceForTier;

  return clothCost + leatherCost + metalBarCost + planksCost + costs.artifact;
}

export function calculateProfit(input: CalculationInput): {
  profit: number;
  breakdown: PriceBreakdown;
} | null {
  const cost = parseNumber(input.itemCost);
  const sell = parseNumber(input.sellPrice);

  if (Number.isNaN(cost) || Number.isNaN(sell)) {
    return null;
  }

  const count = ITEM_COUNTS[input.item] ?? 0;

  // Artifact costs (runes, souls, relics)

  // Material costs using extracted function
  const clothQty = parseNumber(input.clothCount);
  const leatherQty = parseNumber(input.leatherCount);
  const metalBarQty = parseNumber(input.metalBarCount);
  const planksQty = parseNumber(input.planksCount);
  const artifactQty = parseNumber(input.artifactCount);

  calculateTotalCost(
    input.tier,
    count,
    {
      cloth: Number.isFinite(clothQty) ? clothQty : 0,
      leather: Number.isFinite(leatherQty) ? leatherQty : 0,
      metalBar: Number.isFinite(metalBarQty) ? metalBarQty : 0,
      planks: Number.isFinite(planksQty) ? planksQty : 0,
      artifact: Number.isFinite(artifactQty) ? artifactQty : 0,
    },
    input.prices
  );

  const artifactTotal = calculateArtifactCost(
    input.tier,
    count,
    input.prices,
    "0"
  );

  const materialTotal = calculateCraftingCostLegacy(
    input.tier,
    {
      cloth: Number.isFinite(clothQty) ? clothQty : 0,
      leather: Number.isFinite(leatherQty) ? leatherQty : 0,
      metalBar: Number.isFinite(metalBarQty) ? metalBarQty : 0,
      planks: Number.isFinite(planksQty) ? planksQty : 0,
      artifact: Number.isFinite(artifactQty) ? artifactQty : 0,
    },
    input.prices
  );

  const manual = Number.isFinite(cost) ? cost : 0;
  const totalCost = manual + artifactTotal + materialTotal;

  const taxAmount = calculateTaxAmount(sell);
  const sellAfterTax = calculateSellAfterTax(sell);

  const profit = sellAfterTax - totalCost;

  return {
    profit,
    breakdown: {
      artifactTotal,
      materialTotal,
      manualCost: manual,
      totalCost,
      taxAmount,
      sellAfterTax,
    },
  };
}
