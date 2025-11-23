import type { Tier, ItemKey, PriceBreakdown, ResourcePriceMap } from "@/types";
import {
  calculateSellAfterTax,
  calculateTaxAmount,
  parseNumber,
  ITEM_COUNTS,
} from "./utility";

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

export function calculateCraftingCost(
  tier: Tier,
  costs: CraftingCosts,
  prices: ResourcePriceMap,
): number {
  const clothPriceForTier = parseNumber(prices.cloth?.[tier] ?? 0);
  const leatherPriceForTier = parseNumber(prices.leather?.[tier] ?? 0);
  const metalBarPriceForTier = parseNumber(prices.metalBar?.[tier] ?? 0);
  const planksPriceForTier = parseNumber(prices.planks?.[tier] ?? 0);

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
  const runePriceForTier = parseNumber(input.prices.runes?.[input.tier] ?? 0);
  const soulPriceForTier = parseNumber(input.prices.souls?.[input.tier] ?? 0);
  const relicPriceForTier = parseNumber(input.prices.relics?.[input.tier] ?? 0);

  const runeCost = runePriceForTier * count;
  const soulCost = soulPriceForTier * count;
  const relicCost = relicPriceForTier * count;

  // Material costs using extracted function
  const clothQty = parseNumber(input.clothCount);
  const leatherQty = parseNumber(input.leatherCount);
  const metalBarQty = parseNumber(input.metalBarCount);
  const planksQty = parseNumber(input.planksCount);
  const artifactQty = parseNumber(input.artifactCount);

  const materialTotal = calculateCraftingCost(
    input.tier,
    {
      cloth: Number.isFinite(clothQty) ? clothQty : 0,
      leather: Number.isFinite(leatherQty) ? leatherQty : 0,
      metalBar: Number.isFinite(metalBarQty) ? metalBarQty : 0,
      planks: Number.isFinite(planksQty) ? planksQty : 0,
      artifact: Number.isFinite(artifactQty) ? artifactQty : 0,
    },
    input.prices,
  );

  const resourceTotal = runeCost + soulCost + relicCost;

  const manual = Number.isFinite(cost) ? cost : 0;
  const totalCost = manual + resourceTotal + materialTotal;

  const taxAmount = calculateTaxAmount(sell);
  const sellAfterTax = calculateSellAfterTax(sell);

  const profit = sellAfterTax - totalCost;

  return {
    profit,
    breakdown: {
      runeCost,
      soulCost,
      relicCost,
      resourceTotal,
      materialTotal,
      manualCost: manual,
      totalCost,
      taxAmount,
      sellAfterTax,
    },
  };
}
