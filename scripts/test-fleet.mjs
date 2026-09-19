import test from "node:test";
import assert from "node:assert/strict";
import { createDvirFromIntake, normalizeState } from "../lib/fleet-core.js";
import { readFileSync } from "node:fs";

test("seed includes TRK-4821 / DVIR-9912", () => {
  const seed = JSON.parse(readFileSync(new URL("../demo/seed.json", import.meta.url), "utf8"));
  assert.ok(seed.vehicles.some((v) => v.id === "TRK-4821"));
  assert.ok(seed.dvirs.some((d) => d.id === "DVIR-9912"));
});

test("intake creates DVIR + DEF with crack_related", () => {
  const state = normalizeState(
    JSON.parse(readFileSync(new URL("../demo/seed.json", import.meta.url), "utf8"))
  );
  const created = createDvirFromIntake(state, {
    vehicle_id: "TRK-4821",
    inspector: "R. Demo",
    location: "Yard",
    overall: "UNSATISFACTORY",
    defect_code: "FRAME-RAIL-CRACK",
    system: "frame",
    severity: "critical",
    description: "Frame crack",
    crack_related: true,
    oos_candidate: true,
    photos_present: true,
  });
  assert.ok(created.dvir.id.startsWith("DVIR-"));
  assert.ok(created.defect.id.startsWith("DEF-"));
  assert.equal(created.defect.crack_related, true);
});
