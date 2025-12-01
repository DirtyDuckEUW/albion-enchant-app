"use client";

import { useState } from "react";
import "./mp-chance.css";
import { useLocalStorage } from "@/hooks/useLocalStorage";

// Quality probabilities per roll
const QUALITY_CHANCES = {
  masterpiece: 0.001,
  excellent: 0.011,
  outstanding: 0.05,
  good: 0.25,
  normal: 0.688,
};

export default function MpChancePage() {
  const [baseQuality, setBaseQuality] = useLocalStorage<string>(
    "mp_chance_base_quality",
    ""
  );
  const [food, setFood] = useLocalStorage<string>("mp_chance_food", "223");

  // Calculate total quality
  const totalQuality = (parseFloat(baseQuality) || 0) + (parseFloat(food) || 0);

  // Calculate quality chance based on rerolls - only best roll counts
  const calculateQualityChances = () => {
    if (totalQuality <= 0) {
      return {
        masterpiece: 0,
        excellent: 0,
        outstanding: 0,
        good: 0,
        normal: 0,
      };
    }

    // Calculate number of guaranteed rolls and chance for partial roll
    const guaranteedRolls = Math.floor(totalQuality / 100) + 1; // +1 for the base roll
    const partialQuality = totalQuality % 100;
    const partialRollChance = partialQuality / 100;

    // We need to calculate the probability distribution for the BEST of N rolls
    // P(best = quality X) = P(at least one roll is X or better) - P(at least one roll is better than X)

    const calculateAtLeastChance = (minChance: number, rolls: number) => {
      // Probability that at least one roll meets or exceeds this quality
      const failChance = 1 - minChance;
      return 1 - Math.pow(failChance, rolls);
    };

    // For partial roll: weighted average between guaranteed rolls and guaranteed + 1
    const atLeastMasterpiece =
      calculateAtLeastChance(QUALITY_CHANCES.masterpiece, guaranteedRolls) *
        (1 - partialRollChance) +
      calculateAtLeastChance(QUALITY_CHANCES.masterpiece, guaranteedRolls + 1) *
        partialRollChance;

    const atLeastExcellent =
      calculateAtLeastChance(
        QUALITY_CHANCES.masterpiece + QUALITY_CHANCES.excellent,
        guaranteedRolls
      ) *
        (1 - partialRollChance) +
      calculateAtLeastChance(
        QUALITY_CHANCES.masterpiece + QUALITY_CHANCES.excellent,
        guaranteedRolls + 1
      ) *
        partialRollChance;

    const atLeastOutstanding =
      calculateAtLeastChance(
        QUALITY_CHANCES.masterpiece +
          QUALITY_CHANCES.excellent +
          QUALITY_CHANCES.outstanding,
        guaranteedRolls
      ) *
        (1 - partialRollChance) +
      calculateAtLeastChance(
        QUALITY_CHANCES.masterpiece +
          QUALITY_CHANCES.excellent +
          QUALITY_CHANCES.outstanding,
        guaranteedRolls + 1
      ) *
        partialRollChance;

    const atLeastGood =
      calculateAtLeastChance(
        QUALITY_CHANCES.masterpiece +
          QUALITY_CHANCES.excellent +
          QUALITY_CHANCES.outstanding +
          QUALITY_CHANCES.good,
        guaranteedRolls
      ) *
        (1 - partialRollChance) +
      calculateAtLeastChance(
        QUALITY_CHANCES.masterpiece +
          QUALITY_CHANCES.excellent +
          QUALITY_CHANCES.outstanding +
          QUALITY_CHANCES.good,
        guaranteedRolls + 1
      ) *
        partialRollChance;

    // Calculate exact probabilities for each quality tier
    return {
      masterpiece: atLeastMasterpiece * 100,
      excellent: (atLeastExcellent - atLeastMasterpiece) * 100,
      outstanding: (atLeastOutstanding - atLeastExcellent) * 100,
      good: (atLeastGood - atLeastOutstanding) * 100,
      normal: (1 - atLeastGood) * 100,
    };
  };

  const qualityChances = calculateQualityChances();

  // Calculate reroll details for display
  const guaranteedRolls = Math.floor(totalQuality / 100) + 1; // +1 for base roll
  const partialQuality = totalQuality % 100;
  const partialRollChance = partialQuality / 100;

  return (
    <main className="page mp-chance-page">
      <h1>MP Chance</h1>

      <div className="field-row">
        <label className="field">
          <span>Base Quality</span>
          <input
            type="text"
            inputMode="decimal"
            value={baseQuality}
            onChange={(e) => setBaseQuality(e.target.value)}
            placeholder="Enter base quality"
          />
        </label>

        <label className="field">
          <span>Food</span>
          <input
            type="text"
            inputMode="decimal"
            value={food}
            onChange={(e) => setFood(e.target.value)}
            placeholder="Enter food bonus"
          />
        </label>
      </div>

      {totalQuality > 0 && (
        <section className="result">
          <h2>Results</h2>
          <p>
            Total Quality: <strong>{totalQuality}</strong>
          </p>
          <p>
            Total Rolls: <strong>{guaranteedRolls}</strong>
          </p>
          {partialQuality > 0 && (
            <p>
              Partial Roll Chance: <strong>{partialRollChance * 100}%</strong>
            </p>
          )}
          <hr className="sep" />
          <p>
            Masterpiece Chance:{" "}
            <strong>{qualityChances.masterpiece.toFixed(2)}%</strong>
          </p>
          <p>
            Excellent Chance:{" "}
            <strong>{qualityChances.excellent.toFixed(2)}%</strong>
          </p>
          <p>
            Outstanding Chance:{" "}
            <strong>{qualityChances.outstanding.toFixed(2)}%</strong>
          </p>
          <p>
            Good Chance: <strong>{qualityChances.good.toFixed(2)}%</strong>
          </p>
          <p>
            Normal Chance: <strong>{qualityChances.normal.toFixed(2)}%</strong>
          </p>
          <hr className="sep" />
          <p className="muted">Base Quality Probabilities:</p>
          <p>
            Masterpiece:{" "}
            <strong>{(QUALITY_CHANCES.masterpiece * 100).toFixed(2)}%</strong>
          </p>
          <p>
            Excellent:{" "}
            <strong>{(QUALITY_CHANCES.excellent * 100).toFixed(2)}%</strong>
          </p>
          <p>
            Outstanding:{" "}
            <strong>{(QUALITY_CHANCES.outstanding * 100).toFixed(2)}%</strong>
          </p>
          <p>
            Good: <strong>{(QUALITY_CHANCES.good * 100).toFixed(2)}%</strong>
          </p>
          <p>
            Normal:{" "}
            <strong>{(QUALITY_CHANCES.normal * 100).toFixed(2)}%</strong>
          </p>
        </section>
      )}
    </main>
  );
}
