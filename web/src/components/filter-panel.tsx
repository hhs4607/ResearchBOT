"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Filter } from "lucide-react";

interface FilterPanelProps {
  onFilterChange: (filters: Record<string, any>) => void;
  showIncludeStatus?: boolean;
}

export function FilterPanel({ onFilterChange, showIncludeStatus = false }: FilterPanelProps) {
  // In a real app, this would use local state to track checked filters
  // and then bubble up `onFilterChange` when apply is clicked or on change.
  // We're keeping it static for the mockup.

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger>
          <div className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3 gap-1">
            <Filter className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
              Filter
            </span>
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[200px]">
          <DropdownMenuLabel>Sources</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuCheckboxItem checked>OpenAlex</DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem checked>Semantic Scholar</DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem>arXiv</DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem>CrossRef</DropdownMenuCheckboxItem>
          
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Publication Year</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuCheckboxItem>Last 2 Years</DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem>Last 5 Years</DropdownMenuCheckboxItem>

          {showIncludeStatus && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem checked>Included</DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked>Undecided</DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem>Excluded</DropdownMenuCheckboxItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
