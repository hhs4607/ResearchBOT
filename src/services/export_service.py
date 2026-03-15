"""Export service — CSV download and Zotero sync."""

from __future__ import annotations

import io
import json
import sqlite3

import pandas as pd


class ExportService:
    def __init__(self, conn: sqlite3.Connection):
        self.conn = conn

    def export_csv(
        self,
        project_id: int,
        columns: list[str] | None = None,
        default_columns: list[str] | None = None,
    ) -> str:
        """Export included papers as CSV string."""
        rows = self.conn.execute(
            "SELECT * FROM papers WHERE project_id = ? AND is_included = 1 ORDER BY ai_relevance_score DESC",
            (project_id,),
        ).fetchall()

        if not rows:
            cols = columns or default_columns or ["title"]
            return ",".join(cols) + "\n"

        records = []
        for r in rows:
            d = dict(r)
            # Parse first author
            authors = json.loads(d.get("authors") or "[]")
            d["first_author"] = authors[0]["name"] if authors else ""
            d["authors_str"] = "; ".join(a.get("name", "") for a in authors)
            records.append(d)

        df = pd.DataFrame(records)

        # Column selection
        available = {
            "title", "first_author", "authors_str", "doi", "year", "venue",
            "abstract", "url", "pdf_url", "cited_by_count", "is_open_access",
            "ai_relevance_score", "ai_keywords", "ai_objective", "ai_method",
            "ai_result", "sources", "discovered_at",
        }
        # Map friendly names
        col_map = {"authors": "authors_str"}

        selected = columns or default_columns or [
            "title", "first_author", "doi", "venue", "year",
            "ai_keywords", "ai_objective", "ai_method", "ai_result",
        ]
        selected = [col_map.get(c, c) for c in selected]
        selected = [c for c in selected if c in available or c in df.columns]

        buf = io.StringIO()
        df[selected].to_csv(buf, index=False)
        return buf.getvalue()

    def export_csv_filename(self, project_id: int) -> str:
        row = self.conn.execute("SELECT name FROM projects WHERE id = ?", (project_id,)).fetchone()
        name = row["name"] if row else "export"
        safe_name = "".join(c if c.isalnum() or c in " _-" else "_" for c in name).replace(" ", "_")
        return f"{safe_name}_export.csv"

    # --- Zotero ---

    def zotero_sync(self, project_id: int, *, user_id: str, api_key: str) -> dict:
        """Sync included papers to Zotero collection."""
        from pyzotero import zotero

        zot = zotero.Zotero(user_id, "user", api_key)

        # Get or create collection
        row = self.conn.execute(
            "SELECT id, collection_key FROM zotero_sync WHERE project_id = ? ORDER BY id DESC LIMIT 1",
            (project_id,),
        ).fetchone()

        project = self.conn.execute("SELECT name FROM projects WHERE id = ?", (project_id,)).fetchone()
        project_name = project["name"] if project else "ResearchBot"

        if row and row["collection_key"]:
            collection_key = row["collection_key"]
        else:
            collections = zot.collections()
            existing = next((c for c in collections if c["data"]["name"] == project_name), None)
            if existing:
                collection_key = existing["key"]
            else:
                resp = zot.create_collections([{"name": project_name}])
                collection_key = resp["successful"]["0"]["key"] if resp.get("successful") else None
                if not collection_key:
                    return {"collection_key": None, "papers_synced": 0, "papers_total": 0, "status": "error"}

        # Get included papers with DOI
        papers = self.conn.execute(
            "SELECT doi FROM papers WHERE project_id = ? AND is_included = 1 AND doi IS NOT NULL AND doi != ''",
            (project_id,),
        ).fetchall()

        synced = 0
        for batch_start in range(0, len(papers), 50):
            batch = papers[batch_start:batch_start + 50]
            items = []
            for p in batch:
                items.append({
                    "itemType": "journalArticle",
                    "DOI": p["doi"],
                    "collections": [collection_key],
                })
            try:
                zot.create_items(items)
                synced += len(batch)
            except Exception:
                pass

        # Update tracking
        self.conn.execute(
            """INSERT INTO zotero_sync (project_id, collection_key, papers_synced, last_synced_at)
               VALUES (?, ?, ?, CURRENT_TIMESTAMP)""",
            (project_id, collection_key, synced),
        )
        self.conn.commit()

        return {
            "collection_key": collection_key,
            "papers_synced": synced,
            "papers_total": len(papers),
            "status": "success" if synced == len(papers) else "partial",
        }

    def zotero_status(self, project_id: int) -> dict:
        row = self.conn.execute(
            "SELECT collection_key, papers_synced, last_synced_at FROM zotero_sync WHERE project_id = ? ORDER BY id DESC LIMIT 1",
            (project_id,),
        ).fetchone()
        if not row:
            return {"project_id": project_id, "collection_key": None, "papers_synced": 0, "last_synced_at": None}
        return {
            "project_id": project_id,
            "collection_key": row["collection_key"],
            "papers_synced": row["papers_synced"],
            "last_synced_at": row["last_synced_at"],
        }
