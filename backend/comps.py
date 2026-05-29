"""Sample-data generator for foreclosure listings across all 50 US states.

Produces realistic-looking foreclosure properties with:
- city + ZIP from a curated list per state
- agent name + phone + brokerage
- estimated market value (what comparable homes sell for in that ZIP)
- estimated repair cost (based on year built + sqft)
- 3 nearby comparable sales

Used by seed_data.py. NOT used when real scrapers run — real scrapers fill these fields
either from the source (HUD lists "as-is value") or via a market lookup service.
"""
from __future__ import annotations

import hashlib
import random
from datetime import datetime, timedelta

# (state, [(city, zip, base_median_value_usd)])
# Median values are 2024 ballpark figures from public Zillow/Redfin/Census aggregates.
STATE_CITIES: dict[str, list[tuple[str, str, int]]] = {
    "AL": [("Birmingham", "35206", 165000), ("Mobile", "36605", 145000), ("Montgomery", "36116", 155000)],
    "AK": [("Anchorage", "99504", 365000), ("Fairbanks", "99701", 285000)],
    "AZ": [("Phoenix", "85016", 410000), ("Tucson", "85705", 285000), ("Mesa", "85204", 395000)],
    "AR": [("Little Rock", "72204", 175000), ("Fort Smith", "72904", 145000)],
    "CA": [("Bakersfield", "93305", 365000), ("Fresno", "93720", 425000), ("Sacramento", "95824", 485000), ("Stockton", "95205", 415000)],
    "CO": [("Denver", "80219", 545000), ("Colorado Springs", "80909", 415000), ("Pueblo", "81004", 245000)],
    "CT": [("Hartford", "06112", 215000), ("Bridgeport", "06606", 285000), ("New Haven", "06511", 245000)],
    "DE": [("Wilmington", "19805", 245000), ("Dover", "19901", 265000)],
    "DC": [("Washington", "20019", 485000)],
    "FL": [("Miami", "33145", 595000), ("Jacksonville", "32209", 245000), ("Tampa", "33610", 335000), ("Orlando", "32805", 305000)],
    "GA": [("Atlanta", "30341", 365000), ("Augusta", "30906", 165000), ("Savannah", "31405", 295000), ("Columbus", "31907", 175000)],
    "HI": [("Honolulu", "96817", 715000), ("Hilo", "96720", 525000)],
    "ID": [("Boise", "83704", 445000), ("Idaho Falls", "83401", 325000)],
    "IL": [("Chicago", "60620", 245000), ("Rockford", "61108", 145000), ("Springfield", "62703", 145000), ("Peoria", "61604", 125000)],
    "IN": [("Indianapolis", "46226", 195000), ("Fort Wayne", "46805", 165000), ("Gary", "46408", 95000)],
    "IA": [("Des Moines", "50315", 195000), ("Cedar Rapids", "52404", 175000)],
    "KS": [("Wichita", "67214", 145000), ("Topeka", "66604", 135000), ("Kansas City", "66104", 125000)],
    "KY": [("Louisville", "40214", 195000), ("Lexington", "40505", 235000)],
    "LA": [("New Orleans", "70126", 235000), ("Baton Rouge", "70805", 165000), ("Shreveport", "71106", 155000)],
    "ME": [("Portland", "04102", 425000), ("Bangor", "04401", 195000)],
    "MD": [("Baltimore", "21215", 175000), ("Silver Spring", "20906", 425000)],
    "MA": [("Boston", "02124", 595000), ("Worcester", "01604", 365000), ("Springfield", "01104", 245000)],
    "MI": [("Detroit", "48224", 85000), ("Grand Rapids", "49507", 215000), ("Flint", "48504", 65000), ("Lansing", "48910", 155000)],
    "MN": [("Minneapolis", "55411", 285000), ("Saint Paul", "55106", 265000)],
    "MS": [("Jackson", "39212", 115000), ("Gulfport", "39501", 165000)],
    "MO": [("Saint Louis", "63115", 95000), ("Kansas City", "64127", 145000), ("Springfield", "65802", 165000)],
    "MT": [("Billings", "59102", 355000), ("Missoula", "59801", 485000)],
    "NE": [("Omaha", "68111", 195000), ("Lincoln", "68521", 245000)],
    "NV": [("Las Vegas", "89108", 395000), ("Reno", "89502", 485000), ("Henderson", "89015", 445000)],
    "NH": [("Manchester", "03103", 365000), ("Nashua", "03060", 425000)],
    "NJ": [("Newark", "07108", 355000), ("Trenton", "08609", 195000), ("Camden", "08105", 125000)],
    "NM": [("Albuquerque", "87108", 265000), ("Las Cruces", "88001", 235000)],
    "NY": [("Bronx", "10456", 595000), ("Buffalo", "14215", 145000), ("Rochester", "14609", 145000), ("Syracuse", "13208", 135000)],
    "NC": [("Charlotte", "28206", 305000), ("Raleigh", "27610", 365000), ("Greensboro", "27406", 195000), ("Durham", "27704", 345000)],
    "ND": [("Fargo", "58103", 295000), ("Bismarck", "58501", 285000)],
    "OH": [("Cleveland", "44102", 95000), ("Columbus", "43207", 175000), ("Cincinnati", "45213", 165000), ("Toledo", "43607", 85000)],
    "OK": [("Oklahoma City", "73119", 165000), ("Tulsa", "74115", 135000)],
    "OR": [("Portland", "97233", 445000), ("Eugene", "97402", 395000), ("Salem", "97301", 365000)],
    "PA": [("Philadelphia", "19120", 175000), ("Pittsburgh", "15210", 145000), ("Allentown", "18102", 195000), ("Erie", "16511", 95000)],
    "PR": [("San Juan", "00926", 215000)],
    "RI": [("Providence", "02909", 295000), ("Warwick", "02886", 345000)],
    "SC": [("Columbia", "29203", 175000), ("Charleston", "29405", 365000), ("Greenville", "29611", 215000)],
    "SD": [("Sioux Falls", "57104", 265000), ("Rapid City", "57701", 285000)],
    "TN": [("Memphis", "38111", 165000), ("Nashville", "37207", 365000), ("Knoxville", "37917", 235000)],
    "TX": [("Houston", "77084", 245000), ("Dallas", "75217", 215000), ("San Antonio", "78228", 195000), ("Austin", "78745", 485000), ("Fort Worth", "76105", 175000)],
    "UT": [("Salt Lake City", "84116", 445000), ("West Valley City", "84119", 415000)],
    "VT": [("Burlington", "05401", 425000), ("Rutland", "05701", 215000)],
    "VA": [("Richmond", "23224", 235000), ("Virginia Beach", "23464", 365000), ("Norfolk", "23504", 215000)],
    "WA": [("Seattle", "98118", 715000), ("Tacoma", "98404", 425000), ("Spokane", "99205", 345000)],
    "WV": [("Charleston", "25302", 145000), ("Huntington", "25701", 95000)],
    "WI": [("Milwaukee", "53206", 125000), ("Madison", "53704", 365000), ("Green Bay", "54303", 195000)],
    "WY": [("Cheyenne", "82001", 325000), ("Casper", "82601", 285000)],
}

