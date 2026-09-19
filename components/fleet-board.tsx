import Link from "next/link";
import { formatWhen } from "@/lib/format";
import type { Dvir, OpenDefect, Vehicle } from "@/lib/types";
import { StatusBadge } from "./status-badge";

export function DefectTable({ defects }: { defects: OpenDefect[] }) {
  if (defects.length === 0) {
    return <EmptyState text="No open defects in the yard store." />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted">
          <tr className="border-b border-line">
            <th className="px-3 py-2 font-medium">Defect</th>
            <th className="px-3 py-2 font-medium">DVIR</th>
            <th className="px-3 py-2 font-medium">Unit</th>
            <th className="px-3 py-2 font-medium">Code</th>
            <th className="px-3 py-2 font-medium">Severity</th>
            <th className="px-3 py-2 font-medium">Opened</th>
          </tr>
        </thead>
        <tbody>
          {defects.map((defect) => (
            <tr key={defect.id} className="border-b border-line/70 hover:bg-panel-2/80">
              <td className="px-3 py-2.5 font-mono text-amber">{defect.id}</td>
              <td className="px-3 py-2.5 font-mono">
                <Link href={`/dvir/${defect.dvir_id}`} className="text-ink underline-offset-2 hover:underline">
                  {defect.dvir_id}
                </Link>
              </td>
              <td className="px-3 py-2.5 font-mono">{defect.vehicle_id}</td>
              <td className="px-3 py-2.5 text-muted">{defect.code}</td>
              <td className="px-3 py-2.5">
                <StatusBadge value={defect.severity} />
              </td>
              <td className="px-3 py-2.5 text-muted">{formatWhen(defect.opened_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function DvirTable({ dvirs }: { dvirs: Dvir[] }) {
  if (dvirs.length === 0) {
    return <EmptyState text="No DVIRs filed yet." />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted">
          <tr className="border-b border-line">
            <th className="px-3 py-2 font-medium">DVIR</th>
            <th className="px-3 py-2 font-medium">Unit</th>
            <th className="px-3 py-2 font-medium">Inspector</th>
            <th className="px-3 py-2 font-medium">System</th>
            <th className="px-3 py-2 font-medium">Result</th>
            <th className="px-3 py-2 font-medium">Inspected</th>
          </tr>
        </thead>
        <tbody>
          {dvirs.map((dvir) => {
            const primary = dvir.defects[0];
            return (
              <tr key={dvir.id} className="border-b border-line/70 hover:bg-panel-2/80">
                <td className="px-3 py-2.5 font-mono">
                  <Link href={`/dvir/${dvir.id}`} className="text-amber underline-offset-2 hover:underline">
                    {dvir.id}
                  </Link>
                </td>
                <td className="px-3 py-2.5 font-mono">{dvir.vehicle_id}</td>
                <td className="px-3 py-2.5">{dvir.inspector}</td>
                <td className="px-3 py-2.5 text-muted">
                  {primary?.system.replaceAll("_", " ") ?? "—"}
                </td>
                <td className="px-3 py-2.5">
                  <StatusBadge value={dvir.overall} />
                </td>
                <td className="px-3 py-2.5 text-muted">{formatWhen(dvir.inspected_at)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function VehicleStrip({ vehicles }: { vehicles: Vehicle[] }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {vehicles.map((vehicle) => (
        <div key={vehicle.id} className="border border-line bg-panel-2/60 px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <p className="font-mono text-sm text-amber">{vehicle.id}</p>
            <StatusBadge value={vehicle.status} />
          </div>
          <p className="mt-1 text-sm">
            {vehicle.year} {vehicle.make} {vehicle.model}
          </p>
          <p className="mt-1 text-xs text-muted">
            {vehicle.home_shop} · {vehicle.odometer_miles.toLocaleString()} mi · {vehicle.route}
          </p>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="border border-dashed border-line px-4 py-8 text-center text-sm text-muted">
      {text}
    </div>
  );
}
