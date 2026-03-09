from sqlalchemy.orm import Session

from app.models.briefing import Briefing, BriefingMetric, BriefingPoint
from app.schemas.briefing import BriefingCreate


class BriefingService:
    @staticmethod
    def create_briefing(db: Session, briefing_data: BriefingCreate) -> Briefing:
        """Create a new briefing with points and metrics."""
        briefing = Briefing(
            company_name=briefing_data.company_name,
            ticker=briefing_data.ticker,
            sector=briefing_data.sector,
            analyst_name=briefing_data.analyst_name,
            summary=briefing_data.summary,
            recommendation=briefing_data.recommendation,
        )
        db.add(briefing)
        db.flush()  # Get the briefing ID

        # Add key points
        for idx, key_point in enumerate(briefing_data.key_points, 1):
            point = BriefingPoint(
                briefing_id=briefing.id,
                content=key_point,
                type="key_point",
                display_order=idx,
            )
            db.add(point)

        # Add risks
        for idx, risk in enumerate(briefing_data.risks, 1):
            point = BriefingPoint(
                briefing_id=briefing.id,
                content=risk,
                type="risk",
                display_order=idx,
            )
            db.add(point)

        # Add metrics
        if briefing_data.metrics:
            for metric_data in briefing_data.metrics:
                metric = BriefingMetric(
                    briefing_id=briefing.id,
                    name=metric_data.name,
                    value=metric_data.value,
                )
                db.add(metric)

        db.commit()
        db.refresh(briefing)
        return briefing

    @staticmethod
    def get_briefing(db: Session, briefing_id: int) -> Briefing | None:
        """Retrieve a briefing by ID."""
        return db.query(Briefing).filter(Briefing.id == briefing_id).first()

    @staticmethod
    def mark_as_generated(db: Session, briefing_id: int, html_content: str) -> Briefing:
        """Mark briefing as generated and store HTML."""
        briefing = db.query(Briefing).filter(Briefing.id == briefing_id).first()
        if briefing:
            briefing.is_generated = True
            briefing.html_content = html_content
            db.commit()
            db.refresh(briefing)
        return briefing