STREET_NAMES = [
    "Maple", "Oak", "Pine", "Cedar", "Elm", "Birch", "Walnut", "Cherry",
    "Sunset", "Sunrise", "Park", "Lake", "River", "Hill", "Ridge", "Forest",
    "Main", "Washington", "Lincoln", "Jefferson", "Madison", "Adams", "Jackson",
    "Liberty", "Independence", "Highland", "Meadow", "Spring", "Valley",
]
STREET_TYPES = ["St", "Ave", "Rd", "Dr", "Ln", "Blvd", "Way", "Ct", "Pl"]

FIRST_NAMES = [
    "Maria", "James", "Linda", "Robert", "Patricia", "Michael", "Jennifer",
    "David", "Elizabeth", "William", "Barbara", "Richard", "Susan", "Joseph",
    "Jessica", "Thomas", "Sarah", "Charles", "Karen", "Christopher", "Nancy",
    "Daniel", "Lisa", "Matthew", "Betty", "Anthony", "Helen", "Mark", "Sandra",
    "Donald", "Donna", "Steven", "Carol", "Paul", "Ruth", "Andrew", "Sharon",
    "Joshua", "Michelle", "Kenneth", "Laura", "Carlos", "Ana", "Luis", "Sofia",
    "Tasha", "Mike", "Linda", "Roberto", "Aisha", "DeShawn", "Priya", "Ahmed",
]
LAST_NAMES = [
    "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis",
    "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson",
    "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson",
    "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson", "Walker",
    "Young", "Allen", "King", "Wright", "Scott", "Torres", "Nguyen", "Hill",
    "Flores", "Green", "Adams", "Nelson", "Baker", "Hall", "Rivera", "Campbell",
    "Mitchell", "Carter", "Roberts", "Patel", "Khan", "Brooks", "Kim", "Chen",
]
BROKERAGE_SUFFIXES = [
    "Realty Group", "Real Estate", "Properties", "Brokers", "Home Solutions",
    "Realty Partners", "Property Services", "HUD Approved Brokers", "Realty Inc",
]

