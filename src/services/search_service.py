"""Search orchestration service.

Searches multiple sources in parallel, deduplicates, scores.
Returns TEMPORARY results (not saved to DB).
Logs the search to search_logs.
"""

from __future__ import annotations

import json
import sqlite3

from src.config import Config
from src.search import SearchResult, search_all, DEFAULT_MODES
from src.services.dedup_service import deduplicate
from src.services.screening_service import score_results


class SearchService:
    def __init__(self, conn: sqlite3.Connection, config: Config):
        self.conn = conn
        self.config = config

    def execute_search(
        self,
        project_id: int,
        query: str,
        *,
        mode: str = "standard",
        year_min: int | None = None,
        year_max: int | None = None,
        limit_per_source: int | None = None,
    ) -> dict:
        """Execute multi-source search. Returns temporary results (not saved to DB)."""
        # Resolve sources for mode
        mode_config = self.config.search_modes.get(mode)
        sources = mode_config.sources if mode_config else DEFAULT_MODES.get(mode, DEFAULT_MODES["standard"])
        lps = limit_per_source or self.config.limit_per_source

        # Search all sources in parallel
        raw_results = search_all(query, sources=sources, limit_per_source=lps, config=self.config)

        # Collect results and errors per source
        all_results: list[SearchResult] = []
        source_summary = {}
        for source_name, result_or_error in raw_results.items():
            if isinstance(result_or_error, str):
                source_summary[source_name] = {"found": 0, "errors": result_or_error}
            else:
                source_summary[source_name] = {"found": len(result_or_error), "errors": None}
                all_results.extend(result_or_error)

        total_found = len(all_results)

        # Deduplicate
        deduped = deduplicate(all_results)

        # Check which papers already exist in project
        existing_dois = set()
        existing_titles = set()
        rows = self.conn.execute(
            "SELECT doi, LOWER(title) as title_lower FROM papers WHERE project_id = ?",
            (project_id,),
        ).fetchall()
        for r in rows:
            if r["doi"]:
                existing_dois.add(r["doi"].lower())
            if r["title_lower"]:
                existing_titles.add(r["title_lower"])

        already_in_project = 0
        for r in deduped:
            is_existing = False
            if r.doi and r.doi.lower() in existing_dois:
                is_existing = True
            elif r.title and r.title.lower() in existing_titles:
                is_existing = True
            r.raw_metadata["already_saved"] = is_existing
            if is_existing:
                already_in_project += 1

        # Score results
        score_results(deduped, query, self.config.scoring)

        # Log the search
        search_id = self._log_search(
            project_id, query, mode, source_summary, total_found, len(deduped) - already_in_project,
        )

        # Build response
        papers = []
        for i, r in enumerate(deduped):
            papers.append({
                "temp_index": i,
                "title": r.title,
                "authors": r.authors,
                "year": r.year,
                "venue": r.venue,
                "doi": r.doi,
                "abstract": r.abstract,
                "url": r.url,
                "pdf_url": r.pdf_url,
                "cited_by_count": r.cited_by_count,
                "is_open_access": r.is_open_access,
                "ai_relevance_score": r.raw_metadata.get("ai_relevance_score", 0),
                "sources": r.raw_metadata.get("_all_sources", [r.source_name]),
                "already_saved": r.raw_metadata.get("already_saved", False),
                # Carry full data for save operation
                "_search_result": r,
            })

        return {
            "search_id": search_id,
            "query": query,
            "mode": mode,
            "source_results": source_summary,
            "papers_found": total_found,
            "papers_deduped": len(deduped),
            "already_in_project": already_in_project,
            "papers": papers,
        }

    def list_searches(self, project_id: int) -> list[dict]:
        rows = self.conn.execute(
            """SELECT id, query, search_mode, source_results, papers_found, papers_new, created_at
               FROM search_logs WHERE project_id = ? ORDER BY created_at DESC""",
            (project_id,),
        ).fetchall()
        result = []
        for r in rows:
            d = dict(r)
            d["source_results"] = json.loads(d["source_results"]) if d["source_results"] else {}
            result.append(d)
        return result

    def _log_search(self, project_id, query, mode, source_summary, papers_found, papers_new) -> int:
        cur = self.conn.execute(
            """INSERT INTO search_logs (project_id, query, search_mode, source_results, papers_found, papers_new)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (project_id, query, mode, json.dumps(source_summary), papers_found, papers_new),
        )
        self.conn.commit()
        return cur.lastrowid
