from scrapers.base import BaseScraper, ScrapedProperty
from scrapers.hud_reo import HudReoScraper

# Reliable, browser-free scrapers run everywhere (local, Render, GitHub Actions).
ALL_SCRAPERS: list[type[BaseScraper]] = [HudReoScraper]

# The Playwright-based HUD Home Store detail scraper is optional (heavy, needs a
# browser). Import lazily so it never breaks the API/seed/cron when unavailable.
try:
    from scrapers.hud import HudHomeStoreScraper  # noqa: F401
except ModuleNotFoundError as _exc:
    import logging

    logging.getLogger(__name__).info(
        "Playwright HUD detail scraper unavailable (%s) — using API-only HUD REO scraper.",
        _exc,
    )

__all__ = ["BaseScraper", "ScrapedProperty", "ALL_SCRAPERS", "HudReoScraper"]
