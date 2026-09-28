from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class IncidentCreate(BaseModel):
    incident_type: str = Field(
        min_length=2,
        max_length=100,
    )

    title: str = Field(
        min_length=2,
        max_length=255,
    )

    severity: str = Field(
        default="INFO",
        max_length=20,
    )

    source: str = Field(
        min_length=1,
        max_length=255,
    )

    target: str | None = Field(
        default=None,
        max_length=255,
    )

    description: str = Field(
        min_length=1,
    )

    linked_event_id: int | None = None


class IncidentStatusUpdate(BaseModel):
    status: str = Field(
        min_length=2,
        max_length=30,
    )


class IncidentResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True
    )

    id: int

    incident_type: str

    title: str

    severity: str

    status: str

    source: str

    target: str | None

    description: str

    linked_event_id: int | None

    created_at: datetime

    updated_at: datetime