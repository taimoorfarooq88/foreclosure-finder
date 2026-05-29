from scrapers.base import BaseScraper, ScrapedProperty

ALL_SCRAPERS: list[type[BaseScraper]] = []

# HUD scraper depends on Playwright. Import lazily so API/seed work without it.
try:
    from scrapers.hud import HudHomeStoreScraper

    ALL_SCRAPERS.append(HudHomeStoreScraper)
except ModuleNotFoundError as _exc:
    import logging
    logging.getLogger(__name__).warning(
        "HUD scraper unavailable (%s). Install with: python -m playwright install chromium",
        _exc,
    )

__all__ = ["BaseScraper", "ScrapedProperty", "ALL_SCRAPERS"]
