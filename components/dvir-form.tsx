"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { Vehicle } from "@/lib/types";
import { FLEET_SYSTEMS, SEVERITIES } from "@/lib/types";

type Props = {
  vehicles: Vehicle[];
};

export function DvirForm({ vehicles }: Props) {
  const router = useRouter();
  const [vehicleId, setVehicleId] = useState(vehicles[0]?.id ?? "");
  const [inspector, setInspector] = useState("");
  const [severity, setSeverity] = useState<(typeof SEVERITIES)[number]>("critical");
  const [system, setSystem] = useState<(typeof FLEET_SYSTEMS)[number]>("service_brakes");
  const [description, setDescription] = useState("");
  const [oos, setOos] = useState(true);
  const [photo, setPhoto] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const selected = useMemo(
    () => vehicles.find((v) => v.id === vehicleId),
    [vehicleId, vehicles],
  );

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setPending(true);
    try {
      const res = await fetch("/api/fleet/dvirs", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          vehicle_id: vehicleId,
          inspector,
          severity,
          system,
          description,
          oos_candidate: oos,
          photo_present: photo,
        }),
      });
      const data = (await res.json()) as { error?: string; dvir?: { id: string } };
      if (!res.ok || !data.dvir) {
        throw new Error(data.error || `Submit failed (${res.status})`);
      }
      router.push(`/dvir/${data.dvir.id}?created=1`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted">
            Vehicle
          </span>
          <select
            required
            value={vehicleId}
            onChange={(e) => setVehicleId(e.target.value)}
            className="border border-line bg-bg px-3 py-2.5 text-ink outline-none focus:border-amber"
          >
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.id} · {v.year} {v.make} {v.model}
              </option>
            ))}
          </select>
          {selected ? (
            <span className="text-xs text-muted">
              {selected.home_shop} · {selected.status.replaceAll("_", " ")} · next{" "}
              {selected.route}
            </span>
          ) : null}
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted">
            Inspector
          </span>
          <input
            required
            value={inspector}
            onChange={(e) => setInspector(e.target.value)}
            placeholder="e.g. R. Okonkwo"
            className="border border-line bg-bg px-3 py-2.5 text-ink outline-none placeholder:text-muted/50 focus:border-amber"
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted">
            Severity
          </span>
          <select
            value={severity}
            onChange={(e) => {
              const next = e.target.value as (typeof SEVERITIES)[number];
              setSeverity(next);
              if (next === "critical") setOos(true);
            }}
            className="border border-line bg-bg px-3 py-2.5 text-ink outline-none focus:border-amber"
          >
            {SEVERITIES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted">
            System
          </span>
          <select
            value={system}
            onChange={(e) => setSystem(e.target.value as (typeof FLEET_SYSTEMS)[number])}
            className="border border-line bg-bg px-3 py-2.5 text-ink outline-none focus:border-amber"
          >
            {FLEET_SYSTEMS.map((s) => (
              <option key={s} value={s}>
                {s.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted">
          Defect description
        </span>
        <textarea
          required
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What did the inspector find? Include side, axle, leak, travel, or lamp behavior."
          className="border border-line bg-bg px-3 py-2.5 text-ink outline-none placeholder:text-muted/50 focus:border-amber"
        />
      </label>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={oos}
            onChange={(e) => setOos(e.target.checked)}
            className="size-4 accent-amber"
          />
          OOS candidate — do-not-dispatch if confirmed
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={photo}
            onChange={(e) => setPhoto(e.target.checked)}
            className="size-4 accent-amber"
          />
          Photo present (demo flag)
        </label>
      </div>

      {error ? (
        <p className="border border-critical/40 bg-critical/10 px-3 py-2 text-sm text-critical">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending || vehicles.length === 0}
        className="border border-amber bg-amber px-4 py-3 font-mono text-sm font-semibold uppercase tracking-[0.16em] text-bg hover:bg-amber-dim disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Filing DVIR…" : "File DVIR + open defect"}
      </button>
    </form>
  );
}
