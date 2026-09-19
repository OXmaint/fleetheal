"use client";

import { useState } from "react";

export function CopyPrompt({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="border border-amber/50 bg-amber/10 p-4">
      <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.2em] text-amber">
        Judge / agent prompt
      </p>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <code className="font-mono text-lg text-ink sm:text-xl">{text}</code>
        <button
          type="button"
          onClick={copy}
          className="shrink-0 border border-amber bg-amber px-3 py-2 font-mono text-xs font-semibold uppercase tracking-wider text-bg hover:bg-amber-dim"
        >
          {copied ? "Copied" : "Copy prompt"}
        </button>
      </div>
    </div>
  );
}
