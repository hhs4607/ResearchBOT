"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SearchBar } from "@/components/search-bar";
import { BookOpen, Sparkles, FolderOpen } from "lucide-react";
import { useProject } from "@/lib/project-context";
import { CreateProjectDialog } from "@/components/project-manager";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  const router = useRouter();
  const { projectId, setProjectId, projects, isLoading } = useProject();
  const [mode, setMode] = useState<string>("standard");

  const handleSearch = (query: string) => {
    if (!projectId) return;
    const params = new URLSearchParams({
      q: query,
      mode,
      projectId: projectId.toString(),
    });
    router.push(`/search?${params.toString()}`);
  };

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center p-6 text-center">
      <div className="mb-8 flex items-center justify-center gap-3">
        <div className="rounded-2xl bg-primary/10 p-4">
          <BookOpen className="h-12 w-12 text-primary" aria-hidden="true" />
        </div>
        <h1 className="text-5xl font-extrabold tracking-tight">ResearchBot</h1>
      </div>

      <p className="mb-12 max-w-[600px] text-lg text-muted-foreground">
        Your intelligent assistant for literature review and paper curation.
        Search across 6+ academic sources with AI-powered relevance scoring.
      </p>

      <div className="w-full max-w-3xl space-y-6">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 rounded-xl bg-card p-4 shadow-sm border">
          <div className="flex-1 space-y-2 text-left">
            <label className="text-sm font-medium text-muted-foreground ml-1 flex items-center gap-2">
              <FolderOpen className="w-3 h-3" aria-hidden="true" /> Active Project
            </label>
            {isLoading ? (
              <Skeleton className="h-10 w-full" />
            ) : projects.length === 0 ? (
              <div className="flex items-center gap-2">
                <p className="text-sm text-muted-foreground">No projects yet.</p>
                <CreateProjectDialog />
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Select
                  value={projectId?.toString() || ""}
                  onValueChange={(v) => v && setProjectId(parseInt(v))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a project">
                      {(value: string) => {
                        const p = projects.find((proj) => proj.id.toString() === value);
                        return p ? `${p.name} (${p.paper_counts?.total || 0} papers)` : value;
                      }}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id.toString()}>
                        {p.name} ({p.paper_counts?.total || 0} papers)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <CreateProjectDialog />
              </div>
            )}
          </div>
          <div className="flex-[0.5] space-y-2 text-left">
            <label className="text-sm font-medium text-muted-foreground ml-1 flex items-center gap-1">
              <Sparkles className="h-3 w-3" aria-hidden="true" /> Search Mode
            </label>
            <Select value={mode} onValueChange={(v) => v && setMode(v)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Search Mode">
                  {(value: string) => {
                    const labels: Record<string, string> = {
                      quick: "Quick (1 source)",
                      standard: "Standard (3 sources)",
                      deep: "Deep (6 sources)",
                    };
                    return labels[value] || value;
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="quick">Quick (1 source)</SelectItem>
                <SelectItem value="standard">Standard (3 sources)</SelectItem>
                <SelectItem value="deep">Deep (6 sources)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <SearchBar onSearch={handleSearch} />

        <div className="flex flex-wrap items-center justify-center gap-2 pt-4 text-sm text-muted-foreground">
          <span>Try searching for:</span>
          {["PINN fatigue prediction", "LLM agent architecture", "RAG evaluation metrics"].map((term) => (
            <button
              key={term}
              onClick={() => handleSearch(term)}
              className="rounded-full bg-secondary px-3 py-1 hover:bg-secondary/80 hover:text-secondary-foreground transition-colors"
            >
              {term}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
