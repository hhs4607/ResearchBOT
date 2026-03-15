"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { apiClient } from "@/lib/api/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, ExternalLink, Activity, CheckCircle2, BookmarkMinus, Sparkles, Calendar, BrainCircuit, BookOpen, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { CopyProjectDialog } from "@/components/copy-project-dialog";
import { ExtractionDialog } from "@/components/extraction-dialog";
import { toast } from "sonner";

export default function PaperDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const id = Number(params.id);

  const { data: paper, isLoading, error } = useQuery({
    queryKey: ["paper", id],
    queryFn: () => apiClient.papers.get(id),
  });

  const [note, setNote] = useState("");
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [isTogglingInclude, setIsTogglingInclude] = useState(false);

  useEffect(() => {
    if (paper?.user_note != null) {
      setNote(paper.user_note);
    }
  }, [paper?.user_note]);

  const handleToggleInclude = async (include: boolean) => {
    setIsTogglingInclude(true);
    try {
      await apiClient.papers.toggleInclude(id, include);
      queryClient.invalidateQueries({ queryKey: ["paper", id] });
      queryClient.invalidateQueries({ queryKey: ["papers"] });
      toast.success(include ? "Paper included" : "Paper excluded");
    } catch (e) {
      toast.error("Failed to update paper status");
    } finally {
      setIsTogglingInclude(false);
    }
  };

  const handleSaveNote = async () => {
    setIsSavingNote(true);
    try {
      await apiClient.papers.update(id, { user_note: note });
      queryClient.invalidateQueries({ queryKey: ["paper", id] });
      toast.success("Note saved");
    } catch (e) {
      toast.error("Failed to save note");
    } finally {
      setIsSavingNote(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 space-y-6 max-w-5xl mx-auto mt-4">
        <Skeleton className="h-10 w-32 mb-8" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-6 w-2/3" />
        <div className="flex gap-4 pt-4">
          <Skeleton className="h-32 w-2/3" />
          <Skeleton className="h-32 w-1/3" />
        </div>
      </div>
    );
  }

  if (error || !paper) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold text-destructive">Error loading paper</h2>
        <Button onClick={() => router.back()} variant="outline" className="mt-4">
          Go Back
        </Button>
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return "bg-green-500/10 text-green-700 dark:text-green-400";
    if (score >= 0.5) return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400";
    return "bg-red-500/10 text-red-700 dark:text-red-400";
  };

  const isIncluded = paper.is_included === true || paper.is_included === 1;
  const isExcluded = paper.is_included === false || paper.is_included === 0;

  return (
    <div className="flex h-full flex-col">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} aria-label="Go back">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex gap-2">
            <Badge variant="outline" className={`font-mono text-sm tabular-nums ${getScoreColor(paper.ai_relevance_score)}`}>
              Score: {(paper.ai_relevance_score * 100).toFixed(0)}
            </Badge>
            {isIncluded && (
              <Badge className="bg-green-600 hover:bg-green-600 gap-1"><CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" /> Included</Badge>
            )}
            {isExcluded && (
              <Badge variant="destructive" className="gap-1"><BookmarkMinus className="w-3.5 h-3.5" aria-hidden="true" /> Excluded</Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <CopyProjectDialog paperId={paper.id} currentProjectId={paper.project_id} />
          <Button
            variant="default"
            size="sm"
            className="gap-2"
            disabled={isIncluded || isTogglingInclude}
            onClick={() => handleToggleInclude(true)}
          >
            {isTogglingInclude ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" aria-hidden="true" />}
            Include
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="gap-2 text-destructive hover:bg-destructive/10"
            disabled={isExcluded || isTogglingInclude}
            onClick={() => handleToggleInclude(false)}
          >
            <BookmarkMinus className="h-4 w-4" aria-hidden="true" /> Exclude
          </Button>
        </div>
      </header>

      <main className="flex-1 overflow-auto p-6 lg:p-10">
        <div className="mx-auto max-w-5xl space-y-8">

          {/* Header Info */}
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-3">{paper.title}</h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-muted-foreground">
              <span className="font-medium text-foreground">
                {paper.authors.map(a => a.name).join(", ")}
              </span>
              <span className="flex items-center gap-1"><Calendar className="h-4 w-4" aria-hidden="true" /> {paper.year}</span>
              <span>{paper.venue}</span>
              {paper.url && (
                <a href={paper.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                  <ExternalLink className="h-4 w-4" aria-hidden="true" /> View Source
                </a>
              )}
            </div>

            <div className="flex gap-2 mt-4">
              {paper.keywords?.map(kw => (
                <Badge key={kw.id} variant="secondary">
                  {kw.canonical_form}
                </Badge>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Main Content (Left, 2 cols) */}
            <div className="lg:col-span-2 space-y-8">
              <section>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-muted-foreground" aria-hidden="true" /> Abstract
                </h3>
                <p className="text-foreground/90 leading-relaxed text-justify">
                  {paper.abstract}
                </p>
              </section>

              <Separator />

              <section>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <BrainCircuit className="h-5 w-5 text-primary" aria-hidden="true" /> AI Extraction
                  </h3>
                  <ExtractionDialog paperIds={[paper.id]} />
                </div>

                {paper.ai_objective ? (
                  <div className="space-y-4 rounded-xl border bg-card p-5">
                    <div>
                      <span className="font-semibold text-sm text-primary uppercase tracking-wider">Objective</span>
                      <p className="mt-1">{paper.ai_objective}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-sm text-primary uppercase tracking-wider">Method</span>
                      <p className="mt-1">{paper.ai_method}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-sm text-primary uppercase tracking-wider">Result</span>
                      <p className="mt-1">{paper.ai_result}</p>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground bg-muted/10">
                    <BrainCircuit className="h-8 w-8 mx-auto mb-3 opacity-20" aria-hidden="true" />
                    <p>No AI extraction available.</p>
                    <div className="mt-4 flex justify-center">
                      <ExtractionDialog paperIds={[paper.id]} />
                    </div>
                  </div>
                )}
              </section>

              <Separator />

              <section>
                <h3 className="text-lg font-semibold mb-3">User Notes</h3>
                <Textarea
                  name="user_note"
                  placeholder="Add your reading notes, thoughts, or curation rationale here…"
                  className="min-h-[150px] resize-y"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
                <div className="flex justify-end mt-2">
                  <Button
                    size="sm"
                    disabled={note === (paper.user_note || "") || isSavingNote}
                    onClick={handleSaveNote}
                    className="gap-2"
                  >
                    {isSavingNote && <Loader2 className="h-3 w-3 animate-spin" />}
                    Save Note
                  </Button>
                </div>
              </section>
            </div>

            {/* Sidebar (Right, 1 col) */}
            <div className="space-y-6">
              <div className="rounded-xl border bg-card p-5 space-y-4">
                <h4 className="font-semibold flex items-center gap-2">
                  <Activity className="h-4 w-4 text-muted-foreground" aria-hidden="true" /> Metrics
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-sm text-muted-foreground">Cited By</span>
                    <p className="text-2xl font-bold tabular-nums">{paper.cited_by_count}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm text-muted-foreground">References</span>
                    <p className="text-2xl font-bold tabular-nums">{paper.references?.length || 0}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border bg-card overflow-hidden">
                <Tabs defaultValue="references" className="w-full">
                  <TabsList className="w-full grid border-b rounded-none grid-cols-2">
                    <TabsTrigger value="references">References</TabsTrigger>
                    <TabsTrigger value="citations">Cited By</TabsTrigger>
                  </TabsList>
                  <TabsContent value="references" className="p-0 m-0">
                    <div className="max-h-[400px] overflow-y-auto p-4 space-y-4">
                      {paper.references?.map((ref, i) => (
                        <div key={i} className="text-sm">
                          <p className="font-medium line-clamp-2">{ref.title}</p>
                          <p className="text-muted-foreground mt-0.5">{ref.year || "Unknown"} {ref.doi && `· ${ref.doi}`}</p>
                        </div>
                      ))}
                      {(!paper.references || paper.references.length === 0) && (
                        <p className="text-sm text-muted-foreground text-center py-4">No references available.</p>
                      )}
                    </div>
                  </TabsContent>
                  <TabsContent value="citations" className="p-0 m-0">
                    <div className="max-h-[400px] overflow-y-auto p-4 space-y-4">
                      {paper.cited_by?.map((cite, i) => (
                        <div key={i} className="text-sm">
                          <p className="font-medium line-clamp-2">{cite.title}</p>
                          <p className="text-muted-foreground mt-0.5">{cite.year || "Unknown"}</p>
                        </div>
                      ))}
                      {(!paper.cited_by || paper.cited_by.length === 0) && (
                        <p className="text-sm text-muted-foreground text-center py-4">No citations available.</p>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
