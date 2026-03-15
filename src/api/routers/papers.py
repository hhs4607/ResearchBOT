"""Papers router — save, CRUD, include/exclude, extract, refetch, copy, bulk ops."""

from fastapi import APIRouter, Depends, HTTPException, Query

from src.api.deps import get_db, get_config
from src.api.models import (
    PaperSaveIn, PaperSaveOut, IncludeIn, PaperUpdateIn, PaperCopyIn,
    BulkIncludeIn, BulkKeywordIn, BulkResultOut, BulkExtractIn, BulkExtractOut,
    Pagination,
)
from src.services.paper_service import PaperService
from src.services.extraction_service import ExtractionService

router = APIRouter(tags=["papers"])


# --- Save from search ---

@router.post("/projects/{project_id}/papers/save")
def save_papers(project_id: int, body: PaperSaveIn, conn=Depends(get_db)):
    from src.api.routers.search import get_temp_results
    temp = get_temp_results(body.search_id)
    if temp is None:
        raise HTTPException(400, "Search results expired or not found. Please search again.")

    svc = PaperService(conn)
    selections = [{"temp_index": s.temp_index, "is_included": s.is_included} for s in body.selections]
    result = svc.save_from_search(project_id, body.search_id, selections, temp)
    return PaperSaveOut(**result)


# --- List ---

@router.get("/projects/{project_id}/papers")
def list_papers(
    project_id: int,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    sort: str = Query("ai_relevance_score"),
    order: str = Query("desc"),
    is_included: str | None = Query(None),
    keyword: str | None = Query(None),
    year_min: int | None = Query(None),
    year_max: int | None = Query(None),
    score_min: float | None = Query(None),
    score_max: float | None = Query(None),
    source: str | None = Query(None),
    q: str | None = Query(None),
    conn=Depends(get_db),
):
    # Parse is_included: "true"→1, "false"→0, "null"→-1 (undecided)
    inc_val = None
    if is_included == "true":
        inc_val = 1
    elif is_included == "false":
        inc_val = 0
    elif is_included == "null":
        inc_val = -1

    svc = PaperService(conn)
    result = svc.list_papers(
        project_id, page=page, limit=limit, sort=sort, order=order,
        is_included=inc_val, keyword=keyword,
        year_min=year_min, year_max=year_max,
        score_min=score_min, score_max=score_max,
        source=source, q=q,
    )
    result["pagination"] = Pagination(**result["pagination"])
    return result


# --- Single paper ---

@router.get("/papers/{paper_id}")
def get_paper(paper_id: int, conn=Depends(get_db)):
    svc = PaperService(conn)
    paper = svc.get(paper_id)
    if not paper:
        raise HTTPException(404, "Paper not found")
    return paper


@router.patch("/papers/{paper_id}/include")
def toggle_include(paper_id: int, body: IncludeIn, conn=Depends(get_db)):
    svc = PaperService(conn)
    is_inc = None
    if body.is_included is True:
        is_inc = 1
    elif body.is_included is False:
        is_inc = 0
    paper = svc.set_included(paper_id, is_inc)
    if not paper:
        raise HTTPException(404, "Paper not found")
    return paper


@router.put("/papers/{paper_id}")
def update_paper(paper_id: int, body: PaperUpdateIn, conn=Depends(get_db)):
    svc = PaperService(conn)
    paper = svc.update(paper_id, **body.model_dump(exclude_none=True))
    if not paper:
        raise HTTPException(404, "Paper not found")
    return paper


@router.delete("/papers/{paper_id}", status_code=204)
def delete_paper(paper_id: int, conn=Depends(get_db)):
    svc = PaperService(conn)
    if not svc.delete(paper_id):
        raise HTTPException(404, "Paper not found")


# --- Extract (Gemini) ---

@router.post("/papers/{paper_id}/extract")
def extract_paper(paper_id: int, conn=Depends(get_db), config=Depends(get_config)):
    if not config.gemini_api_key:
        raise HTTPException(500, "GEMINI_API_KEY not configured")
    svc = ExtractionService(conn, api_key=config.gemini_api_key, model=config.gemini_model)
    result = svc.extract_paper(paper_id)
    if result is None:
        raise HTTPException(400, "Paper has no abstract or extraction failed")
    return PaperService(conn).get(paper_id)


@router.post("/projects/{project_id}/papers/extract")
def extract_bulk(project_id: int, body: BulkExtractIn, conn=Depends(get_db), config=Depends(get_config)):
    if not config.gemini_api_key:
        raise HTTPException(500, "GEMINI_API_KEY not configured")
    svc = ExtractionService(conn, api_key=config.gemini_api_key, model=config.gemini_model)
    result = svc.extract_bulk(
        paper_ids=body.paper_ids,
        project_id=project_id,
        filter_mode=body.filter or "all_unextracted",
    )
    return BulkExtractOut(**result)


# --- Refetch ---

@router.post("/papers/{paper_id}/refetch")
def refetch_paper(paper_id: int, conn=Depends(get_db), config=Depends(get_config)):
    svc = PaperService(conn)
    paper = svc.refetch_metadata(paper_id, config=config)
    if not paper:
        raise HTTPException(404, "Paper not found")
    return paper


# --- Copy ---

@router.post("/papers/{paper_id}/copy")
def copy_paper(paper_id: int, body: PaperCopyIn, conn=Depends(get_db)):
    svc = PaperService(conn)
    paper = svc.copy_to_project(paper_id, body.target_project_id)
    if not paper:
        raise HTTPException(400, "Copy failed — paper not found or duplicate in target project")
    return paper


# --- Bulk ops ---

@router.post("/projects/{project_id}/papers/bulk-include")
def bulk_include(project_id: int, body: BulkIncludeIn, conn=Depends(get_db)):
    svc = PaperService(conn)
    is_inc = None
    if body.is_included is True:
        is_inc = 1
    elif body.is_included is False:
        is_inc = 0
    count = svc.bulk_include(body.paper_ids, is_inc)
    return BulkResultOut(updated=count)


@router.post("/projects/{project_id}/papers/bulk-keywords")
def bulk_keywords(project_id: int, body: BulkKeywordIn, conn=Depends(get_db)):
    svc = PaperService(conn)
    count = svc.bulk_keyword(body.paper_ids, body.keyword_id, body.action)
    return BulkResultOut(updated=count)
