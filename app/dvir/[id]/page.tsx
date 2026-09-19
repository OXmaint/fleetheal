import Link from "next/link";
import { notFound } from "next/navigation";
import { CopyPrompt } from "@/components/copy-prompt";
import { StatusBadge } from "@/components/status-badge";
import { findDvir, findVehicle } from "@/lib/fleet";
import { formatWhen } from "@/lib/format";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  return { title: `${id} · FleetHeal DVIR` };
}

export default async function DvirPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { created } = await searchParams;
  const { state } = await getStore();
  const dvir = findDvir(state, id);
  if (!dvir) notFound();

  const vehicle = findVehicle(state, dvir.vehicle_id);
  const defect = state.open_defects.find((d) => d.dvir_id === dvir.id);
  const prompt = `Investigate ${dvir.id} on ${dvir.vehicle_id}`;
  const justCreated = created === "1";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-amber">
            {justCreated ? "Intake accepted" : "Inspection record"}
          </p>
          <h2 className="mt-1 font-mono text-3xl text-ink">{dvir.id}</h2>
        </div>
        <Link
          href="/"
          className="border border-line px-3 py-2 font-mono text-xs uppercase tracking-wider text-muted hover:border-amber hover:text-amber"
        >
          Back to yard
        </Link>
      </div>

      {justCreated ? (
        <div className="border border-ok/40 bg-ok/10 px-4 py-3 text-sm text-ok">
          DVIR and open defect created. Paste the prompt below into ChatGPT / Claude on TrueForge
          to show <span className="font-mono">approval_required</span> on ground / work-order tools.
        </div>
      ) : null}

      <CopyPrompt text={prompt} />

      <div className="grid gap-4 md:grid-cols-3">
        <IdCard label="DVIR" value={dvir.id} />
        <IdCard label="Vehicle" value={dvir.vehicle_id} />
        <IdCard label="Defect" value={defect?.id ?? "—"} />
      </div>

      <section className="border border-line bg-panel">
        <header className="border-b border-line px-4 py-3 font-mono text-xs uppercase tracking-[0.2em] text-muted">
          Record
        </header>
        <dl className="grid gap-4 p-4 sm:grid-cols-2">
          <Field label="Inspector" value={dvir.inspector} />
          <Field label="Inspected" value={formatWhen(dvir.inspected_at)} />
          <Field label="Location" value={dvir.location} />
          <div>
            <dt className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted">Overall</dt>
            <dd className="mt-1">
              <StatusBadge value={dvir.overall} />
            </dd>
          </div>
          {vehicle ? (
            <>
              <Field
                label="Unit"
                value={`${vehicle.year} ${vehicle.make} ${vehicle.model} · ${vehicle.status.replaceAll("_", " ")}`}
              />
              <Field label="Shop / route" value={`${vehicle.home_shop} · ${vehicle.route}`} />
            </>
          ) : null}
        </dl>
      </section>

      <section className="border border-line bg-panel">
        <header className="border-b border-line px-4 py-3 font-mono text-xs uppercase tracking-[0.2em] text-muted">
          Defects on this DVIR
        </header>
        <ul className="divide-y divide-line">
          {dvir.defects.map((item) => (
            <li key={item.code} className="flex flex-col gap-2 px-4 py-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-sm text-amber">{item.code}</span>
                <StatusBadge value={item.severity} />
                {item.oos_candidate ? <StatusBadge value="critical" label="OOS candidate" /> : null}
              </div>
              <p className="text-sm text-ink">{item.description}</p>
              <p className="text-xs text-muted">
                System {item.system.replaceAll("_", " ")} · photos{" "}
                {item.photos.some((p) => p.present) ? "present" : "not attached"}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function IdCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-line bg-panel px-4 py-4">
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">{label}</p>
      <p className="mt-2 font-mono text-xl text-amber">{value}</p>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted">{label}</dt>
      <dd className="mt-1 text-sm">{value}</dd>
    </div>
  );
}
