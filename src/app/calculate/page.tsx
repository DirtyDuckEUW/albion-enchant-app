"use client";

import { useState } from "react";
import "./calculate.css";
import { MARKET_TAX } from "../../lib/constants";

type ItemKey =
	| "head_boots_offhand_cape"
	| "armor_bag"
	| "one_handed_weapon"
	| "two_handed_weapon";

export default function CalculatePage() {
	const [item, setItem] = useState<ItemKey>("head_boots_offhand_cape");
	const [tier, setTier] = useState<"T4" | "T5" | "T6" | "T7" | "T8">("T4");
	const [itemCost, setItemCost] = useState<string>("");
	const [sellPrice, setSellPrice] = useState<string>("");
	const [result, setResult] = useState<number | null>(null);
	const [breakdown, setBreakdown] = useState<{
		runeCost: number;
		soulCost: number;
		relicCost: number;
		resourceTotal: number;
		manualCost: number;
		totalCost: number;
		taxAmount: number;
		sellAfterTax: number;
	} | null>(null);

	function parseNumber(value: string) {
		const n = Number(value.replaceAll(",", "."));
		return Number.isFinite(n) ? n : NaN;
	}

	function calculate() {
		const cost = parseNumber(itemCost);
		const sell = parseNumber(sellPrice);

		if (Number.isNaN(cost) || Number.isNaN(sell)) {
			setResult(NaN);
			return;
		}

		// load prices from localStorage (preferred)
		const storageKey = (r: string) => `ae_prices_${r}`;
		function loadPrices(key: string) {
			try {
				const raw = localStorage.getItem(storageKey(key));
				if (!raw) return null;
				const parsed = JSON.parse(raw) as Record<string, string>;
				return parsed;
			} catch (e) {
				return null;
			}
		}

		const runePrices = loadPrices("runes");
		const soulPrices = loadPrices("souls");
		const relicPrices = loadPrices("relics");

		// counts per item category
		const counts: Record<ItemKey, number> = {
			head_boots_offhand_cape: 96,
			armor_bag: 192,
			one_handed_weapon: 288,
			two_handed_weapon: 384,
		};

		const count = counts[item] ?? 0;

		const runePriceForTier = runePrices ? parseNumber(runePrices[tier] ?? "0") : 0;
		const soulPriceForTier = soulPrices ? parseNumber(soulPrices[tier] ?? "0") : 0;
		const relicPriceForTier = relicPrices ? parseNumber(relicPrices[tier] ?? "0") : 0;

		const runeCost = runePriceForTier * count;
		const soulCost = soulPriceForTier * count;
		const relicCost = relicPriceForTier * count;

		const resourceTotal = runeCost + soulCost + relicCost;

		const manual = Number.isFinite(cost) ? cost : 0;
		const totalCost = manual + resourceTotal;

		// apply market tax to sell price (from global constants)
		const taxAmount = Number.isFinite(sell) ? sell * MARKET_TAX : 0;
		const sellAfterTax = Number.isFinite(sell) ? sell - taxAmount : 0;

		const profitPer = sellAfterTax - totalCost;
		setResult(profitPer);

		setBreakdown({
			runeCost,
			soulCost,
			relicCost,
			resourceTotal,
			manualCost: manual,
			totalCost,
			taxAmount,
			sellAfterTax,
		});
	}

	return (
		<main className="page calculate-page">
			<h1>Calculate</h1>

			<form
				onSubmit={(e) => {
					e.preventDefault();
					calculate();
				}}
				className="calc-form"
			>
				<label className="field">
					<span>Item-Kategorie</span>
					<select value={item} onChange={(e) => setItem(e.target.value as ItemKey)}>
						<option value="head_boots_offhand_cape">Helmet / Boots / Off-Hand / Cape</option>
						<option value="armor_bag">Armor / Bag</option>
						<option value="one_handed_weapon">One Handed Weapon</option>
						<option value="two_handed_weapon">Two Handed Weapon</option>
					</select>
				</label>

				<label className="field">
					<span>Tier</span>
					<select value={tier} onChange={(e) => setTier(e.target.value as "T4" | "T5" | "T6" | "T7" | "T8") }>
						<option value="T4">T4</option>
						<option value="T5">T5</option>
						<option value="T6">T6</option>
						<option value="T7">T7</option>
						<option value="T8">T8</option>
					</select>
				</label>

				<label className="field">
					<span>Item Cost</span>
					<input
						inputMode="decimal"
						value={itemCost}
						onChange={(e) => setItemCost(e.target.value)}
					/>
				</label>

				<label className="field">
					<span>Sell Price</span>
					<input
						inputMode="decimal"
						value={sellPrice}
						onChange={(e) => setSellPrice(e.target.value)}
					/>
				</label>

				<div className="actions">
					<button type="submit" className="btn">Calculate</button>
					<button
						type="button"
						className="btn btn-ghost"
						onClick={() => {
							setItemCost("");
							setSellPrice("");
							setResult(null);
						}}
					>
						Reset
					</button>
				</div>
			</form>

			<section className="result">
				{result === null ? (
					<p className="muted">No calculation yet.</p>
				) : Number.isNaN(result) ? (
					<p className="error">Invalid input — check item cost and sell price.</p>
				) : (
					<>
						<p>
							Artifact total: <strong>{breakdown ? breakdown.resourceTotal.toLocaleString() : '0'}</strong>
						</p>
						<p>
							Total cost: <strong>{breakdown ? breakdown.totalCost.toLocaleString() : '0'}</strong>
						</p>

						<hr className="sep" />

						<p>
							Market tax (6.5%): <strong>{breakdown ? breakdown.taxAmount.toLocaleString() : '0'}</strong>
						</p>
						<p>
							Sell after tax: <strong>{breakdown ? breakdown.sellAfterTax.toLocaleString() : '0'}</strong>
						</p>

						<hr className="sep" />

						<p>
							Profit: <strong>{result.toLocaleString()}</strong>
						</p>
						<p>
							Profit %:{' '}
							<strong>
								{Number.isFinite(result) && breakdown && breakdown.totalCost > 0
									? ((result / breakdown.totalCost) * 100).toFixed(2) + '%'
									: 'N/A'}
							</strong>
						</p>
					</>
				)}
			</section>
		</main>
	);
}
