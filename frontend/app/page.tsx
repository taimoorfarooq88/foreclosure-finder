import Pagination from "@/components/Pagination";
import PropertyCard from "@/components/PropertyCard";
import SearchFilters from "@/components/SearchFilters";
import { searchProperties } from "@/lib/api";

export const dynamic = "force-dynamic";

type SearchParams = { [k: string]: string | string[] | undefined };

function pickStr(v: string | string[] | undefined): string | undefined {
  if (Array.isArray(v)) return v[0];
  return v;
}

export default async function HomePage({ searchParams }: { searchParams: SearchParams }) {
  const params = {
    state: pickStr(searchParams.state),
    zip: pickStr(searchParams.zip),
    city: pickStr(searchParams.city),
    source: pickStr(searchParams.source),
    min_price: pickStr(searchParams.min_price),
    max_price: pickStr(searchParams.max_price),
    min_beds: pickStr(searchParams.min_beds),
    has_photos: pickStr(searchParams.has_photos) === "true",
    has_agent_phone: pickStr(searchParams.has_agent_phone) === "true",
    min_profit: pickStr(searchParams.min_profit),
    min_profit_percent: pickStr(searchParams.min_profit_percent),
    sort: pickStr(searchParams.sort) || "newest",
    page: Number(pickStr(searchParams.page) || "1"),
    page_size: 24,
  };

  let data;
  let error: string | null = null;
  try {
    data = await searchProperties(params as never);
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-700 via-brand-600 to-brand-800 text-white shadow-soft">
        {/* decorative grid + glow */}
        <div
          className="absolute inset-0 opacity-[0.15]"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(255,255,255,.4) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,.4) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
          }}
          aria-hidden
        />
        <div className="absolute -top-24 -right-16 w-72 h-72 rounded-full bg-white/10 blur-3xl" aria-hidden />
        <div className="relative px-6 py-9 md:px-10 md:py-12">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium ring-1 ring-white/20 mb-4">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            Live deals · updated daily
          </div>
          <h1 className="text-3xl md:text-[2.6rem] font-extrabold leading-tight tracking-tight max-w-3xl">
            Find Foreclosed Home Deals Across All 50 States
          </h1>
          <div className="mt-6 flex flex-wrap gap-x-8 gap-y-3">
            <Stat value="50+" label="States covered" />
            <Stat value="6" label="Official sources" />
            <Stat value="100%" label="Free to search" />
          </div>
        </div>
      </section>

      <SearchFilters />

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <b>Could not reach the API:</b> {error}
          <div className="mt-1 text-xs text-red-700">
            Start the backend with <code className="rounded bg-red-100 px-1">python run_api.py</code> from the{" "}
            <code className="rounded bg-red-100 px-1">backend/</code> directory.
          </div>
        </div>
      )}

      {data && (
        <>
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-slate-600">
              <b className="text-slate-900">{data.total.toLocaleString()}</b> listing{data.total === 1 ? "" : "s"} found
              {data.total === 0 && <span className="ml-2 text-slate-500">— try clearing some filters.</span>}
            </p>
          </div>

          {data.results.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
              {data.results.map((p, i) => (
                <div key={p.id} className="animate-fade-in-up" style={{ animationDelay: `${Math.min(i, 11) * 40}ms` }}>
                  <PropertyCard p={p} />
                </div>
              ))}
            </div>
          )}

          {data.total === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 py-16 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-2xl">
                🔍
              </div>
              <p className="font-medium text-slate-700">No listings match your filters</p>
              <p className="mt-1 text-sm text-slate-500">Try widening your price range or clearing the location.</p>
            </div>
          )}

          <Pagination page={data.page} pageSize={data.page_size} total={data.total} />
        </>
      )}
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="text-2xl font-bold leading-none">{value}</div>
      <div className="mt-1 text-xs font-medium text-brand-100/80 uppercase tracking-wide">{label}</div>
    </div>
  );
}
