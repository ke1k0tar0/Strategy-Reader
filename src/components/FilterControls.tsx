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
  const [customStrategies, setCustomStrategies] = useState<string[]>([]);
  const [selectedStrategy, setSelectedStrategy] = useState<string>("");
  const [selectedMarketCondition, setSelectedMarketCondition] =
    useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>(""); // <-- New Date State

  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newStrategyName, setNewStrategyName] = useState("");

  useEffect(() => {
    const savedCustom = localStorage.getItem("custom_strategies");
    const parsedCustom = savedCustom ? JSON.parse(savedCustom) : [];

    setCustomStrategies(parsedCustom);
    const combined = Array.from(new Set([...strategies, ...parsedCustom]));

    setAvailableStrategies(combined);
    if (!selectedStrategy && combined.length > 0) {
      setSelectedStrategy(combined[0]);
    }
  }, [strategies, selectedStrategy]);

  const handleAddStrategy = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newStrategyName.trim();
    if (!name) return;

    const updatedCustom = Array.from(new Set([...customStrategies, name]));
    localStorage.setItem("custom_strategies", JSON.stringify(updatedCustom));
    setCustomStrategies(updatedCustom);

    const combined = Array.from(new Set([...strategies, ...updatedCustom]));
    setAvailableStrategies(combined);
    setSelectedStrategy(name);

    setNewStrategyName("");
    setIsAddingNew(false);
  };

  const handleRemoveStrategy = () => {
    if (!selectedStrategy) return;
    const updatedCustom = customStrategies.filter(
      (s) => s !== selectedStrategy,
    );
    localStorage.setItem("custom_strategies", JSON.stringify(updatedCustom));
    setCustomStrategies(updatedCustom);

    const combined = Array.from(new Set([...strategies, ...updatedCustom]));
    setAvailableStrategies(combined);
    setSelectedStrategy(combined[0] || "");
  };

  const handleFilter = () => {
    if (!selectedStrategy) return;
    onFilter({
      strategy: selectedStrategy,
      marketCondition: selectedMarketCondition || undefined,
      date: selectedDate || undefined, // <-- Pass the date filter state up
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
            className="px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-slate-300 transition-all shadow-sm"
          >
            Save to List
          </button>
        </form>
      )}

      {/* Grid updated to 3 columns to accommodate the Date Picker */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div>
          <div className="flex justify-between items-end mb-2">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
              Target Strategy <span className="text-red-400">*</span>
            </label>
            {customStrategies.includes(selectedStrategy) && (
              <button
                onClick={handleRemoveStrategy}
                className="text-xs font-semibold text-red-500 hover:text-red-700 transition-colors flex items-center gap-1"
                title="Remove custom strategy"
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                Delete Custom
              </button>
            )}
          </div>
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
                {strategy}{" "}
                {customStrategies.includes(strategy) ? " (Custom)" : ""}
              </option>
            ))}
          </select>
        </div>

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

        {/* New Date Filter Component */}
        <div>
          <div className="flex justify-between items-end mb-2">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
              Target Date Filter
            </label>
            {selectedDate && (
              <button
                onClick={() => setSelectedDate("")}
                className="text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors"
                title="Clear date selection"
              >
                Clear
              </button>
            )}
          </div>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            disabled={loading}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all disabled:opacity-50 font-medium text-slate-700 cursor-pointer"
          />
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
