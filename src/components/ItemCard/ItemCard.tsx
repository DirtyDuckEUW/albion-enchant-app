"use client";

import React from "react";
import "./item-card.css";
import { calculateSellAfterTax, calculateTaxAmount } from "../../lib/utility";

export type ItemCardProps = {
  uniqueName: string;
  name: string;
  buyPrice: number;
  sellPrice: number;
};

export default function ItemCard({ uniqueName, name, buyPrice, sellPrice }: ItemCardProps) {
  const sellAfterTax = calculateSellAfterTax(sellPrice);
  const profit = Math.round(sellAfterTax - buyPrice);

  const profitClass = profit >= 0 ? "profit positive" : "profit negative";

  return (
    <div className={`item-card ${uniqueName}`}>
      <div className="thumb">
          <img src={`https://render.albiononline.com/v1/item/${uniqueName}.png?quality=4`} alt={name} />
      </div>

      <div className="content">
        <div className="title">{name}</div>
        <div className="prices">
          <div className="price-row">Buy: <strong>{buyPrice.toLocaleString()}</strong></div>
          <div className="price-row">Sell: <strong>{sellPrice.toLocaleString()}</strong></div>
          <div className="price-row">Sell after tax: <strong>{sellAfterTax.toLocaleString()}</strong></div>
        </div>

        <div className={profitClass}>
          Profit: <strong>{profit.toLocaleString()}</strong>
        </div>
      </div>
    </div>
  );
}
