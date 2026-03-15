"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SearchBar } from "@/components/search-bar";
import { BookOpen, Sparkles } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
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
  const [projectId, setProjectId] = useState<string>("1");
  const [mode, setMode] = useState<string>("standard");

  const { data, isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: () => apiClient.projects.list(),
  });

  const handleSearch = (query: string) => {
    // Navigate to Search Results page with parameters
    const params = new URLSearchParams({
      q: query,
      mode,
      projectId,
    });
    router.push(`/search?${params.toString()}`);
  };

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center p-6 text-center">
      <div className="mb-8 flex items-center justify-center gap-3">
        <div className="rounded-2xl bg-primary/10 p-4">
          <BookOpen className="h-12 w-12 text-primary" />
        </div>
        <h1 className="text-5xl font-extrabold tracking-tight">ResearchBot</h1>
      </div>

      <p className="mb-12 max-w-[600px] text-lg text-muted-foreground">
        Your intelligent assistant for literature review and paper curation. 
        Search across 6+ academic sources with AI-powered relevance scoring.
      </p>

      <div className="w-full max-w-3xl space-y-6">
        <div className="flex items-center gap-4 rounded-xl bg-card p-4 shadow-sm border">
          <div className="flex-1 space-y-2 text-left">
            <label className="text-sm font-medium text-muted-foreground ml-1">
              Active Project
            </label>
            {isLoading ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <Select value={projectId} onValueChange={(v) => v && setProjectId(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  {data?.projects.map((p) => (
                    <SelectItem key={p.id} value={p.id.toString()}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <div className="flex-[0.5] space-y-2 text-left">
            <label className="text-sm font-medium text-muted-foreground ml-1 flex items-center gap-1">
              <Sparkles className="h-3 w-3" /> Search Mode
            </label>
            <Select value={mode} onValueChange={(v) => v && setMode(v)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Search Mode" />
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
