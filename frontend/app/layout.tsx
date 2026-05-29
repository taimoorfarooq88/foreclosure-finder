import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  title: "Foreclosure Finder — USA Foreclosed Home Deals",
  description:
    "Search foreclosed homes across all 50 US states from HUD, Fannie Mae, Freddie Mac, VA, USDA, and Auction.com. Photos, full details, and listing agent contacts.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen flex flex-col font-sans antialiased">
        <header className="glass sticky top-0 z-30 border-b border-slate-200/70">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white font-bold shadow-soft transition-transform group-hover:scale-105">
                <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" aria-hidden>
                  <path
                    d="M3 11.5 12 4l9 7.5M5 10v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-9"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div className="leading-tight">
                <span className="block font-bold text-[17px] text-slate-900 tracking-tight">
                  Foreclosure<span className="text-brand-600">Finder</span>
                </span>
                <span className="block text-[10px] text-slate-500 font-medium uppercase tracking-wider">
                  USA Bank-Owned Deals
                </span>
              </div>
            </Link>
            <nav className="flex items-center gap-1 text-sm">
              <Link
                href="/"
                className="px-3 py-2 rounded-lg font-medium text-slate-700 hover:text-brand-700 hover:bg-brand-50 transition-colors"
              >
                Search
              </Link>
              <Link
                href="/stats"
                className="px-3 py-2 rounded-lg font-medium text-slate-700 hover:text-brand-700 hover:bg-brand-50 transition-colors"
              >
                Stats
              </Link>
              <a
                href="https://www.hudhomestore.gov"
                target="_blank"
                rel="noreferrer"
                className="hidden sm:inline-flex items-center gap-1 px-3 py-2 rounded-lg font-medium text-slate-500 hover:text-brand-700 hover:bg-brand-50 transition-colors"
              >
                HUD <span className="text-xs">↗</span>
              </a>
            </nav>
          </div>
        </header>

        <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-6">{children}</main>

        <footer className="mt-8 border-t border-slate-200 bg-white/60">
          <div className="max-w-7xl mx-auto px-4 py-8 grid gap-6 sm:grid-cols-[1.5fr_1fr]">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white text-xs font-bold">
                  F
                </div>
                <span className="font-semibold text-slate-800 text-sm">Foreclosure Finder</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed max-w-xl">
                Data aggregated from public government and GSE sources: HUD Home Store, Fannie Mae HomePath, Freddie
                Mac HomeSteps, VA, USDA, and Auction.com. Always verify property status and contact details with the
                listing agent before bidding.
              </p>
            </div>
            <div className="text-xs text-slate-500">
              <div className="font-semibold text-slate-700 mb-2 uppercase tracking-wide text-[11px]">Sources</div>
              <ul className="space-y-1">
                <li>HUD Home Store</li>
                <li>Fannie Mae HomePath · Freddie Mac HomeSteps</li>
                <li>VA · USDA · Auction.com</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-200/70 py-4 text-center text-[11px] text-slate-400">
            © {new Date().getFullYear()} Foreclosure Finder · For informational purposes only.
          </div>
        </footer>
      </body>
    </html>
  );
}
