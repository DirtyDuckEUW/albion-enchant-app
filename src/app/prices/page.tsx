"use client";

import { useEffect, useState } from "react";
import "./prices.css";

type Tier = "T4" | "T5" | "T6" | "T7" | "T8";
type ResourceKey = "runes" | "souls" | "relics";

const TIERS: Tier[] = ["T4", "T5", "T6", "T7", "T8"];

function storageKey(resource: ResourceKey) {
	return `ae_prices_${resource}`;
}

export default function PricesPage() {
	const defaultTierValues: Record<Tier, string> = { T4: "0", T5: "0", T6: "0", T7: "0", T8: "0" };
	const [runes, setRunes] = useState<Record<Tier, string>>(defaultTierValues);
	const [souls, setSouls] = useState<Record<Tier, string>>(defaultTierValues);
	const [relics, setRelics] = useState<Record<Tier, string>>(defaultTierValues);

	// Load saved values from localStorage on mount
	useEffect(() => {
		try {
			const r = localStorage.getItem(storageKey("runes"));
			const s = localStorage.getItem(storageKey("souls"));
			const re = localStorage.getItem(storageKey("relics"));
			if (r) {
				const parsed = JSON.parse(r);
				setRunes({ ...defaultTierValues, ...parsed });
			}
			if (s) {
				const parsed = JSON.parse(s);
				setSouls({ ...defaultTierValues, ...parsed });
			}
			if (re) {
				const parsed = JSON.parse(re);
				setRelics({ ...defaultTierValues, ...parsed });
			}
		} catch (e) {
			// ignore
		}
	}, []);

	function handleChange(resource: ResourceKey, tier: Tier, value: string) {
		const setter = resource === "runes" ? setRunes : resource === "souls" ? setSouls : setRelics;
		setter((prev) => ({ ...prev, [tier]: value }));
	}

	function saveAll() {
		try {
			localStorage.setItem(storageKey("runes"), JSON.stringify(runes));
			localStorage.setItem(storageKey("souls"), JSON.stringify(souls));
			localStorage.setItem(storageKey("relics"), JSON.stringify(relics));
			alert("Prices saved to localStorage.");
		} catch (e) {
			alert("Failed to save prices.");
		}
	}

	function resetAll() {
		setRunes(defaultTierValues);
		setSouls(defaultTierValues);
		setRelics(defaultTierValues);
		try {
			localStorage.removeItem(storageKey("runes"));
			localStorage.removeItem(storageKey("souls"));
			localStorage.removeItem(storageKey("relics"));
		} catch (e) {}
	}

	return (
		<main className="page prices-page">
			<h1>Prices</h1>
			<h2>Manual resource price input for artifacts (T4–T8).</h2>

			<div className="prices-grid">
				<section className="price-block">
					<h2>Runes</h2>
					<div className="tiers">
						{TIERS.map((t) => (
							<label key={`runes-${t}`} className="tier-field">
								<span>{t}</span>
								<input
									inputMode="decimal"
									value={runes[t]}
									onChange={(e) => handleChange("runes", t, e.target.value)}
								/>
							</label>
						))}
					</div>
				</section>

				<section className="price-block">
					<h2>Souls</h2>
					<div className="tiers">
						{TIERS.map((t) => (
							<label key={`souls-${t}`} className="tier-field">
								<span>{t}</span>
								<input
									inputMode="decimal"
									value={souls[t]}
									onChange={(e) => handleChange("souls", t, e.target.value)}
								/>
							</label>
						))}
					</div>
				</section>

				<section className="price-block">
					<h2>Relics</h2>
					<div className="tiers">
						{TIERS.map((t) => (
							<label key={`relics-${t}`} className="tier-field">
								<span>{t}</span>
								<input
									inputMode="decimal"
									value={relics[t]}
									onChange={(e) => handleChange("relics", t, e.target.value)}
								/>
							</label>
						))}
					</div>
				</section>
			</div>

			<div className="actions">
				<button className="btn" onClick={saveAll}>Save</button>
				<button className="btn btn-ghost" onClick={resetAll}>Reset</button>
			</div>
		</main>
	);
}

