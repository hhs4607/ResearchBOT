"""Google Scholar client via scholarly library.

Best-effort source — may fail due to rate limiting or IP blocking.
Rate limit: ~1 req per 3 seconds.
"""

from __future__ import annotations

import logging
import time

from src.search import SearchResult

logger = logging.getLogger(__name__)


def search(query: str, *, max_results: int = 20) -> list[SearchResult]:
    try:
        from scholarly import scholarly as scholar_api
    except ImportError:
        logger.warning("scholarly not installed, skipping Google Scholar")
        return []

    results = []
    try:
        pubs = scholar_api.search_pubs(query)
        for i in range(max_results):
            try:
                pub = next(pubs)
            except StopIteration:
                break

            bib = pub.get("bib", {})
            year_str = bib.get("pub_year", "")
            year = int(year_str) if year_str.isdigit() else None

            author_names = bib.get("author", [])
            if isinstance(author_names, str):
                author_names = [a.strip() for a in author_names.split(" and ")]
            authors = [{"name": name} for name in author_names]

            results.append(SearchResult(
                title=bib.get("title", ""),
                authors=authors,
                year=year,
                venue=bib.get("venue", ""),
                abstract=bib.get("abstract", ""),
                url=pub.get("pub_url", ""),
                pdf_url=pub.get("eprint_url"),
                cited_by_count=pub.get("num_citations", 0) or 0,
                source_name="google_scholar",
                source_rank=i,
                source_total=0,
            ))
            time.sleep(3)
    except Exception as e:
        logger.warning("Google Scholar search failed (best-effort): %s", e)

    for r in results:
        r.source_total = len(results)

    return results
