"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SubmitPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<any>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const payload = {
      vehicle_id: String(form.get("vehicle_id") || "").trim(),
      inspector: String(form.get("inspector") || "").trim(),
      location: String(form.get("location") || "").trim(),
      overall: String(form.get("overall") || "UNSATISFACTORY"),
      defect_code: String(form.get("defect_code") || "").trim(),
      system: String(form.get("system") || "").trim(),
      severity: String(form.get("severity") || "major"),
      description: String(form.get("description") || "").trim(),
      crack_related: form.get("crack_related") === "on",
      oos_candidate: form.get("oos_candidate") === "on",
      photos_present: form.get("photos_present") === "on",
    };
    const res = await fetch("/api/fleet/dvirs", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error || "Submit failed");
      return;
    }
    setResult(data);
  }

  return (
    <main style={{ maxWidth: 640, margin: "0 auto", padding: 24 }}>
      <p>
        <Link href="/">← Yard board</Link>
      </p>
      <h1>Submit DVIR report</h1>
      <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
        <label>
          Vehicle
          <br />
          <select name="vehicle_id" defaultValue="TRK-4821">
            <option value="TRK-4821">TRK-4821</option>
            <option value="TRK-1107">TRK-1107</option>
          </select>
        </label>
        <label>
          Inspector
          <br />
          <input name="inspector" required defaultValue="R. Demo" />
        </label>
        <label>
          Location
          <br />
          <input name="location" required defaultValue="Santa Clara Yard" />
        </label>
        <label>
          Overall status
          <br />
          <select name="overall" defaultValue="UNSATISFACTORY">
            <option>UNSATISFACTORY</option>
            <option>SATISFACTORY_WITH_NOTES</option>
            <option>SATISFACTORY</option>
          </select>
        </label>
        <label>
          Defect code
          <br />
          <input name="defect_code" required defaultValue="FRAME-RAIL-CRACK" />
        </label>
        <label>
          System
          <br />
          <input name="system" required defaultValue="frame" />
        </label>
        <label>
          Severity
          <br />
          <select name="severity" defaultValue="critical">
            <option>critical</option>
            <option>major</option>
            <option>minor</option>
          </select>
        </label>
        <label>
          Description
          <br />
          <textarea
            name="description"
            required
            rows={3}
            defaultValue="Frame rail crack visible at LH kick-up; heat-checked rotor noted."
          />
        </label>
        <label style={{ background: "#3a2a10", padding: 12, display: "block" }}>
          <input type="checkbox" name="crack_related" defaultChecked />{" "}
          <strong>crack_related</strong> — flag crack-related issues (heat-checked
          rotors, cracked lens, frame crack)
        </label>
        <label>
          <input type="checkbox" name="oos_candidate" defaultChecked /> oos_candidate
        </label>
        <label>
          <input type="checkbox" name="photos_present" defaultChecked /> photos_present
        </label>
        <button type="submit" disabled={busy}>
          {busy ? "Saving…" : "Submit DVIR"}
        </button>
      </form>
      {error ? <p>{error}</p> : null}
      {result ? (
        <section>
          <h2>Saved</h2>
          <p>
            {result.dvir?.id} + {result.defect?.id}
          </p>
          <textarea readOnly rows={5} style={{ width: "100%" }} value={result.investigate_prompt} />
          <p>
            <button type="button" onClick={() => router.push("/")}>
              View on yard board
            </button>
          </p>
        </section>
      ) : null}
    </main>
  );
}
