"""Search router — POST search (temp results), GET history, POST auto-select."""

from fastapi import APIRouter, Depends, HTTPException

from src.api.deps import get_db, get_config
from src.api.models import SearchIn, SearchResultOut, SearchPaperOut, SourceResult, AutoSelectIn, AutoSelectOut
from src.services.search_service import SearchService
from src.services.paper_service import PaperService

router = APIRouter(tags=["search"])

# Store temporary search results in memory (keyed by search_id)
_temp_results: dict[int, list[dict]] = {}


@router.post("/projects/{project_id}/search")
def execute_search(project_id: int, body: SearchIn, conn=Depends(get_db), config=Depends(get_config)):
    svc = SearchService(conn, config)
    result = svc.execute_search(
        project_id, body.query,
        mode=body.mode,
        year_min=body.year_min,
        year_max=body.year_max,
        limit_per_source=body.limit_per_source,
    )

    # Store temp results for save operation
    _temp_results[result["search_id"]] = result["papers"]

    # Build response (strip internal _search_result)
    papers = []
    for p in result["papers"]:
        papers.append(SearchPaperOut(
            temp_index=p["temp_index"],
            title=p["title"],
            authors=p["authors"],
            year=p["year"],
            venue=p["venue"],
            doi=p["doi"],
            abstract=p["abstract"],
            url=p["url"],
            pdf_url=p["pdf_url"],
            cited_by_count=p["cited_by_count"],
            is_open_access=p["is_open_access"],
            ai_relevance_score=p["ai_relevance_score"],
            sources=p["sources"],
            already_saved=p["already_saved"],
        ))

    source_results = {k: SourceResult(**v) for k, v in result["source_results"].items()}

    return SearchResultOut(
        search_id=result["search_id"],
        query=result["query"],
        mode=result["mode"],
        source_results=source_results,
        papers_found=result["papers_found"],
        papers_deduped=result["papers_deduped"],
        already_in_project=result["already_in_project"],
        papers=papers,
    )


@router.get("/projects/{project_id}/searches")
def list_searches(project_id: int, conn=Depends(get_db), config=Depends(get_config)):
    svc = SearchService(conn, config)
    return {"searches": svc.list_searches(project_id)}


@router.post("/projects/{project_id}/auto-select")
def auto_select(project_id: int, body: AutoSelectIn, conn=Depends(get_db)):
    svc = PaperService(conn)
    count = svc.auto_select(project_id, body.threshold)
    return AutoSelectOut(papers_selected=count, threshold=body.threshold)


def get_temp_results(search_id: int) -> list[dict] | None:
    """Get temporary search results (used by papers router for save)."""
    return _temp_results.get(search_id)


def clear_temp_results(search_id: int) -> None:
    """Clear temporary results after save."""
    _temp_results.pop(search_id, None)
