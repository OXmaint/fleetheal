import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const sans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-ibm-sans",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-ibm-mono",
});

export const metadata: Metadata = {
  title: "FleetHeal · DVIR Intake",
  description:
    "Synthetic fleet-ops DVIR intake for FleetHeal hackathon demos. No proprietary product data.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable} dark`}>
      <body className="font-sans antialiased">
        <div className="relative min-h-screen">
          <div className="scanline absolute inset-0 opacity-40" />
          <header className="relative z-10 border-b border-line bg-bg/80 backdrop-blur">
            <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4">
              <Link href="/" className="group">
                <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-amber">
                  Yard ops
                </p>
                <h1 className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">
                  FleetHeal
                  <span className="text-muted"> / DVIR intake</span>
                </h1>
              </Link>
              <div className="flex flex-wrap items-center gap-3 font-mono text-[11px] uppercase tracking-[0.16em] text-muted">
                <span className="border border-line px-2 py-1">SCL yard</span>
                <span className="border border-line px-2 py-1">synthetic only</span>
                <Link href="/api/fleet/state" className="border border-line px-2 py-1 hover:border-amber hover:text-amber">
                  API
                </Link>
              </div>
            </div>
          </header>
          <main className="relative z-10 mx-auto max-w-6xl px-4 py-8">{children}</main>
          <footer className="relative z-10 mx-auto max-w-6xl px-4 pb-10 text-xs text-muted">
            Mock fleet data for TrueFoundry / TrueForge demos. No Oxmaint customer records, private
            schemas, or production APIs.
          </footer>
        </div>
      </body>
    </html>
  );
}
