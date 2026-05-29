import Link from "next/link";
import { notFound } from "next/navigation";
import { getProperty } from "@/lib/api";
import { computeProfit, formatPrice, sourceName } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function PropertyDetailPage({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!Number.isFinite(id)) notFound();

  let p;
  try {
    p = await getProperty(id);
  } catch {
    notFound();
  }

  const profit = computeProfit(p);

  return (
    <div className="space-y-6">
      <Link href="/" className="text-sm text-brand-600 hover:underline">← Back to search</Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {p.photos && p.photos.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              <div className="col-span-2 aspect-[16/9] bg-slate-100 rounded-lg overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.photos[0]} alt={p.address} className="w-full h-full object-cover" />
              </div>
              {p.photos.slice(1, 5).map((src, i) => (
                <div key={i} className="aspect-[4/3] bg-slate-100 rounded-lg overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt={`${p.address} ${i + 2}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          ) : (
            <div className="aspect-[16/9] bg-slate-100 rounded-lg flex items-center justify-center text-slate-400">
              No photos available
            </div>
          )}

          <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-3xl font-bold text-slate-900">{formatPrice(p.price)}</div>
                <div className="mt-1 text-sm text-slate-600">
                  {[p.beds && `${p.beds} bd`, p.baths && `${p.baths} ba`, p.sqft && `${p.sqft.toLocaleString()} sqft`]
                    .filter(Boolean)
                    .join("  ·  ")}
                </div>
              </div>
              <div className="text-right space-y-1">
                <div className="inline-block bg-brand-600 text-white text-xs px-2 py-1 rounded">
                  {sourceName(p.source)}
                </div>
                {p.status && (
                  <div className="text-xs text-slate-600 bg-slate-100 inline-block px-2 py-1 rounded ml-1">
                    {p.status}
                  </div>
                )}
              </div>
            </div>

            <div>
              <div className="font-semibold text-slate-900">{p.address}</div>
              <div className="text-sm text-slate-600">{[p.city, p.state, p.zip_code].filter(Boolean).join(", ")}</div>
              {p.county && <div className="text-xs text-slate-500">{p.county} County</div>}
            </div>
          </div>

          {profit && (
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg p-5">
              <h2 className="font-bold text-green-900 mb-3 flex items-center gap-2">
                <span>💰</span> Profit Analysis
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-xs text-slate-600 uppercase">Foreclosure Price</div>
                  <div className="text-xl font-bold text-slate-900">{formatPrice(profit.price)}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-600 uppercase">Est. Market Value</div>
                  <div className="text-xl font-bold text-blue-700">{formatPrice(profit.marketValue)}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-600 uppercase">Repair Estimate</div>
                  <div className="text-xl font-bold text-amber-700">−{formatPrice(profit.repairCost)}</div>
                </div>
                <div className="border-l-2 border-green-400 pl-4">
                  <div className="text-xs text-green-800 uppercase font-semibold">Net Profit Potential</div>
                  <div className={`text-2xl font-bold ${profit.netProfit > 0 ? "text-green-700" : "text-red-700"}`}>
                    {profit.netProfit > 0 ? "+" : ""}{formatPrice(profit.netProfit)}
                  </div>
                  <div className={`text-sm font-medium ${profit.profitPercent > 0 ? "text-green-700" : "text-red-700"}`}>
                    {profit.profitPercent.toFixed(1)}% ROI
                  </div>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-green-200 text-xs text-slate-600">
                Market value estimated from nearby comparable sales (see below). Repair cost estimate based on year built
                + square footage — always confirm with a contractor before purchase.
              </div>
            </div>
          )}

          <div className="bg-white border border-slate-200 rounded-lg p-5">
            <h2 className="font-semibold text-slate-900 mb-3">Property Details</h2>
            <dl className="grid grid-cols-2 gap-y-2 text-sm">
              <Detail k="Type" v={p.property_type} />
              <Detail k="Bedrooms" v={p.beds} />
              <Detail k="Bathrooms" v={p.baths} />
              <Detail k="Square Feet" v={p.sqft?.toLocaleString()} />
              <Detail k="Lot Size" v={p.lot_size} />
              <Detail k="Year Built" v={p.year_built} />
              <Detail k="Listed" v={p.listing_date ? new Date(p.listing_date).toLocaleDateString() : null} />
              <Detail k="Auction / Bid Open" v={p.auction_date ? new Date(p.auction_date).toLocaleDateString() : null} />
            </dl>
            {p.description && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <h3 className="font-semibold text-slate-900 mb-2 text-sm">Description</h3>
                <p className="text-sm text-slate-700 whitespace-pre-line">{p.description}</p>
              </div>
            )}
          </div>

          {p.comps && p.comps.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-lg p-5">
              <h2 className="font-semibold text-slate-900 mb-1">Nearby Comparable Sales</h2>
              <p className="text-xs text-slate-500 mb-3">
                Recent sales of similar homes within {p.zip_code} — used to estimate this property&apos;s market value.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-slate-500 uppercase border-b border-slate-200">
                      <th className="py-2 pr-2">Address</th>
                      <th className="py-2 pr-2">Sold Price</th>
                      <th className="py-2 pr-2">Sold Date</th>
                      <th className="py-2 pr-2">Beds/Baths</th>
                      <th className="py-2 pr-2">Sqft</th>
                      <th className="py-2 pr-2">Distance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {p.comps.map((c, i) => (
                      <tr key={i} className="border-b border-slate-100 last:border-0">
                        <td className="py-2 pr-2 font-medium text-slate-900">{c.address}</td>
                        <td className="py-2 pr-2 font-semibold text-green-700">{formatPrice(c.sold_price)}</td>
                        <td className="py-2 pr-2 text-slate-600">{new Date(c.sold_date).toLocaleDateString()}</td>
                        <td className="py-2 pr-2 text-slate-600">{c.beds} bd / {c.baths} ba</td>
                        <td className="py-2 pr-2 text-slate-600">{c.sqft.toLocaleString()}</td>
                        <td className="py-2 pr-2 text-slate-600">{c.distance_miles} mi</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {profit && (
                <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-600">
                  Avg comp sale: <b>{formatPrice(p.comps.reduce((s, c) => s + c.sold_price, 0) / p.comps.length)}</b>
                  {"  ·  "}
                  This listing is priced{" "}
                  <b className={profit.grossProfit > 0 ? "text-green-700" : "text-red-700"}>
                    {((1 - profit.price / profit.marketValue) * 100).toFixed(0)}% below
                  </b>{" "}
                  comparable market value.
                </div>
              )}
            </div>
          )}
        </div>

        <aside className="space-y-4">
          <div className="bg-white border-2 border-brand-600 rounded-lg p-5 sticky top-24">
            <div className="text-xs text-brand-700 font-medium uppercase tracking-wide mb-2">Listing Agent</div>
            {p.agent_name || p.agent_phone || p.agent_email ? (
              <div className="space-y-3">
                {p.agent_name && (
                  <div>
                    <div className="font-semibold text-slate-900">{p.agent_name}</div>
                    {p.agent_company && <div className="text-sm text-slate-600">{p.agent_company}</div>}
                  </div>
                )}
                {p.agent_phone && (
                  <a
                    href={`tel:${p.agent_phone.replace(/[^\d+]/g, "")}`}
                    className="block w-full text-center bg-brand-600 hover:bg-brand-700 text-white font-semibold py-3 rounded text-lg"
                  >
                    📞 {p.agent_phone}
                  </a>
                )}
                {p.agent_email && (
                  <a
                    href={`mailto:${p.agent_email}`}
                    className="block w-full text-center border-2 border-brand-600 text-brand-700 hover:bg-brand-50 font-medium py-2 rounded text-sm"
                  >
                    ✉ {p.agent_email}
                  </a>
                )}
              </div>
            ) : (
              <div className="text-sm text-slate-500">
                Agent contact not available for this listing. Visit the source site below for inquiries.
              </div>
            )}

            {p.source_url && (
              <a
                href={p.source_url}
                target="_blank"
                rel="noreferrer"
                className="block mt-4 pt-4 border-t border-slate-100 text-sm text-slate-600 hover:text-brand-600"
              >
                View original listing on {sourceName(p.source)} ↗
              </a>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

function Detail({ k, v }: { k: string; v: string | number | null | undefined }) {
  return (
    <>
      <dt className="text-slate-500">{k}</dt>
      <dd className="text-slate-900">{v ?? "—"}</dd>
    </>
  );
}
