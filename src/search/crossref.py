"""CrossRef API client.

API: https://api.crossref.org/works
Rate limit: 50 req/sec, polite pool with email header.
"""

from __future__ import annotations

import logging
import re
import time

import httpx

from src.search import SearchResult

logger = logging.getLogger(__name__)

CROSSREF_API = "https://api.crossref.org/works"


def search(query: str, *, max_results: int = 20, config=None) -> list[SearchResult]:
    email = getattr(config, "crossref_email", "") if config else ""
    params = {
        "query": query,
        "rows": min(max_results, 100),
        "select": "DOI,title,abstract,published-print,published-online,"
                  "is-referenced-by-count,author,container-title,subject",
    }

    headers = {}
    if email:
        headers["User-Agent"] = f"ResearchBot/2.0 (mailto:{email})"

    resp = httpx.get(CROSSREF_API, params=params, headers=headers, timeout=30)
    resp.raise_for_status()
    items = resp.json().get("message", {}).get("items", [])

    results = []
    for i, item in enumerate(items[:max_results]):
        title = item.get("title", [""])[0] if item.get("title") else ""
        abstract = item.get("abstract", "") or ""
        if "<" in abstract:
            abstract = re.sub(r"<[^>]+>", "", abstract)

        doi = item.get("DOI")

        date_parts = (
            item.get("published-print", {}).get("date-parts", [[None]])
            or item.get("published-online", {}).get("date-parts", [[None]])
        )
        year = date_parts[0][0] if date_parts and date_parts[0] else None

        authors = []
        for a in item.get("author", []):
            name = f"{a.get('given', '')} {a.get('family', '')}".strip()
            affiliation_list = a.get("affiliation", [])
            entry = {"name": name}
            if affiliation_list:
                entry["affiliation"] = affiliation_list[0].get("name", "")
            if name:
                authors.append(entry)

        container = item.get("container-title", [])
        venue = container[0] if container else ""
        subjects = item.get("subject", [])

        results.append(SearchResult(
            title=title,
            authors=authors,
            year=year,
            venue=venue,
            abstract=abstract,
            doi=doi,
            url=f"https://doi.org/{doi}" if doi else "",
            cited_by_count=item.get("is-referenced-by-count", 0) or 0,
            author_keywords=subjects,
            source_name="crossref",
            source_id=doi,
            source_rank=i,
            source_total=len(items),
        ))

    time.sleep(0.5)
    return results
