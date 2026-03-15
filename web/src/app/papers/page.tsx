"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { PaperOut } from "@/lib/api/types";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle2, BookmarkMinus, Settings2, Download, Trash, ChevronLeft, ChevronRight, SlidersHorizontal, XCircle, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FilterPanel } from "@/components/filter-panel";
import { ExtractionDialog } from "@/components/extraction-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";

export default function PapersPage() {
  const [projectId] = useState<number>(1);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [threshold, setThreshold] = useState<number>(0.8);

  const { data, isLoading, error } = useQuery({
    queryKey: ["papers", projectId],
    queryFn: () => apiClient.papers.list(projectId),
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
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(papers.map(p => p.id)));
    }
  };

  const toggleSelectOne = (id: number) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  return (
    <div className="flex h-full flex-col">
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b px-6 py-4 gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Paper Database</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage and curate papers saved to this project.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-2 mr-4 border-r pr-4 border-muted">
              <span className="text-sm font-medium text-muted-foreground mr-1">
                {selectedIds.size} selected
              </span>
              <Button variant="secondary" size="sm" className="gap-1 bg-green-500/10 text-green-700 hover:bg-green-500/20">
                <CheckCircle2 className="h-4 w-4" /> Include
              </Button>
              <Button variant="secondary" size="sm" className="gap-1 bg-red-500/10 text-red-700 hover:bg-red-500/20">
                <BookmarkMinus className="h-4 w-4" /> Exclude
              </Button>
              <ExtractionDialog paperIds={Array.from(selectedIds)} isBulk />
            </div>
          )}
          <FilterPanel onFilterChange={() => {}} showIncludeStatus />
          <Popover>
            <PopoverTrigger>
              <div className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3 gap-2">
                <SlidersHorizontal className="h-4 w-4" /> Threshold
              </div>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium leading-none">Auto-Select Threshold</h4>
                  <p className="text-sm text-muted-foreground">
                    Automatically mark papers as Included if their AI score exceeds this value. Currently: {(threshold * 100).toFixed(0)}
                  </p>
                </div>
                <Slider
                  defaultValue={[threshold * 100]}
                  max={100}
                  step={1}
                  onValueChange={(v) => setThreshold((Array.isArray(v) ? v[0] : (v as any)[0]) / 100)}
                />
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
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-destructive">
            <p className="font-semibold">Failed to load library</p>
            <p className="text-sm mt-1">{(error as Error).message}</p>
          </div>
        ) : papers.length ? (
          <div className="flex flex-col gap-4">
            <div className="rounded-md border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12 text-center p-0">
                      <Checkbox 
                        checked={allSelected ? true : isIndeterminate ? "indeterminate" as any : false}
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
                    <TableRow key={paper.id} data-state={selectedIds.has(paper.id) && "selected"}>
                      <TableCell className="p-0">
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
                            {paper.authors.length > 0 ? paper.authors[0].name + (paper.authors.length > 1 ? " et al." : "") : "Unknown"}
                          </span>
                          <span>•</span>
                          <span>{paper.year}</span>
                          <span>•</span>
                          <span className="truncate max-w-[150px]">{paper.venue}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {paper.ai_keywords?.split(";").slice(0, 3).map((kw, i) => (
                            <Badge key={i} variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                              {kw.trim()}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className={`font-mono ${getScoreColor(paper.ai_relevance_score)}`}>
                          {(paper.ai_relevance_score * 100).toFixed(0)}
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
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">View</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            {/* Pagination Controls */}
            {data?.pagination && (
              <div className="flex items-center justify-between px-2">
                <div className="flex-1 text-sm text-muted-foreground">
                  Showing 1 to {papers.length} of {data.pagination.total} entries
                </div>
                <div className="flex items-center space-x-6 lg:space-x-8">
                  <div className="flex w-[100px] items-center justify-center text-sm font-medium">
                    Page {data.pagination.page} of {data.pagination.total_pages}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" className="h-8 w-8 p-0" disabled={data?.pagination.page <= 1}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" className="h-8 w-8 p-0" disabled={data?.pagination.page >= data?.pagination.total_pages}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex h-64 items-center justify-center rounded-lg border border-dashed">
            <div className="text-center text-muted-foreground">
              <p>No papers saved yet.</p>
              <p className="text-sm mt-1">Go to Search to discover papers.</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
