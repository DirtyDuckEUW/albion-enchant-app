"use client";

import type { ReturnRateOption } from "@/types/shared";

interface ReturnRateInputProps {
  returnRate: ReturnRateOption | string;
  setReturnRate: (value: string) => void;
}

export default function ReturnRateInput({
  returnRate,
  setReturnRate,
}: ReturnRateInputProps) {
  return (
    <div className="filter-field">
      <label>Return Rate (%)</label>
      <select
        value={returnRate}
        onChange={(e) => setReturnRate(e.target.value)}
      >
        <option value="15.25">15.25%</option>
        <option value="24.81">24.81%</option>
        <option value="43.50">43.50%</option>
        <option value="47.92">47.92%</option>
        <option value="57.49">57.49%</option>
      </select>
    </div>
  );
}
