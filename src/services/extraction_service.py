"""Gemini-based keyword + OMR extraction service.

Called separately from search. Populates ai_keywords, ai_objective,
ai_method, ai_result. Auto-normalizes keywords to paper_keywords table.
"""

from __future__ import annotations

import sqlite3

from src.llm.gemini import extract_paper_info
from src.services.keyword_service import KeywordService


class ExtractionService:
    def __init__(self, conn: sqlite3.Connection, *, api_key: str, model: str = "gemini-2.5-flash"):
        self.conn = conn
        self.api_key = api_key
        self.model = model
        self.keyword_svc = KeywordService(conn)

    def extract_paper(self, paper_id: int) -> dict | None:
        """Run Gemini extraction on a single paper. Returns updated paper fields or None."""
        row = self.conn.execute(
            "SELECT title, abstract FROM papers WHERE id = ?", (paper_id,)
        ).fetchone()
        if not row or not row["abstract"]:
            return None

        result = extract_paper_info(
            row["title"], row["abstract"],
            api_key=self.api_key, model=self.model,
        )
        if not result:
            return None

        # Store raw AI keywords as semicolon string
        ai_keywords_str = "; ".join(result["keywords"])

        self.conn.execute(
            """UPDATE papers SET
                ai_keywords = ?, ai_objective = ?, ai_method = ?, ai_result = ?,
                updated_at = CURRENT_TIMESTAMP
               WHERE id = ?""",
            (ai_keywords_str, result["objective"], result["method"], result["result"], paper_id),
        )

        # Auto-normalize keywords to paper_keywords
        for kw in result["keywords"]:
            kid, canonical = self.keyword_svc.normalize(kw)
            if kid is not None:
                self.keyword_svc.link_paper_keyword(paper_id, kid, source="ai")

        self.conn.commit()
        return {
            "ai_keywords": ai_keywords_str,
            "ai_objective": result["objective"],
            "ai_method": result["method"],
            "ai_result": result["result"],
        }

    def extract_bulk(
        self, paper_ids: list[int] | None = None, *, project_id: int | None = None, filter_mode: str = "all_unextracted"
    ) -> dict:
        """Extract for multiple papers. Returns {extracted, skipped, failed, errors}."""
        if paper_ids is None and project_id is not None:
            if filter_mode == "included":
                rows = self.conn.execute(
                    "SELECT id FROM papers WHERE project_id = ? AND is_included = 1 AND ai_keywords IS NULL",
                    (project_id,),
                ).fetchall()
            else:
                rows = self.conn.execute(
                    "SELECT id FROM papers WHERE project_id = ? AND ai_keywords IS NULL",
                    (project_id,),
                ).fetchall()
            paper_ids = [r["id"] for r in rows]

        if not paper_ids:
            return {"extracted": 0, "skipped": 0, "failed": 0, "errors": []}

        extracted = 0
        skipped = 0
        failed = 0
        errors = []

        for pid in paper_ids:
            # Skip if already extracted
            row = self.conn.execute(
                "SELECT ai_keywords FROM papers WHERE id = ?", (pid,)
            ).fetchone()
            if row and row["ai_keywords"]:
                skipped += 1
                continue

            try:
                result = self.extract_paper(pid)
                if result:
                    extracted += 1
                else:
                    skipped += 1
            except Exception as e:
                failed += 1
                errors.append(f"Paper {pid}: {e}")

        return {"extracted": extracted, "skipped": skipped, "failed": failed, "errors": errors}
