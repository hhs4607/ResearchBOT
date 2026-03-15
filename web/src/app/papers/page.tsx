"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { useProject } from "@/lib/project-context";
import { PaperOut } from "@/lib/api/types";
import { FilterPanel, FilterState } from "@/components/filter-panel";
import { ExtractionDialog } from "@/components/extraction-dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import {
  CheckCircle2, XCircle, HelpCircle, ChevronLeft, ChevronRight,
  SlidersHorizontal, Eye, Loader2, FolderOpen
} from "lucide-react";

export default function PapersPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { projectId, projects } = useProject();
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [threshold, setThreshold] = useState<number>(0.8);
  const [autoSelectLoading, setAutoSelectLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<FilterState>({});

  const currentProject = projects.find((p: any) => p.id === projectId);

  const { data, isLoading, error } = useQuery({
    queryKey: ["papers", projectId, page, filters],
    queryFn: () => {
      if (!projectId) return { papers: [], pagination: { page: 1, limit: 20, total: 0, total_pages: 1 } };
      const params: Record<string, any> = { page, limit: 20 };
      if (filters.is_included) params.is_included = filters.is_included;
      if (filters.year_min) params.year_min = filters.year_min;
      if (filters.year_max) params.year_max = filters.year_max;
      if (filters.q) params.q = filters.q;
      return apiClient.papers.list(projectId, params);
    },
    enabled: !!projectId,
  });

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return "bg-green-500/10 text-green-700";
    if (score >= 0.5) return "bg-yellow-500/10 text-yellow-700";
    return "bg-red-500/10 text-red-700";
  };

  const papers = data?.papers || [];
  const allSelected = papers.length > 0 && selectedIds.size === papers.length;
  const isIndeterminate = selectedIds.size > 0 && selectedIds.size < papers.length;

  const toggleSelectAll = () => {
    if (allSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(papers.map((p: any) => p.id)));
  };

  const toggleSelectOne = (id: number) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleAutoSelect = async () => {
    if (!projectId) return;
    setAutoSelectLoading(true);
    try {
      const result = await apiClient.projects.autoSelect(projectId, threshold);
      alert(`Auto-selected ${result.papers_selected} papers above ${(threshold * 100).toFixed(0)}% threshold.`);
      queryClient.invalidateQueries({ queryKey: ["papers", projectId] });
    } catch (e) {
      console.error("Auto-select failed:", e);
    } finally {
      setAutoSelectLoading(false);
    }
  };

  const handleBulkInclude = async (include: boolean) => {
    if (!projectId || selectedIds.size === 0) return;
    try {
      await apiClient.papers.bulkInclude(projectId, {
        paper_ids: Array.from(selectedIds),
        is_included: include,
      });
      setSelectedIds(new Set());
      queryClient.invalidateQueries({ queryKey: ["papers", projectId] });
    } catch (e) {
      console.error("Bulk action failed:", e);
    }
  };

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    setPage(1);
  };

  if (!projectId) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center text-muted-foreground">
          <FolderOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">No project selected</p>
          <p className="text-sm mt-1">Select or create a project from the Home page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <header className="sticky top-0 z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between border-b bg-background/95 backdrop-blur px-6 py-4 gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Paper Database</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {currentProject ? currentProject.name : "Project"} &mdash; {data?.pagination?.total || 0} papers
          </p>
        </div>

        <div className="flex items-center gap-2">
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-2 mr-4 border-r pr-4 border-muted">
              <span className="text-sm font-medium text-muted-foreground mr-1">
                {selectedIds.size} selected
              </span>
              <Button variant="secondary" size="sm" className="gap-1 bg-green-500/10 text-green-700 hover:bg-green-500/20" onClick={() => handleBulkInclude(true)}>
                <CheckCircle2 className="h-4 w-4" /> Include
              </Button>
              <Button variant="secondary" size="sm" className="gap-1 bg-red-500/10 text-red-700 hover:bg-red-500/20" onClick={() => handleBulkInclude(false)}>
                <XCircle className="h-4 w-4" /> Exclude
              </Button>
              <ExtractionDialog paperIds={Array.from(selectedIds)} isBulk />
            </div>
          )}
          <FilterPanel onFilterChange={handleFilterChange} showIncludeStatus />
          <Popover>
            <PopoverTrigger className="inline-flex shrink-0 items-center justify-center rounded-lg border border-border bg-background text-sm font-medium hover:bg-muted hover:text-foreground h-7 gap-1 px-2.5">
              <SlidersHorizontal className="h-4 w-4" /> Threshold
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium leading-none">Auto-Select Threshold</h4>
                  <p className="text-sm text-muted-foreground">
                    Automatically include undecided papers above this score: {(threshold * 100).toFixed(0)}%
                  </p>
                </div>
                <Slider
                  defaultValue={[threshold * 100]}
                  max={100}
                  step={5}
                  onValueChange={(v) => setThreshold((Array.isArray(v) ? v[0] : v) / 100)}
                />
                <Button size="sm" className="w-full gap-2" onClick={handleAutoSelect} disabled={autoSelectLoading}>
                  {autoSelectLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  Apply Auto-Select
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </header>

      <main className="flex-1 overflow-auto p-6">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : error ? (
          <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-6 text-destructive">
            <p className="font-semibold">Failed to load papers</p>
            <p className="text-sm mt-1">{(error as Error).message}</p>
          </div>
        ) : papers.length ? (
          <div className="flex flex-col gap-4">
            <div className="rounded-xl border bg-card shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12 text-center p-0">
                      <Checkbox
                        checked={allSelected ? true : isIndeterminate ? ("indeterminate" as any) : false}
                        onCheckedChange={toggleSelectAll}
                        aria-label="Select all"
                        className="ml-4"
                      />
                    </TableHead>
                    <TableHead className="w-[400px]">Paper</TableHead>
                    <TableHead>Keywords</TableHead>
                    <TableHead className="text-center">Score</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {papers.map((paper: PaperOut) => (
                    <TableRow key={paper.id} data-state={selectedIds.has(paper.id) && "selected"} className="cursor-pointer hover:bg-muted/50" onClick={() => router.push(`/papers/${paper.id}`)}>
                      <TableCell className="p-0" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedIds.has(paper.id)}
                          onCheckedChange={() => toggleSelectOne(paper.id)}
                          aria-label={`Select ${paper.title}`}
                          className="ml-4"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="font-medium line-clamp-1">{paper.title}</div>
                        <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                          <span className="truncate max-w-[150px]">
                            {paper.authors?.length > 0 ? paper.authors[0].name + (paper.authors.length > 1 ? " et al." : "") : "Unknown"}
                          </span>
                          <span>&bull;</span>
                          <span>{paper.year}</span>
                          {paper.venue && <><span>&bull;</span><span className="truncate max-w-[150px]">{paper.venue}</span></>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {paper.ai_keywords?.split(";").slice(0, 3).map((kw: string, i: number) => (
                            <Badge key={i} variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                              {kw.trim()}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className={`font-mono ${getScoreColor(paper.ai_relevance_score || 0)}`}>
                          {((paper.ai_relevance_score || 0) * 100).toFixed(0)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {(paper.is_included === true || paper.is_included === 1) && (
                          <Badge className="bg-green-600 hover:bg-green-600 gap-1"><CheckCircle2 className="w-3 h-3" /> Included</Badge>
                        )}
                        {(paper.is_included === false || paper.is_included === 0) && (
                          <Badge variant="destructive" className="gap-1"><XCircle className="w-3 h-3" /> Excluded</Badge>
                        )}
                        {(paper.is_included === null || paper.is_included === undefined) && (
                          <Badge variant="outline" className="text-muted-foreground gap-1"><HelpCircle className="w-3 h-3" /> Undecided</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="sm" className="gap-1" onClick={() => router.push(`/papers/${paper.id}`)}>
                          <Eye className="w-4 h-4" /> View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {data?.pagination && (
              <div className="flex items-center justify-between px-2">
                <div className="flex-1 text-sm text-muted-foreground">
                  Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, data.pagination.total)} of {data.pagination.total} entries
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">
                    Page {data.pagination.page} of {data.pagination.total_pages}
                  </span>
                  <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled={page >= (data?.pagination?.total_pages || 1)} onClick={() => setPage(p => p + 1)}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex h-64 items-center justify-center rounded-xl border border-dashed">
            <div className="text-center text-muted-foreground">
              <p className="text-lg font-medium">No papers saved yet</p>
              <p className="text-sm mt-1">Go to Home &amp; Search to discover papers.</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
