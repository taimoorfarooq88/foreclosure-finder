from datetime import datetime
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from db.models import Property, ScrapeRun


def upsert_property(db: Session, source: str, source_id: str, data: dict[str, Any]) -> tuple[Property, bool]:
    """Insert or update a property by (source, source_id). Returns (property, is_new)."""
    existing = db.execute(
        select(Property).where(Property.source == source, Property.source_id == source_id)
    ).scalar_one_or_none()

    if existing is None:
        prop = Property(source=source, source_id=source_id, **data)
        db.add(prop)
        db.flush()
        return prop, True

    for key, value in data.items():
        if value is not None and hasattr(existing, key):
            setattr(existing, key, value)
    existing.updated_at = datetime.utcnow()
    db.flush()
    return existing, False


def start_run(db: Session, source: str) -> ScrapeRun:
    run = ScrapeRun(source=source, started_at=datetime.utcnow(), status="running")
    db.add(run)
    db.commit()
    db.refresh(run)
    return run


def finish_run(db: Session, run: ScrapeRun, *, status: str, found: int, new: int, updated: int, error: str | None = None) -> None:
    run.finished_at = datetime.utcnow()
    run.status = status
    run.items_found = found
    run.items_new = new
    run.items_updated = updated
    run.error = error
    db.commit()
