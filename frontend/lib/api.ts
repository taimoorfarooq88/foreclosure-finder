export type Property = {
  id: number;
  source: string;
  source_id: string;
  source_url: string | null;
  address: string;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  county: string | null;
  latitude: number | null;
  longitude: number | null;
  price: number | null;
  status: string | null;
  listing_date: string | null;
  auction_date: string | null;
  property_type: string | null;
  beds: number | null;
  baths: number | null;
  sqft: number | null;
  lot_size: string | null;
  year_built: number | null;
  photos: string[] | null;
  agent_name: string | null;
  agent_phone: string | null;
  agent_email: string | null;
  agent_company: string | null;
  description: string | null;
  estimated_market_value: number | null;
  estimated_repair_cost: number | null;
  comps: Array<{
    address: string;
    zip: string;
    sold_price: number;
    sold_date: string;
    beds: number;
    baths: number;
    sqft: number;
    distance_miles: number;
  }> | null;
  created_at: string;
  updated_at: string;
};

export type SearchResponse = {
  total: number;
  page: number;
  page_size: number;
  results: Property[];
};

export type StatsResponse = {
  total_properties: number;
  by_source: Record<string, number>;
  by_state: Record<string, number>;
  last_scrape_runs: Array<{
    source: string;
    started_at: string;
    finished_at: string | null;
    status: string;
    items_found: number;
    items_new: number;
    items_updated: number;
    error: string | null;
  }>;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8765";

export async function searchProperties(params: Record<string, string | number | boolean | undefined>): Promise<SearchResponse> {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "" && v !== false) qs.set(k, String(v));
  }
  const res = await fetch(`${API_URL}/api/properties?${qs.toString()}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

export async function getProperty(id: number): Promise<Property> {
  const res = await fetch(`${API_URL}/api/properties/${id}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

export async function getStats(): Promise<StatsResponse> {
  const res = await fetch(`${API_URL}/api/stats`, { cache: "no-store" });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}
