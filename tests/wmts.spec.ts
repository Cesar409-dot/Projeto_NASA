import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect, vi, afterEach } from "vitest";
import { nasaLayers } from "@/data/map-layers";
import { validateWmts, probeLayer } from "@/lib/mars/wmts";
const xml = readFileSync(
  resolve("tests/fixtures/mola-capabilities.xml"),
  "utf8",
);
afterEach(() => vi.unstubAllGlobals());
describe("WMTS availability gate", () => {
  it("accepts MOLA and rejects a changed grid or Earth CRS", () => {
    expect(() => validateWmts(xml, nasaLayers[0])).not.toThrow();
    expect(() =>
      validateWmts(
        xml.replace("<TileWidth>256</TileWidth>", "<TileWidth>512</TileWidth>"),
        nasaLayers[0],
      ),
    ).toThrow();
    expect(() =>
      validateWmts(xml.replaceAll("EPSG::104905", "EPSG::3857"), nasaLayers[0]),
    ).toThrow();
  });
  it("does not enable a layer when the sample tile fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce({ ok: true, text: async () => xml })
        .mockResolvedValueOnce({ ok: false, status: 404 }),
    );
    await expect(
      probeLayer(nasaLayers[0], new AbortController().signal),
    ).rejects.toThrow("HTTP 404");
  });
  it("rejects a non-image response even with HTTP 200", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce({ ok: true, text: async () => xml })
        .mockResolvedValueOnce({
          ok: true,
          arrayBuffer: async () => new ArrayBuffer(32),
        }),
    );
    await expect(
      probeLayer(nasaLayers[0], new AbortController().signal),
    ).rejects.toThrow("PNG");
  });
});
