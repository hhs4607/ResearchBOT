"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Filter, Search } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export interface FilterState {
  is_included?: string;
  year_min?: number;
  year_max?: number;
  q?: string;
}

interface FilterPanelProps {
  onFilterChange: (filters: FilterState) => void;
  showIncludeStatus?: boolean;
}

export function FilterPanel({ onFilterChange, showIncludeStatus = false }: FilterPanelProps) {
  const [open, setOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>({});
  const [searchText, setSearchText] = useState("");

  const handleApply = () => {
    const applied: FilterState = { ...filters };
    if (searchText.trim()) {
      applied.q = searchText.trim();
    }
    onFilterChange(applied);
    setOpen(false);
  };

  const handleClear = () => {
    setFilters({});
    setSearchText("");
    onFilterChange({});
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className="inline-flex shrink-0 items-center justify-center rounded-lg border border-border bg-background text-sm font-medium hover:bg-muted hover:text-foreground h-7 gap-1 px-2.5">
        <Filter className="h-4 w-4" />
        Filter
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[280px] p-4">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Search in titles & abstracts</label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="e.g., neural network"
                className="pl-8"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </div>
          </div>

          {showIncludeStatus && (
            <>
              <Separator />
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <div className="space-y-2">
                  {[
                    { label: "Included", value: "true" },
                    { label: "Excluded", value: "false" },
                    { label: "Undecided", value: "null" },
                  ].map((opt) => (
                    <label key={opt.value} className="flex items-center gap-2 text-sm cursor-pointer">
                      <Checkbox
                        checked={filters.is_included === opt.value}
                        onCheckedChange={(checked) => {
                          setFilters(prev => ({
                            ...prev,
                            is_included: checked ? opt.value : undefined,
                          }));
                        }}
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
              </div>
            </>
          )}

          <Separator />
          <div className="space-y-2">
            <label className="text-sm font-medium">Year Range</label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                placeholder="From"
                className="w-24"
                value={filters.year_min || ""}
                onChange={(e) => setFilters(prev => ({ ...prev, year_min: e.target.value ? parseInt(e.target.value) : undefined }))}
              />
              <span className="text-muted-foreground">&mdash;</span>
              <Input
                type="number"
                placeholder="To"
                className="w-24"
                value={filters.year_max || ""}
                onChange={(e) => setFilters(prev => ({ ...prev, year_max: e.target.value ? parseInt(e.target.value) : undefined }))}
              />
            </div>
          </div>

          <Separator />
          <div className="flex justify-between">
            <Button variant="ghost" size="sm" onClick={handleClear}>Clear all</Button>
            <Button size="sm" onClick={handleApply} className="gap-2">
              <Filter className="h-3 w-3" /> Apply
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
