/**
 * Parameter JSON parser
 * Handles parsing and validation of JSON parameter sets from sheets
 */

import { ParameterSet } from "@/src/types/strategy";

/**
 * Flatten nested parameter objects recursively
 */
export function flattenParameters(
  params: Record<string, any>,
  prefix = "",
): ParameterSet {
  const flattened: ParameterSet = {};

  Object.entries(params).forEach(([key, value]) => {
    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      Object.assign(flattened, flattenParameters(value, fullKey));
    } else if (
      typeof value === "number" ||
      typeof value === "string" ||
      typeof value === "boolean"
    ) {
      flattened[fullKey] = value;
    }
  });

  return flattened;
}

/**
 * Validate and parse parameter JSON with extremely high resilience
 */
export function parseParameterJSON(jsonString: string): ParameterSet | null {
  try {
    if (!jsonString || String(jsonString).trim() === "") return null;

    const sanitized = String(jsonString).trim();
    let parsed: any = null;

    // 1. Try strict JSON parse first
    try {
      parsed = JSON.parse(sanitized);
    } catch (e1) {
      // 2. Try auto-wrapping with braces
      let wrapped = sanitized;
      if (!wrapped.startsWith("{") && !wrapped.startsWith("[")) {
        wrapped = "{" + wrapped.replace(/,\s*$/, "") + "}";
      }
      try {
        parsed = JSON.parse(wrapped);
      } catch (e2) {
        // 3. Fallback: Relaxed JS object parsing to handle unquoted keys,
        // trailing commas, and single quotes commonly typed by humans.
        try {
          const fn = new Function("return " + wrapped);
          parsed = fn();
        } catch (e3) {
          return null;
        }
      }
    }

    // Handle accidental double-stringification
    if (typeof parsed === "string") {
      try {
        parsed = JSON.parse(parsed);
      } catch (e) {}
    }

    if (!parsed || typeof parsed !== "object") return null;

    // Flatten nested objects (e.g. { a: { b: 1 } } -> { "a.b": 1 })
    // so the ranking engine can analyze the parameters directly.
    const flattened = flattenParameters(parsed);

    return Object.keys(flattened).length > 0 ? flattened : null;
  } catch (error) {
    return null;
  }
}

export function getParameterKeys(parameterSets: ParameterSet[]): string[] {
  const keys = new Set<string>();
  parameterSets.forEach((params) => {
    Object.keys(params).forEach((key) => keys.add(key));
  });
  return Array.from(keys).sort();
}

export function compareParameterSets(set1: ParameterSet, set2: ParameterSet) {
  const result = {
    added: {} as Record<string, unknown>,
    removed: {} as Record<string, unknown>,
    changed: {} as Record<string, { from: unknown; to: unknown }>,
    unchanged: {} as Record<string, unknown>,
  };
  const allKeys = new Set([...Object.keys(set1), ...Object.keys(set2)]);

  allKeys.forEach((key) => {
    const value1 = set1[key];
    const value2 = set2[key];
    if (!(key in set1)) result.added[key] = value2;
    else if (!(key in set2)) result.removed[key] = value1;
    else if (value1 !== value2)
      result.changed[key] = { from: value1, to: value2 };
    else result.unchanged[key] = value1;
  });
  return result;
}

export function validateParameterTypes(params: ParameterSet): boolean {
  return Object.values(params).every(
    (value) =>
      typeof value === "number" ||
      typeof value === "string" ||
      typeof value === "boolean",
  );
}

export function getParameterStats(
  parameterSets: ParameterSet[],
  paramKey: string,
) {
  const values = parameterSets
    .map((p) => p[paramKey])
    .filter((v) => v !== undefined && v !== null);
  if (values.length === 0) return { values: [] };
  const numericValues = values.filter((v) => typeof v === "number") as number[];
  if (numericValues.length === 0)
    return { values: values as (string | number)[] };

  return {
    min: Math.min(...numericValues),
    max: Math.max(...numericValues),
    avg: numericValues.reduce((a, b) => a + b, 0) / numericValues.length,
    values: values as (string | number)[],
  };
}
