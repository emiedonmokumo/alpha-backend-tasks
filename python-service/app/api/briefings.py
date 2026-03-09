from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.briefing import BriefingCreate, BriefingRead
from app.services.briefing_service import BriefingService
from app.services.report_formatter import ReportFormatter

router = APIRouter(prefix="/briefings", tags=["briefings"])
formatter = ReportFormatter()


@router.post("", response_model=BriefingRead)
def create_briefing(briefing_data: BriefingCreate, db: Session = Depends(get_db)):
    """Create a new briefing with key points, risks, and optional metrics."""
    briefing = BriefingService.create_briefing(db, briefing_data)
    return briefing


@router.get("/{briefing_id}", response_model=BriefingRead)
def get_briefing(briefing_id: int, db: Session = Depends(get_db)):
    """Retrieve a briefing by ID."""
    briefing = BriefingService.get_briefing(db, briefing_id)
    if not briefing:
        raise HTTPException(status_code=404, detail="Briefing not found")
    return briefing


@router.post("/{briefing_id}/generate", response_model=BriefingRead)
def generate_briefing_report(briefing_id: int, db: Session = Depends(get_db)):
    """Generate HTML report from briefing data."""
    briefing = BriefingService.get_briefing(db, briefing_id)
    if not briefing:
        raise HTTPException(status_code=404, detail="Briefing not found")
    
    # Render HTML from briefing data
    html_content = formatter.render_briefing_report(briefing)
    
    # Mark as generated and store HTML
    briefing = BriefingService.mark_as_generated(db, briefing_id, html_content)
    
    return briefing


@router.get("/{briefing_id}/html", response_class=HTMLResponse)
def get_briefing_html(briefing_id: int, db: Session = Depends(get_db)):
    """Retrieve the rendered HTML report for a briefing."""
    briefing = BriefingService.get_briefing(db, briefing_id)
    if not briefing:
        raise HTTPException(status_code=404, detail="Briefing not found")
    
    if not briefing.is_generated or not briefing.html_content:
        raise HTTPException(status_code=404, detail="Report not yet generated")
    
    return briefing.html_content

    
    if not briefing.is_generated or not briefing.html_content:
        raise HTTPException(status_code=404, detail="Report not yet generated")
    
    return {"content": briefing.html_content}
