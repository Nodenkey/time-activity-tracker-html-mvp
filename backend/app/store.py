from __future__ import annotations

from dataclasses import dataclass, asdict
from datetime import date, datetime
from typing import Any, Dict, List, Optional


@dataclass
class StoredTimeEntry:
    id: int
    date: date
    person: str
    team: str
    activity: str
    category: str
    duration_minutes: int
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime


_entries: Dict[int, StoredTimeEntry] = {}
_next_id: int = 1


def _seed_data() -> None:
    global _next_id
    seed_items = [
        {
            "date": date(2026, 4, 13),
            "person": "Alice Johnson",
            "team": "Engineering",
            "activity": "Implement time tracking API endpoints",
            "category": "Development",
            "duration_minutes": 120,
            "notes": "Initial CRUD implementation",
        },
        {
            "date": date(2026, 4, 13),
            "person": "Brian Lee",
            "team": "HR",
            "activity": "Prepare onboarding schedule for new hires",
            "category": "HR Operations",
            "duration_minutes": 90,
            "notes": None,
        },
        {
            "date": date(2026, 4, 12),
            "person": "Carla Gomez",
            "team": "Finance",
            "activity": "Reconcile Q1 expense reports",
            "category": "Reporting",
            "duration_minutes": 180,
            "notes": "Focused on travel expenses",
        },
    ]

    for item in seed_items:
        created = datetime.utcnow()
        global _entries
        entry = StoredTimeEntry(
            id=_next_id,
            created_at=created,
            updated_at=created,
            **item,
        )
        _entries[_next_id] = entry
        _next_id += 1


_seed_data()


def list_entries(*, date_filter: Optional[date] = None, person: Optional[str] = None, team: Optional[str] = None) -> List[Dict[str, Any]]:
    results: List[StoredTimeEntry] = list(_entries.values())

    if date_filter is not None:
        results = [e for e in results if e.date == date_filter]
    if person is not None:
        person_norm = person.strip().lower()
        results = [e for e in results if e.person.lower() == person_norm]
    if team is not None:
        team_norm = team.strip().lower()
        results = [e for e in results if e.team.lower() == team_norm]

    return [asdict(e) for e in results]


def get_entry(entry_id: int) -> Optional[Dict[str, Any]]:
    entry = _entries.get(entry_id)
    return asdict(entry) if entry is not None else None


def create_entry(data: Dict[str, Any]) -> Dict[str, Any]:
    global _next_id
    created = datetime.utcnow()
    entry = StoredTimeEntry(
        id=_next_id,
        created_at=created,
        updated_at=created,
        **data,
    )
    _entries[_next_id] = entry
    _next_id += 1
    return asdict(entry)


def update_entry(entry_id: int, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    entry = _entries.get(entry_id)
    if entry is None:
        return None

    for key, value in data.items():
        if hasattr(entry, key) and key not in {"id", "created_at"}:
            setattr(entry, key, value)
    entry.updated_at = datetime.utcnow()
    return asdict(entry)


def delete_entry(entry_id: int) -> bool:
    if entry_id not in _entries:
        return False
    del _entries[entry_id]
    return True
