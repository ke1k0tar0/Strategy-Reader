"use client";

import { FilterOptions } from "@/src/types/strategy";
import { useState, useEffect } from "react";

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
  const [availableStrategies, setAvailableStrategies] = useState<string[]>([]);
  const [selectedStrategy, setSelectedStrategy] = useState<string>("");
  const [selectedMarketCondition, setSelectedMarketCondition] =
    useState<string>("");

  // New Strategy State
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newStrategyName, setNewStrategyName] = useState("");

  // Initialize and load custom strategies from localStorage
  useEffect(() => {
    const savedCustom = localStorage.getItem("custom_strategies");
    const customStrategies = savedCustom ? JSON.parse(savedCustom) : [];
    const combined = Array.from(new Set([...strategies, ...customStrategies]));

    setAvailableStrategies(combined);
    if (!selectedStrategy && combined.length > 0) {
      setSelectedStrategy(combined[0]);
    }
  }, [strategies, selectedStrategy]);

  const handleAddStrategy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStrategyName.trim()) return;

    const name = newStrategyName.trim();
    const updated = Array.from(new Set([...availableStrategies, name]));

    // Update local state and storage
    setAvailableStrategies(updated);
    const savedCustom = localStorage.getItem("custom_strategies");
    const customStrategies = savedCustom ? JSON.parse(savedCustom) : [];
    if (!customStrategies.includes(name)) {
      localStorage.setItem(
        "custom_strategies",
        JSON.stringify([...customStrategies, name]),
      );
    }

    setSelectedStrategy(name);
    setNewStrategyName("");
    setIsAddingNew(false);
  };

  const handleFilter = () => {
    if (!selectedStrategy) return;
    onFilter({
      strategy: selectedStrategy,
      marketCondition: selectedMarketCondition || undefined,
    });
  };

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-slate-100 p-6 mb-8 transition-all">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-slate-800 tracking-tight">
          Configuration Parameters
        </h2>
        <button
          onClick={() => setIsAddingNew(!isAddingNew)}
          className="text-sm font-medium text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-full transition-colors"
        >
          {isAddingNew ? "Cancel" : "+ Add Custom Strategy"}
        </button>
      </div>

      {/* Add New Strategy Panel */}
      {isAddingNew && (
        <form
          onSubmit={handleAddStrategy}
          className="mb-6 p-4 bg-slate-50 rounded-xl border border-blue-100 flex gap-3 items-end animate-in fade-in slide-in-from-top-2"
        >
          <div className="flex-1">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              New Strategy Name
            </label>
            <input
              type="text"
              placeholder="e.g., 1D Macro Trend..."
              value={newStrategyName}
              onChange={(e) => setNewStrategyName(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              autoFocus
            />
          </div>
          <button
            type="submit"
            disabled={!newStrategyName.trim()}
            className="px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all shadow-sm"
          >
            Save to List
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Strategy Selector */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            Target Strategy <span className="text-red-400">*</span>
          </label>
          <select
            value={selectedStrategy}
            onChange={(e) => setSelectedStrategy(e.target.value)}
            disabled={loading}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all disabled:opacity-50 appearance-none font-medium text-slate-700 cursor-pointer"
          >
            <option value="" disabled>
              Select a strategy...
            </option>
            {availableStrategies.map((strategy) => (
              <option key={strategy} value={strategy}>
                {strategy}
              </option>
            ))}
          </select>
        </div>

        {/* Market Condition Selector */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            Market Condition Filter
          </label>
          <select
            value={selectedMarketCondition}
            onChange={(e) => setSelectedMarketCondition(e.target.value)}
            disabled={loading}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all disabled:opacity-50 appearance-none font-medium text-slate-700 cursor-pointer"
          >
            <option value="">All Market Conditions</option>
            {marketConditions.map((condition) => (
              <option key={condition} value={condition}>
                {condition}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button
        onClick={handleFilter}
        disabled={loading || !selectedStrategy}
        className="w-full md:w-auto px-8 py-3 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg transform active:scale-[0.98]"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Analyzing Data...
          </span>
        ) : (
          "Generate Optimization Report"
        )}
      </button>
    </div>
  );
}
