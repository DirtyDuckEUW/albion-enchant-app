"use client";

import { useState } from "react";
import "./calculate.css";
import { useResourcePrices } from "@/hooks/useResourcePrices";
import { calculateProfit } from "@/lib/calculations";
import type { ItemKey, Tier, PriceBreakdown } from "@/types";
import ItemSelect from "@/components/ItemSelect/ItemSelect";
import TierSelect from "@/components/TierSelect/TierSelect";

export default function CalculatePage() {
	const [item, setItem] = useState<ItemKey>("head_boots_offhand_cape");
	const [tier, setTier] = useState<Tier>("T4");
	const [itemCost, setItemCost] = useState<string>("");
	const [sellPrice, setSellPrice] = useState<string>("");
	const [clothCount, setClothCount] = useState<string>("");
	const [leatherCount, setLeatherCount] = useState<string>("");
	const [metalBarCount, setMetalBarCount] = useState<string>("");
	const [planksCount, setPlanksCount] = useState<string>("");
	const [artifactCount, setArtifactCount] = useState<string>("");
	const [result, setResult] = useState<number | null>(null);
	const [breakdown, setBreakdown] = useState<PriceBreakdown | null>(null);

	const { prices } = useResourcePrices();

	function calculate() {
		const calculationResult = calculateProfit({
			itemCost,
			sellPrice,
			item,
			tier,
			clothCount,
			leatherCount,
			metalBarCount,
			planksCount,
			artifactCount,
			prices,
		});

		if (!calculationResult) {
			setResult(NaN);
			setBreakdown(null);
			return;
		}

		setResult(calculationResult.profit);
		setBreakdown(calculationResult.breakdown);
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
				<div className="field-row">
					<ItemSelect value={item} onChange={setItem} />
					<TierSelect value={tier} onChange={setTier} />
				</div>

				<div className="resource-counts">
					<p className="muted">Resource quantities</p>
					<div className="resource-grid">
						<label className="resource-field">
							<span>Cloth</span>
							<input
								inputMode="decimal"
								value={clothCount}
								onChange={(e) => setClothCount(e.target.value)}
								placeholder="0"
							/>
						</label>
						<label className="resource-field">
							<span>Leather</span>
							<input
								inputMode="decimal"
								value={leatherCount}
								onChange={(e) => setLeatherCount(e.target.value)}
								placeholder="0"
							/>
						</label>
						<label className="resource-field">
							<span>Metal Bar</span>
							<input
								inputMode="decimal"
								value={metalBarCount}
								onChange={(e) => setMetalBarCount(e.target.value)}
								placeholder="0"
							/>
						</label>
						<label className="resource-field">
							<span>Planks</span>
							<input
								inputMode="decimal"
								value={planksCount}
								onChange={(e) => setPlanksCount(e.target.value)}
								placeholder="0"
							/>
						</label>
						<label className="resource-field">
							<span>Artifact</span>
							<input
								inputMode="decimal"
								value={artifactCount}
								onChange={(e) => setArtifactCount(e.target.value)}
								placeholder="0"
							/>
						</label>
					</div>
				</div>

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
							setClothCount("");
							setLeatherCount("");
							setMetalBarCount("");
							setPlanksCount("");
							setArtifactCount("");
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
							Resource costs: <strong>{breakdown ? breakdown.materialTotal.toLocaleString() : '0'}</strong>
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
