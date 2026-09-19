import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import rawSeed from "../demo/seed.json";
import { cloneState } from "./fleet";
import type { FleetState, StoreBackend, StoreMeta } from "./types";

const BLOB_PATH = "fleetheal/fleet-state.json";
const REDIS_KEY = "fleetheal:fleet-state";
const FILE_PATH = join(process.cwd(), ".data", "fleet-state.json");

type Loaded = { state: FleetState; meta: StoreMeta };

let memoryState: FleetState | null = null;
let writeChain: Promise<unknown> = Promise.resolve();

function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = writeChain.then(fn, fn);
  writeChain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

function emptyMeta(backend: StoreBackend, extra?: Partial<StoreMeta>): StoreMeta {
  const durable = backend === "blob" || backend === "redis" || backend === "file";
  return {
    backend,
    durable,
    ...extra,
  };
}

function isVercel() {
  return process.env.VERCEL === "1";
}

function hasBlob() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

function hasRedis() {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

export function detectBackend(): StoreBackend {
  if (hasBlob()) return "blob";
  if (hasRedis()) return "redis";
  if (!isVercel()) return "file";
  return "memory";
}

function seedState(): FleetState {
  return cloneState(rawSeed as FleetState);
}

function stripMeta(input: unknown): FleetState | null {
  if (!input || typeof input !== "object") return null;
  const { _meta: _ignored, ...rest } = input as FleetState & { _meta?: unknown };
  if (!Array.isArray(rest.vehicles) || !Array.isArray(rest.dvirs)) return null;
  return rest as FleetState;
}

async function readBlob(): Promise<FleetState | null> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return null;
  const { list } = await import("@vercel/blob");
  const { blobs } = await list({ prefix: BLOB_PATH, token, limit: 20 });
  const match = blobs.find((b) => b.pathname === BLOB_PATH) ?? blobs[0];
  if (!match) return null;
  const res = await fetch(match.url, { cache: "no-store" });
  if (!res.ok) return null;
  return stripMeta(await res.json());
}

async function writeBlob(state: FleetState) {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) throw new Error("BLOB_READ_WRITE_TOKEN is not set");
  const { put } = await import("@vercel/blob");
  await put(BLOB_PATH, JSON.stringify(state, null, 2), {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
    token,
  });
}

async function redisClient() {
  const { Redis } = await import("@upstash/redis");
  return Redis.fromEnv();
}

async function readRedis(): Promise<FleetState | null> {
  const redis = await redisClient();
  const value = await redis.get(REDIS_KEY);
  return stripMeta(value);
}

async function writeRedis(state: FleetState) {
  const redis = await redisClient();
  await redis.set(REDIS_KEY, state);
}

async function readFileStore(): Promise<FleetState | null> {
  try {
    const raw = await readFile(FILE_PATH, "utf8");
    return stripMeta(JSON.parse(raw));
  } catch {
    return null;
  }
}

async function writeFileStore(state: FleetState) {
  await mkdir(dirname(FILE_PATH), { recursive: true });
  const tmp = `${FILE_PATH}.${process.pid}.tmp`;
  await writeFile(tmp, JSON.stringify(state, null, 2), "utf8");
  await rename(tmp, FILE_PATH);
}

function memoryWarning(): string {
  return "In-memory store — state is per serverless instance and resets on cold start. Set BLOB_READ_WRITE_TOKEN (Vercel Blob) or UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN for durable multi-instance persistence.";
}

async function readFor(backend: StoreBackend): Promise<Loaded> {
  if (backend === "blob") {
    const existing = await readBlob();
    if (existing) return { state: existing, meta: emptyMeta("blob") };
    const state = seedState();
    await writeBlob(state);
    return { state, meta: emptyMeta("blob") };
  }

  if (backend === "redis") {
    const existing = await readRedis();
    if (existing) return { state: existing, meta: emptyMeta("redis") };
    const state = seedState();
    await writeRedis(state);
    return { state, meta: emptyMeta("redis") };
  }

  if (backend === "file") {
    const existing = await readFileStore();
    if (existing) return { state: existing, meta: emptyMeta("file") };
    const state = seedState();
    await writeFileStore(state);
    return { state, meta: emptyMeta("file") };
  }

  if (!memoryState) memoryState = seedState();
  return {
    state: memoryState,
    meta: emptyMeta("memory", { warning: memoryWarning() }),
  };
}

async function persist(backend: StoreBackend, state: FleetState) {
  if (backend === "blob") {
    await writeBlob(state);
    return;
  }
  if (backend === "redis") {
    await writeRedis(state);
    return;
  }
  if (backend === "file") {
    await writeFileStore(state);
    return;
  }
  memoryState = state;
}

export async function getStore(): Promise<Loaded> {
  const backend = detectBackend();
  try {
    return await readFor(backend);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!memoryState) memoryState = seedState();
    return {
      state: memoryState,
      meta: emptyMeta("memory", {
        warning: `Durable store (${backend}) failed (${message}). ${memoryWarning()}`,
      }),
    };
  }
}

export async function mutateStore<T>(
  mutator: (state: FleetState) => T | Promise<T>,
): Promise<{ result: T; state: FleetState; meta: StoreMeta }> {
  return withLock(async () => {
    const loaded = await getStore();
    const state = cloneState(loaded.state);
    const result = await mutator(state);
    try {
      await persist(loaded.meta.backend, state);
      if (loaded.meta.backend === "memory") memoryState = state;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      memoryState = state;
      return {
        result,
        state,
        meta: emptyMeta("memory", {
          warning: `Persist failed (${message}). ${memoryWarning()}`,
        }),
      };
    }
    return { result, state, meta: loaded.meta };
  });
}

export function publicState(state: FleetState, meta: StoreMeta) {
  return { ...state, _meta: meta };
}
