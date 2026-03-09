CREATE TABLE briefings (
    id SERIAL PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL,
    ticker VARCHAR(10) NOT NULL,
    sector VARCHAR(255),
    analyst_name VARCHAR(255),
    summary TEXT NOT NULL,
    recommendation VARCHAR(255) NOT NULL,
    is_generated BOOLEAN DEFAULT FALSE NOT NULL,
    html_content TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE briefing_points (
    id SERIAL PRIMARY KEY,
    briefing_id INTEGER NOT NULL REFERENCES briefings(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    type VARCHAR(20) NOT NULL,
    display_order INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE briefing_metrics (
    id SERIAL PRIMARY KEY,
    briefing_id INTEGER NOT NULL REFERENCES briefings(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    value VARCHAR(500) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_briefing_points_briefing_id ON briefing_points(briefing_id);
CREATE INDEX idx_briefing_metrics_briefing_id ON briefing_metrics(briefing_id);
