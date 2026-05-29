"""HUD Home Store scraper.

HUD Home Store (https://www.hudhomestore.gov) lists FHA-foreclosed homes nationwide.
The site is a JavaScript SPA, so we use Playwright to render it and extract listings.

NOTE: HUD periodically restyles the site. If selectors stop matching, run with
DEBUG=1 to capture screenshots into backend/data/cache/ for inspection.
"""
from __future__ import annotations

import asyncio
import json
import logging
import os
import re
from datetime import datetime
from typing import Any, AsyncIterator

from playwright.async_api import Browser, BrowserContext, Page, async_playwright

from config import DATA_DIR, settings
from scrapers.base import BaseScraper, ScrapedProperty

logger = logging.getLogger(__name__)

# Two-letter codes for all 50 states + DC + PR
US_STATES = [
    "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
    "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
    "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
    "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
    "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY",
    "DC", "PR",
]


class HudHomeStoreScraper(BaseScraper):
    source = "hud"
    base_url = "https://www.hudhomestore.gov"

    def __init__(self, *, headless: bool = True) -> None:
        super().__init__()
        self.headless = headless
        self._browser: Browser | None = None
        self._context: BrowserContext | None = None

    async def _launch(self) -> BrowserContext:
        self._pw = await async_playwright().start()
        self._browser = await self._pw.chromium.launch(headless=self.headless)
        self._context = await self._browser.new_context(
            user_agent=settings.scraper_user_agent,
            viewport={"width": 1440, "height": 900},
        )
        return self._context

    async def _shutdown(self) -> None:
        if self._context:
            await self._context.close()
        if self._browser:
            await self._browser.close()
        if hasattr(self, "_pw"):
            await self._pw.stop()

    async def iter_properties(self, *, states: list[str] | None = None) -> AsyncIterator[ScrapedProperty]:
        target_states = [s.upper() for s in (states or US_STATES)]
        context = await self._launch()
        try:
            for state in target_states:
                logger.info("[hud] scraping state=%s", state)
                async for prop in self._scrape_state(context, state):
                    yield prop
                await asyncio.sleep(settings.scraper_delay_seconds)
        finally:
            await self._shutdown()

    async def _scrape_state(self, context: BrowserContext, state: str) -> AsyncIterator[ScrapedProperty]:
        page = await context.new_page()
        try:
            # The search-by-state map links to /searchresult?state=XX. Exact param name
            # may need adjustment after a live run — fall back to typing into the search box.
            url = f"{self.base_url}/searchresult?state={state}"
            await page.goto(url, wait_until="networkidle", timeout=60000)

            # If state filter via URL did not work, type the state code into the search box.
            try:
                await page.wait_for_selector("[data-testid='property-card'], .property-card, .listing-card", timeout=10000)
            except Exception:
                search_box = page.locator("input[placeholder*='State'], input[placeholder*='ZIP'], input[name='search']").first
                if await search_box.count():
                    await search_box.fill(state)
                    await search_box.press("Enter")
                    await page.wait_for_load_state("networkidle", timeout=60000)

            page_num = 1
            while page_num <= settings.scraper_max_pages:
                cards = page.locator("[data-testid='property-card'], .property-card, .listing-card, article.listing")
                count = await cards.count()
                if count == 0:
                    if os.environ.get("DEBUG"):
                        await page.screenshot(path=str(DATA_DIR / f"hud_empty_{state}_p{page_num}.png"))
                    logger.warning("[hud] no cards found for state=%s page=%d", state, page_num)
                    break

                for i in range(count):
                    card = cards.nth(i)
                    detail_url = await self._extract_detail_url(card)
                    if not detail_url:
                        continue
                    prop = await self._scrape_detail(context, detail_url, state)
                    if prop:
                        yield prop

                next_btn = page.locator("a:has-text('Next'), button:has-text('Next'), [aria-label='Next page']").first
                if not await next_btn.count() or not await next_btn.is_enabled():
                    break
                await next_btn.click()
                await page.wait_for_load_state("networkidle", timeout=60000)
                page_num += 1
        finally:
            await page.close()

    async def _extract_detail_url(self, card) -> str | None:
        link = card.locator("a[href*='/listing'], a[href*='details'], a[href*='property']").first
        if await link.count() == 0:
            return None
        href = await link.get_attribute("href")
        if not href:
            return None
        return href if href.startswith("http") else f"{self.base_url}{href}"

    async def _scrape_detail(self, context: BrowserContext, url: str, state: str) -> ScrapedProperty | None:
        page = await context.new_page()
        try:
            await page.goto(url, wait_until="networkidle", timeout=60000)
            await asyncio.sleep(1)

            data = await page.evaluate(_DETAIL_EXTRACTOR_JS)
            if not data or not data.get("address"):
                if os.environ.get("DEBUG"):
                    await page.screenshot(path=str(DATA_DIR / f"hud_detail_fail_{state}.png"))
                return None

            source_id = data.get("case_number") or _hash_url(url)
            return ScrapedProperty(
                source_id=str(source_id),
                source_url=url,
                address=data.get("address", "").strip(),
                city=data.get("city"),
                state=data.get("state") or state,
                zip_code=data.get("zip"),
                price=_parse_price(data.get("price")),
                status=data.get("status"),
                listing_date=_parse_date(data.get("listing_date")),
                auction_date=_parse_date(data.get("bid_open_date")),
                property_type=data.get("property_type"),
                beds=_parse_int(data.get("beds")),
                baths=_parse_float(data.get("baths")),
                sqft=_parse_int(data.get("sqft")),
                year_built=_parse_int(data.get("year_built")),
                photos=data.get("photos") or [],
                agent_name=data.get("broker_name"),
                agent_phone=data.get("broker_phone"),
                agent_email=data.get("broker_email"),
                agent_company=data.get("broker_company"),
                description=data.get("description"),
                raw=data,
            )
        except Exception as exc:  # noqa: BLE001
            logger.warning("[hud] detail scrape failed for %s: %r", url, exc)
            return None
        finally:
            await page.close()


