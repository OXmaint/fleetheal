import type { StoreMeta } from "@/lib/types";

export function StoreBanner({ meta }: { meta: StoreMeta }) {
  const label =
    meta.backend === "blob"
      ? "Vercel Blob"
      : meta.backend === "redis"
        ? "Upstash Redis"
        : meta.backend === "file"
          ? "local .data/fleet-state.json"
          : "in-memory + seed";

  return (
    <div
      className={`flex flex-wrap items-center gap-3 border px-4 py-2.5 text-xs ${
        meta.warning
          ? "border-amber/40 bg-amber/10 text-amber"
          : "border-line bg-panel-2 text-muted"
      }`}
    >
      <span className="font-mono uppercase tracking-[0.18em]">Store</span>
      <span>{label}</span>
      {meta.durable ? (
        <span className="text-ok">durable</span>
      ) : (
        <span className="text-amber">not multi-instance safe</span>
      )}
      {meta.warning ? <span className="min-w-0 flex-1">{meta.warning}</span> : null}
    </div>
  );
}
