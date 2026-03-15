"""Export router — CSV download, Zotero sync + status."""

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse

from src.api.deps import get_db, get_config
from src.api.models import ZoteroSyncOut, ZoteroStatusOut, KeywordStatsOut, KeywordStatItem
from src.services.export_service import ExportService
from src.services.keyword_service import KeywordService

router = APIRouter(tags=["export"])


@router.get("/projects/{project_id}/export/csv")
def export_csv(
    project_id: int,
    columns: str | None = Query(None, description="Comma-separated column names"),
    conn=Depends(get_db),
    config=Depends(get_config),
):
    svc = ExportService(conn)
    col_list = columns.split(",") if columns else None
    csv_content = svc.export_csv(project_id, columns=col_list, default_columns=config.csv_default_columns)
    filename = svc.export_csv_filename(project_id)

    return StreamingResponse(
        iter([csv_content]),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.post("/projects/{project_id}/export/zotero")
def zotero_sync(project_id: int, conn=Depends(get_db), config=Depends(get_config)):
    if not config.zotero_user_id or not config.zotero_api_key:
        raise HTTPException(500, "ZOTERO_USER_ID and ZOTERO_API_KEY not configured")
    svc = ExportService(conn)
    result = svc.zotero_sync(project_id, user_id=config.zotero_user_id, api_key=config.zotero_api_key)
    return ZoteroSyncOut(**result)


@router.get("/projects/{project_id}/export/zotero/status")
def zotero_status(project_id: int, conn=Depends(get_db)):
    svc = ExportService(conn)
    return ZoteroStatusOut(**svc.zotero_status(project_id))


# Keyword stats (listed under export since it's project-scoped)
@router.get("/projects/{project_id}/keyword-stats")
def keyword_stats(project_id: int, conn=Depends(get_db)):
    svc = KeywordService(conn)
    stats = svc.keyword_stats(project_id)
    return KeywordStatsOut(
        project_id=project_id,
        stats=[KeywordStatItem(**s) for s in stats],
        total_keywords=len(stats),
    )
