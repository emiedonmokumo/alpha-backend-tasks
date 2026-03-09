# Briefing Report Generator - Python Service

## Overview
A FastAPI-based backend service for creating, managing, and rendering professional briefing reports for companies. Analysts can store structured briefing data (company info, executive summary, key points, risks, recommendations, and metrics) and generate HTML reports.

---

## Architecture

### Project Structure
```
python-service/
├── app/
│   ├── api/                    # API route handlers
│   │   ├── health.py          # Health check endpoint
│   │   ├── sample_items.py    # Sample CRUD endpoints
│   │   └── briefings.py       # Briefing endpoints (CREATE, READ, GENERATE, HTML)
│   ├── db/                    # Database configuration
│   │   ├── base.py           # SQLAlchemy Base for models
│   │   ├── session.py        # Session management
│   │   └── run_migrations.py # Manual migration runner
│   ├── models/               # SQLAlchemy ORM models
│   │   ├── briefing.py       # Briefing, BriefingPoint, BriefingMetric models
│   │   └── sample_item.py    # Sample model
│   ├── schemas/              # Pydantic validation schemas
│   │   ├── briefing.py       # Briefing request/response schemas
│   │   └── sample_item.py    # Sample schemas
│   ├── services/             # Business logic layer
│   │   ├── briefing_service.py    # Briefing CRUD operations
│   │   ├── report_formatter.py    # HTML rendering via Jinja2
│   │   └── sample_item_service.py # Sample operations
│   ├── templates/            # Jinja2 HTML templates
│   │   ├── base.html        # Base template
│   │   └── briefing_report.html # Professional briefing report template
│   ├── config.py            # Configuration management
│   └── main.py              # FastAPI app initialization
├── db/
│   └── migrations/          # SQL migration files
│       ├── 001_create_sample_items.sql/.down.sql
│       └── 002_create_briefings.sql/.down.sql
├── tests/
│   ├── conftest.py         # Pytest fixtures and configuration
│   ├── test_health.py      # Health endpoint tests
│   ├── test_sample_items.py # Sample CRUD tests
│   └── test_briefings.py   # Briefing service tests
├── requirements.txt        # Python dependencies
├── pytest.ini             # Pytest configuration
├── Dockerfile             # Docker image definition
└── README.md
```

---

## API Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/briefings` | Create a new briefing |
| GET | `/briefings/{id}` | Retrieve briefing by ID |
| POST | `/briefings/{id}/generate` | Generate HTML report |
| GET | `/briefings/{id}/html` | Fetch rendered HTML |

---

## Database Schema

### Briefings Table
- `id` (INT, PK): Primary key
- `company_name` (VARCHAR 255): Required company name
- `ticker` (VARCHAR 10): Required stock ticker (auto-uppercase)
- `sector` (VARCHAR 255): Optional sector classification
- `analyst_name` (VARCHAR 255): Optional analyst identifier
- `summary` (TEXT): Required executive summary
- `recommendation` (VARCHAR 255): Required recommendation (e.g., "BUY", "SELL", "HOLD")
- `is_generated` (BOOLEAN): Flag indicating if HTML has been generated
- `html_content` (TEXT): Cached HTML report
- `created_at` (TIMESTAMPTZ): Timestamp
- `updated_at` (TIMESTAMPTZ): Timestamp

### BriefingPoints Table
- `id` (INT, PK)
- `briefing_id` (INT, FK): Reference to briefing
- `content` (TEXT): Point content
- `type` (VARCHAR 20): "key_point" or "risk"
- `display_order` (INT): Order within type
- `created_at` (TIMESTAMPTZ)

### BriefingMetrics Table
- `id` (INT, PK)
- `briefing_id` (INT, FK)
- `name` (VARCHAR 255): Metric name (unique within briefing)
- `value` (VARCHAR 500): Metric value
- `created_at` (TIMESTAMPTZ)

---

## Implementation Details

