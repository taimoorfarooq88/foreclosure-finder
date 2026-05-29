"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { SOURCES, US_STATES } from "@/lib/constants";

const inputCls =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30";
const labelCls = "mb-1 block text-xs font-semibold text-slate-600";

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
  const [fixerUpper, setFixerUpper] = useState(sp.get("fixer_upper") === "true");
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
    if (fixerUpper) qs.set("fixer_upper", "true");
    if (minProfit) qs.set("min_profit", minProfit);
    if (minProfitPct) qs.set("min_profit_percent", minProfitPct);
    if (sort !== "newest") qs.set("sort", sort);
    router.push(`/?${qs.toString()}`);
  };

  const reset = () => {
    setState(""); setZip(""); setCity(""); setSource("");
    setMinPrice(""); setMaxPrice(""); setMinBeds("");
    setHasPhotos(false); setHasAgent(false); setFixerUpper(false);
    setMinProfit(""); setMinProfitPct("");
    setSort("newest");
    router.push("/");
  };

  return (
    <form
      onSubmit={submit}
      className="space-y-4 rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-card backdrop-blur-sm md:p-5"
    >
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div>
          <label className={labelCls}>State</label>
          <select value={state} onChange={(e) => setState(e.target.value)} className={inputCls}>
            <option value="">All states</option>
            {US_STATES.map((s) => (
              <option key={s.code} value={s.code}>{s.code} — {s.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>ZIP Code</label>
          <input type="text" inputMode="numeric" maxLength={5} value={zip} onChange={(e) => setZip(e.target.value)}
            placeholder="e.g. 77084" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>City</label>
          <input type="text" value={city} onChange={(e) => setCity(e.target.value)}
            placeholder="e.g. Houston" className={inputCls} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <div>
          <label className={labelCls}>Source</label>
          <select value={source} onChange={(e) => setSource(e.target.value)} className={inputCls}>
            <option value="">All sources</option>
            {SOURCES.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>Min Price</label>
          <input type="number" min={0} value={minPrice} onChange={(e) => setMinPrice(e.target.value)}
            placeholder="$" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Max Price</label>
          <input type="number" min={0} value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)}
            placeholder="$" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Min Beds</label>
          <select value={minBeds} onChange={(e) => setMinBeds(e.target.value)} className={inputCls}>
            <option value="">Any</option>
            {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}+</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Sort by</label>
          <select value={sort} onChange={(e) => setSort(e.target.value)} className={inputCls}>
            <option value="newest">Newest</option>
            <option value="price_asc">Price: Low → High</option>
            <option value="price_desc">Price: High → Low</option>
            <option value="beds_desc">Most Beds</option>
            <option value="profit_desc">Highest Profit $</option>
            <option value="profit_percent_desc">Highest ROI %</option>
          </select>
        </div>
      </div>

      {/* Deal filters — visually grouped as the "money" section */}
      <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3">
        <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-emerald-800">
          <span>💰</span> Deal filters
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-emerald-700">Min Net Profit ($)</label>
            <input type="number" min={0} step={5000} value={minProfit} onChange={(e) => setMinProfit(e.target.value)}
              placeholder="e.g. 50000"
              className="w-full rounded-lg border border-emerald-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-emerald-700">Min ROI (%)</label>
            <input type="number" min={0} max={100} step={5} value={minProfitPct} onChange={(e) => setMinProfitPct(e.target.value)}
              placeholder="e.g. 25"
              className="w-full rounded-lg border border-emerald-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30" />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 pt-0.5">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={hasPhotos} onChange={(e) => setHasPhotos(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
          Has photos
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={hasAgent} onChange={(e) => setHasAgent(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
          Has agent phone
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-amber-700">
          <input type="checkbox" checked={fixerUpper} onChange={(e) => setFixerUpper(e.target.checked)}
            className="h-4 w-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500" />
          🔨 Fixer-uppers only
        </label>
        <div className="flex-1" />
        <button type="button" onClick={reset}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50">
          Reset
        </button>
        <button type="submit"
          className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 active:scale-[0.98]">
          <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden>
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
            <path d="m20 20-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          Search
        </button>
      </div>
    </form>
  );
}
