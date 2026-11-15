import { readFileSync } from "node:fs";
import { describe, expect, it, vi, afterEach } from "vitest";
import { nasaLayers, sampleTileUrl } from "@/data/map-layers";
import { validateWmts, probeLayer } from "@/lib/mars/wmts";
import {
  parseRecords,
  emptyRecords,
  routeDistance,
  routeSegments,
  manualCoordinate,
} from "@/lib/mars/exploration";
import { sciencePoints } from "@/data/science-points";
afterEach(() => vi.unstubAllGlobals());

describe("Verified expansion contracts", () => {
  it.each([
    ["18,45", "77,40", 18.45, 77.4],
    ["-90", "360", -90, 0],
    ["90", "-180", 90, -180],
    ["0", "270", 0, -90],
  ])(
    "normalizes manual Mars coordinates %s / %s",
    (lat, lon, latitude, longitude) => {
      const result = manualCoordinate(lat, lon)!;
      expect(result.latitude).toBeCloseTo(latitude);
      expect(result.longitude).toBeCloseTo(longitude);
      expect(result).toMatchObject({
        body: "Mars",
        latitudeType: "planetocentric",
        longitudeDirection: "east",
      });
    },
  );
  it.each([
    ["", "0"],
    [" ", "0"],
    ["91", "0"],
    ["-90.1", "0"],
    ["0", "361"],
    ["0", "-181"],
    ["NaN", "0"],
    ["0", "Infinity"],
    ["0x10", "0"],
    ["1e1", "0"],
    ["1,2.3", "0"],
  ])("rejects invalid manual input %s / %s", (lat, lon) => {
    expect(manualCoordinate(lat, lon)).toBeUndefined();
  });
  it.each(["ctx-regional", "mola"])(
    "checks the actual NASA metadata of %s",
    (id) => {
      const layer = nasaLayers.find((l) => l.id === id)!;
      const xml = readFileSync(
        "tests/fixtures/" + id + "-capabilities.xml",
        "utf8",
      );
      expect(() => validateWmts(xml, layer)).not.toThrow();
      expect(() =>
        validateWmts(xml.replaceAll("EPSG::104905", "EPSG::3857"), layer),
      ).toThrow();
      expect(sampleTileUrl(layer)).toContain(
        id === "mola" ? "/0/0/1.jpg" : "/12/1628/5858.png",
      );
    },
  );
  it.each(["ctx-regional", "mola"])(
    "checks tile decoding and size for %s",
    async (id) => {
      const layer = nasaLayers.find((l) => l.id === id)!;
      const xml = readFileSync(
        "tests/fixtures/" + id + "-capabilities.xml",
        "utf8",
      );
      const bytes =
        id === "mola"
          ? new Uint8Array([255, 216, 255])
          : new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
      const fetchMock = vi.fn(async (url: string) =>
        url.endsWith(".xml")
          ? { ok: true, text: async () => xml }
          : { ok: true, arrayBuffer: async () => bytes.buffer },
      );
      vi.stubGlobal("fetch", fetchMock);
      const close = vi.fn();
      const decode = vi.fn(async () => ({ width: 256, height: 256, close }));
      vi.stubGlobal("createImageBitmap", decode);
      await expect(
        probeLayer(layer, new AbortController().signal),
      ).resolves.toBeUndefined();
      expect(close).toHaveBeenCalledOnce();
      decode.mockResolvedValueOnce({ width: 128, height: 256, close });
      await expect(
        probeLayer(layer, new AbortController().signal),
      ).rejects.toThrow("Dimensões");
    },
  );
  it("splits global routes at the dateline without a false geographic bridge", () => {
    const p = sciencePoints[0];
    const route = {
      origin: {
        ...p,
        coordinate: { ...p.coordinate, latitude: 0, longitude: 179 },
      },
      destination: {
        ...p,
        id: "east",
        coordinate: { ...p.coordinate, latitude: 0, longitude: -179 },
      },
    };
    const segments = routeSegments(route);
    expect(segments).toHaveLength(2);
    for (const segment of segments)
      for (let i = 1; i < segment.length; i++)
        expect(Math.abs(segment[i][1] - segment[i - 1][1])).toBeLessThanOrEqual(
          180,
        );
  });
  it("rejects incompatible persistence and coincident/antipodal routes", () => {
    expect(() =>
      parseRecords(JSON.stringify({ ...emptyRecords, version: 2 })),
    ).toThrow();
    const a = sciencePoints[0];
    expect(
      routeDistance({
        origin: a,
        destination: { ...a, id: "same-coordinate" },
      }),
    ).toBeNull();
    expect(
      routeDistance({
        origin: a,
        destination: {
          ...a,
          id: "antipodal",
          coordinate: {
            ...a.coordinate,
            latitude: -a.coordinate.latitude,
            longitude: a.coordinate.longitude - 180,
          },
        },
      }),
    ).toBeNull();
    expect(
      routeDistance({ origin: a, destination: sciencePoints[1] }),
    ).toBeGreaterThan(0);
  });
});
