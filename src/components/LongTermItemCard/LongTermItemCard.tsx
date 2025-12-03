"use client";

import "./long-term-item-card.css";

export type LongTermItemCardProps = {
  uniqueName: string;
  name: string;
  artefactCost: number;
  onArtefactCostChange: (value: number) => void;
  craftCost: number;
  sellPrice: number;
  onSellPriceChange: (value: number) => void;
  amountPerDay: number;
  onAmountPerDayChange: (value: number) => void;
  profit: number;
  profitPercentage: number;
};

export default function LongTermItemCard({
  uniqueName,
  name,
  artefactCost,
  onArtefactCostChange,
  craftCost,
  sellPrice,
  onSellPriceChange,
  amountPerDay,
  onAmountPerDayChange,
  profit,
  profitPercentage,
}: LongTermItemCardProps) {
  return (
    <div className="long-term-item-card">
      <div className="card-image">
        <img
          src={`https://render.albiononline.com/v1/item/${uniqueName}.png?quality=4`}
          alt={name}
        />
      </div>
      <div className="card-name">{name}</div>
      <div className="card-field">
        <label>Artefact</label>
        <input
          type="text"
          inputMode="decimal"
          value={artefactCost}
          onChange={(e) =>
            onArtefactCostChange(parseFloat(e.target.value) || 0)
          }
        />
      </div>
      <div className="card-field">
        <label>Craft</label>
        <div className="card-value">{craftCost}</div>
      </div>
      <div className="card-field">
        <label>Sell</label>
        <input
          type="text"
          inputMode="decimal"
          value={sellPrice}
          onChange={(e) => onSellPriceChange(parseFloat(e.target.value) || 0)}
        />
      </div>
      <div className="card-field">
        <label>Amount/Day</label>
        <input
          type="text"
          inputMode="decimal"
          value={amountPerDay}
          onChange={(e) =>
            onAmountPerDayChange(parseFloat(e.target.value) || 0)
          }
        />
      </div>
      <div className="card-field">
        <label>Profit</label>
        <div
          className="card-value"
          style={{
            color: profit >= 0 ? "#a6e3a1" : "#f38ba8",
            fontWeight: "600",
          }}
        >
          {profit}
          {craftCost > 0 && (
            <span style={{ marginLeft: "0.25rem", fontSize: "0.85rem" }}>
              ({profitPercentage.toFixed(2)}%)
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
