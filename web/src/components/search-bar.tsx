"use client";

import { useState, useEffect } from "react";
import { Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface SearchBarProps {
  onSearch: (query: string) => void;
  isLoading?: boolean;
  defaultValue?: string;
}

export function SearchBar({ onSearch, isLoading = false, defaultValue = "" }: SearchBarProps) {
  const [query, setQuery] = useState(defaultValue);

  useEffect(() => {
    if (defaultValue) setQuery(defaultValue);
  }, [defaultValue]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex w-full items-center gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input
          type="search"
          name="search_query"
          aria-label="Search papers"
          placeholder="Search papers across multiple sources…"
          autoComplete="off"
          className="h-12 w-full rounded-full bg-background pl-10 pr-4 text-base shadow-sm focus-visible:ring-primary"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={isLoading}
        />
      </div>
      <Button
        type="submit"
        size="lg"
        disabled={!query.trim() || isLoading}
        className="h-12 rounded-full px-8 gap-2"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Searching…
          </>
        ) : (
          "Search"
        )}
      </Button>
    </form>
  );
}
