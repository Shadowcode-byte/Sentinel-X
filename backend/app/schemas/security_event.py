from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class SecurityEventCreate(BaseModel):
    event_type: str = Field(min_length=2, max_length=100)
    source: str = Field(min_length=1, max_length=255)
    target: str | None = Field(default=None, max_length=255)
    severity: str = Field(default="INFO", max_length=20)
    description: str = Field(min_length=1)


class SecurityEventResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    event_type: str
    source: str
    target: str | None
    severity: str
    description: str
    created_at: datetime