"""arXiv API client.

Uses the arxiv Python package (v2.x).
Rate limit: 1 request per 3 seconds.
Always open access.
"""

from __future__ import annotations

import logging
import time

import arxiv

from src.search import SearchResult

logger = logging.getLogger(__name__)


def search(query: str, *, max_results: int = 20) -> list[SearchResult]:
    client = arxiv.Client()
    search_obj = arxiv.Search(
        query=query,
        max_results=min(max_results, 50),
        sort_by=arxiv.SortCriterion.Relevance,
    )

    results = []
    try:
        for i, result in enumerate(client.results(search_obj)):
            arxiv_id = result.entry_id.split("/abs/")[-1]
            if "v" in arxiv_id:
                arxiv_id = arxiv_id.rsplit("v", 1)[0]

            authors = [{"name": a.name} for a in result.authors]

            results.append(SearchResult(
                title=result.title.replace("\n", " ").strip(),
                authors=authors,
                year=result.published.year if result.published else None,
                venue="arXiv",
                abstract=result.summary.replace("\n", " ").strip() if result.summary else "",
                doi=result.doi or None,
                url=result.entry_id,
                pdf_url=result.pdf_url,
                arxiv_id=arxiv_id,
                cited_by_count=0,
                is_open_access=True,
                author_keywords=list(result.categories or []),
                source_name="arxiv",
                source_id=arxiv_id,
                source_rank=i,
                source_total=0,  # unknown until iteration complete
            ))
    except Exception as e:
        logger.warning("arXiv search failed: %s", e)

    for r in results:
        r.source_total = len(results)

    time.sleep(3.0)
    return results
