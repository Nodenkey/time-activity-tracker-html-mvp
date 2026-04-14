from datetime import date
from typing import List, Optional

from fastapi import APIRouter, HTTPException, Query, status

from app import store
from app.models import TimeEntry, TimeEntryCreate, TimeEntryUpdate

router = APIRouter(prefix="/api", tags=["entries"])


@router.get("/entries", response_model=List[TimeEntry])
def list_time_entries(
    date: Optional[date] = Query(None, description="Filter by date (YYYY-MM-DD)"),
    person: Optional[str] = Query(None, description="Filter by person name (exact match, case-insensitive)"),
    team: Optional[str] = Query(None, description="Filter by team name (exact match, case-insensitive)"),
):
    entries = store.list_entries(date_filter=date, person=person, team=team)
    return [TimeEntry(**{k: v for k, v in e.items() if k in TimeEntry.model_fields}) for e in entries]


@router.post("/entries", response_model=TimeEntry, status_code=status.HTTP_201_CREATED)
def create_time_entry(payload: TimeEntryCreate):
    created = store.create_entry(payload.model_dump())
    return TimeEntry(**{k: v for k, v in created.items() if k in TimeEntry.model_fields})


@router.put("/entries/{entry_id}", response_model=TimeEntry)
def update_time_entry(entry_id: int, payload: TimeEntryUpdate):
    existing = store.get_entry(entry_id)
    if existing is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error": "not_found",
                "message": f"Entry with id {entry_id} does not exist",
                "detail": None,
            },
        )

    update_data = payload.model_dump(exclude_unset=True)
    updated = store.update_entry(entry_id, update_data)
    assert updated is not None
    return TimeEntry(**{k: v for k, v in updated.items() if k in TimeEntry.model_fields})


@router.delete("/entries/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_time_entry(entry_id: int):
    deleted = store.delete_entry(entry_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error": "not_found",
                "message": f"Entry with id {entry_id} does not exist",
                "detail": None,
            },
        )
    return None
