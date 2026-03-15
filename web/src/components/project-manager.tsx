"use client";
import { useState } from "react";
import { useProject } from "@/lib/project-context";
import { apiClient } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Trash2, Loader2 } from "lucide-react";

export function CreateProjectDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const { refetchProjects, setProjectId } = useProject();

  const handleCreate = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      const project = await apiClient.projects.create({ name: name.trim(), description: description.trim() || undefined });
      await refetchProjects();
      setProjectId(project.id);
      setOpen(false);
      setName("");
      setDescription("");
    } catch (e) {
      console.error("Failed to create project:", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="inline-flex shrink-0 items-center justify-center rounded-lg border border-border bg-background text-sm font-medium hover:bg-muted hover:text-foreground h-7 gap-1 px-2.5">
        <Plus className="w-4 h-4" /> New Project
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>Create a new review project to collect and curate papers.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Project Name</label>
            <Input placeholder="e.g., PINN Fatigue Review 2026" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Description (optional)</label>
            <Textarea placeholder="Brief description of this review..." value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleCreate} disabled={!name.trim() || loading} className="gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Create Project
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function DeleteProjectButton({ projectId, projectName }: { projectId: number; projectName: string }) {
  const [loading, setLoading] = useState(false);
  const { refetchProjects, setProjectId, projects } = useProject();

  const handleDelete = async () => {
    setLoading(true);
    try {
      await apiClient.projects.delete(projectId);
      await refetchProjects();
      const remaining = projects.filter(p => p.id !== projectId);
      if (remaining.length > 0) {
        setProjectId(remaining[0].id);
      }
    } catch (e) {
      console.error("Failed to delete project:", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger className="inline-flex shrink-0 items-center justify-center rounded-lg text-sm font-medium hover:bg-muted h-7 gap-1 px-2.5 text-destructive hover:text-destructive">
        <Trash2 className="w-4 h-4" /> Delete
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Project</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete &quot;{projectName}&quot;? This will permanently remove all papers, search history, and keyword associations. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Delete Project
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
