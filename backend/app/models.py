from datetime import date
from typing import Optional

from pydantic import BaseModel, Field, field_validator


class TimeEntryBase(BaseModel):
    date: date = Field(..., description="Entry date")
    person: str = Field(..., description="Person who performed the activity")
    team: str = Field(..., description="Team name")
    activity: str = Field(..., description="Description of the activity")
    category: str = Field(..., description="Category of work, e.g. Development, Meeting")
    duration_minutes: int = Field(..., gt=0, description="Duration in minutes, must be > 0")
    notes: Optional[str] = Field(None, description="Optional notes")

    @field_validator("person", "team", "activity", "category")
    @classmethod
    def non_empty_string(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("must not be empty")
        return v.strip()


class TimeEntryCreate(TimeEntryBase):
    pass


class TimeEntryUpdate(BaseModel):
    date: Optional[date] = None
    person: Optional[str] = None
    team: Optional[str] = None
    activity: Optional[str] = None
    category: Optional[str] = None
    duration_minutes: Optional[int] = Field(None, gt=0)
    notes: Optional[str] = None

    @field_validator("person", "team", "activity", "category")
    @classmethod
    def non_empty_optional_string(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        if not v.strip():
            raise ValueError("must not be empty")
        return v.strip()


class TimeEntry(TimeEntryBase):
    id: int = Field(..., description="Server-assigned unique ID")

    class Config:
        from_attributes = True
