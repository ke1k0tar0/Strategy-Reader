/**
 * Parameter JSON parser
 */
import { ParameterSet } from "@/src/types/strategy";

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

export function parseParameterJSON(jsonString: string): ParameterSet | null {
  try {
    if (
      !jsonString ||
      String(jsonString).trim() === "" ||
      jsonString.trim() === "-"
    )
      return null;

    let sanitized = String(jsonString).trim();
    let parsed: any = null;

    try {
      parsed = JSON.parse(sanitized);
    } catch (e1) {
      // Auto-wrap if braces are missing
      let wrapped = sanitized;
      if (!wrapped.startsWith("{") && !wrapped.startsWith("[")) {
        wrapped = "{" + wrapped.replace(/,\s*$/, "") + "}";
      }
      try {
        parsed = JSON.parse(wrapped);
      } catch (e2) {
        // Fallback to relaxed JS evaluation for human-typed objects
        try {
          const fn = new Function("return " + wrapped);
          parsed = fn();
        } catch (e3) {
          return null;
        }
      }
    }

    if (typeof parsed === "string") {
      try {
        parsed = JSON.parse(parsed);
      } catch (e) {}
    }

    if (!parsed || typeof parsed !== "object") return null;

    const flattened = flattenParameters(parsed);
    return Object.keys(flattened).length > 0 ? flattened : null;
  } catch (error) {
    return null;
  }
}

export function getParameterKeys(parameterSets: ParameterSet[]): string[] {
  const keys = new Set<string>();
  parameterSets.forEach((params) =>
    Object.keys(params).forEach((key) => keys.add(key)),
  );
  return Array.from(keys).sort();
}

export function validateParameterTypes(params: ParameterSet): boolean {
  return Object.values(params).every(
    (value) =>
      typeof value === "number" ||
      typeof value === "string" ||
      typeof value === "boolean",
  );
}
