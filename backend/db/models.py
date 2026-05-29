from datetime import datetime

from sqlalchemy import JSON, DateTime, Float, Index, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from db.database import Base


class Property(Base):
    __tablename__ = "properties"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    # Source tracking — same physical property may appear in multiple sources
    source: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    source_id: Mapped[str] = mapped_column(String(128), nullable=False)
    source_url: Mapped[str | None] = mapped_column(Text)

    # Address
    address: Mapped[str] = mapped_column(String(255), nullable=False)
    city: Mapped[str | None] = mapped_column(String(120), index=True)
    state: Mapped[str | None] = mapped_column(String(2), index=True)
    zip_code: Mapped[str | None] = mapped_column(String(10), index=True)
    county: Mapped[str | None] = mapped_column(String(120))
    latitude: Mapped[float | None] = mapped_column(Float)
    longitude: Mapped[float | None] = mapped_column(Float)

    # Listing
    price: Mapped[float | None] = mapped_column(Float, index=True)
    status: Mapped[str | None] = mapped_column(String(64))
    listing_date: Mapped[datetime | None] = mapped_column(DateTime)
    auction_date: Mapped[datetime | None] = mapped_column(DateTime)

    # Property attributes
    property_type: Mapped[str | None] = mapped_column(String(64))
    beds: Mapped[int | None] = mapped_column(Integer)
    baths: Mapped[float | None] = mapped_column(Float)
    sqft: Mapped[int | None] = mapped_column(Integer)
    lot_size: Mapped[str | None] = mapped_column(String(64))
    year_built: Mapped[int | None] = mapped_column(Integer)

    # Media — JSON list of URLs
    photos: Mapped[list[str] | None] = mapped_column(JSON)

    # Agent / contact — THIS IS THE CRITICAL FIELD for the user
    agent_name: Mapped[str | None] = mapped_column(String(255))
    agent_phone: Mapped[str | None] = mapped_column(String(64), index=True)
    agent_email: Mapped[str | None] = mapped_column(String(255))
    agent_company: Mapped[str | None] = mapped_column(String(255))

    # Description + raw scraped payload for debugging
    description: Mapped[str | None] = mapped_column(Text)
    raw: Mapped[dict | None] = mapped_column(JSON)

    # Market analysis — estimated value of comparable nearby homes (ARV),
    # repair cost estimate, and a JSON list of {address, sold_price, sold_date, beds, baths, sqft}
    # comps used to derive the estimate. Lets users see profit margin at a glance.
    estimated_market_value: Mapped[float | None] = mapped_column(Float)
    estimated_repair_cost: Mapped[float | None] = mapped_column(Float)
    comps: Mapped[list[dict] | None] = mapped_column(JSON)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    __table_args__ = (
        UniqueConstraint("source", "source_id", name="uq_property_source"),
        Index("ix_property_state_zip", "state", "zip_code"),
    )


class ScrapeRun(Base):
    __tablename__ = "scrape_runs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    source: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    started_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    finished_at: Mapped[datetime | None] = mapped_column(DateTime)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="running")
    items_found: Mapped[int] = mapped_column(Integer, default=0)
    items_new: Mapped[int] = mapped_column(Integer, default=0)
    items_updated: Mapped[int] = mapped_column(Integer, default=0)
    error: Mapped[str | None] = mapped_column(Text)
