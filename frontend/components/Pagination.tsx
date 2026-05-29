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
  };

  return (
    <div className="flex items-center justify-center gap-2 py-6">
      <button
        disabled={page <= 1}
        onClick={() => goto(page - 1)}
        className="px-3 py-1.5 text-sm rounded border border-slate-300 disabled:opacity-40 hover:bg-slate-50"
      >
        ← Prev
      </button>
      <span className="text-sm text-slate-600 px-3">
        Page <b>{page}</b> of {totalPages} ({total.toLocaleString()} listings)
      </span>
      <button
        disabled={page >= totalPages}
        onClick={() => goto(page + 1)}
        className="px-3 py-1.5 text-sm rounded border border-slate-300 disabled:opacity-40 hover:bg-slate-50"
      >
        Next →
      </button>
    </div>
  );
}