PROPERTY_TYPES = ["Single Family", "Single Family", "Single Family", "Condo", "Townhouse", "Manufactured Home"]
STATUSES = ["New Listing", "Price Reduced", "Pending Bid Opening", "Showcase", "Available"]

SOURCES = ["hud", "hud", "hud", "fannie_mae", "freddie_mac", "auction_com", "va", "usda"]

PHOTO_POOL = [
    "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800",
    "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800",
    "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800",
    "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800",
    "https://images.unsplash.com/photo-1565182999561-18d7dc61c393?w=800",
    "https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=800",
    "https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800",
    "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800",
    "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800",
    "https://images.unsplash.com/photo-1572120360610-d971b9d7767c?w=800",
    "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=800",
    "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800",
    "https://images.unsplash.com/photo-1494526585095-c41746248156?w=800",
    "https://images.unsplash.com/photo-1518883060464-6d92a8e54fd1?w=800",
    "https://images.unsplash.com/photo-1480074568708-e7b720bb3f09?w=800",
]


def _deterministic_rng(seed: str) -> random.Random:
    h = hashlib.md5(seed.encode()).hexdigest()
    return random.Random(int(h, 16))


def _gen_phone(rng: random.Random, area_code: str = "555") -> str:
    return f"({area_code}) {rng.randint(200, 999):03d}-{rng.randint(1000, 9999):04d}"


# Approximate area codes per state (one common code each — for plausible-looking phone numbers)
STATE_AREA_CODES: dict[str, str] = {
    "AL": "205", "AK": "907", "AZ": "602", "AR": "501", "CA": "213", "CO": "303",
    "CT": "203", "DE": "302", "DC": "202", "FL": "305", "GA": "404", "HI": "808",
    "ID": "208", "IL": "312", "IN": "317", "IA": "515", "KS": "316", "KY": "502",
    "LA": "504", "ME": "207", "MD": "410", "MA": "617", "MI": "313", "MN": "612",
    "MS": "601", "MO": "314", "MT": "406", "NE": "402", "NV": "702", "NH": "603",
    "NJ": "201", "NM": "505", "NY": "212", "NC": "704", "ND": "701", "OH": "216",
    "OK": "405", "OR": "503", "PA": "215", "PR": "787", "RI": "401", "SC": "803",
    "SD": "605", "TN": "615", "TX": "713", "UT": "801", "VT": "802", "VA": "804",
    "WA": "206", "WV": "304", "WI": "414", "WY": "307",
}


def _gen_address(rng: random.Random) -> str:
    number = rng.randint(100, 9999)
    street = rng.choice(STREET_NAMES)
    suffix = rng.choice(STREET_TYPES)
    return f"{number} {street} {suffix}"


def _gen_agent(rng: random.Random, state: str, city: str) -> dict:
    first = rng.choice(FIRST_NAMES)
    last = rng.choice(LAST_NAMES)
    suffix = rng.choice(BROKERAGE_SUFFIXES)
    company = f"{last} {suffix}" if rng.random() < 0.5 else f"{city} {suffix}"
    area = STATE_AREA_CODES.get(state, "555")
    handle = f"{first.lower()}.{last.lower()}"
    return {
        "agent_name": f"{first} {last}",
        "agent_phone": _gen_phone(rng, area),
        "agent_email": f"{handle}@{company.lower().replace(' ', '')}.com",
        "agent_company": company,
    }


def _estimate_repair_cost(rng: random.Random, year_built: int, sqft: int, status: str) -> int:
    """Repair cost grows with age and size; foreclosed homes typically need more work."""
    age = max(0, 2025 - year_built)
    base_per_sqft = 8 + age * 0.4  # older = more wear
    if "Reduced" in status or "Showcase" in status:
        base_per_sqft *= 1.5  # heavily-discounted listings usually need more work
    base = base_per_sqft * sqft
    return int(base * rng.uniform(0.7, 1.3) / 100) * 100


def _make_comp(rng: random.Random, base_addr_zip: str, base_market_value: int, base_beds: int, base_baths: float, base_sqft: int) -> dict:
    """One nearby comparable sale within the same ZIP."""
    addr = _gen_address(rng)
    sold_price = int(base_market_value * rng.uniform(0.9, 1.1) / 1000) * 1000
    days_ago = rng.randint(15, 180)
    return {
        "address": addr,
        "zip": base_addr_zip,
        "sold_price": sold_price,
        "sold_date": (datetime.utcnow() - timedelta(days=days_ago)).strftime("%Y-%m-%d"),
        "beds": base_beds + rng.choice([-1, 0, 0, 0, 1]) or base_beds,
        "baths": max(1.0, base_baths + rng.choice([-0.5, 0, 0, 0, 0.5])),
        "sqft": int(base_sqft * rng.uniform(0.85, 1.15) / 50) * 50,
        "distance_miles": round(rng.uniform(0.2, 2.5), 1),
    }


