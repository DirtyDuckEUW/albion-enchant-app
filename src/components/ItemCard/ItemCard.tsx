"use client";

import React from "react";
import "./item-card.css";
import { MARKET_TAX } from "../../lib/constants";

export type ItemCardProps = {
  imageSrc?: string;
  name: string;
  buyPrice: number;
  sellPrice: number;
  className?: string;
};

export default function ItemCard({ imageSrc, name, buyPrice, sellPrice, className }: ItemCardProps) {
  const taxAmount = Number.isFinite(sellPrice) ? sellPrice * MARKET_TAX : 0;
  const sellAfterTax = Number.isFinite(sellPrice) ? sellPrice - taxAmount : 0;
  const profit = sellAfterTax - buyPrice;

  const profitClass = profit >= 0 ? "profit positive" : "profit negative";

  return (
    <div className={`item-card ${className ?? ""}`}>
      <div className="thumb">
        {imageSrc ? (
          <img src={imageSrc} alt={name} />
        ) : (
          <div className="placeholder">No Image</div>
        )}
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
