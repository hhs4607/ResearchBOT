"""Keyword normalization and CRUD service.

ai_keywords = Gemini raw output (read-only, semicolon-separated string)
paper_keywords = operational normalized data (user edits this, junction table)
"""

from __future__ import annotations

import json
import re
import sqlite3

# Pattern: "Full Name (ABBREVIATION)" e.g. "Physics-Informed Neural Networks (PINN)"
_PAREN_ABBREV = re.compile(r'^(.+?)\s*\(([A-Z][A-Za-z0-9-]*s?)\)\s*$')


class KeywordService:
    def __init__(self, conn: sqlite3.Connection):
        self.conn = conn

    # --- Normalization ---

    def _match_canonical(self, term: str) -> tuple[int | None, str | None]:
        """Try to match a term against canonical forms (case-insensitive)."""
        row = self.conn.execute(
            "SELECT id, canonical_form FROM keywords WHERE LOWER(canonical_form) = ?",
            (term.lower(),),
        ).fetchone()
        if row:
            return row["id"], row["canonical_form"]
        # Try without trailing 's' for plurals (e.g. "PINNs" → "PINN")
        if term.endswith('s') and len(term) > 2:
            row = self.conn.execute(
                "SELECT id, canonical_form FROM keywords WHERE LOWER(canonical_form) = ?",
                (term[:-1].lower(),),
            ).fetchone()
            if row:
                return row["id"], row["canonical_form"]
        return None, None

    def _match_variant(self, term: str) -> tuple[int | None, str | None]:
        """Try to match a term against variant lists."""
        term_lower = term.lower()
        rows = self.conn.execute(
            "SELECT id, canonical_form, variants FROM keywords WHERE variants IS NOT NULL"
        ).fetchall()
        for row in rows:
            variants = json.loads(row["variants"]) if row["variants"] else []
            if term_lower in [v.lower() for v in variants]:
                return row["id"], row["canonical_form"]
        return None, None

    def normalize(self, raw_keyword: str) -> tuple[int | None, str]:
        """Normalize a keyword against the canonical dictionary.

        Handles formats like "Physics-Informed Neural Networks (PINN)".
        Returns (keyword_id, canonical_form) if matched, or (None, original) if not.
        """
        raw_stripped = raw_keyword.strip()
        if not raw_stripped:
            return None, raw_keyword

        # 1. Parse "Full Name (ABBREV)" pattern
        m = _PAREN_ABBREV.match(raw_stripped)
        if m:
            full_name, abbrev = m.group(1).strip(), m.group(2).strip()

            # Try abbreviation first (most likely to match canonical)
            kid, canonical = self._match_canonical(abbrev)
            if kid:
                return kid, canonical

            # Try full name as variant
            kid, canonical = self._match_variant(full_name)
            if kid:
                return kid, canonical

        # 2. Direct canonical match
        kid, canonical = self._match_canonical(raw_stripped)
        if kid:
            return kid, canonical

        # 3. Variant match
        kid, canonical = self._match_variant(raw_stripped)
        if kid:
            return kid, canonical

        return None, raw_keyword

    def normalize_many(self, keywords_str: str, separator: str = ";") -> list[tuple[int | None, str]]:
        """Normalize a semicolon-separated keyword string."""
        if not keywords_str:
            return []
        results = []
        seen = set()
        for kw in keywords_str.split(separator):
            kw = kw.strip()
            if not kw:
                continue
            kid, canonical = self.normalize(kw)
            key = canonical.lower()
            if key not in seen:
                seen.add(key)
                results.append((kid, canonical))
        return results

    # --- CRUD ---

    def list_all(self) -> list[dict]:
        rows = self.conn.execute(
            "SELECT id, canonical_form, variants, created_at FROM keywords ORDER BY canonical_form"
        ).fetchall()
        return [
            {
                "id": r["id"],
                "canonical_form": r["canonical_form"],
                "variants": json.loads(r["variants"]) if r["variants"] else [],
                "created_at": r["created_at"],
            }
            for r in rows
        ]

    def get(self, keyword_id: int) -> dict | None:
        row = self.conn.execute(
            "SELECT id, canonical_form, variants, created_at FROM keywords WHERE id = ?",
            (keyword_id,),
        ).fetchone()
        if not row:
            return None
        return {
            "id": row["id"],
            "canonical_form": row["canonical_form"],
            "variants": json.loads(row["variants"]) if row["variants"] else [],
            "created_at": row["created_at"],
        }

    def create(self, canonical_form: str, variants: list[str] | None = None) -> dict:
        variants_json = json.dumps(variants or [])
        cur = self.conn.execute(
            "INSERT INTO keywords (canonical_form, variants) VALUES (?, ?)",
            (canonical_form, variants_json),
        )
        self.conn.commit()
        return self.get(cur.lastrowid)

    def update(self, keyword_id: int, canonical_form: str | None = None, variants: list[str] | None = None) -> dict | None:
        existing = self.get(keyword_id)
        if not existing:
            return None
        new_canonical = canonical_form if canonical_form is not None else existing["canonical_form"]
        new_variants = json.dumps(variants) if variants is not None else json.dumps(existing["variants"])
        self.conn.execute(
            "UPDATE keywords SET canonical_form = ?, variants = ? WHERE id = ?",
            (new_canonical, new_variants, keyword_id),
        )
        self.conn.commit()
        return self.get(keyword_id)

    def delete(self, keyword_id: int) -> bool:
        cur = self.conn.execute("DELETE FROM keywords WHERE id = ?", (keyword_id,))
        self.conn.commit()
        return cur.rowcount > 0

    # --- Paper-keyword operations ---

    def link_paper_keyword(self, paper_id: int, keyword_id: int, source: str = "ai") -> None:
        try:
            self.conn.execute(
                "INSERT OR IGNORE INTO paper_keywords (paper_id, keyword_id, source) VALUES (?, ?, ?)",
                (paper_id, keyword_id, source),
            )
            self.conn.commit()
        except sqlite3.IntegrityError:
            pass

    def unlink_paper_keyword(self, paper_id: int, keyword_id: int) -> None:
        self.conn.execute(
            "DELETE FROM paper_keywords WHERE paper_id = ? AND keyword_id = ?",
            (paper_id, keyword_id),
        )
        self.conn.commit()

    def get_paper_keywords(self, paper_id: int) -> list[dict]:
        rows = self.conn.execute(
            """SELECT k.id, k.canonical_form, pk.source
               FROM paper_keywords pk
               JOIN keywords k ON pk.keyword_id = k.id
               WHERE pk.paper_id = ?
               ORDER BY k.canonical_form""",
            (paper_id,),
        ).fetchall()
        return [{"id": r["id"], "canonical_form": r["canonical_form"], "source": r["source"]} for r in rows]

    def set_paper_keywords(self, paper_id: int, keyword_ids: list[int], source: str = "user") -> None:
        """Replace all keywords for a paper."""
        self.conn.execute("DELETE FROM paper_keywords WHERE paper_id = ?", (paper_id,))
        for kid in keyword_ids:
            self.conn.execute(
                "INSERT OR IGNORE INTO paper_keywords (paper_id, keyword_id, source) VALUES (?, ?, ?)",
                (paper_id, kid, source),
            )
        self.conn.commit()

    # --- Stats ---

    def keyword_stats(self, project_id: int) -> list[dict]:
        """Keyword frequency for a project."""
        rows = self.conn.execute(
            """SELECT k.id as keyword_id, k.canonical_form, COUNT(pk.paper_id) as paper_count
               FROM paper_keywords pk
               JOIN keywords k ON pk.keyword_id = k.id
               JOIN papers p ON pk.paper_id = p.id
               WHERE p.project_id = ?
               GROUP BY k.id, k.canonical_form
               ORDER BY paper_count DESC""",
            (project_id,),
        ).fetchall()
        return [dict(r) for r in rows]
