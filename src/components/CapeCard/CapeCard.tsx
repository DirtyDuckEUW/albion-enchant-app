"use client";

import "./cape-card.css";
import { calculateSellAfterTax } from "../../lib/utility";

export type CapeCardProps = {
  uniqueName: string;
  name: string;
  amount?: number;
  onAmountChange?: (uniqueName: string, amount: number) => void;
  crestCost?: number;
  heartCost?: number;
  heartQuantity?: number;
  baseCapePrice?: number;
  resourceCost?: number;
  totalCraftCost: number;
  perItemCraftCost?: number;
  sellPrice?: number;
  showSellPrice?: boolean;
  crestId?: string;
  heartId?: string;
  onCrestPriceChange?: (crestId: string, price: number) => void;
  onHeartPriceChange?: (heartId: string, price: number) => void;
  isEditableCrest?: boolean;
  isEditableHeart?: boolean;
  onSellPriceChange?: (uniqueName: string, price: number) => void;
  isEditableSellPrice?: boolean;
};

export default function CapeCard({
  uniqueName,
  name,
  amount,
  onAmountChange,
  crestCost,
  heartCost,
  heartQuantity = 1,
  baseCapePrice,
  resourceCost,
  totalCraftCost,
  perItemCraftCost,
  sellPrice = 0,
  showSellPrice = true,
  crestId,
  heartId,
  onCrestPriceChange,
  onHeartPriceChange,
  isEditableCrest = false,
  isEditableHeart = false,
  onSellPriceChange,
  isEditableSellPrice = false,
}: CapeCardProps) {
  return (
    <div className={`cape-card ${uniqueName}`}>
      <div className="card-header">
        <div className="thumb">
          <img
            src={`https://render.albiononline.com/v1/item/${uniqueName}.png?quality=4`}
            alt={name}
          />
        </div>
        <div className="title">
          <span>{name}</span>
          {amount !== undefined && onAmountChange && (
            <input
              type="number"
              min="0"
              step="1"
              value={amount}
              onChange={(e) => {
                const val =
                  e.target.value === "" ? 0 : parseInt(e.target.value, 10);
                onAmountChange(uniqueName, isNaN(val) ? 0 : val);
              }}
              className="price-input"
            />
          )}
        </div>
      </div>

      <div className="card-body">
        {/* Crafting Costs */}
        <div className="crafting-section">
          <h4>Crafting Cost</h4>
          {resourceCost !== undefined && (
            <div className="cost-row">
              Resources: <strong>{resourceCost.toLocaleString()}</strong>
            </div>
          )}
          {baseCapePrice !== undefined && (
            <div className="cost-row">
              Base Cape: <strong>{baseCapePrice.toLocaleString()}</strong>
            </div>
          )}
          {crestCost !== undefined && (
            <div className="cost-row">
              Crest:
              {isEditableCrest && crestId && onCrestPriceChange ? (
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={crestCost || ""}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    onCrestPriceChange(crestId, isNaN(val) ? 0 : val);
                  }}
                  className="price-input"
                />
              ) : (
                <strong>{crestCost.toLocaleString()}</strong>
              )}
            </div>
          )}
          {heartCost !== undefined && (
            <div className="cost-row">
              <span>
                Heart ({heartQuantity}x @ {heartCost.toLocaleString()}):
              </span>
              {isEditableHeart && heartId && onHeartPriceChange ? (
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={heartCost || ""}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    onHeartPriceChange(heartId, isNaN(val) ? 0 : val);
                  }}
                  className="price-input"
                />
              ) : (
                <strong>{(heartCost * heartQuantity).toLocaleString()}</strong>
              )}
            </div>
          )}
          <div className="cost-row total">
            <strong>Total: {totalCraftCost.toLocaleString()}</strong>
          </div>
        </div>

        {/* Sell Price and Profit */}
        {showSellPrice && (
          <div className="sell-section">
            <h4>Profit</h4>
            <div className="sell-row">
              <span className="label">Sell Price:</span>
              {isEditableSellPrice && onSellPriceChange ? (
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={sellPrice || ""}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    onSellPriceChange(uniqueName, isNaN(val) ? 0 : val);
                  }}
                  className="price-input"
                />
              ) : (
                <strong>{sellPrice.toLocaleString()}</strong>
              )}
            </div>
            <div className="sell-row">
              <span className="label">After Tax:</span>
              <strong>
                {calculateSellAfterTax(sellPrice).toLocaleString()}
              </strong>
            </div>
            <div className="profit-row">
              <span className="label">Profit:</span>
              <strong
                className={
                  Math.round(
                    calculateSellAfterTax(sellPrice) -
                      (perItemCraftCost ?? totalCraftCost)
                  ) >= 0
                    ? "positive"
                    : "negative"
                }
              >
                {(perItemCraftCost ?? totalCraftCost) > 0 ? (
                  <>
                    {Math.round(
                      (calculateSellAfterTax(sellPrice) -
                        (perItemCraftCost ?? totalCraftCost)) *
                        (amount !== undefined ? amount : 0)
                    ) >= 0
                      ? "+"
                      : ""}
                    {Math.round(
                      (calculateSellAfterTax(sellPrice) -
                        (perItemCraftCost ?? totalCraftCost)) *
                        (amount !== undefined ? amount : 0)
                    ).toLocaleString()}{" "}
                    (
                    {(
                      (Math.round(
                        calculateSellAfterTax(sellPrice) -
                          (perItemCraftCost ?? totalCraftCost)
                      ) /
                        (perItemCraftCost ?? totalCraftCost)) *
                      100
                    ).toFixed(1)}
                    %)
                  </>
                ) : (
                  "-"
                )}
              </strong>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
