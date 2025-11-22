import "./discovery.css";
import ItemCard from "../../components/ItemCard/ItemCard";

export default function DiscoveryPage() {
	return (
		<main className="page discovery-page">
			<h1>Discovery</h1>
			<p>Liste profitabler Crafts.</p>

			<section className="example-cards" style={{ marginTop: '1rem' }}>
				<ItemCard
					imageSrc="https://render.albiononline.com/v1/item/T5_ARMOR_PLATE_KEEPER@3.png?quality=4"
					name="Enchanted Helmet"
					buyPrice={1200}
					sellPrice={1300}
				/>
			</section>
		</main>
	);
}
