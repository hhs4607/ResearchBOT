"""Project CRUD with paper count aggregation."""

from __future__ import annotations

import sqlite3


class ProjectService:
    def __init__(self, conn: sqlite3.Connection):
        self.conn = conn

    def list_all(self) -> list[dict]:
        rows = self.conn.execute(
            "SELECT id, name, description, created_at, updated_at FROM projects ORDER BY updated_at DESC"
        ).fetchall()
        return [self._enrich(dict(r)) for r in rows]

    def get(self, project_id: int) -> dict | None:
        row = self.conn.execute(
            "SELECT id, name, description, created_at, updated_at FROM projects WHERE id = ?",
            (project_id,),
        ).fetchone()
        if not row:
            return None
        return self._enrich_detail(dict(row))

    def create(self, name: str, description: str | None = None) -> dict:
        cur = self.conn.execute(
            "INSERT INTO projects (name, description) VALUES (?, ?)",
            (name, description),
        )
        self.conn.commit()
        return self.get(cur.lastrowid)

    def update(self, project_id: int, name: str | None = None, description: str | None = None) -> dict | None:
        existing = self.get(project_id)
        if not existing:
            return None
        new_name = name if name is not None else existing["name"]
        new_desc = description if description is not None else existing["description"]
        self.conn.execute(
            "UPDATE projects SET name = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
            (new_name, new_desc, project_id),
        )
        self.conn.commit()
        return self.get(project_id)

    def delete(self, project_id: int) -> bool:
        cur = self.conn.execute("DELETE FROM projects WHERE id = ?", (project_id,))
        self.conn.commit()
        return cur.rowcount > 0

    def _paper_counts(self, project_id: int) -> dict:
        row = self.conn.execute(
            """SELECT
                COUNT(*) as total,
                SUM(CASE WHEN is_included = 1 THEN 1 ELSE 0 END) as included,
                SUM(CASE WHEN is_included = 0 THEN 1 ELSE 0 END) as excluded,
                SUM(CASE WHEN is_included IS NULL THEN 1 ELSE 0 END) as undecided
               FROM papers WHERE project_id = ?""",
            (project_id,),
        ).fetchone()
        return {
            "total": row["total"] or 0,
            "included": row["included"] or 0,
            "excluded": row["excluded"] or 0,
            "undecided": row["undecided"] or 0,
        }

    def _search_count(self, project_id: int) -> int:
        row = self.conn.execute(
            "SELECT COUNT(*) as cnt FROM search_logs WHERE project_id = ?",
            (project_id,),
        ).fetchone()
        return row["cnt"] or 0

    def _enrich(self, project: dict) -> dict:
        project["paper_counts"] = self._paper_counts(project["id"])
        project["search_count"] = self._search_count(project["id"])
        return project

    def _enrich_detail(self, project: dict) -> dict:
        project = self._enrich(project)
        # Top keywords
        rows = self.conn.execute(
            """SELECT k.canonical_form as keyword, COUNT(*) as count
               FROM paper_keywords pk
               JOIN keywords k ON pk.keyword_id = k.id
               JOIN papers p ON pk.paper_id = p.id
               WHERE p.project_id = ?
               GROUP BY k.id ORDER BY count DESC LIMIT 10""",
            (project["id"],),
        ).fetchall()
        project["top_keywords"] = [dict(r) for r in rows]
        # Year range
        row = self.conn.execute(
            "SELECT MIN(year) as min_year, MAX(year) as max_year FROM papers WHERE project_id = ? AND year IS NOT NULL",
            (project["id"],),
        ).fetchone()
        project["year_range"] = {"min": row["min_year"], "max": row["max_year"]}
        return project
