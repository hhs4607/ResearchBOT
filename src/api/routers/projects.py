"""Projects router — CRUD + summary stats."""

from fastapi import APIRouter, Depends, HTTPException

from src.api.deps import get_db, get_config
from src.api.models import ProjectIn, ProjectListItem, ProjectDetailOut, PaperCounts, KeywordCount, YearRange
from src.services.project_service import ProjectService

router = APIRouter(tags=["projects"])


def _to_list_item(p: dict) -> ProjectListItem:
    return ProjectListItem(
        id=p["id"], name=p["name"], description=p.get("description"),
        created_at=p.get("created_at"), updated_at=p.get("updated_at"),
        paper_counts=PaperCounts(**p.get("paper_counts", {})),
        search_count=p.get("search_count", 0),
    )


@router.get("/projects")
def list_projects(conn=Depends(get_db)):
    svc = ProjectService(conn)
    return {"projects": [_to_list_item(p) for p in svc.list_all()]}


@router.post("/projects", status_code=201)
def create_project(body: ProjectIn, conn=Depends(get_db)):
    svc = ProjectService(conn)
    return svc.create(body.name, body.description)


@router.get("/projects/{project_id}")
def get_project(project_id: int, conn=Depends(get_db)):
    svc = ProjectService(conn)
    p = svc.get(project_id)
    if not p:
        raise HTTPException(404, "Project not found")
    return ProjectDetailOut(
        id=p["id"], name=p["name"], description=p.get("description"),
        created_at=p.get("created_at"), updated_at=p.get("updated_at"),
        paper_counts=PaperCounts(**p.get("paper_counts", {})),
        search_count=p.get("search_count", 0),
        top_keywords=[KeywordCount(**k) for k in p.get("top_keywords", [])],
        year_range=YearRange(**p.get("year_range", {})),
    )


@router.put("/projects/{project_id}")
def update_project(project_id: int, body: ProjectIn, conn=Depends(get_db)):
    svc = ProjectService(conn)
    p = svc.update(project_id, body.name, body.description)
    if not p:
        raise HTTPException(404, "Project not found")
    return p


@router.delete("/projects/{project_id}", status_code=204)
def delete_project(project_id: int, conn=Depends(get_db)):
    svc = ProjectService(conn)
    if not svc.delete(project_id):
        raise HTTPException(404, "Project not found")
