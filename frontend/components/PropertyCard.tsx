import Link from "next/link";
import { type Property } from "@/lib/api";
import { computeProfit, formatPrice, sourceName } from "@/lib/constants";

export default function PropertyCard({ p }: { p: Property }) {
  const photo = p.photos && p.photos.length > 0 ? p.photos[0] : null;
  const profit = computeProfit(p);

  const profitBadgeColor =
    profit == null
      ? "bg-slate-500"
      : profit.profitPercent >= 25
      ? "bg-green-600"
      : profit.profitPercent >= 10
      ? "bg-amber-500"
      : profit.netProfit > 0
      ? "bg-slate-600"
      : "bg-red-600";

  return (
    <Link
      href={`/property/${p.id}`}
      className="block bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition"
    >
      <div className="aspect-[4/3] bg-slate-100 relative">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt={p.address} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">No photo</div>
        )}
        <div className="absolute top-2 left-2 bg-brand-600 text-white text-xs px-2 py-1 rounded font-medium">
          {sourceName(p.source)}
        </div>
        {p.status && (
          <div className="absolute top-2 right-2 bg-white/90 text-slate-700 text-xs px-2 py-1 rounded">
            {p.status}
          </div>
        )}
        {profit && profit.netProfit > 0 && (
          <div className={`absolute bottom-2 left-2 ${profitBadgeColor} text-white text-xs font-bold px-2 py-1 rounded shadow`}>
            +{formatPrice(profit.netProfit)} profit ({profit.profitPercent.toFixed(0)}%)
          </div>
        )}
      </div>
      <div className="p-4 space-y-2">
        <div className="flex items-baseline justify-between">
          <div className="text-xl font-bold text-slate-900">{formatPrice(p.price)}</div>
          {profit && (
            <div className="text-xs text-slate-500">
              Market: <span className="font-semibold text-slate-700">{formatPrice(profit.marketValue)}</span>
            </div>
          )}
        </div>
        <div className="text-sm text-slate-600">
          {[p.beds && `${p.beds} bd`, p.baths && `${p.baths} ba`, p.sqft && `${p.sqft.toLocaleString()} sqft`]
            .filter(Boolean)
            .join("  ·  ")}
        </div>
        <div className="text-sm text-slate-900 font-medium leading-snug">{p.address}</div>
        <div className="text-xs text-slate-500">
          {[p.city, p.state, p.zip_code].filter(Boolean).join(", ")}
        </div>
        {profit && (
          <div className="pt-2 border-t border-slate-100 grid grid-cols-3 gap-2 text-xs">
            <div>
              <div className="text-slate-500">Repair est.</div>
              <div className="font-semibold text-slate-700">{formatPrice(profit.repairCost)}</div>
            </div>
            <div>
              <div className="text-slate-500">Net profit</div>
              <div className={`font-bold ${profit.netProfit > 0 ? "text-green-700" : "text-red-700"}`}>
                {formatPrice(profit.netProfit)}
              </div>
            </div>
            <div>
              <div className="text-slate-500">ROI</div>
              <div className={`font-bold ${profit.profitPercent > 0 ? "text-green-700" : "text-red-700"}`}>
                {profit.profitPercent.toFixed(0)}%
              </div>
            </div>
          </div>
        )}
        {p.agent_phone && (
          <div className="pt-2 border-t border-slate-100 flex items-center gap-2 text-xs">
            <span className="text-slate-500">Agent:</span>
            <span className="text-brand-700 font-medium">{p.agent_phone}</span>
          </div>
        )}
      </div>
    </Link>
  );
}
