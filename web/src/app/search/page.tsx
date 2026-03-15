"use client";

import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { PaperCard } from "@/components/paper-card";
import { SearchBar } from "@/components/search-bar";
import { Sparkles, Filter, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Suspense } from "react";

function SearchResultsContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const mode = searchParams.get("mode") || "standard";
  const projectId = searchParams.get("projectId") || "1";

  const { data, isLoading, error } = useQuery({
    queryKey: ["search", projectId, query, mode],
    queryFn: () => apiClient.search.execute(Number(projectId), query, mode),
    enabled: !!query,
  });

  const handleNewSearch = (newQuery: string) => {
    // In a real app we'd push to router, here we just observe the component would re-render if we did
    window.location.href = `/search?q=${encodeURIComponent(newQuery)}&mode=${mode}&projectId=${projectId}`;
  };

  return (
    <div className="flex h-full flex-col">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center gap-4">
          <div className="flex-1">
            <SearchBar onSearch={handleNewSearch} isLoading={isLoading} />
          </div>
          <Button variant="outline" size="icon" title="Filter Results">
            <Filter className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" title="Sort Options">
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <main className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-5xl space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Search Results</h2>
              <p className="text-muted-foreground mt-1 text-sm">
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 animate-pulse text-primary" />
                    Searching across {mode === "deep" ? "6" : mode === "standard" ? "3" : "1"} sources...
                  </span>
                ) : data ? (
                  `Found ${data.papers_found} papers (${data.papers_deduped - data.already_in_project} new to project) for "${query}"`
                ) : (
                  "Enter a query to begin."
                )}
              </p>
            </div>
          </div>

          <Separator />

          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex flex-col space-y-3">
                  <Skeleton className="h-[125px] w-full rounded-xl" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-[80%]" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-destructive">
              <p className="font-semibold">Search failed</p>
              <p className="text-sm mt-1">{(error as Error).message}</p>
            </div>
          ) : data?.papers?.length ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
              {data.papers.map((paper: any) => (
                <PaperCard 
                  key={`temp-${paper.temp_index}`} 
                  paper={paper} 
                  originalProjectId={Number(projectId)} 
                  searchId={data.search_id}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
              <Sparkles className="mb-4 h-12 w-12 opacity-20" />
              <p className="text-lg font-medium">No results found</p>
              <p className="text-sm">Try adjusting your search terms or running a Deep search.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center"><Skeleton className="h-8 w-64 mx-auto mb-4" /><Skeleton className="h-96 w-full max-w-5xl mx-auto rounded-xl" /></div>}>
      <SearchResultsContent />
    </Suspense>
  );
}
