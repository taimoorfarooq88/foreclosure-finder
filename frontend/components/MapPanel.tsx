"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useMemo } from "react";
import { type NearbyProperty, type Property } from "@/lib/api";
import { formatPrice } from "@/lib/constants";
import { type MapComp, type MapNearby } from "./PropertyMap";

const PropertyMap = dynamic(() => import("./PropertyMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[360px] w-full items-center justify-center bg-slate-100 text-sm text-slate-400">
      Loading map…
    </div>
  ),
});

export default function MapPanel({ property, nearby }: { property: Property; nearby: NearbyProperty[] }) {
  const hasSubject = property.latitude != null && property.longitude != null;

  const mapComps: MapComp[] = useMemo(
    () =>
      (property.comps ?? [])
        .filter((c) => c.lat != null && c.lng != null)
        .map((c) => ({ lat: c.lat as number, lng: c.lng as number, address: c.address, sold_price: c.sold_price })),
    [property.comps]
  );

  const mapNearby: MapNearby[] = useMemo(
    () =>
      nearby
        .filter((n) => n.latitude != null && n.longitude != null && (n.distance_miles == null || n.distance_miles <= 30))
        .map((n) => ({
          lat: n.latitude as number,
          lng: n.longitude as number,
          id: n.id,
          address: n.address,
          city: n.city,
          price: n.price,
          distance_miles: n.distance_miles,
        })),
    [nearby]
  );

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
        <h2 className="font-semibold text-slate-900">Location &amp; Neighborhood</h2>
        <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
          <Legend color="#2563eb" label="This home" />
          <Legend color="#059669" label="Recent sales" />
          <Legend color="#f59e0b" label="Nearby deals" />
        </div>
      </div>

      {hasSubject ? (
        <PropertyMap
          subject={{
            lat: property.latitude as number,
            lng: property.longitude as number,
            address: property.address,
            price: property.price,
            marketValue: property.estimated_market_value,
          }}
          comps={mapComps}
          nearby={mapNearby}
        />
      ) : (
        <div className="flex h-[200px] items-center justify-center bg-slate-50 text-sm text-slate-400">
          Location coordinates not available for this listing.
        </div>
      )}

      {/* Neighborhood value comparison */}
      <div className="border-t border-slate-100 p-5">
        <h3 className="mb-1 text-sm font-semibold text-slate-900">Nearby foreclosure listings</h3>
        <p className="mb-3 text-xs text-slate-500">
          Compare this deal against other bank-owned homes in the area.
        </p>

        {nearby.length === 0 ? (
          <p className="text-sm text-slate-500">No other listings found nearby yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {nearby.map((n) => (
              <li key={n.id}>
                <Link
                  href={`/property/${n.id}`}
                  className="-mx-2 flex items-center justify-between gap-3 rounded-lg px-2 py-2.5 transition hover:bg-slate-50"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-slate-800">{n.address}</div>
                    <div className="text-xs text-slate-500">
                      {[n.city, n.state].filter(Boolean).join(", ")}
                      {n.distance_miles != null && <span className="text-slate-400"> · {n.distance_miles} mi</span>}
                      {[n.beds && `${n.beds} bd`, n.baths && `${n.baths} ba`].filter(Boolean).length > 0 && (
                        <span className="text-slate-400">
                          {" · "}
                          {[n.beds && `${n.beds} bd`, n.baths && `${n.baths} ba`].filter(Boolean).join(" / ")}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-sm font-bold text-slate-900">{formatPrice(n.price)}</div>
                    {n.estimated_market_value != null && (
                      <div className="text-[11px] text-slate-500">mkt {formatPrice(n.estimated_market_value)}</div>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="inline-block h-2.5 w-2.5 rounded-full ring-2 ring-white" style={{ background: color }} />
      {label}
    </span>
  );
}
