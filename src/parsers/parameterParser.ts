/**
 * Parameter JSON parser
 * Handles parsing and validation of JSON parameter sets from sheets
 */

import { ParameterSet } from "@/src/types/strategy";
import { parseJSON, validateNumericField } from "@/src/utils/data";
import { logger, AppError } from "@/src/utils/errors";

/**
 * Validate and parse parameter JSON
 */
export function parseParameterJSON(jsonString: string): ParameterSet | null {
  try {
    if (!jsonString || jsonString.trim() === "") {
      return null;
    }

    const parsed = parseJSON<Record<string, unknown>>(jsonString);

    if (!parsed || typeof parsed !== "object") {
      logger("warn", "Invalid parameter JSON: not an object", { jsonString });
      return null;
    }

    // Convert to ParameterSet (ensure values are valid)
    const parameterSet: ParameterSet = {};

    Object.entries(parsed).forEach(([key, value]) => {
      // Allow numbers, strings, and booleans
      if (
        typeof value === "number" ||
        typeof value === "string" ||
        typeof value === "boolean"
      ) {
        parameterSet[key] = value;
      } else {
        logger("warn", `Skipping parameter with invalid type`, {
          key,
          valueType: typeof value,
        });
      }
    });

    return Object.keys(parameterSet).length > 0 ? parameterSet : null;
  } catch (error) {
    logger("warn", "Failed to parse parameter JSON", { jsonString, error });
    return null;
  }
}

/**
 * Flatten nested parameter objects
 */
export function flattenParameters(
  params: ParameterSet,
  prefix = "",
): ParameterSet {
  const flattened: ParameterSet = {};

  Object.entries(params).forEach(([key, value]) => {
    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      Object.assign(
        flattened,
        flattenParameters(value as ParameterSet, fullKey),
      );
    } else {
      flattened[fullKey] = value;
    }
  });

  return flattened;
}

/**
 * Get parameter keys from multiple experiments
 */
export function getParameterKeys(parameterSets: ParameterSet[]): string[] {
  const keys = new Set<string>();

  parameterSets.forEach((params) => {
    Object.keys(params).forEach((key) => keys.add(key));
  });

  return Array.from(keys).sort();
}

/**
 * Compare two parameter sets
 */
export function compareParameterSets(
  set1: ParameterSet,
  set2: ParameterSet,
): {
  added: Record<string, unknown>;
  removed: Record<string, unknown>;
  changed: Record<string, { from: unknown; to: unknown }>;
  unchanged: Record<string, unknown>;
} {
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

    if (!(key in set1)) {
      result.added[key] = value2;
    } else if (!(key in set2)) {
      result.removed[key] = value1;
    } else if (value1 !== value2) {
      result.changed[key] = { from: value1, to: value2 };
    } else {
      result.unchanged[key] = value1;
    }
  });

  return result;
}

/**
 * Validate parameter types
 */
export function validateParameterTypes(params: ParameterSet): boolean {
  return Object.values(params).every(
    (value) =>
      typeof value === "number" ||
      typeof value === "string" ||
      typeof value === "boolean",
  );
}

/**
 * Get parameter statistics
 */
export function getParameterStats(
  parameterSets: ParameterSet[],
  paramKey: string,
): {
  min?: number;
  max?: number;
  avg?: number;
  values: (string | number)[];
} {
  const values = parameterSets
    .map((p) => p[paramKey])
    .filter((v) => v !== undefined && v !== null);

  if (values.length === 0) {
    return { values: [] };
  }

  const numericValues = values.filter((v) => typeof v === "number") as number[];

  if (numericValues.length === 0) {
    return { values: values as (string | number)[] };
  }

  return {
    min: Math.min(...numericValues),
    max: Math.max(...numericValues),
    avg: numericValues.reduce((a, b) => a + b, 0) / numericValues.length,
    values: values as (string | number)[],
  };
}
