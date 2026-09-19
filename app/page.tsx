"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Defect = {
  id: string;
  dvir_id: string;
  vehicle_id: string;
  code: string;
  severity: string;
  crack_related?: boolean;
  opened_at?: string;
  description?: string;
};

type Dvir = {
  id: string;
  vehicle_id: string;
  inspector: string;
  overall: string;
  inspected_at: string;
  defects?: { crack_related?: boolean; description?: string }[];
};

export default function HomePage() {
  const [state, setState] = useState<any>(null);
  const [error, setError] = useState("");

  async function load() {
    const res = await fetch("/api/fleet/state", { cache: "no-store" });
    if (!res.ok) {
      setError(`Failed to load state (${res.status})`);
      return;
    }
    setState(await res.json());
    setError("");
  }

  useEffect(() => {
    load();
  }, []);

  const defects: Defect[] = state?.open_defects || [];
  const dvirs: Dvir[] = state?.dvirs || [];

  return (
    <main style={{ maxWidth: 960, margin: "0 auto", padding: 24 }}>
      <p style={{ color: "#f5a524", letterSpacing: 2, fontSize: 12 }}>FLEETHEAL YARD BOARD</p>
      <h1>Open defects / DVIRs</h1>
      <p>
        <Link href="/submit">Submit a DVIR report</Link>
        {" · "}
        <button type="button" onClick={load}>
          Refresh
        </button>
      </p>
      {error ? <p>{error}</p> : null}
      {!state ? <p>Loading store…</p> : null}

      <h2>Open defects</h2>
      <table width="100%" cellPadding={8} style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th align="left">Defect</th>
            <th align="left">DVIR</th>
            <th align="left">Vehicle</th>
            <th align="left">Code</th>
            <th align="left">Severity</th>
            <th align="left">Crack</th>
          </tr>
        </thead>
        <tbody>
          {defects.map((d) => (
            <tr key={d.id} style={{ borderTop: "1px solid #334" }}>
              <td>{d.id}</td>
              <td>{d.dvir_id}</td>
              <td>{d.vehicle_id}</td>
              <td>{d.code}</td>
              <td>{d.severity}</td>
              <td>{d.crack_related ? "CRACK" : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>DVIRs</h2>
      <table width="100%" cellPadding={8} style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th align="left">DVIR</th>
            <th align="left">Vehicle</th>
            <th align="left">Inspector</th>
            <th align="left">Overall</th>
            <th align="left">Crack</th>
          </tr>
        </thead>
        <tbody>
          {dvirs.map((d) => (
            <tr key={d.id} style={{ borderTop: "1px solid #334" }}>
              <td>{d.id}</td>
              <td>{d.vehicle_id}</td>
              <td>{d.inspector}</td>
              <td>{d.overall}</td>
              <td>{d.defects?.some((x) => x.crack_related) ? "CRACK" : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
