/**
 * Filter Controls Component
 * Allows users to select strategy and market conditions
 */

"use client";

import { FilterOptions } from "@/src/types/strategy";
import { useState } from "react";

interface FilterControlsProps {
  strategies: string[];
  marketConditions: string[];
  onFilter: (filters: FilterOptions) => void;
  loading?: boolean;
}

export function FilterControls({
  strategies,
  marketConditions,
  onFilter,
  loading = false,
}: FilterControlsProps) {
  const [selectedStrategy, setSelectedStrategy] = useState<string>(
    strategies[0] || "",
  );
  const [selectedMarketCondition, setSelectedMarketCondition] =
    useState<string>("");

  const handleFilter = () => {
    onFilter({
      strategy: selectedStrategy,
      marketCondition: selectedMarketCondition || undefined,
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-bold text-slate-800 mb-4">Filters</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Strategy Selector */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Strategy <span className="text-red-500">*</span>
          </label>
          <select
            value={selectedStrategy}
            onChange={(e) => setSelectedStrategy(e.target.value)}
            disabled={loading}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
          >
            <option value="">Select a strategy</option>
            {strategies.map((strategy) => (
              <option key={strategy} value={strategy}>
                {strategy}
              </option>
            ))}
          </select>
        </div>

        {/* Market Condition Selector */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Market Condition
          </label>
          <select
            value={selectedMarketCondition}
            onChange={(e) => setSelectedMarketCondition(e.target.value)}
            disabled={loading}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
          >
            <option value="">All conditions</option>
            {marketConditions.map((condition) => (
              <option key={condition} value={condition}>
                {condition}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Submit Button */}
      <button
        onClick={handleFilter}
        disabled={loading || !selectedStrategy}
        className="w-full md:w-auto px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? "Loading..." : "Get Recommendation"}
      </button>
    </div>
  );
}
