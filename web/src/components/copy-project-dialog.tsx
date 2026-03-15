"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { Copy, Loader2 } from "lucide-react";

interface CopyProjectDialogProps {
  paperId: number;
  currentProjectId: number;
}

export function CopyProjectDialog({ paperId, currentProjectId }: CopyProjectDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [isCopying, setIsCopying] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: () => apiClient.projects.list(),
  });

  const availableProjects = data?.projects.filter((p) => p.id !== currentProjectId) || [];

  const handleCopy = async () => {
    if (!selectedProject) return;
    setIsCopying(true);
    try {
      // Mock API call to copy endpoint
      // POST /api/papers/{paperId}/copy { target_project_id: selectedProject }
      await new Promise((resolve) => setTimeout(resolve, 800));
      setOpen(false);
      setSelectedProject("");
    } catch (error) {
      console.error("Failed to copy paper", error);
    } finally {
      setIsCopying(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <div className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3 gap-2">
          <Copy className="h-4 w-4" /> Copy to Project
        </div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Copy Paper</DialogTitle>
          <DialogDescription>
            Copy this paper and its metadata to another active project.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Destination Project</label>
            <Select value={selectedProject} onValueChange={(v) => v && setSelectedProject(v)} disabled={isLoading}>
              <SelectTrigger>
                <SelectValue placeholder={isLoading ? "Loading projects..." : "Select a project"} />
              </SelectTrigger>
              <SelectContent>
                {availableProjects.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground text-center">No other projects available</div>
                ) : (
                  availableProjects.map((p) => (
                    <SelectItem key={p.id} value={p.id.toString()}>
                      {p.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isCopying}>
            Cancel
          </Button>
          <Button onClick={handleCopy} disabled={!selectedProject || isCopying}>
            {isCopying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Copy Paper
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
