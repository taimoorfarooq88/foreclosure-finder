export const US_STATES: Array<{ code: string; name: string }> = [
  { code: "AL", name: "Alabama" }, { code: "AK", name: "Alaska" }, { code: "AZ", name: "Arizona" },
  { code: "AR", name: "Arkansas" }, { code: "CA", name: "California" }, { code: "CO", name: "Colorado" },
  { code: "CT", name: "Connecticut" }, { code: "DE", name: "Delaware" }, { code: "DC", name: "DC" },
  { code: "FL", name: "Florida" }, { code: "GA", name: "Georgia" }, { code: "HI", name: "Hawaii" },
  { code: "ID", name: "Idaho" }, { code: "IL", name: "Illinois" }, { code: "IN", name: "Indiana" },
  { code: "IA", name: "Iowa" }, { code: "KS", name: "Kansas" }, { code: "KY", name: "Kentucky" },
  { code: "LA", name: "Louisiana" }, { code: "ME", name: "Maine" }, { code: "MD", name: "Maryland" },
  { code: "MA", name: "Massachusetts" }, { code: "MI", name: "Michigan" }, { code: "MN", name: "Minnesota" },
  { code: "MS", name: "Mississippi" }, { code: "MO", name: "Missouri" }, { code: "MT", name: "Montana" },
  { code: "NE", name: "Nebraska" }, { code: "NV", name: "Nevada" }, { code: "NH", name: "New Hampshire" },
  { code: "NJ", name: "New Jersey" }, { code: "NM", name: "New Mexico" }, { code: "NY", name: "New York" },
  { code: "NC", name: "North Carolina" }, { code: "ND", name: "North Dakota" }, { code: "OH", name: "Ohio" },
  { code: "OK", name: "Oklahoma" }, { code: "OR", name: "Oregon" }, { code: "PA", name: "Pennsylvania" },
  { code: "PR", name: "Puerto Rico" }, { code: "RI", name: "Rhode Island" }, { code: "SC", name: "South Carolina" },
  { code: "SD", name: "South Dakota" }, { code: "TN", name: "Tennessee" }, { code: "TX", name: "Texas" },
  { code: "UT", name: "Utah" }, { code: "VT", name: "Vermont" }, { code: "VA", name: "Virginia" },
  { code: "WA", name: "Washington" }, { code: "WV", name: "West Virginia" }, { code: "WI", name: "Wisconsin" },
  { code: "WY", name: "Wyoming" },
];

export const SOURCES: Array<{ id: string; name: string }> = [
  { id: "hud", name: "HUD Home Store" },
  { id: "fannie_mae", name: "Fannie Mae HomePath" },
  { id: "freddie_mac", name: "Freddie Mac HomeSteps" },
  { id: "va", name: "VA Foreclosures" },
  { id: "usda", name: "USDA" },
  { id: "auction_com", name: "Auction.com" },
];

export function sourceName(id: string): string {
  return SOURCES.find((s) => s.id === id)?.name ?? id;
}

export function formatPrice(n: number | null): string {
  if (n == null) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

/**
 * Google Street View Static image of the actual house at a lat/lng.
 * `return_error_code=true` makes Google return HTTP 404 (instead of a gray
 * "no imagery" placeholder) where there's no coverage, so the <img> onError can
 * fall back to the aerial tile. Returns null if no key is configured.
 */
export function streetViewUrl(lat: number, lng: number, size = "800x450"): string | null {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
  if (!key || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  const params = new URLSearchParams({
    size,
    location: `${lat},${lng}`,
    fov: "80",
    return_error_code: "true",
    key,
  });
  return `https://maps.googleapis.com/maps/api/streetview?${params.toString()}`;
}

/**
 * Esri World Imagery satellite tile covering a lat/lng — free, no API key.
 * Used as a real aerial thumbnail for listings that have no photo (HUD REO data
 * has location but no images).
 */
export function satelliteTileUrl(lat: number, lng: number, zoom = 16): string | null {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  const n = 2 ** zoom;
  const x = Math.floor(((lng + 180) / 360) * n);
  const latRad = (lat * Math.PI) / 180;
  const y = Math.floor(((1 - Math.asinh(Math.tan(latRad)) / Math.PI) / 2) * n);
  return `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${zoom}/${y}/${x}`;
}

export type ProfitAnalysis = {
  marketValue: number;
  price: number;
  repairCost: number;
  grossProfit: number; // marketValue - price
  netProfit: number; // marketValue - price - repairCost
  profitPercent: number; // netProfit / marketValue * 100
};

export function computeProfit(p: {
  price: number | null;
  estimated_market_value: number | null;
  estimated_repair_cost: number | null;
}): ProfitAnalysis | null {
  if (p.price == null || p.estimated_market_value == null) return null;
  const repairCost = p.estimated_repair_cost ?? 0;
  const grossProfit = p.estimated_market_value - p.price;
  const netProfit = grossProfit - repairCost;
  const profitPercent = p.estimated_market_value > 0 ? (netProfit / p.estimated_market_value) * 100 : 0;
  return {
    marketValue: p.estimated_market_value,
    price: p.price,
    repairCost,
    grossProfit,
    netProfit,
    profitPercent,
  };
}
