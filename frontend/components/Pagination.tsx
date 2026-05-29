"use client";

import { useRouter, useSearchParams } from "next/navigation";

export default function Pagination({ page, pageSize, total }: { page: number; pageSize: number; total: number }) {
  const router = useRouter();
  const sp = useSearchParams();
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;

  const goto = (p: number) => {
    const qs = new URLSearchParams(sp.toString());
    qs.set("page", String(p));
    router.push(`/?${qs.toString()}`);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const btn =
    "inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white";

  return (
    <div className="flex items-center justify-center gap-3 py-8">
      <button disabled={page <= 1} onClick={() => goto(page - 1)} className={btn}>
        ← Prev
      </button>
      <span className="rounded-lg bg-white px-4 py-2 text-sm text-slate-600 shadow-sm ring-1 ring-slate-200">
        Page <b className="text-slate-900">{page}</b> of {totalPages}
        <span className="ml-1 text-slate-400">· {total.toLocaleString()} listings</span>
      </span>
      <button disabled={page >= totalPages} onClick={() => goto(page + 1)} className={btn}>
        Next →
      </button>
    </div>
  );
}
