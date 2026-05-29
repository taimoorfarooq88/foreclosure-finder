import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Foreclosure Finder — USA Foreclosed Home Deals",
  description:
    "Search foreclosed homes across all 50 US states from HUD, Fannie Mae, Freddie Mac, VA, USDA, and Auction.com. Photos, full details, and listing agent contacts.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-md bg-brand-600 flex items-center justify-center text-white font-bold">
                F
              </div>
              <span className="font-semibold text-lg text-slate-900">Foreclosure Finder</span>
            </Link>
            <nav className="flex items-center gap-6 text-sm">
              <Link href="/" className="text-slate-700 hover:text-brand-600">Search</Link>
              <Link href="/stats" className="text-slate-700 hover:text-brand-600">Stats</Link>
              <a
                href="https://www.hudhomestore.gov"
                target="_blank"
                rel="noreferrer"
                className="text-slate-500 hover:text-brand-600"
              >
                HUD ↗
              </a>
            </nav>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 py-6">{children}</main>
        <footer className="max-w-7xl mx-auto px-4 py-8 text-xs text-slate-500">
          Data aggregated from public government and GSE sources: HUD Home Store, Fannie Mae HomePath, Freddie Mac
          HomeSteps, VA, USDA, Auction.com. Always verify property status and contact details with the listing agent
          before bidding.
        </footer>
      </body>
    </html>
  );
}
