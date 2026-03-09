import pytest
from sqlalchemy.orm import Session

from app.models.briefing import Briefing, BriefingMetric, BriefingPoint
from app.schemas.briefing import BriefingCreate, BriefingMetricCreate
from app.services.briefing_service import BriefingService


@pytest.fixture
def sample_briefing_data():
    """Create sample briefing data for testing."""
    return BriefingCreate(
        company_name="Tech Corp Inc.",
        ticker="TECH",
        sector="Technology",
        analyst_name="John Analyst",
        summary="Strong fundamentals with growing market share.",
        recommendation="BUY",
        key_points=[
            "Innovative product pipeline",
            "Strong market position",
        ],
        risks=[
            "Regulatory uncertainty",
        ],
        metrics=[
            BriefingMetricCreate(name="P/E Ratio", value="15.5"),
            BriefingMetricCreate(name="Revenue Growth", value="25.3%"),
        ],
    )


def test_create_briefing(db: Session, sample_briefing_data):
    """Test creating a new briefing."""
    briefing = BriefingService.create_briefing(db, sample_briefing_data)

    assert briefing.id is not None
    assert briefing.company_name == "Tech Corp Inc."
    assert briefing.ticker == "TECH"
    assert briefing.analyst_name == "John Analyst"
    assert briefing.is_generated is False
    assert len(briefing.points) == 3  # 2 key_points + 1 risk
    assert len(briefing.metrics) == 2


def test_get_briefing(db: Session, sample_briefing_data):
    """Test retrieving a briefing by ID."""
    created_briefing = BriefingService.create_briefing(db, sample_briefing_data)
    retrieved_briefing = BriefingService.get_briefing(db, created_briefing.id)

    assert retrieved_briefing is not None
    assert retrieved_briefing.id == created_briefing.id
    assert retrieved_briefing.company_name == "Tech Corp Inc."


def test_get_briefing_not_found(db: Session):
    """Test retrieving a non-existent briefing."""
    briefing = BriefingService.get_briefing(db, 99999)
    assert briefing is None


def test_mark_as_generated(db: Session, sample_briefing_data):
    """Test marking a briefing as generated."""
    briefing = BriefingService.create_briefing(db, sample_briefing_data)
    html_content = "<html>Test HTML</html>"

    updated_briefing = BriefingService.mark_as_generated(db, briefing.id, html_content)

    assert updated_briefing.is_generated is True
    assert updated_briefing.html_content == html_content


def test_briefing_validation_duplicate_metrics(sample_briefing_data):
    """Test that duplicate metric names are rejected."""
    sample_briefing_data.metrics = [
        BriefingMetricCreate(name="Revenue", value="1000M"),
        BriefingMetricCreate(name="Revenue", value="2000M"),
    ]

    with pytest.raises(ValueError, match="Metric names must be unique"):
        BriefingCreate(**sample_briefing_data.model_dump())


def test_briefing_validation_min_key_points(sample_briefing_data):
    """Test that at least 2 key points are required."""
    sample_briefing_data.key_points = ["Only one point"]

    with pytest.raises(ValueError):
        BriefingCreate(**sample_briefing_data.model_dump())


def test_briefing_validation_min_risks(sample_briefing_data):
    """Test that at least 1 risk is required."""
    sample_briefing_data.risks = []

    with pytest.raises(ValueError):
        BriefingCreate(**sample_briefing_data.model_dump())


def test_ticker_normalization(sample_briefing_data):
    """Test that ticker is normalized to uppercase."""
    sample_briefing_data.ticker = "tech"
    briefing_data = BriefingCreate(**sample_briefing_data.model_dump())
    assert briefing_data.ticker == "TECH"
