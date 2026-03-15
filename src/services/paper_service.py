"""Paper service — save from search, CRUD, filtering, bulk ops, refetch, copy."""

from __future__ import annotations

import json
import sqlite3

from src.search import SearchResult


class PaperService:
    def __init__(self, conn: sqlite3.Connection):
        self.conn = conn

    # --- Save from search results ---

    def save_from_search(
        self, project_id: int, search_id: int, selections: list[dict], search_results: list[dict]
    ) -> dict:
        """Save selected papers from search results to DB.

        selections: [{temp_index, is_included}, ...]
        search_results: the papers list from SearchService.execute_search()
        """
        saved = 0
        skipped = 0
        paper_ids = []

        result_map = {p["temp_index"]: p for p in search_results}

        for sel in selections:
            idx = sel["temp_index"]
            is_included = sel.get("is_included")
            paper_data = result_map.get(idx)
            if not paper_data:
                skipped += 1
                continue

            sr: SearchResult = paper_data.get("_search_result")
            if not sr:
                skipped += 1
                continue

            # Check duplicate
            if sr.doi:
                existing = self.conn.execute(
                    "SELECT id FROM papers WHERE project_id = ? AND doi = ?",
                    (project_id, sr.doi),
                ).fetchone()
                if existing:
                    skipped += 1
                    paper_ids.append(existing["id"])
                    continue

            existing_title = self.conn.execute(
                "SELECT id FROM papers WHERE project_id = ? AND title = ?",
                (project_id, sr.title),
            ).fetchone()
            if existing_title:
                skipped += 1
                paper_ids.append(existing_title["id"])
                continue

            sources = sr.raw_metadata.get("_all_sources", [sr.source_name])

            try:
                cur = self.conn.execute(
                    """INSERT INTO papers (
                        project_id, doi, openalex_id, s2_id, arxiv_id,
                        title, authors, year, venue, abstract, url, pdf_url, tldr,
                        cited_by_count, is_open_access,
                        ai_relevance_score, is_included, sources, raw_metadata
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                    (
                        project_id, sr.doi, sr.openalex_id, sr.s2_id, sr.arxiv_id,
                        sr.title, json.dumps(sr.authors), sr.year, sr.venue,
                        sr.abstract, sr.url, sr.pdf_url, sr.tldr,
                        sr.cited_by_count, sr.is_open_access,
                        sr.raw_metadata.get("ai_relevance_score"),
                        is_included, json.dumps(sources), json.dumps(sr.raw_metadata),
                    ),
                )
                pid = cur.lastrowid
                paper_ids.append(pid)
                saved += 1

                # Link to search
                self.conn.execute(
                    "INSERT OR IGNORE INTO search_papers (search_id, paper_id) VALUES (?, ?)",
                    (search_id, pid),
                )

                # Save source details
                for source_name in sources:
                    source_id = None
                    if source_name == "openalex":
                        source_id = sr.openalex_id
                    elif source_name == "semantic_scholar":
                        source_id = sr.s2_id
                    elif source_name == "arxiv":
                        source_id = sr.arxiv_id
                    self.conn.execute(
                        "INSERT OR IGNORE INTO paper_sources (paper_id, source, source_id) VALUES (?, ?, ?)",
                        (pid, source_name, source_id),
                    )

            except sqlite3.IntegrityError:
                skipped += 1
                continue

        self.conn.commit()
        return {"saved": saved, "skipped_duplicates": skipped, "paper_ids": paper_ids}

    # --- List with filtering ---

    def list_papers(
        self,
        project_id: int,
        *,
        page: int = 1,
        limit: int = 20,
        sort: str = "ai_relevance_score",
        order: str = "desc",
        is_included: int | None = None,  # None=all, 1=included, 0=excluded, -1=undecided
        keyword: str | None = None,
        year_min: int | None = None,
        year_max: int | None = None,
        score_min: float | None = None,
        score_max: float | None = None,
        source: str | None = None,
        q: str | None = None,
    ) -> dict:
        conditions = ["p.project_id = ?"]
        params: list = [project_id]

        if is_included == 1:
            conditions.append("p.is_included = 1")
        elif is_included == 0:
            conditions.append("p.is_included = 0")
        elif is_included == -1:
            conditions.append("p.is_included IS NULL")

        if year_min is not None:
            conditions.append("p.year >= ?")
            params.append(year_min)
        if year_max is not None:
            conditions.append("p.year <= ?")
            params.append(year_max)
        if score_min is not None:
            conditions.append("p.ai_relevance_score >= ?")
            params.append(score_min)
        if score_max is not None:
            conditions.append("p.ai_relevance_score <= ?")
            params.append(score_max)
        if q:
            conditions.append("(p.title LIKE ? OR p.abstract LIKE ?)")
            params.extend([f"%{q}%", f"%{q}%"])
        if source:
            conditions.append("p.sources LIKE ?")
            params.append(f'%"{source}"%')

        join_clause = ""
        if keyword:
            join_clause = """
                JOIN paper_keywords pk ON p.id = pk.paper_id
                JOIN keywords k ON pk.keyword_id = k.id
            """
            conditions.append("k.canonical_form = ?")
            params.append(keyword)

        where = " AND ".join(conditions)
        allowed_sorts = {"ai_relevance_score", "year", "cited_by_count", "title", "discovered_at"}
        sort_col = sort if sort in allowed_sorts else "ai_relevance_score"
        order_dir = "ASC" if order.lower() == "asc" else "DESC"

        # Count total
        count_sql = f"SELECT COUNT(DISTINCT p.id) as cnt FROM papers p {join_clause} WHERE {where}"
        total = self.conn.execute(count_sql, params).fetchone()["cnt"]

        # Fetch page
        offset = (page - 1) * limit
        fetch_params = list(params) + [limit, offset]
        sql = f"""SELECT DISTINCT p.id, p.title, p.authors, p.year, p.venue, p.doi, p.url,
                         p.cited_by_count, p.is_open_access, p.ai_relevance_score,
                         p.ai_keywords, p.is_included, p.sources, p.discovered_at
                  FROM papers p {join_clause}
                  WHERE {where}
                  ORDER BY p.{sort_col} {order_dir}
                  LIMIT ? OFFSET ?"""

        rows = self.conn.execute(sql, fetch_params).fetchall()
        papers = []
        for r in rows:
            d = dict(r)
            d["authors"] = json.loads(d["authors"]) if d["authors"] else []
            d["sources"] = json.loads(d["sources"]) if d["sources"] else []
            papers.append(d)

        return {
            "papers": papers,
            "pagination": {
                "page": page,
                "limit": limit,
                "total": total,
                "total_pages": max(1, (total + limit - 1) // limit),
            },
        }

    # --- Single paper ---

    def get(self, paper_id: int) -> dict | None:
        row = self.conn.execute("SELECT * FROM papers WHERE id = ?", (paper_id,)).fetchone()
        if not row:
            return None
        d = dict(row)
        for json_field in ("authors", "sources", "raw_metadata", "references_list", "cited_by_list"):
            if d.get(json_field):
                d[json_field] = json.loads(d[json_field])
            else:
                d[json_field] = [] if json_field != "raw_metadata" else {}
        # Get keywords
        from src.services.keyword_service import KeywordService
        ks = KeywordService(self.conn)
        d["keywords"] = ks.get_paper_keywords(paper_id)
        # Get source details
        sources = self.conn.execute(
            "SELECT source, source_id, fetched_at FROM paper_sources WHERE paper_id = ?",
            (paper_id,),
        ).fetchall()
        d["source_details"] = [dict(s) for s in sources]
        return d

    def update(self, paper_id: int, **fields) -> dict | None:
        allowed = {"ai_keywords", "ai_objective", "ai_method", "ai_result", "user_note", "is_included"}
        updates = {k: v for k, v in fields.items() if k in allowed and v is not None}
        if not updates:
            return self.get(paper_id)

        set_clause = ", ".join(f"{k} = ?" for k in updates)
        values = list(updates.values()) + [paper_id]
        self.conn.execute(
            f"UPDATE papers SET {set_clause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
            values,
        )

        # Handle keyword_ids if provided
        keyword_ids = fields.get("keyword_ids")
        if keyword_ids is not None:
            from src.services.keyword_service import KeywordService
            KeywordService(self.conn).set_paper_keywords(paper_id, keyword_ids, source="user")

        self.conn.commit()
        return self.get(paper_id)

    def set_included(self, paper_id: int, is_included: int | None) -> dict | None:
        self.conn.execute(
            "UPDATE papers SET is_included = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
            (is_included, paper_id),
        )
        self.conn.commit()
        return self.get(paper_id)

    def delete(self, paper_id: int) -> bool:
        cur = self.conn.execute("DELETE FROM papers WHERE id = ?", (paper_id,))
        self.conn.commit()
        return cur.rowcount > 0

    # --- Bulk operations ---

    def bulk_include(self, paper_ids: list[int], is_included: int | None) -> int:
        if not paper_ids:
            return 0
        placeholders = ",".join("?" for _ in paper_ids)
        cur = self.conn.execute(
            f"UPDATE papers SET is_included = ?, updated_at = CURRENT_TIMESTAMP WHERE id IN ({placeholders})",
            [is_included] + paper_ids,
        )
        self.conn.commit()
        return cur.rowcount

    def auto_select(self, project_id: int, threshold: float) -> int:
        cur = self.conn.execute(
            """UPDATE papers SET is_included = 1, updated_at = CURRENT_TIMESTAMP
               WHERE project_id = ? AND is_included IS NULL AND ai_relevance_score >= ?""",
            (project_id, threshold),
        )
        self.conn.commit()
        return cur.rowcount

    def bulk_keyword(self, paper_ids: list[int], keyword_id: int, action: str = "add") -> int:
        from src.services.keyword_service import KeywordService
        ks = KeywordService(self.conn)
        count = 0
        for pid in paper_ids:
            if action == "add":
                ks.link_paper_keyword(pid, keyword_id, source="user")
            else:
                ks.unlink_paper_keyword(pid, keyword_id)
            count += 1
        return count

    # --- Copy ---

    def copy_to_project(self, paper_id: int, target_project_id: int) -> dict | None:
        source = self.get(paper_id)
        if not source:
            return None
        try:
            cur = self.conn.execute(
                """INSERT INTO papers (
                    project_id, doi, openalex_id, s2_id, arxiv_id,
                    title, authors, year, venue, abstract, url, pdf_url, tldr,
                    cited_by_count, is_open_access, references_list, cited_by_list,
                    ai_relevance_score, ai_keywords, ai_objective, ai_method, ai_result,
                    sources, raw_metadata
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (
                    target_project_id,
                    source.get("doi"), source.get("openalex_id"), source.get("s2_id"), source.get("arxiv_id"),
                    source["title"], json.dumps(source.get("authors", [])),
                    source.get("year"), source.get("venue"), source.get("abstract"),
                    source.get("url"), source.get("pdf_url"), source.get("tldr"),
                    source.get("cited_by_count", 0), source.get("is_open_access", False),
                    json.dumps(source.get("references_list", [])),
                    json.dumps(source.get("cited_by_list", [])),
                    source.get("ai_relevance_score"), source.get("ai_keywords"),
                    source.get("ai_objective"), source.get("ai_method"), source.get("ai_result"),
                    json.dumps(source.get("sources", [])),
                    json.dumps(source.get("raw_metadata", {})),
                ),
            )
            self.conn.commit()
            return self.get(cur.lastrowid)
        except sqlite3.IntegrityError:
            return None

    # --- Refetch ---

    def refetch_metadata(self, paper_id: int, *, config=None) -> dict | None:
        """Re-fetch metadata from known sources. Fills missing fields including refs/cited_by."""
        paper = self.get(paper_id)
        if not paper:
            return None

        doi = paper.get("doi")
        s2_id = paper.get("s2_id")

        if s2_id or doi:
            from src.search.semantic_scholar import fetch_with_refs
            lookup_id = s2_id or f"DOI:{doi}"
            s2_data = fetch_with_refs(lookup_id, config=config)
            if s2_data:
                updates = {}
                if not paper.get("abstract") and s2_data.get("abstract"):
                    updates["abstract"] = s2_data["abstract"]
                if not paper.get("tldr") and s2_data.get("tldr"):
                    updates["tldr"] = s2_data["tldr"]
                if not paper.get("pdf_url") and s2_data.get("pdf_url"):
                    updates["pdf_url"] = s2_data["pdf_url"]

                refs = s2_data.get("references", [])
                cited = s2_data.get("cited_by", [])
                if refs:
                    updates["references_list"] = json.dumps(refs)
                if cited:
                    updates["cited_by_list"] = json.dumps(cited)

                if s2_data.get("cited_by_count", 0) > paper.get("cited_by_count", 0):
                    updates["cited_by_count"] = s2_data["cited_by_count"]

                if updates:
                    set_clause = ", ".join(f"{k} = ?" for k in updates)
                    values = list(updates.values()) + [paper_id]
                    self.conn.execute(
                        f"UPDATE papers SET {set_clause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
                        values,
                    )
                    self.conn.commit()

        return self.get(paper_id)
