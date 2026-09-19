import { severityTone } from "@/lib/format";

const tones: Record<string, string> = {
  critical: "border-critical/40 bg-critical/10 text-critical",
  major: "border-amber/40 bg-amber/10 text-amber",
  minor: "border-minor/40 bg-minor/10 text-minor",
  open: "border-amber/40 bg-amber/10 text-amber",
  grounded: "border-critical/40 bg-critical/10 text-critical",
  in_service: "border-ok/40 bg-ok/10 text-ok",
  UNSATISFACTORY: "border-critical/40 bg-critical/10 text-critical",
  SATISFACTORY_WITH_NOTES: "border-amber/40 bg-amber/10 text-amber",
};

export function StatusBadge({
  value,
  label,
}: {
  value: string;
  label?: string;
}) {
  const tone = tones[value] || tones[severityTone(value)] || "border-line bg-panel-2 text-muted";
  return (
    <span
      className={`inline-flex items-center rounded-sm border px-2 py-0.5 font-mono text-[11px] font-medium tracking-wide uppercase ${tone}`}
    >
      {label ?? value.replaceAll("_", " ")}
    </span>
  );
}
