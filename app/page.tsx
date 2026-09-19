import { DvirForm } from "@/components/dvir-form";
import { DefectTable, DvirTable, VehicleStrip } from "@/components/fleet-board";
import { StoreBanner } from "@/components/store-banner";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { state, meta } = await getStore();
  const openDefects = state.open_defects.filter((d) => d.status === "open");
  const recentDvirs = [...state.dvirs].sort((a, b) =>
    a.inspected_at < b.inspected_at ? 1 : -1,
  );

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3">
        <p className="max-w-3xl text-sm text-muted">
          File a driver vehicle inspection report against the shared yard store. New IDs
          (DVIR-XXXX / DEF-XXXX) are immediately visible to MCP tools when{" "}
          <code className="font-mono text-amber">FLEETHEAL_API_BASE</code> points at this app.
        </p>
        <StoreBanner meta={meta} />
      </section>

      <VehicleStrip vehicles={state.vehicles} />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]">
        <section className="border border-line bg-panel">
          <header className="flex items-center justify-between border-b border-line px-4 py-3">
            <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
              Open defects
            </h2>
            <span className="font-mono text-xs text-amber">{openDefects.length} open</span>
          </header>
          <DefectTable defects={openDefects} />
        </section>

        <section className="border border-amber/40 bg-panel">
          <header className="border-b border-line px-4 py-3">
            <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-amber">
              Submit DVIR
            </h2>
            <p className="mt-1 text-xs text-muted">Creates a DVIR plus an open defect.</p>
          </header>
          <div className="p-4">
            <DvirForm vehicles={state.vehicles} />
          </div>
        </section>
      </div>

      <section className="border border-line bg-panel">
        <header className="flex items-center justify-between border-b border-line px-4 py-3">
          <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
            Recent DVIRs
          </h2>
          <span className="font-mono text-xs text-muted">{recentDvirs.length} filed</span>
        </header>
        <DvirTable dvirs={recentDvirs} />
      </section>
    </div>
  );
}
