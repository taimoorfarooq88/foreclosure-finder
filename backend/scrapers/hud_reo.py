"""HUD FHA REO scraper — reliable JSON API (no browser, no anti-bot).

HUD publishes all FHA single-family REO (foreclosed) properties via a public
ArcGIS REST service. We query it as paged JSON — far more robust than scraping
the JavaScript HUD Home Store site.

Endpoint: https://egis.hud.gov/arcgis/rest/services/gotit/REOProperties/MapServer/0
Fields available: CASE_NUM, STREET_NUM, DIRECTION_PREFIX, STREET_NAME, CITY,
STATE_CODE, DISPLAY_ZIP_CODE, CASE_STEP_NUMBER, + point geometry.

Note: this dataset gives address + location nationwide, but NOT price / beds /
photos / agent — those live on the HUD Home Store listing pages and would need a
separate (harder) enrichment step.
"""
from __future__ import annotations

import logging
import re
from typing import Any, AsyncIterator

from scrapers.base import BaseScraper, ScrapedProperty

logger = logging.getLogger(__name__)

_LAYER = "https://egis.hud.gov/arcgis/rest/services/gotit/REOProperties/MapServer/0/query"
_PAGE_SIZE = 1000  # service maxRecordCount


def _clean(s: Any) -> str | None:
    if s is None:
        return None
    s = re.sub(r"\s+", " ", str(s)).strip()
    return s or None


class HudReoScraper(BaseScraper):
    source = "hud"
    base_url = "https://www.hudhomestore.gov"

    async def iter_properties(self, *, states: list[str] | None = None) -> AsyncIterator[ScrapedProperty]:
        where = "1=1"
        if states:
            codes = ",".join(f"'{s.upper()}'" for s in states)
            where = f"STATE_CODE IN ({codes})"

        offset = 0
        while True:
            params = {
                "where": where,
                "outFields": "*",
                "returnGeometry": "true",
                "outSR": "4326",  # WGS84 → x=lng, y=lat
                "resultOffset": str(offset),
                "resultRecordCount": str(_PAGE_SIZE),
                "f": "json",
            }
            resp = await self.fetch(_LAYER, params=params)
            data = resp.json()
            features = data.get("features", [])
            if not features:
                break

            for feat in features:
                prop = self._to_property(feat)
                if prop:
                    yield prop

            offset += len(features)
            if not data.get("exceededTransferLimit") and len(features) < _PAGE_SIZE:
                break

    def _to_property(self, feat: dict[str, Any]) -> ScrapedProperty | None:
        a = feat.get("attributes", {})
        g = feat.get("geometry") or {}

        case_num = _clean(a.get("CASE_NUM"))
        if not case_num:
            return None

        address = _clean(" ".join(filter(None, [
            _clean(a.get("STREET_NUM")),
            _clean(a.get("DIRECTION_PREFIX")),
            _clean(a.get("STREET_NAME")),
        ])))
        if not address:
            return None

        zip_raw = a.get("DISPLAY_ZIP_CODE")
        zip_code = str(zip_raw).zfill(5) if zip_raw not in (None, "", 0) else None

        lat = g.get("y")
        lng = g.get("x")

        return ScrapedProperty(
            source_id=case_num,
            source_url=f"{self.base_url}/Listing/PropertySearch.aspx?caseNumber={case_num}",
            address=address,
            city=_clean(a.get("CITY")),
            state=_clean(a.get("STATE_CODE")),
            zip_code=zip_code,
            latitude=float(lat) if isinstance(lat, (int, float)) else None,
            longitude=float(lng) if isinstance(lng, (int, float)) else None,
            status="FHA REO (as-is)",
            property_type="Single Family",
            description=(
                "FHA-foreclosed single-family home (HUD REO), sold as-is. "
                "Price, condition, and broker details are listed on HUD Home Store."
            ),
            raw=a,
        )
