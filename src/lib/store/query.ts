import type { QueryOptions, StoredDoc, WhereClause } from "./types";

export function readField(row: unknown, field: string): unknown {
  return field.split(".").reduce<unknown>((acc, part) => {
    if (acc && typeof acc === "object" && part in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, row);
}

function matches(row: unknown, clause: WhereClause): boolean {
  const value = readField(row, clause.field);
  switch (clause.op) {
    case "==":
      return value === clause.value;
    case "!=":
      return value !== clause.value;
    case "in":
      return Array.isArray(clause.value) && clause.value.includes(value);
    case ">":
      return typeof value === "number" && typeof clause.value === "number"
        ? value > clause.value
        : String(value) > String(clause.value);
    case ">=":
      return typeof value === "number" && typeof clause.value === "number"
        ? value >= clause.value
        : String(value) >= String(clause.value);
    case "<":
      return typeof value === "number" && typeof clause.value === "number"
        ? value < clause.value
        : String(value) < String(clause.value);
    case "<=":
      return typeof value === "number" && typeof clause.value === "number"
        ? value <= clause.value
        : String(value) <= String(clause.value);
    case "array-contains":
      return Array.isArray(value) && value.includes(clause.value);
    default:
      return false;
  }
}

export function matchesAll(row: unknown, clauses: WhereClause[]): boolean {
  return clauses.every((clause) => matches(row, clause));
}

export function sortRows<T>(rows: Array<StoredDoc<T>>, orderBy?: QueryOptions["orderBy"]) {
  if (!orderBy?.length) return rows;
  return [...rows].sort((a, b) => {
    for (const clause of orderBy) {
      const left = readField(a, clause.field);
      const right = readField(b, clause.field);
      if (left === right) continue;
      if (left === undefined || left === null) return 1;
      if (right === undefined || right === null) return -1;
      const comparison =
        typeof left === "number" && typeof right === "number"
          ? left - right
          : String(left).localeCompare(String(right));
      return clause.direction === "desc" ? -comparison : comparison;
    }
    return 0;
  });
}