### Validation (Pydantic)
- `companyName`: Required, 1-255 characters
- `ticker`: Required, 1-10 characters, auto-normalized to uppercase
- `summary`: Required, min 1 character
- `recommendation`: Required, 1-255 characters
- `keyPoints`: Required, minimum 2 points
- `risks`: Required, minimum 1 risk
- `metrics`: Optional, metric names must be unique

### Service Layer
**BriefingService**:
- `create_briefing()`: Create briefing with points and metrics
- `get_briefing()`: Retrieve briefing with relationships
- `mark_as_generated()`: Update generation status and store HTML

**ReportFormatter**:
- `render_briefing_report()`: Transform briefing to HTML using Jinja2 template
- Uses semantic HTML with plain CSS styling
- Professional layout with company header, summary, key points, risks, metrics, and footer

### HTML Report Features
- Responsive design (up to 900px max-width)
- Print-friendly styling
- Company branding with ticker and sector
- Separated key points and risks with distinct styling
- Metrics grid layout
- Analyst attribution
- Generated timestamp tracking

---

## Key Decisions

### Database
- SQLAlchemy 2.0 ORM for type-safe queries
- Manual SQL migrations with custom runner (`run_migrations.py`)
- Cascading deletes: removing briefing removes all points and metrics

### Validation
- Pydantic schemas enforce all business rules
- Ticker auto-normalization at schema level
- Metric uniqueness validated before database insert

### HTML Generation
- Jinja2 templates for semantic, dynamic HTML
- Plain CSS (no frontend frameworks)
- Report cached in database to avoid regeneration
- Single `render_briefing_report()` method for template transformation

### Testing
- pytest fixtures for database isolation (`conftest.py`)
- Each test creates fresh database and cleans up
- Both unit (service) and integration (API) test support

---

## Running the Service

### Local Development (Quick Start)
```bash
# Install dependencies
pip install -r requirements.txt

# Set environment variable
export DATABASE_URL=postgresql://assessment_user:assessment_pass@localhost:5432/assessment_db

# Run migrations
python -m app.db.run_migrations up

# Start server
python -m uvicorn app.main:app --reload --port 8000
```

### Docker Compose (Recommended)
```bash
# Start services (PostgreSQL + Python service)
docker-compose -f docker-compose.dev.yml up

# Migrations run automatically on container start

# Access API at http://localhost:8000
```

### Running Tests
```bash
# All tests
python -m pytest

# Specific test file
python -m pytest tests/test_briefings.py

# With coverage
python -m pytest --cov=app
```

---

## Sample Request

### Create Briefing
```json
{
  "company_name": "Tech Innovators Inc.",
  "ticker": "tech",
  "sector": "Software",
  "analyst_name": "Jane Smith",
  "summary": "Company demonstrates strong growth in cloud services with expanding market share.",
  "recommendation": "BUY",
  "key_points": [
    "Market-leading cloud infrastructure",
    "Strong recurring revenue model"
  ],
  "risks": [
    "Intense competition from industry giants"
  ],
  "metrics": [
    {"name": "P/E Ratio", "value": "28.5"},
    {"name": "Revenue Growth YoY", "value": "35.2%"}
  ]
}
```

### Generate Report
```bash
POST /briefings/{id}/generate
# Returns updated briefing with is_generated=true
```

### Get HTML
```bash
GET /briefings/{id}/html
# Returns: {"content": "<html>...</html>"}
```

---

## Technology Stack

- **Framework**: FastAPI
- **Database**: PostgreSQL with SQLAlchemy 2.0
- **Validation**: Pydantic v2
- **Template Engine**: Jinja2
- **Testing**: pytest with TestClient
- **Python**: 3.12
- **Containerization**: Docker & Docker Compose

---

## Notes

- Docker Compose file (`docker-compose.dev.yml`) is not committed to git (local development only)
- migrations run automatically when docker container starts
- HTML is cached after generation to avoid recomputation
- All endpoints implemented per requirements (no overengineering)
