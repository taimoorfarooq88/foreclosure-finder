"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { SOURCES, US_STATES } from "@/lib/constants";

export default function SearchFilters() {
  const router = useRouter();
  const sp = useSearchParams();
  const [state, setState] = useState(sp.get("state") || "");
  const [zip, setZip] = useState(sp.get("zip") || "");
  const [city, setCity] = useState(sp.get("city") || "");
  const [source, setSource] = useState(sp.get("source") || "");
  const [minPrice, setMinPrice] = useState(sp.get("min_price") || "");
  const [maxPrice, setMaxPrice] = useState(sp.get("max_price") || "");
  const [minBeds, setMinBeds] = useState(sp.get("min_beds") || "");
  const [hasPhotos, setHasPhotos] = useState(sp.get("has_photos") === "true");
  const [hasAgent, setHasAgent] = useState(sp.get("has_agent_phone") === "true");
  const [minProfit, setMinProfit] = useState(sp.get("min_profit") || "");
  const [minProfitPct, setMinProfitPct] = useState(sp.get("min_profit_percent") || "");
  const [sort, setSort] = useState(sp.get("sort") || "newest");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const qs = new URLSearchParams();
    if (state) qs.set("state", state);
    if (zip) qs.set("zip", zip);
    if (city) qs.set("city", city);
    if (source) qs.set("source", source);
    if (minPrice) qs.set("min_price", minPrice);
    if (maxPrice) qs.set("max_price", maxPrice);
    if (minBeds) qs.set("min_beds", minBeds);
    if (hasPhotos) qs.set("has_photos", "true");
    if (hasAgent) qs.set("has_agent_phone", "true");
    if (minProfit) qs.set("min_profit", minProfit);
    if (minProfitPct) qs.set("min_profit_percent", minProfitPct);
    if (sort !== "newest") qs.set("sort", sort);
    router.push(`/?${qs.toString()}`);
  };

  const reset = () => {
    setState(""); setZip(""); setCity(""); setSource("");
    setMinPrice(""); setMaxPrice(""); setMinBeds("");
    setHasPhotos(false); setHasAgent(false);
    setMinProfit(""); setMinProfitPct("");
    setSort("newest");
    router.push("/");
  };

  return (
    <form onSubmit={submit} className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">State</label>
          <select value={state} onChange={(e) => setState(e.target.value)} className="w-full border border-slate-300 rounded px-2 py-2 text-sm">
            <option value="">All states</option>
            {US_STATES.map((s) => (
              <option key={s.code} value={s.code}>{s.code} — {s.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">ZIP Code</label>
          <input type="text" inputMode="numeric" maxLength={5} value={zip} onChange={(e) => setZip(e.target.value)}
            placeholder="e.g. 77084" className="w-full border border-slate-300 rounded px-2 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">City</label>
          <input type="text" value={city} onChange={(e) => setCity(e.target.value)}
            placeholder="e.g. Houston" className="w-full border border-slate-300 rounded px-2 py-2 text-sm" />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Source</label>
          <select value={source} onChange={(e) => setSource(e.target.value)} className="w-full border border-slate-300 rounded px-2 py-2 text-sm">
            <option value="">All sources</option>
            {SOURCES.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Min $</label>
          <input type="number" min={0} value={minPrice} onChange={(e) => setMinPrice(e.target.value)}
            className="w-full border border-slate-300 rounded px-2 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Max $</label>
          <input type="number" min={0} value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)}
            className="w-full border border-slate-300 rounded px-2 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Min Beds</label>
          <select value={minBeds} onChange={(e) => setMinBeds(e.target.value)} className="w-full border border-slate-300 rounded px-2 py-2 text-sm">
            <option value="">Any</option>
            {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}+</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Sort</label>
          <select value={sort} onChange={(e) => setSort(e.target.value)} className="w-full border border-slate-300 rounded px-2 py-2 text-sm">
            <option value="newest">Newest</option>
            <option value="price_asc">Price: Low → High</option>
            <option value="price_desc">Price: High → Low</option>
            <option value="beds_desc">Most Beds</option>
            <option value="profit_desc">Highest Profit $</option>
            <option value="profit_percent_desc">Highest ROI %</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-green-700 mb-1">💰 Min Net Profit ($)</label>
          <input type="number" min={0} step={5000} value={minProfit} onChange={(e) => setMinProfit(e.target.value)}
            placeholder="e.g. 50000" className="w-full border border-green-300 rounded px-2 py-2 text-sm bg-green-50" />
        </div>
        <div>
          <label className="block text-xs font-medium text-green-700 mb-1">💰 Min ROI (%)</label>
          <input type="number" min={0} max={100} step={5} value={minProfitPct} onChange={(e) => setMinProfitPct(e.target.value)}
            placeholder="e.g. 25" className="w-full border border-green-300 rounded px-2 py-2 text-sm bg-green-50" />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 pt-1">
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={hasPhotos} onChange={(e) => setHasPhotos(e.target.checked)} />
          Has photos
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={hasAgent} onChange={(e) => setHasAgent(e.target.checked)} />
          Has agent phone
        </label>
        <div className="flex-1" />
        <button type="button" onClick={reset} className="px-3 py-2 text-sm rounded border border-slate-300 text-slate-600 hover:bg-slate-50">
          Reset
        </button>
        <button type="submit" className="px-4 py-2 text-sm rounded bg-brand-600 text-white hover:bg-brand-700 font-medium">
          Search
        </button>
      </div>
    </form>
  );
}
