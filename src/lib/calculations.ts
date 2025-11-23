import type { Tier, ItemKey, PriceBreakdown, ResourcePriceMap } from '@/types';
import { calculateSellAfterTax, calculateTaxAmount, parseNumber, ITEM_COUNTS } from './utility';

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

  // Material costs (cloth, leather, metal, planks, artifact)
  const clothPriceForTier = parseNumber(input.prices.cloth?.[input.tier] ?? 0);
  const leatherPriceForTier = parseNumber(input.prices.leather?.[input.tier] ?? 0);
  const metalBarPriceForTier = parseNumber(input.prices.metalBar?.[input.tier] ?? 0);
  const planksPriceForTier = parseNumber(input.prices.planks?.[input.tier] ?? 0);

  const clothQty = parseNumber(input.clothCount);
  const leatherQty = parseNumber(input.leatherCount);
  const metalBarQty = parseNumber(input.metalBarCount);
  const planksQty = parseNumber(input.planksCount);
  const artifactQty = parseNumber(input.artifactCount);

  const clothCost = (Number.isFinite(clothQty) ? clothQty : 0) * clothPriceForTier;
  const leatherCost = (Number.isFinite(leatherQty) ? leatherQty : 0) * leatherPriceForTier;
  const metalBarCost = (Number.isFinite(metalBarQty) ? metalBarQty : 0) * metalBarPriceForTier;
  const planksCost = (Number.isFinite(planksQty) ? planksQty : 0) * planksPriceForTier;
  const artifactCostValue = Number.isFinite(artifactQty) ? artifactQty : 0;

  const resourceTotal = runeCost + soulCost + relicCost;
  const materialTotal = clothCost + leatherCost + metalBarCost + planksCost + artifactCostValue;

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
