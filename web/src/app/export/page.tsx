"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Download, RefreshCw, AlertCircle } from "lucide-react";

export default function ExportPage() {
  const projectId = 1; // Defaulting to 1 for MVP

  const { data: project } = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => apiClient.projects.get(projectId),
  });

  const { data: zoteroStatus, refetch: refetchZotero } = useQuery({
    queryKey: ["zoteroStatus", projectId],
    queryFn: () => apiClient.projects.zoteroStatus(projectId),
  });

  const syncZoteroMutation = useMutation({
    mutationFn: () => apiClient.projects.syncZotero(projectId),
    onSuccess: () => {
      refetchZotero();
    },
  });

  const handleExportCsv = () => {
    // Navigate to point to the backend's export endpoint, which returns a file download
    window.location.href = `/api/projects/${projectId}/export/csv`;
  };

  return (
    <div className="flex h-full flex-col">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b px-6 py-4">
        <h1 className="text-xl font-bold">Export & Integrations</h1>
      </header>
      
      <main className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-5xl space-y-8">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Project Export</h2>
            <p className="text-muted-foreground mt-1">
              Download your curated papers and AI extractions.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* CSV Export Card */}
            <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
              <div className="flex flex-col space-y-1.5">
                <h3 className="font-semibold leading-none tracking-tight">CSV Export</h3>
                <p className="text-sm text-muted-foreground">
                  Download all included papers with their abstracts, AI keywords, and extracted fields.
                </p>
              </div>
              <div className="mt-4 pt-4 border-t">
                <Button onClick={handleExportCsv} className="w-full gap-2">
                  <Download className="h-4 w-4" />
                  Download CSV
                </Button>
              </div>
            </div>

            {/* Zotero Sync Card */}
            <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
              <div className="flex flex-col space-y-1.5">
                <h3 className="font-semibold leading-none tracking-tight">Zotero Integration</h3>
                <p className="text-sm text-muted-foreground">
                  Sync included papers directly to your connected Zotero library.
                </p>
              </div>
              
              {zoteroStatus && (
                <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                  <AlertCircle className="h-4 w-4" />
                  <span>Status: {zoteroStatus.status || "Unknown"}</span>
                </div>
              )}

              <div className="mt-4 pt-4 border-t">
                <Button 
                  onClick={() => syncZoteroMutation.mutate()} 
                  disabled={syncZoteroMutation.isPending}
                  variant="outline" 
                  className="w-full gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${syncZoteroMutation.isPending ? "animate-spin" : ""}`} />
                  {syncZoteroMutation.isPending ? "Syncing..." : "Sync to Zotero"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
