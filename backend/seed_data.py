"""Seed the DB with sample foreclosure listings across all 50 US states + DC + PR,
each with estimated market value, repair cost, and 3 nearby comparable sales.

Run: `python seed_data.py`           — additive seed
     `python seed_data.py --reset`   — wipe DB first (use after schema changes)
"""
from __future__ import annotations

import sys

from comps import generate_all
from db.database import Base, SessionLocal, engine, init_db
from db.repository import upsert_property


def seed(reset: bool = False) -> int:
    """Load sample listings into the DB. Returns the number of samples processed.

    Importable so the API can auto-seed on startup (useful on hosts with an
    ephemeral disk, where the DB is empty on every cold start).
    """
    if reset:
        # Drop and recreate tables — wipes sample data and applies any schema changes.
        # We do NOT delete the .db file because Windows may still hold a stale handle
        # on it even after the holding process exits. drop_all() is enough.
        Base.metadata.drop_all(bind=engine)
        print("DB reset (tables dropped).")

    init_db()
    samples = generate_all()
    db = SessionLocal()
    try:
        new_count = updated_count = 0
        for item in samples:
            _, is_new = upsert_property(db, source=item["source"], source_id=item["source_id"], data=item["data"])
            if is_new:
                new_count += 1
            else:
                updated_count += 1
        db.commit()
        print(f"Seed complete — {new_count} new, {updated_count} updated, {len(samples)} total samples across all states.")
        return len(samples)
    finally:
        db.close()


def main() -> None:
    seed(reset="--reset" in sys.argv)


if __name__ == "__main__":
    main()
