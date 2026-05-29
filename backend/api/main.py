from __future__ import annotations

from contextlib import asynccontextmanager
from typing import Annotated

from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from math import asin, cos, radians, sin, sqrt

from api.schemas import NearbyOut, PropertyOut, SearchResponse, StatsResponse
from db.database import get_db, init_db
from db.models import Property, ScrapeRun


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    # Auto-seed sample data when the DB is empty. Cloud hosts (Render free tier,
    # etc.) use an ephemeral disk, so a fresh SQLite file appears on every cold
    # start — without this the deployed site would show zero listings.
    from db.database import SessionLocal

    db = SessionLocal()
    try:
        if db.execute(select(func.count(Property.id))).scalar_one() == 0:
            from seed_data import seed

            seed()
    finally:
        db.close()
    yield


app = FastAPI(
    title="Foreclosure Finder API",
    description="Search foreclosed properties from HUD, Fannie Mae, Freddie Mac, VA, USDA, and Auction.com",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


DbDep = Annotated[Session, Depends(get_db)]


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.get("/api/properties", response_model=SearchResponse)
def search_properties(
    db: DbDep,
    state: str | None = Query(None, min_length=2, max_length=2, description="2-letter US state code, e.g. TX"),
    zip_code: str | None = Query(None, alias="zip", min_length=5, max_length=10),
    city: str | None = Query(None),
    source: str | None = Query(None, description="Filter by data source: hud, fannie_mae, freddie_mac, va, usda, auction_com"),
    min_price: float | None = Query(None, ge=0),
    max_price: float | None = Query(None, ge=0),
    min_beds: int | None = Query(None, ge=0),
    min_baths: float | None = Query(None, ge=0),
    property_type: str | None = Query(None),
    has_photos: bool = Query(False),
    has_agent_phone: bool = Query(False),
    min_profit: float | None = Query(None, description="Filter to deals where (market_value - price - repair_cost) >= this amount"),
    min_profit_percent: float | None = Query(None, description="Filter to deals where profit / market_value >= this %"),
    sort: str = Query("newest", pattern="^(newest|price_asc|price_desc|beds_desc|profit_desc|profit_percent_desc)$"),
    page: int = Query(1, ge=1),
    page_size: int = Query(24, ge=1, le=100),
) -> SearchResponse:
    stmt = select(Property)
    count_stmt = select(func.count(Property.id))

    filters = []
    if state:
        filters.append(Property.state == state.upper())
    if zip_code:
        filters.append(Property.zip_code == zip_code)
    if city:
        filters.append(Property.city.ilike(f"%{city}%"))
    if source:
        filters.append(Property.source == source)
    if min_price is not None:
        filters.append(Property.price >= min_price)
    if max_price is not None:
        filters.append(Property.price <= max_price)
    if min_beds is not None:
        filters.append(Property.beds >= min_beds)
    if min_baths is not None:
        filters.append(Property.baths >= min_baths)
    if property_type:
        filters.append(Property.property_type == property_type)
    if has_photos:
        filters.append(Property.photos.is_not(None))
    if has_agent_phone:
        filters.append(Property.agent_phone.is_not(None))

    # Profit = market_value - price - COALESCE(repair_cost, 0). Only meaningful when both
    # market_value and price are present, so guard with NOT NULL too.
    from sqlalchemy import func as sa_func
    profit_expr = (
        Property.estimated_market_value
        - Property.price
        - sa_func.coalesce(Property.estimated_repair_cost, 0)
    )
    if min_profit is not None:
        filters.append(Property.estimated_market_value.is_not(None))
        filters.append(Property.price.is_not(None))
        filters.append(profit_expr >= min_profit)
    if min_profit_percent is not None:
        filters.append(Property.estimated_market_value.is_not(None))
        filters.append(Property.estimated_market_value > 0)
        filters.append(profit_expr * 100.0 / Property.estimated_market_value >= min_profit_percent)

    for f in filters:
        stmt = stmt.where(f)
        count_stmt = count_stmt.where(f)

    if sort == "price_asc":
        stmt = stmt.order_by(Property.price.asc().nulls_last())
    elif sort == "price_desc":
        stmt = stmt.order_by(Property.price.desc().nulls_last())
    elif sort == "beds_desc":
        stmt = stmt.order_by(Property.beds.desc().nulls_last())
    elif sort == "profit_desc":
        stmt = stmt.order_by(profit_expr.desc().nulls_last())
    elif sort == "profit_percent_desc":
        stmt = stmt.order_by((profit_expr / Property.estimated_market_value).desc().nulls_last())
    else:
        stmt = stmt.order_by(Property.created_at.desc())

    total = db.execute(count_stmt).scalar_one()
    stmt = stmt.offset((page - 1) * page_size).limit(page_size)
    rows = db.execute(stmt).scalars().all()

    return SearchResponse(
        total=total,
        page=page,
        page_size=page_size,
        results=[PropertyOut.model_validate(r) for r in rows],
    )


@app.get("/api/properties/{property_id}", response_model=PropertyOut)
def get_property(property_id: int, db: DbDep) -> PropertyOut:
    prop = db.get(Property, property_id)
    if not prop:
        raise HTTPException(404, "Property not found")
    return PropertyOut.model_validate(prop)


def _haversine_miles(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Great-circle distance between two lat/lng points, in miles."""
    r = 3958.8  # Earth radius in miles
    dlat = radians(lat2 - lat1)
    dlng = radians(lng2 - lng1)
    a = sin(dlat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlng / 2) ** 2
    return round(2 * r * asin(sqrt(a)), 1)


@app.get("/api/properties/{property_id}/nearby", response_model=list[NearbyOut])
def nearby_properties(
    property_id: int,
    db: DbDep,
    limit: int = Query(12, ge=1, le=50),
) -> list[NearbyOut]:
    """Other foreclosure listings near this one — same state, sorted by distance.
    Used for the map and the neighborhood value comparison."""
    prop = db.get(Property, property_id)
    if not prop:
        raise HTTPException(404, "Property not found")

    stmt = select(Property).where(Property.id != property_id)
    if prop.state:
        stmt = stmt.where(Property.state == prop.state)
    elif prop.zip_code:
        stmt = stmt.where(Property.zip_code == prop.zip_code)
    else:
        return []

    rows = db.execute(stmt).scalars().all()

    out: list[NearbyOut] = []
    for r in rows:
        item = NearbyOut.model_validate(r)
        if prop.latitude is not None and prop.longitude is not None and r.latitude is not None and r.longitude is not None:
            item.distance_miles = _haversine_miles(prop.latitude, prop.longitude, r.latitude, r.longitude)
        out.append(item)

    # Nearest first; listings without coordinates sink to the bottom.
    out.sort(key=lambda x: x.distance_miles if x.distance_miles is not None else 1e9)
    return out[:limit]


@app.get("/api/stats", response_model=StatsResponse)
def stats(db: DbDep) -> StatsResponse:
    total = db.execute(select(func.count(Property.id))).scalar_one()

    by_source_rows = db.execute(
        select(Property.source, func.count(Property.id)).group_by(Property.source)
    ).all()
    by_state_rows = db.execute(
        select(Property.state, func.count(Property.id))
        .where(Property.state.is_not(None))
        .group_by(Property.state)
        .order_by(func.count(Property.id).desc())
    ).all()

    runs = db.execute(
        select(ScrapeRun).order_by(ScrapeRun.started_at.desc()).limit(10)
    ).scalars().all()

    return StatsResponse(
        total_properties=total,
        by_source={s: c for s, c in by_source_rows},
        by_state={s: c for s, c in by_state_rows},
        last_scrape_runs=[
            {
                "source": r.source,
                "started_at": r.started_at.isoformat(),
                "finished_at": r.finished_at.isoformat() if r.finished_at else None,
                "status": r.status,
                "items_found": r.items_found,
                "items_new": r.items_new,
                "items_updated": r.items_updated,
                "error": r.error,
            }
            for r in runs
        ],
    )


@app.get("/api/states")
def list_states(db: DbDep) -> list[dict]:
    rows = db.execute(
        select(Property.state, func.count(Property.id))
        .where(Property.state.is_not(None))
        .group_by(Property.state)
        .order_by(Property.state)
    ).all()
    return [{"state": s, "count": c} for s, c in rows]
