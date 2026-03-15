"""Keywords router — CRUD + project stats."""

from fastapi import APIRouter, Depends, HTTPException

from src.api.deps import get_db
from src.api.models import KeywordIn, KeywordOut, KeywordStatsOut, KeywordStatItem
from src.services.keyword_service import KeywordService

router = APIRouter(tags=["keywords"])


@router.get("/keywords")
def list_keywords(conn=Depends(get_db)):
    svc = KeywordService(conn)
    return {"keywords": [KeywordOut(**k) for k in svc.list_all()]}


@router.post("/keywords", status_code=201)
def create_keyword(body: KeywordIn, conn=Depends(get_db)):
    svc = KeywordService(conn)
    result = svc.create(body.canonical_form, body.variants)
    return KeywordOut(**result)


@router.put("/keywords/{keyword_id}")
def update_keyword(keyword_id: int, body: KeywordIn, conn=Depends(get_db)):
    svc = KeywordService(conn)
    result = svc.update(keyword_id, body.canonical_form, body.variants)
    if not result:
        raise HTTPException(404, "Keyword not found")
    return KeywordOut(**result)


@router.delete("/keywords/{keyword_id}", status_code=204)
def delete_keyword(keyword_id: int, conn=Depends(get_db)):
    svc = KeywordService(conn)
    if not svc.delete(keyword_id):
        raise HTTPException(404, "Keyword not found")