def generate_property(state: str, idx: int) -> dict:
    """Return a dict matching db.models.Property fields (minus id/source_id/source — caller sets those)."""
    cities = STATE_CITIES.get(state, [])
    if not cities:
        raise ValueError(f"No city data for state {state}")
    city, zip_code, median = cities[idx % len(cities)]
    rng = _deterministic_rng(f"{state}-{idx}-{city}-{zip_code}")

    beds = rng.choice([2, 3, 3, 3, 4, 4, 5])
    baths = rng.choice([1.0, 1.5, 2.0, 2.0, 2.5, 3.0])
    sqft = int(rng.gauss(1600, 450))
    sqft = max(700, min(3500, sqft))
    year_built = rng.randint(1925, 2018)
    prop_type = rng.choice(PROPERTY_TYPES)
    status = rng.choice(STATUSES)
    source = rng.choice(SOURCES)

    # Market value is the ZIP median, adjusted for size vs. typical 1600 sqft
    market_value = int(median * (sqft / 1600.0) * rng.uniform(0.9, 1.15) / 1000) * 1000

    # Foreclosure price is 55-80% of market value (the deal!)
    discount = rng.uniform(0.55, 0.80)
    price = int(market_value * discount / 1000) * 1000

    repair_cost = _estimate_repair_cost(rng, year_built, sqft, status)

    # 3 comparable nearby sales
    comps = [_make_comp(rng, zip_code, market_value, beds, baths, sqft) for _ in range(3)]

    agent = _gen_agent(rng, state, city)
    address = _gen_address(rng)

    # Photos: 1-3 random from pool
    num_photos = rng.choice([1, 2, 2, 3])
    photos = rng.sample(PHOTO_POOL, num_photos)

    listing_offset_days = rng.randint(1, 45)
    has_auction = source in ("auction_com", "hud") and rng.random() < 0.4

    descriptions = {
        "hud": f"FHA-foreclosed {prop_type.lower()} in {city}. Property sold as-is. Owner-occupant buyers have priority during initial listing period.",
        "fannie_mae": f"Fannie Mae HomePath {prop_type.lower()}. HomePath Ready Buyer eligible — up to 3% closing cost assistance for owner-occupant buyers.",
        "freddie_mac": f"Freddie Mac HomeSteps property in {city}. First-look period for owner-occupant buyers.",
        "auction_com": f"Online foreclosure auction. Cash deposit required to bid. {prop_type} sold as-is, where-is.",
        "va": f"VA foreclosed {prop_type.lower()}. VA loan eligible for qualifying veteran buyers.",
        "usda": f"USDA-foreclosed rural {prop_type.lower()}. USDA loan eligible for qualifying buyers in rural areas.",
    }

    return {
        "source": source,
        "source_url": f"https://example.{source.replace('_', '')}.gov/listing/{state}-{idx}",
        "address": address,
        "city": city,
        "state": state,
        "zip_code": zip_code,
        "price": float(price),
        "status": status,
        "listing_date": datetime.utcnow() - timedelta(days=listing_offset_days),
        "auction_date": (datetime.utcnow() + timedelta(days=rng.randint(5, 30))) if has_auction else None,
        "property_type": prop_type,
        "beds": beds,
        "baths": baths,
        "sqft": sqft,
        "year_built": year_built,
        "photos": photos,
        "description": descriptions.get(source, ""),
        **agent,
        "estimated_market_value": float(market_value),
        "estimated_repair_cost": float(repair_cost),
        "comps": comps,
    }


def generate_all(per_state_min: int = 2, per_state_max: int = 3) -> list[dict]:
    """Generate sample properties for every state in STATE_CITIES."""
    properties = []
    for state, cities in STATE_CITIES.items():
        rng = _deterministic_rng(f"count-{state}")
        count = min(len(cities), rng.randint(per_state_min, per_state_max))
        for i in range(count):
            data = generate_property(state, i)
            source_id = f"sample-{state.lower()}-{i:03d}"
            properties.append({"source": data["source"], "source_id": source_id, "data": data})
            del data["source"]  # source goes in the outer dict
    return properties
