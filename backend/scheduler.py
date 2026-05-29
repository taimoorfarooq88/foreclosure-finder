"""Daily scheduler — runs all enabled scrapers once per day at 02:00 local time.

Run with: `python scheduler.py`
"""
from __future__ import annotations

import asyncio
import logging
import sys

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

from db.database import SessionLocal, init_db
from scrapers import ALL_SCRAPERS

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("scheduler")


async def run_all_scrapers(states: list[str] | None = None) -> None:
    init_db()
    for scraper_cls in ALL_SCRAPERS:
        db = SessionLocal()
        try:
            async with scraper_cls() as scraper:
                logger.info("Starting scraper: %s", scraper.source)
                result = await scraper.run(db, states=states)
                logger.info("Scraper %s done: %s", scraper.source, result)
        except Exception:
            logger.exception("Scraper %s failed", scraper_cls.__name__)
        finally:
            db.close()


async def main() -> None:
    scheduler = AsyncIOScheduler()
    scheduler.add_job(run_all_scrapers, CronTrigger(hour=2, minute=0), id="daily-scrape", replace_existing=True)
    scheduler.start()
    logger.info("Scheduler started — next run at 02:00 daily")
    try:
        while True:
            await asyncio.sleep(3600)
    except (KeyboardInterrupt, SystemExit):
        scheduler.shutdown()


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "now":
        # Manual one-shot: `python scheduler.py now [STATE [STATE...]]`
        states = sys.argv[2:] or None
        asyncio.run(run_all_scrapers(states=states))
    else:
        asyncio.run(main())
