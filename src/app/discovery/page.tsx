"use client";

import { useEffect, useState } from "react";
import "./discovery.css";
import ItemCard from "../../components/ItemCard/ItemCard";
import { getPrice } from "../../services/api";
import itemsData from "../../albion-ids/items.json";
import type { ItemData, PriceData } from "@/types";

export default function DiscoveryPage() {
	const [prices, setPrices] = useState<Record<string, PriceData>>({});
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		async function fetchPrices() {
			try {
				setLoading(true);
				setError(null);
				
				const items = itemsData as ItemData[];
				const priceMap: Record<string, PriceData> = {};
				
				// Sende für jedes Item einen einzelnen API-Request
				for (const item of items) {
					try {
						const data = await getPrice(item.UniqueName, "Bridgewatch");
						console.log(data)
						if (Array.isArray(data) && data.length > 0) {
							priceMap[data[0].item_id] = data[0];
						}
					} catch (itemError) {
						console.error(`Failed to fetch price for ${item.UniqueName}:`, itemError);
						// Weiter mit nächstem Item
					}
				}
				
				setPrices(priceMap);
			} catch (e: any) {
				console.error("Failed to fetch prices:", e);
				setError(e?.message || "Failed to load prices");
			} finally {
				setLoading(false);
			}
		}

		fetchPrices();
	}, []);

	return (
		<main className="page discovery-page">
			<h1>Discovery</h1>
			<p>Liste profitabler Crafts.</p>

			{loading && <p className="muted">Loading prices...</p>}
			{error && <p className="error">{error}</p>}

			<section className="example-cards" style={{ marginTop: '1rem' }}>
				{(itemsData as ItemData[]).map(item => {
					const priceData = prices[item.UniqueName];
					const sellPrice = priceData?.sell_price_min || 0;
					
					return (
						<ItemCard
							key={item.UniqueName}
							uniqueName={item.UniqueName}
							name={item.LocalizedNames?.["EN-US"] || item.UniqueName}
							buyPrice={0}
							sellPrice={sellPrice}
						/>
					);
				})}
			</section>
		</main>
	);
}
