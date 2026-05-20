/**
 * Parameter JSON parser
 */

import { ParameterSet } from "@/src/types/strategy";
import { parseJSON } from "@/src/utils/data";

export function parseParameterJSON(jsonString: string): ParameterSet | null {
  try {
    if (!jsonString || String(jsonString).trim() === "") return null;

    let sanitized = String(jsonString)
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201C\u201D]/g, '"')
      .trim();

    if (sanitized.includes("'") && !sanitized.includes('"')) {
      sanitized = sanitized.replace(/'/g, '"');
    }

    let parsed = parseJSON<Record<string, unknown>>(sanitized);

    if (typeof parsed === "string") {
      parsed = parseJSON<Record<string, unknown>>(parsed);
    }

    if (!parsed || typeof parsed !== "object") return null;

    const parameterSet: ParameterSet = {};

    Object.entries(parsed).forEach(([key, value]) => {
      if (
        typeof value === "number" ||
        typeof value === "string" ||
        typeof value === "boolean"
      ) {
        parameterSet[key] = value;
      }
    });

    return Object.keys(parameterSet).length > 0 ? parameterSet : null;
  } catch (error) {
    return null;
  }
}

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
