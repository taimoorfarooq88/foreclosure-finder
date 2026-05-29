"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect } from "react";
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from "react-leaflet";
import { formatPrice } from "@/lib/constants";

export type Pt = { lat: number; lng: number };
export type MapSubject = Pt & { address: string; price: number | null; marketValue?: number | null };
export type MapComp = Pt & { address: string; sold_price: number };
export type MapNearby = Pt & {
  id: number;
  address: string;
  city: string | null;
  price: number | null;
  distance_miles: number | null;
};

function FitBounds({ points }: { points: Pt[] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView([points[0].lat, points[0].lng], 13);
      return;
    }
    const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng] as [number, number]));
    map.fitBounds(bounds, { padding: [44, 44], maxZoom: 14 });
  }, [map, points]);
  return null;
}

export default function PropertyMap({
  subject,
  comps,
  nearby,
}: {
  subject: MapSubject;
  comps: MapComp[];
  nearby: MapNearby[];
}) {
  const allPoints: Pt[] = [subject, ...comps, ...nearby];

  return (
    <MapContainer
      center={[subject.lat, subject.lng]}
      zoom={13}
      scrollWheelZoom={false}
      className="h-[360px] w-full"
      style={{ background: "#e2e8f0" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds points={allPoints} />

      {/* Comparable sold homes (green) */}
      {comps.map((c, i) => (
        <CircleMarker
          key={`comp-${i}`}
          center={[c.lat, c.lng]}
          radius={8}
          pathOptions={{ color: "#ffffff", weight: 2, fillColor: "#059669", fillOpacity: 0.95 }}
        >
          <Popup>
            <div className="text-xs">
              <div className="font-semibold text-emerald-700">Sold {formatPrice(c.sold_price)}</div>
              <div className="text-slate-600">{c.address}</div>
            </div>
          </Popup>
        </CircleMarker>
      ))}

      {/* Nearby foreclosure listings (amber) */}
      {nearby.map((n) => (
        <CircleMarker
          key={`near-${n.id}`}
          center={[n.lat, n.lng]}
          radius={8}
          pathOptions={{ color: "#ffffff", weight: 2, fillColor: "#f59e0b", fillOpacity: 0.95 }}
        >
          <Popup>
            <div className="text-xs">
              <div className="font-semibold text-amber-700">{formatPrice(n.price)}</div>
              <div className="text-slate-600">{n.address}</div>
              {n.distance_miles != null && <div className="text-slate-400">{n.distance_miles} mi away</div>}
              <a href={`/property/${n.id}`} className="text-brand-600 underline">
                View listing
              </a>
            </div>
          </Popup>
        </CircleMarker>
      ))}

      {/* Subject property (blue, on top) */}
      <CircleMarker
        center={[subject.lat, subject.lng]}
        radius={11}
        pathOptions={{ color: "#ffffff", weight: 3, fillColor: "#2563eb", fillOpacity: 1 }}
      >
        <Popup>
          <div className="text-xs">
            <div className="font-bold text-brand-700">This property · {formatPrice(subject.price)}</div>
            <div className="text-slate-600">{subject.address}</div>
            {subject.marketValue != null && (
              <div className="text-slate-500">Est. market {formatPrice(subject.marketValue)}</div>
            )}
          </div>
        </Popup>
      </CircleMarker>
    </MapContainer>
  );
}
