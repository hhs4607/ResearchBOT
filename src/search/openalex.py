"""OpenAlex API client.

API: https://api.openalex.org
Rate limit: polite pool with email header, ~0.5s delay.
"""

from __future__ import annotations

import logging
import time

import httpx

from src.search import SearchResult

logger = logging.getLogger(__name__)

OPENALEX_API = "https://api.openalex.org"


def search(query: str, *, max_results: int = 20, config=None) -> list[SearchResult]:
    email = getattr(config, "openalex_email", "") if config else ""
    params = {
        "search": query,
        "filter": "type:article,has_abstract:true",
        "sort": "relevance_score:desc",
        "per_page": min(max_results, 200),
    }
    if email:
        params["mailto"] = email

    resp = httpx.get(f"{OPENALEX_API}/works", params=params, timeout=30)
    resp.raise_for_status()
    data = resp.json()

    results = []
    for i, work in enumerate(data.get("results", [])[:max_results]):
        authors = []
        for authorship in work.get("authorships", []):
            author_info = authorship.get("author", {})
            name = author_info.get("display_name", "")
            institutions = authorship.get("institutions", [])
            affiliation = institutions[0].get("display_name", "") if institutions else ""
            if name:
                entry = {"name": name}
                if affiliation:
                    entry["affiliation"] = affiliation
                authors.append(entry)

        abstract = _reconstruct_abstract(work.get("abstract_inverted_index"))

        # Venue / journal
        venue = ""
        primary_location = work.get("primary_location") or {}
        source = primary_location.get("source") or {}
        venue = source.get("display_name", "")

        # Author keywords from concepts
        author_keywords = [
            c.get("display_name", "")
            for c in work.get("concepts", [])[:10]
            if c.get("display_name")
        ]

        openalex_id = work.get("id", "").replace("https://openalex.org/", "")

        results.append(SearchResult(
            title=work.get("title", "") or "",
            authors=authors,
            year=work.get("publication_year"),
            venue=venue,
            abstract=abstract,
            doi=(work.get("doi") or "").replace("https://doi.org/", "") or None,
            url=work.get("doi") or work.get("id", ""),
            cited_by_count=work.get("cited_by_count", 0),
            is_open_access=work.get("open_access", {}).get("is_oa", False),
            author_keywords=author_keywords,
            openalex_id=openalex_id,
            source_name="openalex",
            source_id=openalex_id,
            source_rank=i,
            source_total=len(data.get("results", [])),
            raw_metadata={"relevance_score": work.get("relevance_score")},
        ))

    time.sleep(0.5)
    return results


def _reconstruct_abstract(inverted_index: dict | None) -> str:
    if not inverted_index:
        return ""
    word_positions = []
    for word, positions in inverted_index.items():
        for pos in positions:
            word_positions.append((pos, word))
    word_positions.sort()
    return " ".join(w for _, w in word_positions)
