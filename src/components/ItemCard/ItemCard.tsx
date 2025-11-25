"use client";

import "./item-card.css";
import { calculateSellAfterTax } from "../../lib/utility";

export type ItemCardProps = {
  uniqueName: string;
  name: string;
  artefactCost: number;
  craftCost: number;
  sellPrice: number;
};

export default function ItemCard({
  uniqueName,
  name,
  artefactCost,
  craftCost,
  sellPrice,
}: ItemCardProps) {
  const sellAfterTax = calculateSellAfterTax(sellPrice);
  const profit = Math.round(sellAfterTax - craftCost);
  const profitPercentage = ((profit / sellPrice) * 100).toFixed(2);

  const profitClass = profit >= 0 ? "profit positive" : "profit negative";

  return (
    <div className={`item-card ${uniqueName}`}>
      <div className="card-header">
        <div className="thumb">
          <img
            src={`https://render.albiononline.com/v1/item/${uniqueName}.png?quality=4`}
            alt={name}
          />
        </div>
        <div className="title">{name}</div>
      </div>

      <div className="card-body">
        <div className="prices">
          <div className="artefact-row">
            Artefact: <strong>{artefactCost.toLocaleString()}</strong>
          </div>
          <div className="price-row">
            Craft: <strong>{craftCost.toLocaleString()}</strong>
          </div>
          <div className="price-row">
            Sell: <strong>{sellPrice.toLocaleString()}</strong>
          </div>
          <div className="price-row">
            Sell after tax: <strong>{sellAfterTax.toLocaleString()}</strong>
          </div>
        </div>

        <div className="profit-row">
          <div className={profitClass}>
            Profit: <strong>{profit.toLocaleString()}</strong>
          </div>
          <div className={profitClass}>({profitPercentage}%)</div>
        </div>
      </div>
    </div>
  );
}
