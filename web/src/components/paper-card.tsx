"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  BookmarkPlus,
  ExternalLink,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Users,
  BookOpen,
  Hash,
  Loader2,
} from "lucide-react";
import { useState } from "react";
import { apiClient } from "@/lib/api/client";

interface PaperCardProps {
  paper: any;
  originalProjectId: number;
  searchId: number;
}

function ScoreBadge({ score }: { score: number }) {
  const pct = (score * 100).toFixed(0);
  const color =
    score >= 0.8
      ? "bg-green-500/10 text-green-700 dark:text-green-400 hover:bg-green-500/20"
      : score >= 0.5
        ? "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-500/20"
        : "bg-red-500/10 text-red-700 dark:text-red-400 hover:bg-red-500/20";
  return (
    <Badge variant="secondary" className={`shrink-0 ${color}`}>
      Score: {pct}
    </Badge>
  );
}

export function PaperCard({ paper, originalProjectId, searchId }: PaperCardProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(paper.already_saved === true);
  const [expanded, setExpanded] = useState(false);

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSaving || isSaved || paper.already_saved) return;
    setIsSaving(true);
    try {
      await apiClient.papers.save(originalProjectId, searchId, [
        { temp_index: paper.temp_index, is_included: true },
      ]);
      setIsSaved(true);
    } catch (error) {
      console.error("Failed to save paper", error);
    } finally {
      setIsSaving(false);
    }
  };

  const authorList = paper.authors?.map((a: any) => a.name).join(", ") || "Unknown";

  return (
    <Card
      className="flex flex-col h-full hover:shadow-md transition-shadow cursor-pointer group"
      role="button"
      tabIndex={0}
      onClick={() => setExpanded(!expanded)}
      onKeyDown={(e: React.KeyboardEvent) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setExpanded(!expanded);
        }
      }}
    >
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start gap-3">
          <CardTitle className="text-base leading-snug line-clamp-2 group-hover:text-primary transition-colors">
            {paper.title}
          </CardTitle>
          <ScoreBadge score={paper.ai_relevance_score || 0} />
        </div>
        <div className="text-sm text-muted-foreground flex items-center gap-2 mt-2 flex-wrap">
          <span className="flex items-center gap-1 truncate max-w-[50%]">
            <Users className="h-3 w-3 shrink-0" aria-hidden="true" />
            {authorList}
          </span>
          {paper.year && (
            <>
              <span className="text-muted-foreground/40">|</span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" aria-hidden="true" />
                {paper.year}
              </span>
            </>
          )}
          {paper.venue && (
            <>
              <span className="text-muted-foreground/40">|</span>
              <span className="truncate max-w-[150px]">{paper.venue}</span>
            </>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 pb-3">
        {/* Source badges */}
        <div className="flex flex-wrap gap-1 mb-3">
          {paper.sources?.map((s: string) => (
            <Badge key={s} variant="outline" className="text-xs capitalize">
              {s.replace("_", " ")}
            </Badge>
          ))}
          {paper.is_open_access && (
            <Badge variant="secondary" className="text-xs bg-blue-500/10 text-blue-700 dark:text-blue-400">
              Open Access
            </Badge>
          )}
          {paper.cited_by_count > 0 && (
            <Badge variant="outline" className="text-xs">
              Cited: {paper.cited_by_count}
            </Badge>
          )}
        </div>

        {/* Abstract preview / full */}
        <div className="text-sm text-muted-foreground">
          {paper.abstract ? (
            <p className={`text-foreground/80 leading-relaxed ${expanded ? "" : "line-clamp-3"}`}>
              {paper.abstract}
            </p>
          ) : paper.ai_keywords ? (
            <p className="text-foreground/70">
              <span className="font-medium">Keywords:</span> {paper.ai_keywords}
            </p>
          ) : (
            <p className="italic">No abstract available.</p>
          )}
        </div>

        {/* Expand indicator */}
        <div className="flex items-center justify-center mt-2">
          <button
            aria-label={expanded ? "Collapse abstract" : "Show full abstract"}
            className="text-xs text-muted-foreground/60 hover:text-muted-foreground flex items-center gap-1 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
          >
            {expanded ? (
              <>
                <ChevronUp className="h-3 w-3" /> Collapse
              </>
            ) : (
              <>
                <ChevronDown className="h-3 w-3" /> Show full abstract
              </>
            )}
          </button>
        </div>

        {/* Expanded details */}
        {expanded && (
          <div className="mt-3 pt-3 border-t space-y-2 text-sm">
            {paper.doi && (
              <p className="text-muted-foreground">
                <span className="font-medium text-foreground">DOI:</span> {paper.doi}
              </p>
            )}
            {paper.ai_keywords && (
              <p className="text-muted-foreground">
                <span className="font-medium text-foreground">AI Keywords:</span> {paper.ai_keywords}
              </p>
            )}
            {paper.pdf_url && (
              <a
                href={paper.pdf_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 text-primary hover:underline"
              >
                <BookOpen className="h-3 w-3" /> View PDF
              </a>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-between border-t bg-muted/20 pt-3 pb-3">
        {paper.url ? (
          <a
            href={paper.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" /> Source
          </a>
        ) : (
          <span className="text-xs text-muted-foreground italic">No link</span>
        )}

        <Button
          size="sm"
          className={`gap-1.5 ${isSaved ? "bg-green-600 hover:bg-green-700 text-white" : ""}`}
          onClick={handleSave}
          disabled={isSaving || isSaved || paper.already_saved}
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Saving...
            </>
          ) : paper.already_saved ? (
            <>
              <CheckCircle2 className="h-4 w-4" /> In Project
            </>
          ) : isSaved ? (
            <>
              <CheckCircle2 className="h-4 w-4" /> Saved
            </>
          ) : (
            <>
              <BookmarkPlus className="h-4 w-4" /> Save to DB
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
