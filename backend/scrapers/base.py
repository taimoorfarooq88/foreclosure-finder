from __future__ import annotations

import asyncio
import logging
from abc import ABC, abstractmethod
from dataclasses import asdict, dataclass, field
from datetime import datetime
from typing import Any, AsyncIterator

import httpx
from sqlalchemy.orm import Session
from tenacity import retry, stop_after_attempt, wait_exponential

from config import settings
from db.repository import finish_run, start_run, upsert_property

logger = logging.getLogger(__name__)


@dataclass
class ScrapedProperty:
    """Normalized property record produced by a scraper. Maps 1:1 onto db.models.Property fields."""

    source_id: str
    address: str
    source_url: str | None = None
    city: str | None = None
    state: str | None = None
    zip_code: str | None = None
    county: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    price: float | None = None
    status: str | None = None
    listing_date: datetime | None = None
    auction_date: datetime | None = None
    property_type: str | None = None
    beds: int | None = None
    baths: float | None = None
    sqft: int | None = None
    lot_size: str | None = None
    year_built: int | None = None
    photos: list[str] = field(default_factory=list)
    agent_name: str | None = None
    agent_phone: str | None = None
    agent_email: str | None = None
    agent_company: str | None = None
    description: str | None = None
    raw: dict[str, Any] | None = None

    def to_db_dict(self) -> dict[str, Any]:
        data = asdict(self)
        data.pop("source_id")
        return data


class BaseScraper(ABC):
    """Base class for source-specific scrapers. Subclasses implement `iter_properties`."""

    source: str = ""
    base_url: str = ""

    def __init__(self) -> None:
        if not self.source:
            raise ValueError(f"{type(self).__name__} must define a non-empty `source`")
        self.client = httpx.AsyncClient(
            headers={"User-Agent": settings.scraper_user_agent},
            timeout=30.0,
            follow_redirects=True,
        )

    async def __aenter__(self) -> "BaseScraper":
        return self

    async def __aexit__(self, *exc_info: Any) -> None:
        await self.client.aclose()

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(min=1, max=10))
    async def fetch(self, url: str, **kwargs: Any) -> httpx.Response:
        await asyncio.sleep(settings.scraper_delay_seconds)
        response = await self.client.get(url, **kwargs)
        response.raise_for_status()
        return response

    @abstractmethod
    async def iter_properties(self, *, states: list[str] | None = None) -> AsyncIterator[ScrapedProperty]:
        """Yield normalized property records. `states` may filter to specific US state codes."""
        if False:  # pragma: no cover — make this an async generator
            yield  # type: ignore[unreachable]

    async def run(self, db: Session, *, states: list[str] | None = None) -> dict[str, int]:
        """Run the scraper end-to-end and upsert results into the DB."""
        run = start_run(db, source=self.source)
        found = new = updated = 0
        error: str | None = None
        try:
            async for prop in self.iter_properties(states=states):
                found += 1
                _, is_new = upsert_property(db, source=self.source, source_id=prop.source_id, data=prop.to_db_dict())
                if is_new:
                    new += 1
                else:
                    updated += 1
                if found % 25 == 0:
                    db.commit()
                    logger.info("[%s] progress: found=%d new=%d updated=%d", self.source, found, new, updated)
            db.commit()
            finish_run(db, run, status="ok", found=found, new=new, updated=updated)
        except Exception as exc:  # noqa: BLE001
            db.rollback()
            error = repr(exc)
            logger.exception("[%s] scrape failed", self.source)
            finish_run(db, run, status="error", found=found, new=new, updated=updated, error=error)
            raise
        return {"found": found, "new": new, "updated": updated}
