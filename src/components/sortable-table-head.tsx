"use client";

import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { TableHead } from "@/components/ui/table";
import type { SortDirection } from "@/lib/hooks/use-sortable";

interface SortableTableHeadProps<T> {
  label: string;
  sortKey: keyof T;
  currentSortKey: keyof T | null;
  direction: SortDirection;
  onSort: (key: keyof T) => void;
  className?: string;
}

export function SortableTableHead<T>({
  label,
  sortKey,
  currentSortKey,
  direction,
  onSort,
  className,
}: SortableTableHeadProps<T>) {
  const isActive = currentSortKey === sortKey && direction !== null;
  const Icon =
    isActive && direction === "asc"
      ? ArrowUp
      : isActive && direction === "desc"
        ? ArrowDown
        : ArrowUpDown;

  return (
    <TableHead className={className}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={`inline-flex items-center gap-1 hover:text-foreground transition-colors ${
          isActive ? "text-foreground font-semibold" : "text-muted-foreground"
        }`}
      >
        {label}
        <Icon className="size-3.5" />
      </button>
    </TableHead>
  );
}
