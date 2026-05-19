/**
 * Error Alert Component
 * Displays error messages to the user
 */

"use client";

import { ApiErrorResponse } from "@/src/types/strategy";

interface ErrorAlertProps {
  error: ApiErrorResponse | string;
  onDismiss?: () => void;
}

export function ErrorAlert({ error, onDismiss }: ErrorAlertProps) {
  const message = typeof error === "string" ? error : error.error;
  const code = typeof error === "string" ? "ERROR" : error.code;

  return (
    <div className="bg-red-50 border border-red-300 rounded-lg p-4 mb-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-red-800 mb-1">Error: {code}</h3>
          <p className="text-red-700">{message}</p>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-red-700 hover:text-red-900 font-bold text-xl leading-none"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}
