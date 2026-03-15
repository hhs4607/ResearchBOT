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
import { toast } from "sonner";

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
      await apiClient.papers.copy(paperId, parseInt(selectedProject));
      toast.success("Paper copied successfully");
      setOpen(false);
      setSelectedProject("");
    } catch (error) {
      toast.error("Failed to copy paper. It may already exist in the target project.");
      console.error("Failed to copy paper", error);
    } finally {
      setIsCopying(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={<Button variant="outline" size="sm" className="gap-2" />}
      >
        <Copy className="h-4 w-4" aria-hidden="true" /> Copy to Project
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
            <label htmlFor="dest-project" className="text-sm font-medium">Destination Project</label>
            <Select value={selectedProject} onValueChange={(v) => v && setSelectedProject(v)} disabled={isLoading}>
              <SelectTrigger>
                <SelectValue placeholder={isLoading ? "Loading projects…" : "Select a project"}>
                  {(value: string) => {
                    const p = availableProjects.find((proj) => proj.id.toString() === value);
                    return p ? p.name : value;
                  }}
                </SelectValue>
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
          <Button onClick={handleCopy} disabled={!selectedProject || isCopying} className="gap-2">
            {isCopying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Copy Paper
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
