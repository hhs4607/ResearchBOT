"""Semantic Scholar API client.

API: https://api.semanticscholar.org/graph/v1
Rate limit: 1 req/sec (unauth), higher with API key.
Exponential backoff on 429.
"""

from __future__ import annotations

import logging
import time

import httpx

from src.search import SearchResult

logger = logging.getLogger(__name__)

_BASE_URL = "https://api.semanticscholar.org/graph/v1"
_TIMEOUT = 15.0

_SEARCH_FIELDS = ",".join([
    "paperId", "externalIds", "title", "abstract", "year",
    "venue", "authors", "citationCount", "isOpenAccess",
    "fieldsOfStudy", "tldr",
])

_DETAIL_FIELDS = _SEARCH_FIELDS + ",references,citations"


def _headers(config=None) -> dict[str, str]:
    api_key = getattr(config, "s2_api_key", "") if config else ""
    if api_key:
        return {"x-api-key": api_key}
    return {}


def _get_with_backoff(url: str, *, params=None, config=None, max_retries=3) -> dict:
    delay = 5.0
    for attempt in range(max_retries + 1):
        resp = httpx.get(url, params=params, headers=_headers(config), timeout=_TIMEOUT)
        if resp.status_code == 429:
            if attempt == max_retries:
                logger.warning("S2 rate limited after %d retries", max_retries)
                return {"data": []}
            logger.info("S2 429, backing off %.0fs (attempt %d)", delay, attempt + 1)
            time.sleep(delay)
            delay *= 3
            continue
        resp.raise_for_status()
        return resp.json()
    return {"data": []}


def search(query: str, *, max_results: int = 20, config=None) -> list[SearchResult]:
    params = {
        "query": query,
        "limit": min(max_results, 100),
        "fields": _SEARCH_FIELDS,
    }

    data = _get_with_backoff(f"{_BASE_URL}/paper/search", params=params, config=config)

    results = []
    for i, item in enumerate(data.get("data", [])[:max_results]):
        results.append(_to_result(item, rank=i, total=len(data.get("data", []))))

    return results


def fetch_with_refs(paper_id: str, *, config=None) -> dict | None:
    """Fetch a single paper with references and citations (for refetch)."""
    try:
        item = _get_with_backoff(
            f"{_BASE_URL}/paper/{paper_id}",
            params={"fields": _DETAIL_FIELDS},
            config=config,
        )
        if not item or not item.get("paperId"):
            return None
    except Exception:
        return None

    result = _to_result(item, rank=0, total=1).to_dict()

    # Add references
    refs = []
    for ref in (item.get("references") or [])[:50]:
        ext = ref.get("externalIds") or {}
        refs.append({
            "doi": ext.get("DOI"),
            "title": ref.get("title", ""),
            "year": ref.get("year"),
        })
    result["references"] = refs

    # Add cited_by
    cited = []
    for cit in (item.get("citations") or [])[:50]:
        ext = cit.get("externalIds") or {}
        cited.append({
            "doi": ext.get("DOI"),
            "title": cit.get("title", ""),
            "year": cit.get("year"),
        })
    result["cited_by"] = cited

    return result


def _to_result(item: dict, *, rank: int, total: int) -> SearchResult:
    ext = item.get("externalIds") or {}
    authors = []
    for a in (item.get("authors") or []):
        name = a.get("name", "")
        if name:
            authors.append({"name": name})

    tldr_obj = item.get("tldr")
    tldr_text = tldr_obj.get("text") if isinstance(tldr_obj, dict) else None
    paper_id = item.get("paperId", "")

    return SearchResult(
        title=item.get("title", "") or "",
        authors=authors,
        year=item.get("year"),
        venue=item.get("venue", "") or "",
        abstract=item.get("abstract", "") or "",
        doi=ext.get("DOI"),
        url=f"https://doi.org/{ext['DOI']}" if ext.get("DOI") else f"https://www.semanticscholar.org/paper/{paper_id}",
        cited_by_count=item.get("citationCount", 0) or 0,
        is_open_access=item.get("isOpenAccess", False) or False,
        tldr=tldr_text,
        openalex_id=ext.get("OpenAlexId"),
        s2_id=paper_id,
        arxiv_id=ext.get("ArXiv"),
        author_keywords=item.get("fieldsOfStudy") or [],
        source_name="semantic_scholar",
        source_id=paper_id,
        source_rank=rank,
        source_total=total,
    )
