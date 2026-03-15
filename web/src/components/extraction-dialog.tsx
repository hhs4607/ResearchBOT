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
import { Sparkles, Loader2, BrainCircuit } from "lucide-react";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";

interface ExtractionDialogProps {
  paperIds: number[];
  isBulk?: boolean;
  projectId?: number;
}

export function ExtractionDialog({ paperIds, isBulk = false, projectId }: ExtractionDialogProps) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const extractMutation = useMutation({
    mutationFn: async () => {
      if (isBulk && projectId) {
        await apiClient.papers.bulkExtract(projectId, { paper_ids: paperIds });
      } else {
        await apiClient.papers.extract(paperIds[0]);
      }
    },
    onSuccess: () => {
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["papers"] });
      queryClient.invalidateQueries({ queryKey: ["paper"] });
    },
    onError: (error) => {
      console.error("Failed to extract data", error);
    }
  });

  const handleExtract = () => {
    extractMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant={isBulk ? "outline" : "secondary"} size="sm" className="gap-2" />
        }
      >
        <Sparkles className="h-4 w-4" aria-hidden="true" />
        {isBulk ? "Extract AI" : "Extract using Gemini"}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BrainCircuit className="h-5 w-5 text-primary" aria-hidden="true" />
            {isBulk ? `Extract Data from ${paperIds.length} Papers` : "Extract Data"}
          </DialogTitle>
          <DialogDescription>
            This action uses the Gemini API to analyze the full text and extract the
            Objective, Method, and Results. This might take a few moments.
          </DialogDescription>
        </DialogHeader>
        <div className="py-6 flex justify-center">
          {extractMutation.isPending ? (
            <div className="flex flex-col items-center gap-4 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm">Analyzing document structure and extracting key entities…</p>
            </div>
          ) : (
            <div className="text-sm text-center text-muted-foreground">
              Ready to process {isBulk ? `${paperIds.length} queued items.` : "this document."}
              {extractMutation.isError && <p className="text-destructive mt-2">Extraction failed. Please try again.</p>}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={extractMutation.isPending}>
            Cancel
          </Button>
          <Button onClick={handleExtract} disabled={extractMutation.isPending} className="gap-2">
            {extractMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Start Extraction
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
