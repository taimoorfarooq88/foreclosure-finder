import Link from "next/link";
import { notFound } from "next/navigation";
import MapPanel from "@/components/MapPanel";
import { getNearby, getProperty } from "@/lib/api";
import { computeProfit, formatPrice, satelliteTileUrl, sourceName } from "@/lib/constants";

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

  const nearby = await getNearby(id);
  const profit = computeProfit(p);

  return (
    <div className="space-y-6">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 shadow-sm transition hover:border-brand-200 hover:text-brand-700"
      >
        ← Back to search
      </Link>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {p.photos && p.photos.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              <div className="col-span-2 aspect-[16/9] overflow-hidden rounded-2xl bg-slate-100 shadow-card">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.photos[0]} alt={p.address} className="h-full w-full object-cover" />
              </div>
              {p.photos.slice(1, 5).map((src, i) => (
                <div key={i} className="aspect-[4/3] overflow-hidden rounded-xl bg-slate-100 shadow-card">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt={`${p.address} ${i + 2}`} className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
          ) : p.latitude != null && p.longitude != null ? (
            <div className="relative aspect-[16/9] overflow-hidden rounded-2xl bg-slate-100 shadow-card">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={satelliteTileUrl(p.latitude, p.longitude, 17) ?? ""}
                alt={`Aerial view of ${p.address}`}
                className="h-full w-full object-cover"
              />
              <div className="absolute bottom-3 right-3 rounded-md bg-black/55 px-2 py-1 text-xs font-medium text-white backdrop-blur-sm">
                🛰️ Aerial view · listing photos on HUD Home Store
              </div>
            </div>
          ) : (
            <div className="flex aspect-[16/9] items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              No photos available
            </div>
          )}

          <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
            <div className="flex items-start justify-between gap-3">
              <div>
                {p.price != null ? (
                  <div className="text-3xl font-bold tracking-tight text-slate-900">{formatPrice(p.price)}</div>
                ) : (
                  <div className="text-xl font-bold text-brand-700">Price on HUD Home Store</div>
                )}
                <div className="mt-1 text-sm text-slate-600">
                  {[p.beds && `${p.beds} bd`, p.baths && `${p.baths} ba`, p.sqft && `${p.sqft.toLocaleString()} sqft`]
                    .filter(Boolean)
                    .join("  ·  ")}
                </div>
              </div>
              <div className="space-y-1 text-right">
                <div className="inline-block rounded-md bg-brand-600 px-2 py-1 text-xs font-semibold text-white">
                  {sourceName(p.source)}
                </div>
                {p.status && (
                  <div className="ml-1 inline-block rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-600">
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
            <div className="rounded-2xl border-2 border-emerald-300 bg-gradient-to-br from-emerald-50 to-white p-5 shadow-card">
              <h2 className="mb-3 flex items-center gap-2 font-bold text-emerald-900">
                <span>💰</span> Profit Analysis
              </h2>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <div>
                  <div className="text-xs uppercase text-slate-600">Foreclosure Price</div>
                  <div className="text-xl font-bold text-slate-900">{formatPrice(profit.price)}</div>
                </div>
                <div>
                  <div className="text-xs uppercase text-slate-600">Est. Market Value</div>
                  <div className="text-xl font-bold text-brand-700">{formatPrice(profit.marketValue)}</div>
                </div>
                <div>
                  <div className="text-xs uppercase text-slate-600">Repair Estimate</div>
                  <div className="text-xl font-bold text-amber-700">−{formatPrice(profit.repairCost)}</div>
                </div>
                <div className="border-l-2 border-emerald-400 pl-4">
                  <div className="text-xs font-semibold uppercase text-emerald-800">Net Profit Potential</div>
                  <div className={`text-2xl font-bold ${profit.netProfit > 0 ? "text-emerald-700" : "text-red-700"}`}>
                    {profit.netProfit > 0 ? "+" : ""}
                    {formatPrice(profit.netProfit)}
                  </div>
                  <div className={`text-sm font-medium ${profit.profitPercent > 0 ? "text-emerald-700" : "text-red-700"}`}>
                    {profit.profitPercent.toFixed(1)}% ROI
                  </div>
                </div>
              </div>
              <div className="mt-3 border-t border-emerald-200 pt-3 text-xs text-slate-600">
                Market value estimated from nearby comparable sales (see below). Repair cost estimate based on year
                built + square footage — always confirm with a contractor before purchase.
              </div>
            </div>
          )}

          <MapPanel property={p} nearby={nearby} />

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
            <h2 className="mb-3 font-semibold text-slate-900">Property Details</h2>
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
              <div className="mt-4 border-t border-slate-100 pt-4">
                <h3 className="mb-2 text-sm font-semibold text-slate-900">Description</h3>
                <p className="whitespace-pre-line text-sm text-slate-700">{p.description}</p>
              </div>
            )}
          </div>

          {p.comps && p.comps.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
              <h2 className="mb-1 font-semibold text-slate-900">Nearby Comparable Sales</h2>
              <p className="mb-3 text-xs text-slate-500">
                Recent sales of similar homes within {p.zip_code} — used to estimate this property&apos;s market value.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
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
                        <td className="py-2 pr-2 font-semibold text-emerald-700">{formatPrice(c.sold_price)}</td>
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
                <div className="mt-3 border-t border-slate-100 pt-3 text-xs text-slate-600">
                  Avg comp sale: <b>{formatPrice(p.comps.reduce((s, c) => s + c.sold_price, 0) / p.comps.length)}</b>
                  {"  ·  "}
                  This listing is priced{" "}
                  <b className={profit.grossProfit > 0 ? "text-emerald-700" : "text-red-700"}>
                    {((1 - profit.price / profit.marketValue) * 100).toFixed(0)}% below
                  </b>{" "}
                  comparable market value.
                </div>
              )}
            </div>
          )}
        </div>

        <aside className="space-y-4">
          <div className="sticky top-24 rounded-2xl border-2 border-brand-600 bg-white p-5 shadow-soft">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand-700">Listing Agent</div>
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
                    className="block w-full rounded-lg bg-brand-600 py-3 text-center text-lg font-semibold text-white transition hover:bg-brand-700"
                  >
                    📞 {p.agent_phone}
                  </a>
                )}
                {p.agent_email && (
                  <a
                    href={`mailto:${p.agent_email}`}
                    className="block w-full rounded-lg border-2 border-brand-600 py-2 text-center text-sm font-medium text-brand-700 transition hover:bg-brand-50"
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
                className="mt-4 block border-t border-slate-100 pt-4 text-sm text-slate-600 transition hover:text-brand-600"
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
