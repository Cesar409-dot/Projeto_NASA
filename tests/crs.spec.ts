import { describe, it, expect } from "vitest";
import { LatLng } from "leaflet";
import { marsAngularCRS } from "@/lib/mars/crs";
import { MARS_RADIUS_METRES } from "@/lib/mars/coordinates";
import fixture from "../docs/evidence/jezero-wmts-grid.json";

describe("the actual Mars CRS used by the app", () => {
  it("matches every advertised matrix without an Earth CRS alias", () => {
    expect(marsAngularCRS.code).toBe("MARS:JEZERO_ANGULAR_GRID");
    for (const layer of fixture.layers)
      for (const m of layer.matrices) {
        const z = Number(m.id),
          bounds = marsAngularCRS.getProjectedBounds(z),
          size = bounds.getSize();
        expect(size.x / m.tileWidth).toBeCloseTo(m.width, 8);
        expect(size.y / m.tileHeight).toBeCloseTo(m.height, 8);
        const origin = marsAngularCRS.latLngToPoint(
          new LatLng(m.topLeft[1], m.topLeft[0]),
          z,
        );
        expect(origin.x).toBeCloseTo(0, 8);
        expect(origin.y).toBeCloseTo(0, 8);
      }
  });
  it("generates the verified tile indices and Mars distances", () => {
    const pixel = marsAngularCRS.latLngToPoint(new LatLng(18.45, 77.45), 12);
    expect(Math.floor(pixel.x / 256)).toBe(5858);
    expect(Math.floor(pixel.y / 256)).toBe(1628);
    expect(
      marsAngularCRS.distance(new LatLng(0, 0), new LatLng(0, 90)),
    ).toBeCloseTo((Math.PI * MARS_RADIUS_METRES) / 2, 6);
  });
});
