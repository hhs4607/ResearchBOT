"use client";

import { useProject } from "@/lib/project-context";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { DeleteProjectButton } from "@/components/project-manager";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Settings, Database, Key, FolderOpen } from "lucide-react";

export default function SettingsPage() {
  const { projectId, projects } = useProject();
  const currentProject = projects.find((p) => p.id === projectId);

  const { data: keywordData } = useQuery({
    queryKey: ["keywords"],
    queryFn: () => apiClient.keywords.list(),
  });

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6" /> Settings
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Project configuration and system status.
        </p>
      </div>

      <div className="rounded-xl border bg-card shadow-sm p-6 space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <FolderOpen className="w-5 h-5" /> Current Project
        </h2>
        {currentProject ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{currentProject.name}</p>
                <p className="text-sm text-muted-foreground">{currentProject.description || "No description"}</p>
              </div>
              <DeleteProjectButton projectId={currentProject.id} projectName={currentProject.name} />
            </div>
            <div className="flex gap-4 text-sm">
              <div className="rounded-lg bg-muted px-3 py-2">
                <span className="text-muted-foreground">Total:</span>{" "}
                <span className="font-semibold">{currentProject.paper_counts?.total || 0}</span>
              </div>
              <div className="rounded-lg bg-green-500/10 px-3 py-2">
                <span className="text-green-700 dark:text-green-400">Included:</span>{" "}
                <span className="font-semibold text-green-700 dark:text-green-400">{currentProject.paper_counts?.included || 0}</span>
              </div>
              <div className="rounded-lg bg-red-500/10 px-3 py-2">
                <span className="text-red-700 dark:text-red-400">Excluded:</span>{" "}
                <span className="font-semibold text-red-700 dark:text-red-400">{currentProject.paper_counts?.excluded || 0}</span>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground">No project selected.</p>
        )}
      </div>

      <div className="rounded-xl border bg-card shadow-sm p-6 space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Database className="w-5 h-5" /> Keyword Dictionary
        </h2>
        <p className="text-sm text-muted-foreground">
          {keywordData?.keywords?.length || 0} canonical keywords with variant mappings.
        </p>
        <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
          {keywordData?.keywords?.slice(0, 30).map((kw: any) => (
            <Badge key={kw.id} variant="secondary" className="text-xs">
              {kw.canonical_form}
            </Badge>
          ))}
          {(keywordData?.keywords?.length || 0) > 30 && (
            <Badge variant="outline" className="text-xs text-muted-foreground">
              +{keywordData.keywords.length - 30} more
            </Badge>
          )}
        </div>
      </div>

      <div className="rounded-xl border bg-card shadow-sm p-6 space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Key className="w-5 h-5" /> API Connections
        </h2>
        <div className="space-y-2 text-sm">
          {["OpenAlex", "Semantic Scholar", "arXiv", "CrossRef", "PubMed", "Google Scholar"].map((source) => (
            <div key={source} className="flex items-center justify-between py-1">
              <span>{source}</span>
              <Badge variant="outline" className="bg-green-500/10 text-green-700 dark:text-green-400">Connected</Badge>
            </div>
          ))}
          <div className="flex items-center justify-between py-1 border-t pt-3 mt-2">
            <span>Gemini AI</span>
            <Badge variant="outline" className="bg-green-500/10 text-green-700">Connected</Badge>
          </div>
          <div className="flex items-center justify-between py-1">
            <span>Zotero</span>
            <Badge variant="outline" className="bg-green-500/10 text-green-700">Connected</Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
