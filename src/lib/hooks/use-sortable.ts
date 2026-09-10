"use client";

import { useState, useMemo, useCallback } from "react";

export type SortDirection = "asc" | "desc" | null;

export interface SortState<T> {
  key: keyof T | null;
  direction: SortDirection;
}

export interface UseSortableReturn<T> {
  sortedData: T[];
  sortState: SortState<T>;
  toggleSort: (key: keyof T) => void;
}

function compareValues(a: unknown, b: unknown): number {
  // Handle nulls/undefined — always last
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;

  // Numbers
  if (typeof a === "number" && typeof b === "number") {
    return a - b;
  }

  // Dates (ISO strings)
  if (typeof a === "string" && typeof b === "string") {
    // Try date comparison if both look like dates
    const dateA = Date.parse(a);
    const dateB = Date.parse(b);
    if (!isNaN(dateA) && !isNaN(dateB)) {
      return dateA - dateB;
    }
    // Otherwise locale-aware string compare
    return a.localeCompare(b, "id-ID", { sensitivity: "base" });
  }

  // Fallback: convert to string
  return String(a).localeCompare(String(b), "id-ID", { sensitivity: "base" });
}

/**
 * Hook for client-side column sorting.
 * Click cycles: asc → desc → none → asc ...
 */
export function useSortable<T>(
  data: T[],
  initialKey?: keyof T | null,
  initialDirection?: SortDirection
): UseSortableReturn<T> {
  const [sortState, setSortState] = useState<SortState<T>>({
    key: initialKey ?? null,
    direction: initialDirection ?? null,
  });

  const toggleSort = useCallback((key: keyof T) => {
    setSortState((prev) => {
      if (prev.key !== key) {
        // New column: start ascending
        return { key, direction: "asc" };
      }
      // Same column: cycle asc → desc → null
      if (prev.direction === "asc") return { key, direction: "desc" };
      if (prev.direction === "desc") return { key: key, direction: null };
      return { key, direction: "asc" };
    });
  }, []);

  const sortedData = useMemo(() => {
    if (!sortState.key || !sortState.direction) return data;
    const { key, direction } = sortState;
    return [...data].sort((a, b) => {
      const cmp = compareValues(a[key], b[key]);
      return direction === "desc" ? -cmp : cmp;
    });
  }, [data, sortState]);

  return { sortedData, sortState, toggleSort };
}
