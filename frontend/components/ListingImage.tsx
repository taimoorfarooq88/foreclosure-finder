"use client";

import { useState } from "react";

/**
 * Renders the best available image for a listing: a primary source (e.g. Google
 * Street View) that falls back to a secondary (e.g. aerial tile) if it fails to
 * load — Street View returns 404 where there's no coverage.
 */
export default function ListingImage({
  primary,
  fallback,
  alt,
  className,
  badge,
  fallbackBadge,
}: {
  primary: string | null;
  fallback: string | null;
  alt: string;
  className?: string;
  badge?: string;
  fallbackBadge?: string;
}) {
  const initial = primary ?? fallback;
  const [src, setSrc] = useState<string | null>(initial);
  const [usingFallback, setUsingFallback] = useState(!primary);

  if (!src) {
    return (
      <div className={`flex items-center justify-center bg-slate-100 text-sm text-slate-400 ${className ?? ""}`}>
        No image
      </div>
    );
  }

  const label = usingFallback ? fallbackBadge : badge;

  return (
    <div className={`relative overflow-hidden bg-slate-100 ${className ?? ""}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        className="h-full w-full object-cover"
        onError={() => {
          if (!usingFallback && fallback) {
            setUsingFallback(true);
            setSrc(fallback);
          }
        }}
      />
      {label && (
        <div className="absolute bottom-2 right-2.5 rounded bg-black/55 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
          {label}
        </div>
      )}
    </div>
  );
}
