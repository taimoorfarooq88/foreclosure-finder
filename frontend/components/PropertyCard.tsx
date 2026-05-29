import Link from "next/link";
import { type Property } from "@/lib/api";
import { computeProfit, formatPrice, satelliteTileUrl, sourceName } from "@/lib/constants";

export default function PropertyCard({ p }: { p: Property }) {
  const photo = p.photos && p.photos.length > 0 ? p.photos[0] : null;
  const aerial = !photo && p.latitude != null && p.longitude != null ? satelliteTileUrl(p.latitude, p.longitude, 16) : null;
  const profit = computeProfit(p);

  const profitBadgeColor =
    profit == null
      ? "bg-slate-500"
      : profit.profitPercent >= 25
      ? "bg-emerald-600"
      : profit.profitPercent >= 10
      ? "bg-amber-500"
      : profit.netProfit > 0
      ? "bg-slate-600"
      : "bg-red-600";

  return (
    <Link
      href={`/property/${p.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card transition-all duration-200 hover:-translate-y-1 hover:border-brand-200 hover:shadow-card-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photo}
            alt={p.address}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : aerial ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={aerial}
              alt={`Aerial view of ${p.address}`}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute bottom-2 right-2.5 rounded bg-black/55 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
              🛰️ Aerial view
            </div>
          </>
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-slate-400">No photo</div>
        )}
        {/* gradient for badge legibility */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/45 to-transparent" />

        <div className="absolute left-2.5 top-2.5 rounded-md bg-brand-600/95 px-2 py-1 text-[11px] font-semibold text-white shadow-sm backdrop-blur-sm">
          {sourceName(p.source)}
        </div>
        {p.status && (
          <div className="absolute right-2.5 top-2.5 rounded-md bg-white/90 px-2 py-1 text-[11px] font-medium text-slate-700 shadow-sm backdrop-blur-sm">
            {p.status}
          </div>
        )}
        {profit && profit.netProfit > 0 && (
          <div
            className={`absolute bottom-2.5 left-2.5 rounded-md ${profitBadgeColor} px-2 py-1 text-[11px] font-bold text-white shadow`}
          >
            +{formatPrice(profit.netProfit)} · {profit.profitPercent.toFixed(0)}% ROI
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-baseline justify-between gap-2">
          {p.price != null ? (
            <div className="text-xl font-bold tracking-tight text-slate-900">{formatPrice(p.price)}</div>
          ) : (
            <div className="text-sm font-semibold text-brand-700">Price on HUD Home Store</div>
          )}
          {profit && (
            <div className="text-[11px] text-slate-500">
              Market <span className="font-semibold text-slate-700">{formatPrice(profit.marketValue)}</span>
            </div>
          )}
        </div>

        <div className="mt-1 text-sm text-slate-600">
          {[p.beds && `${p.beds} bd`, p.baths && `${p.baths} ba`, p.sqft && `${p.sqft.toLocaleString()} sqft`]
            .filter(Boolean)
            .join("  ·  ") || "See listing for details"}
        </div>

        <div className="mt-1.5 line-clamp-1 text-sm font-medium leading-snug text-slate-900 group-hover:text-brand-700">
          {p.address}
        </div>
        <div className="text-xs text-slate-500">{[p.city, p.state, p.zip_code].filter(Boolean).join(", ")}</div>

        {profit && (
          <div className="mt-3 grid grid-cols-3 gap-2 border-t border-slate-100 pt-3 text-xs">
            <div>
              <div className="text-slate-400">Repair</div>
              <div className="font-semibold text-slate-700">{formatPrice(profit.repairCost)}</div>
            </div>
            <div>
              <div className="text-slate-400">Net profit</div>
              <div className={`font-bold ${profit.netProfit > 0 ? "text-emerald-700" : "text-red-700"}`}>
                {formatPrice(profit.netProfit)}
              </div>
            </div>
            <div>
              <div className="text-slate-400">ROI</div>
              <div className={`font-bold ${profit.profitPercent > 0 ? "text-emerald-700" : "text-red-700"}`}>
                {profit.profitPercent.toFixed(0)}%
              </div>
            </div>
          </div>
        )}

        <div className="mt-auto" />

        {p.agent_phone && (
          <div className="mt-3 flex items-center gap-1.5 border-t border-slate-100 pt-3 text-xs">
            <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5 text-emerald-600" aria-hidden>
              <path
                d="M6.5 4h3l1.5 4-2 1.5a11 11 0 0 0 5 5l1.5-2 4 1.5v3a2 2 0 0 1-2.2 2A17 17 0 0 1 4.5 6.2 2 2 0 0 1 6.5 4Z"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinejoin="round"
              />
            </svg>
            <span className="text-slate-500">Agent</span>
            <span className="font-semibold text-brand-700">{p.agent_phone}</span>
          </div>
        )}
      </div>
    </Link>
  );
}
