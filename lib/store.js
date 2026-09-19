import { readFileSync, mkdirSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { normalizeState, publicState, createDvirFromIntake } from "./fleet-core.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SEED_PATH = join(__dirname, "../demo/seed.json");
const FILE_PATH = process.env.FLEET_STATE_PATH || "/tmp/fleetheal-state.json";
const BLOB_KEY = "fleetheal/state.json";

export function detectStore() {
  if (process.env.BLOB_READ_WRITE_TOKEN) return "blob";
  return "file";
}

function loadSeed() {
  return normalizeState(JSON.parse(readFileSync(SEED_PATH, "utf8")));
}

async function readBlob() {
  const { list } = await import("@vercel/blob");
  const { blobs } = await list({ prefix: BLOB_KEY, limit: 20 });
  const hit = blobs.find((b) => b.pathname === BLOB_KEY) || blobs[0];
  if (!hit) return null;
  const res = await fetch(hit.url, { cache: "no-store" });
  if (!res.ok) return null;
  return normalizeState(await res.json());
}

async function writeBlob(state) {
  const { put } = await import("@vercel/blob");
  await put(BLOB_KEY, JSON.stringify(state), {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
  });
}

function readFileStore() {
  if (!existsSync(FILE_PATH)) return null;
  return normalizeState(JSON.parse(readFileSync(FILE_PATH, "utf8")));
}

function writeFileStore(state) {
  mkdirSync(dirname(FILE_PATH), { recursive: true });
  writeFileSync(FILE_PATH, JSON.stringify(state, null, 2));
}

export async function readState() {
  const store = detectStore();
  try {
    if (store === "blob") {
      const fromBlob = await readBlob();
      if (fromBlob) return fromBlob;
    } else {
      const fromFile = readFileStore();
      if (fromFile) return fromFile;
    }
  } catch (err) {
    console.error("[fleetheal] store read failed, seeding", err);
  }
  const seeded = loadSeed();
  await writeState(seeded);
  return seeded;
}

export async function writeState(state) {
  const store = detectStore();
  const next = normalizeState(state);
  next._meta = { ...(next._meta || {}), updated_at: new Date().toISOString(), store };
  if (store === "blob") await writeBlob(next);
  else writeFileStore(next);
  return next;
}

export async function getPublicState() {
  const state = await readState();
  return publicState(state, detectStore());
}

export async function createDvir(body) {
  const state = await readState();
  const created = createDvirFromIntake(state, body);
  if (created.error) return created;
  await writeState(state);
  return created;
}
