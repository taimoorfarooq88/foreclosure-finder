from datetime import datetime

from pydantic import BaseModel, ConfigDict


class PropertyOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    source: str
    source_id: str
    source_url: str | None

    address: str
    city: str | None
    state: str | None
    zip_code: str | None
    county: str | None
    latitude: float | None
    longitude: float | None

    price: float | None
    status: str | None
    listing_date: datetime | None
    auction_date: datetime | None

    property_type: str | None
    beds: int | None
    baths: float | None
    sqft: int | None
    lot_size: str | None
    year_built: int | None

    photos: list[str] | None

    agent_name: str | None
    agent_phone: str | None
    agent_email: str | None
    agent_company: str | None

    description: str | None

    estimated_market_value: float | None
    estimated_repair_cost: float | None
    comps: list[dict] | None

    created_at: datetime
    updated_at: datetime


class NearbyOut(BaseModel):
    """Lightweight listing summary for the map / neighborhood comparison."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    address: str
    city: str | None
    state: str | None
    zip_code: str | None
    latitude: float | None
    longitude: float | None
    price: float | None
    estimated_market_value: float | None
    beds: int | None
    baths: float | None
    sqft: int | None
    distance_miles: float | None = None


class SearchResponse(BaseModel):
    total: int
    page: int
    page_size: int
    results: list[PropertyOut]


class StatsResponse(BaseModel):
    total_properties: int
    by_source: dict[str, int]
    by_state: dict[str, int]
    last_scrape_runs: list[dict]
