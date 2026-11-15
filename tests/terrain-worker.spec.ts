import { readFileSync } from "node:fs";
import { webcrypto } from "node:crypto";
import { beforeEach, afterEach, expect, it, vi } from "vitest";
import { sciencePoints } from "@/data/science-points";
import type { TerrainRequest } from "@/lib/mars/terrain.worker";
beforeEach(async () => {
  vi.stubGlobal("crypto", webcrypto);
  vi.stubGlobal("postMessage", vi.fn());
  vi.stubGlobal("onmessage", null);
  vi.resetModules();
  await import("@/lib/mars/terrain.worker");
});
afterEach(() => vi.unstubAllGlobals());
const request: TerrainRequest = {
  origin: sciencePoints[0].coordinate,
  destination: sciencePoints[1].coordinate,
  options: { maxSlopeDegrees: 20, slopePenalty: 15 },
};
const run = () =>
  (
    globalThis.onmessage as unknown as (event: {
      data: TerrainRequest;
    }) => Promise<void>
  )({ data: request });
it("executa o pipeline real do Worker com verificação SHA-256 e DEM local", async () => {
  const bytes = readFileSync("public/terrain/jezero-ctx-100m-v1.bin");
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({
      ok: true,
      arrayBuffer: async () =>
        bytes.buffer.slice(
          bytes.byteOffset,
          bytes.byteOffset + bytes.byteLength,
        ),
    })),
  );
  await run();
  expect(postMessage).toHaveBeenCalledWith({
    plan: expect.objectContaining({
      algorithm: "astar-v1",
      modelId: "jezero-ctx-100m-v1",
      distanceMetres: expect.closeTo(12358, 0),
    }),
  });
});
it("recusa arquivo adulterado sem retornar polilinha ou fallback direto", async () => {
  const bytes = readFileSync("public/terrain/jezero-ctx-100m-v1.bin");
  bytes[0] ^= 1;
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({
      ok: true,
      arrayBuffer: async () =>
        bytes.buffer.slice(
          bytes.byteOffset,
          bytes.byteOffset + bytes.byteLength,
        ),
    })),
  );
  await run();
  expect(postMessage).toHaveBeenCalledExactlyOnceWith({
    error: "Integridade do arquivo de elevação não confirmada.",
  });
});
