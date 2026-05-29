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
      <section className="bg-gradient-to-r from-brand-600 to-brand-700 text-white rounded-lg p-6 md:p-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Find Foreclosed Home Deals Across All 50 States</h1>
        <p className="text-brand-50 text-sm md:text-base max-w-3xl">
          Aggregated daily from HUD Home Store, Fannie Mae HomePath, Freddie Mac HomeSteps, VA, USDA, and Auction.com.
          Photos, full details, and the listing agent&apos;s phone number — ready to call.
        </p>
      </section>

      <SearchFilters />

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 text-sm">
          <b>Could not reach API:</b> {error}
          <div className="mt-1 text-xs text-red-700">
            Start the backend with <code className="bg-red-100 px-1 rounded">python run_api.py</code> from the
            <code className="bg-red-100 px-1 rounded">backend/</code> directory.
          </div>
        </div>
      )}

      {data && (
        <>
          <div className="text-sm text-slate-600">
            <b>{data.total.toLocaleString()}</b> listing{data.total === 1 ? "" : "s"} found
            {data.total === 0 && (
              <span className="ml-2 text-slate-500">
                — try clearing filters, or seed the database with <code>python seed_data.py</code>.
              </span>
            )}
          </div>
          {data.results.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {data.results.map((p) => (
                <PropertyCard key={p.id} p={p} />
              ))}
            </div>
          )}
          <Pagination page={data.page} pageSize={data.page_size} total={data.total} />
        </>
      )}
    </div>
  );
}
