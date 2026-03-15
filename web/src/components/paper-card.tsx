"use client";

import { PaperOut } from "@/lib/api/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { BookmarkPlus, ExternalLink, Calendar, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { apiClient } from "@/lib/api/client";

interface PaperCardProps {
  paper: any; // Using any or specific type that includes temp_index
  originalProjectId: number;
  searchId: number;
}

export function PaperCard({ paper, originalProjectId, searchId }: PaperCardProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(paper.already_saved || paper.is_included !== null);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await apiClient.papers.save(originalProjectId, searchId, [{
        temp_index: paper.temp_index,
        is_included: true
      }]);
      setIsSaved(true);
    } catch (error) {
      console.error("Failed to save paper", error);
    } finally {
      setIsSaving(false);
    }
  };

  const scoreBadgeColor = 
    paper.ai_relevance_score >= 0.8 
      ? "bg-green-500/10 text-green-700 hover:bg-green-500/20" 
      : paper.ai_relevance_score >= 0.5 
      ? "bg-yellow-500/10 text-yellow-700 hover:bg-yellow-500/20" 
      : "bg-red-500/10 text-red-700 hover:bg-red-500/20";

  return (
    <Card className="flex flex-col h-full hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start gap-4">
          <CardTitle className="text-lg leading-tight line-clamp-2">
            {paper.title}
          </CardTitle>
          <Badge variant="secondary" className={`shrink-0 ${scoreBadgeColor}`}>
            Score: {(paper.ai_relevance_score * 100).toFixed(0)}
          </Badge>
        </div>
        <div className="text-sm text-muted-foreground flex items-center gap-2 mt-2">
          <span className="font-medium truncate max-w-[60%]">
            {paper.authors.map((a: any) => a.name).join(", ")}
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {paper.year}
          </span>
          <span>•</span>
          <span className="truncate">{paper.venue}</span>
        </div>
      </CardHeader>

      <CardContent className="flex-1 pb-4">
        <div className="flex flex-wrap gap-1 mb-3">
          {paper.sources.map((s: string) => (
            <Badge key={s} variant="outline" className="text-xs capitalize">
              {s.replace("_", " ")}
            </Badge>
          ))}
          {paper.is_open_access && (
            <Badge variant="secondary" className="text-xs bg-blue-500/10 text-blue-700">
              Open Access
            </Badge>
          )}
        </div>
        <div className="text-sm text-muted-foreground line-clamp-3">
          {paper.abstract ? (
            <span className="text-foreground/90">{paper.abstract}</span>
          ) : paper.ai_keywords ? (
            <span className="text-foreground/80 font-medium">Keywords: {paper.ai_keywords}</span> 
          ) : (
            "No abstract or keywords available."
          )}
        </div>
      </CardContent>

      <CardFooter className="flex justify-between border-t bg-muted/20 pt-4">
        {paper.url ? (
          <a
            href={paper.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3 gap-1"
          >
            <ExternalLink className="h-4 w-4" /> Source
          </a>
        ) : (
          <Button variant="outline" size="sm" disabled className="gap-1">
            <span>No Link</span>
          </Button>
        )}

        <Button 
          size="sm" 
          className={`gap-1 ${isSaved && !paper.already_saved ? "bg-green-600 hover:bg-green-700 text-white" : ""}`}
          onClick={handleSave}
          disabled={isSaving || isSaved || paper.already_saved}
        >
          {paper.already_saved ? (
             <><CheckCircle2 className="h-4 w-4" /> Already in project</>
          ) : isSaved ? (
            <><CheckCircle2 className="h-4 w-4" /> Saved to DB</>
          ) : (
            <><BookmarkPlus className="h-4 w-4" /> Save {isSaving && "..."}</>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