_DETAIL_EXTRACTOR_JS = r"""
() => {
  const text = (sel) => {
    const el = document.querySelector(sel);
    return el ? el.textContent.trim() : null;
  };
  const findByLabel = (label) => {
    const re = new RegExp(`\\b${label}\\b`, 'i');
    const dts = Array.from(document.querySelectorAll('dt, th, .label, .field-label, strong'));
    for (const dt of dts) {
      if (re.test(dt.textContent || '')) {
        const sib = dt.nextElementSibling;
        if (sib) return sib.textContent.trim();
        const parent = dt.parentElement;
        if (parent) {
          const txt = parent.textContent.replace(dt.textContent, '').trim();
          if (txt) return txt;
        }
      }
    }
    return null;
  };
  const photos = Array.from(document.querySelectorAll('img[src*="hudhomestore"], .gallery img, .property-photo img, [class*="photo"] img'))
    .map(i => i.src)
    .filter(s => s && !s.includes('logo') && !s.includes('icon'));

  const address = text('h1, .property-address, [data-testid="address"]');
  const cityStateZip = text('.city-state-zip, .property-location');
  let city = null, state = null, zip = null;
  if (cityStateZip) {
    const m = cityStateZip.match(/(.+?),\s*([A-Z]{2})\s*(\d{5})/);
    if (m) { city = m[1].trim(); state = m[2]; zip = m[3]; }
  }

  return {
    address: address,
    city: city,
    state: state,
    zip: zip,
    price: text('.price, .listing-price, [data-testid="price"]') || findByLabel('Price'),
    case_number: findByLabel('Case'),
    status: findByLabel('Status') || text('.status-badge'),
    listing_date: findByLabel('Listed') || findByLabel('Listing Date'),
    bid_open_date: findByLabel('Bid Open') || findByLabel('Bid Open Date'),
    property_type: findByLabel('Property Type') || findByLabel('Type'),
    beds: findByLabel('Beds') || findByLabel('Bedrooms'),
    baths: findByLabel('Baths') || findByLabel('Bathrooms'),
    sqft: findByLabel('Sq') || findByLabel('Square Feet'),
    year_built: findByLabel('Year Built'),
    broker_name: findByLabel('Broker') || findByLabel('Listing Broker') || text('.broker-name'),
    broker_phone: findByLabel('Phone') || text('.broker-phone, a[href^="tel:"]'),
    broker_email: findByLabel('Email') || text('.broker-email, a[href^="mailto:"]'),
    broker_company: findByLabel('Company') || findByLabel('Brokerage'),
    description: text('.description, .property-description, [data-testid="description"]'),
    photos: photos,
  };
}
"""


def _parse_price(s: Any) -> float | None:
    if not s:
        return None
    digits = re.sub(r"[^\d.]", "", str(s))
    try:
        return float(digits) if digits else None
    except ValueError:
        return None


def _parse_int(s: Any) -> int | None:
    if s is None:
        return None
    m = re.search(r"\d+", str(s))
    return int(m.group()) if m else None


def _parse_float(s: Any) -> float | None:
    if s is None:
        return None
    m = re.search(r"\d+(?:\.\d+)?", str(s))
    return float(m.group()) if m else None


def _parse_date(s: Any) -> datetime | None:
    if not s:
        return None
    for fmt in ("%m/%d/%Y", "%Y-%m-%d", "%b %d, %Y", "%B %d, %Y"):
        try:
            return datetime.strptime(str(s).strip(), fmt)
        except ValueError:
            continue
    return None


def _hash_url(url: str) -> str:
    import hashlib
    return hashlib.md5(url.encode()).hexdigest()[:16]
