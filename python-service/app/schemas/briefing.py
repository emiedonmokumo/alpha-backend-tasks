from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator


class BriefingPointCreate(BaseModel):
    content: str = Field(min_length=1)
    type: str = Field(pattern="^(key_point|risk)$")  # Either "key_point" or "risk"


class BriefingMetricCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    value: str = Field(min_length=1, max_length=500)


class BriefingCreate(BaseModel):
    company_name: str = Field(min_length=1, max_length=255)
    ticker: str = Field(min_length=1, max_length=10)
    sector: str | None = Field(default=None, max_length=255)
    analyst_name: str | None = Field(default=None, max_length=255)
    summary: str = Field(min_length=1)
    recommendation: str = Field(min_length=1, max_length=255)
    key_points: list[str] = Field(min_length=2)
    risks: list[str] = Field(min_length=1)
    metrics: list[BriefingMetricCreate] | None = Field(default=None)

    @field_validator("ticker")
    @classmethod
    def normalize_ticker(cls, v):
        return v.upper()

    @field_validator("metrics")
    @classmethod
    def validate_unique_metric_names(cls, v):
        if v:
            names = [m.name for m in v]
            if len(names) != len(set(names)):
                raise ValueError("Metric names must be unique within a briefing")
        return v


class BriefingPointRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    content: str
    type: str
    display_order: int


class BriefingMetricRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    value: str


class BriefingRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    company_name: str
    ticker: str
    sector: str | None
    analyst_name: str | None
    summary: str
    recommendation: str
    is_generated: bool
    created_at: datetime
    updated_at: datetime
    points: list[BriefingPointRead]
    metrics: list[BriefingMetricRead]
