import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FleetHeal — DVIR intake",
  description: "Submit and list synthetic DVIR / open defects for the TrueFoundry demo",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
