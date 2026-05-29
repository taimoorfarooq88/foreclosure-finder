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

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Database Stats</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 text-sm">
          API error: {error}
        </div>
      )}

      {stats && (
        <>
          <div className="bg-white border border-slate-200 rounded-lg p-6">
            <div className="text-sm text-slate-500">Total properties</div>
            <div className="text-4xl font-bold text-brand-700">{stats.total_properties.toLocaleString()}</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white border border-slate-200 rounded-lg p-5">
              <h2 className="font-semibold text-slate-900 mb-3">By Source</h2>
              <ul className="space-y-2 text-sm">
                {Object.entries(stats.by_source).map(([k, v]) => (
                  <li key={k} className="flex justify-between border-b border-slate-100 pb-1">
                    <span>{sourceName(k)}</span>
                    <b>{v.toLocaleString()}</b>
                  </li>
                ))}
                {Object.keys(stats.by_source).length === 0 && (
                  <li className="text-slate-500">No data yet.</li>
                )}
              </ul>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-5">
              <h2 className="font-semibold text-slate-900 mb-3">Top States</h2>
              <ul className="space-y-2 text-sm">
                {Object.entries(stats.by_state).slice(0, 15).map(([k, v]) => (
                  <li key={k} className="flex justify-between border-b border-slate-100 pb-1">
                    <span>{k}</span>
                    <b>{v.toLocaleString()}</b>
                  </li>
                ))}
                {Object.keys(stats.by_state).length === 0 && (
                  <li className="text-slate-500">No data yet.</li>
                )}
              </ul>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-5">
            <h2 className="font-semibold text-slate-900 mb-3">Recent Scrape Runs</h2>
            {stats.last_scrape_runs.length === 0 ? (
              <p className="text-sm text-slate-500">No scrape runs recorded yet.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 border-b border-slate-200">
                    <th className="py-1.5">Source</th>
                    <th>Started</th>
                    <th>Status</th>
                    <th className="text-right">Found</th>
                    <th className="text-right">New</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.last_scrape_runs.map((r, i) => (
                    <tr key={i} className="border-b border-slate-100">
                      <td className="py-1.5">{sourceName(r.source)}</td>
                      <td>{new Date(r.started_at).toLocaleString()}</td>
                      <td>
                        <span
                          className={
                            r.status === "ok"
                              ? "text-green-700"
                              : r.status === "error"
                              ? "text-red-700"
                              : "text-slate-600"
                          }
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="text-right">{r.items_found}</td>
                      <td className="text-right">{r.items_new}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
