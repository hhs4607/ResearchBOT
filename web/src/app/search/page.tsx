"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { useProject } from "@/lib/project-context";
import { PaperCard } from "@/components/paper-card";
import { SearchBar } from "@/components/search-bar";
import {
  Sparkles,
  SlidersHorizontal,
  FolderOpen,
  ArrowLeft,
  BookOpen,
  FileDown,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Suspense, useState, useEffect } from "react";

function SearchResultsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get("q") || "";
  const mode = searchParams.get("mode") || "standard";
  const { projectId, setProjectId, projects, isLoading: projectsLoading } = useProject();

  const [savingAll, setSavingAll] = useState(false);
  const [savedAll, setSavedAll] = useState(false);

  // Reset savedAll when query or project changes
  useEffect(() => {
    setSavedAll(false);
  }, [query, projectId]);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["search", projectId, query, mode],
    queryFn: () => apiClient.search.execute(Number(projectId), query, mode),
    enabled: !!query && !!projectId,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const handleNewSearch = (newQuery: string) => {
    const params = new URLSearchParams({
      q: newQuery,
      mode,
      projectId: projectId?.toString() || "",
    });
    router.push(`/search?${params.toString()}`);
  };

  const currentProject = projects.find((p) => p.id === projectId);

  const handleSaveAll = async () => {
    if (!data?.papers?.length || !data?.search_id || !projectId) return;
    setSavingAll(true);
    try {
      const unsavedPapers = data.papers.filter((p: any) => !p.already_saved);
      if (unsavedPapers.length === 0) return;
      const selections = unsavedPapers.map((p: any) => ({
        temp_index: p.temp_index,
        is_included: null,
      }));
      await apiClient.papers.save(Number(projectId), data.search_id, selections);
      setSavedAll(true);
      refetch();
    } catch (error) {
      console.error("Failed to save all papers", error);
    } finally {
      setSavingAll(false);
    }
  };

  const unsavedCount = data?.papers?.filter((p: any) => !p.already_saved).length || 0;

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="mx-auto max-w-6xl px-6 py-4 space-y-3">
          {/* Top row: navigation + project */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Home
              </Link>
              <Separator orientation="vertical" className="h-6" />
              <div className="flex items-center gap-2 text-sm">
                <FolderOpen className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                {projectsLoading ? (
                  <Skeleton className="h-8 w-40" />
                ) : (
                  <Select
                    value={projectId?.toString() || ""}
                    onValueChange={(v) => v && setProjectId(parseInt(v))}
                  >
                    <SelectTrigger className="h-8 w-auto min-w-[160px] text-sm">
                      <SelectValue placeholder="Select project">
                        {(value: string) => {
                          const p = projects.find((proj) => proj.id.toString() === value);
                          return p ? p.name : value;
                        }}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((p) => (
                        <SelectItem key={p.id} value={p.id.toString()}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
            <Badge variant="outline" className="text-xs capitalize">
              {mode} search
            </Badge>
          </div>

          {/* Search bar */}
          <SearchBar onSearch={handleNewSearch} isLoading={isLoading} defaultValue={query} />
        </div>
      </header>

      {/* Results area */}
      <main className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-6xl space-y-6">
          {/* Results summary bar */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Search Results</h2>
              <p className="text-muted-foreground mt-1 text-sm">
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 animate-pulse text-primary" aria-hidden="true" />
                    Searching across{" "}
                    {mode === "deep" ? "6" : mode === "standard" ? "3" : "1"}{" "}
                    sources for &quot;{query}&quot;...
                  </span>
                ) : data ? (
                  <>
                    Found <strong>{data.papers_found || data.papers?.length || 0}</strong> papers
                    {data.papers_deduped ? ` (${data.papers_deduped} deduplicated)` : ""}
                    {data.already_in_project ? ` · ${data.already_in_project} already in project` : ""}
                    {" "}for &quot;{query}&quot;
                  </>
                ) : (
                  "Enter a query to begin."
                )}
              </p>
            </div>

            {/* Bulk save button */}
            {data?.papers?.length > 0 && unsavedCount > 0 && !savedAll && (
              <Button
                variant="default"
                size="sm"
                onClick={handleSaveAll}
                disabled={savingAll}
                className="gap-1.5"
              >
                {savingAll ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Saving all…
                  </>
                ) : (
                  <>
                    <FileDown className="h-4 w-4" /> Save all {unsavedCount} to DB
                  </>
                )}
              </Button>
            )}
            {savedAll && (
              <Badge className="bg-green-600 text-white gap-1">
                <CheckCircle2 className="h-3 w-3" /> All saved
              </Badge>
            )}
          </div>

          <Separator />

          {/* Loading state */}
          {isLoading && (
            <div className="grid gap-6 md:grid-cols-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex flex-col space-y-3">
                  <Skeleton className="h-[180px] w-full rounded-xl" />
                </div>
              ))}
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-6">
              <p className="font-semibold text-destructive">Search failed</p>
              <p className="text-sm mt-1 text-destructive/80">
                {(error as Error).message}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => refetch()}
              >
                Retry
              </Button>
            </div>
          )}

          {/* Results grid */}
          {!isLoading && !error && data?.papers?.length > 0 && (
            <div className="grid gap-6 md:grid-cols-2">
              {data.papers.map((paper: any) => (
                <PaperCard
                  key={`temp-${paper.temp_index}`}
                  paper={paper}
                  originalProjectId={Number(projectId)}
                  searchId={data.search_id}
                />
              ))}
            </div>
          )}

          {/* Empty state */}
          {!isLoading && !error && data && data.papers?.length === 0 && (
            <div className="flex flex-col items-center justify-center p-16 text-center text-muted-foreground">
              <BookOpen className="mb-4 h-16 w-16 opacity-15" />
              <p className="text-lg font-medium">No results found</p>
              <p className="text-sm mt-1">
                Try adjusting your search terms or using a Deep search mode.
              </p>
            </div>
          )}

          {/* No query state */}
          {!isLoading && !error && !data && (
            <div className="flex flex-col items-center justify-center p-16 text-center text-muted-foreground">
              <Sparkles className="mb-4 h-16 w-16 opacity-15" />
              <p className="text-lg font-medium">Enter a search query above</p>
              <p className="text-sm mt-1">
                Search across multiple academic sources with AI-powered relevance scoring.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center">
          <Skeleton className="h-8 w-64 mx-auto mb-4" />
          <Skeleton className="h-96 w-full max-w-5xl mx-auto rounded-xl" />
        </div>
      }
    >
      <SearchResultsContent />
    </Suspense>
  );
}
