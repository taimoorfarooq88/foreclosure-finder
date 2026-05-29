import { getStats } from "@/lib/api";
import { sourceName } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function StatsPage() {
  let stats;
  let error: string | null = null;
  try {
    stats = await getStats();
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }

  const maxSource = stats ? Math.max(1, ...Object.values(stats.by_source)) : 1;
  const maxState = stats ? Math.max(1, ...Object.values(stats.by_state)) : 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Database Stats</h1>
        <p className="mt-1 text-sm text-slate-500">Live counts across every aggregated source.</p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">API error: {error}</div>
      )}

      {stats && (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Total properties" value={stats.total_properties.toLocaleString()} accent />
            <StatCard label="Sources" value={String(Object.keys(stats.by_source).length)} />
            <StatCard label="States with listings" value={String(Object.keys(stats.by_state).length)} />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
              <h2 className="mb-4 font-semibold text-slate-900">By Source</h2>
              <ul className="space-y-3 text-sm">
                {Object.entries(stats.by_source)
                  .sort((a, b) => b[1] - a[1])
                  .map(([k, v]) => (
                    <li key={k}>
                      <div className="mb-1 flex justify-between">
                        <span className="text-slate-700">{sourceName(k)}</span>
                        <b className="text-slate-900">{v.toLocaleString()}</b>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-600"
                          style={{ width: `${(v / maxSource) * 100}%` }}
                        />
                      </div>
                    </li>
                  ))}
                {Object.keys(stats.by_source).length === 0 && <li className="text-slate-500">No data yet.</li>}
              </ul>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
              <h2 className="mb-4 font-semibold text-slate-900">Top States</h2>
              <ul className="space-y-3 text-sm">
                {Object.entries(stats.by_state)
                  .slice(0, 12)
                  .map(([k, v]) => (
                    <li key={k}>
                      <div className="mb-1 flex justify-between">
                        <span className="text-slate-700">{k}</span>
                        <b className="text-slate-900">{v.toLocaleString()}</b>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600"
                          style={{ width: `${(v / maxState) * 100}%` }}
                        />
                      </div>
                    </li>
                  ))}
                {Object.keys(stats.by_state).length === 0 && <li className="text-slate-500">No data yet.</li>}
              </ul>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
            <h2 className="mb-3 font-semibold text-slate-900">Recent Scrape Runs</h2>
            {stats.last_scrape_runs.length === 0 ? (
              <p className="text-sm text-slate-500">No scrape runs recorded yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                      <th className="py-2">Source</th>
                      <th>Started</th>
                      <th>Status</th>
                      <th className="text-right">Found</th>
                      <th className="text-right">New</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.last_scrape_runs.map((r, i) => (
                      <tr key={i} className="border-b border-slate-100 last:border-0">
                        <td className="py-2 font-medium text-slate-800">{sourceName(r.source)}</td>
                        <td className="text-slate-600">{new Date(r.started_at).toLocaleString()}</td>
                        <td>
                          <span
                            className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                              r.status === "ok"
                                ? "bg-emerald-100 text-emerald-700"
                                : r.status === "error"
                                ? "bg-red-100 text-red-700"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {r.status}
                          </span>
                        </td>
                        <td className="text-right text-slate-700">{r.items_found}</td>
                        <td className="text-right text-slate-700">{r.items_new}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div
      className={`rounded-2xl border p-5 shadow-card ${
        accent ? "border-brand-200 bg-gradient-to-br from-brand-50 to-white" : "border-slate-200 bg-white"
      }`}
    >
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</div>
      <div className={`mt-1 text-3xl font-bold ${accent ? "text-brand-700" : "text-slate-900"}`}>{value}</div>
    </div>
  );
}
