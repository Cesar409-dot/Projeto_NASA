import test from "node:test";
import assert from "node:assert/strict";
import {
  MARS_RADIUS_METRES,
  surfaceDistanceMetres,
  eastLongitude180,
  marsLatLng,
  greatCircleLine,
} from "../src/lib/mars/coordinates.ts";
import { routeReducer, emptyRoute } from "../src/lib/mars/route-state.ts";
import { sciencePoints } from "../src/data/science-points.ts";

const coordinate = (latitude, longitude) => ({
  body: "Mars",
  latitudeType: "planetocentric",
  longitudeDirection: "east",
  latitude,
  longitude,
});
const near = (a, b, tolerance = 1e-7) =>
  assert.ok(Math.abs(a - b) < tolerance, `${a} versus ${b}`);

test("great-circle distance uses the documented Mars sphere", () => {
  near(
    surfaceDistanceMetres(coordinate(0, 0), coordinate(0, 90)),
    (Math.PI * MARS_RADIUS_METRES) / 2,
  );
  near(
    surfaceDistanceMetres(coordinate(0, 0), coordinate(0, 180)),
    Math.PI * MARS_RADIUS_METRES,
  );
  assert.equal(
    surfaceDistanceMetres(coordinate(18, 77), coordinate(18, 77)),
    0,
  );
});
test("east-longitude domains are equivalent and the short arc crosses the dateline", () => {
  assert.equal(eastLongitude180(359), -1);
  assert.equal(eastLongitude180(360), 0);
  near(
    surfaceDistanceMetres(coordinate(0, 359), coordinate(0, 1)),
    surfaceDistanceMetres(coordinate(0, -1), coordinate(0, 1)),
  );
  near(
    surfaceDistanceMetres(coordinate(0, 179), coordinate(0, -179)),
    (MARS_RADIUS_METRES * Math.PI) / 90,
  );
});
test("distance rejects terrestrial bodies and incompatible coordinate conventions", () => {
  for (const bad of [
    { body: "Earth" },
    { latitudeType: "planetographic" },
    { longitudeDirection: "west" },
    { latitude: 91 },
    { longitude: 361 },
    { latitude: NaN },
  ]) {
    assert.throws(
      () =>
        surfaceDistanceMetres(
          { ...coordinate(0, 0), ...bad },
          coordinate(0, 1),
        ),
      RangeError,
    );
  }
});
test("distance is symmetric and finite at coincident poles", () => {
  const a = coordinate(-18, 359),
    b = coordinate(42, 32);
  near(surfaceDistanceMetres(a, b), surfaceDistanceMetres(b, a));
  assert.ok(
    Number.isFinite(
      surfaceDistanceMetres(coordinate(90, 0), coordinate(90, 180)),
    ),
  );
});
test("the rendered line follows the same spherical model and preserves endpoints", () => {
  const a = coordinate(18.48, 77.38),
    b = coordinate(18.55, 77.2);
  const line = greatCircleLine(a, b, 10);
  assert.equal(line.length, 11);
  assert.deepEqual(line[0], marsLatLng(a));
  assert.deepEqual(line.at(-1), marsLatLng(b));
  const midpoint = coordinate(...line[5]);
  near(
    surfaceDistanceMetres(a, midpoint),
    surfaceDistanceMetres(a, b) / 2,
    1e-5,
  );
  assert.throws(
    () => greatCircleLine(coordinate(0, 0), coordinate(0, 180)),
    RangeError,
  );
});
test("route origin and destination cannot be the same after controls change", () => {
  let state = routeReducer(emptyRoute, { type: "origin", id: "belva" });
  state = routeReducer(state, { type: "destination", id: "neretva" });
  assert.deepEqual(routeReducer(state, { type: "swap" }), {
    origin: "neretva",
    destination: "belva",
  });
  assert.deepEqual(routeReducer(state, { type: "origin", id: "neretva" }), {
    origin: "neretva",
    destination: "",
  });
  assert.deepEqual(routeReducer(state, { type: "destination", id: "belva" }), {
    origin: "",
    destination: "belva",
  });
  assert.deepEqual(routeReducer(state, { type: "clear" }), emptyRoute);
});
test("catalogued coordinates preserve the cited east-longitude values", () => {
  assert.deepEqual(
    sciencePoints.map((p) => [
      p.id,
      p.coordinate.latitude,
      p.coordinate.longitude,
    ]),
    [
      ["belva", 18.48, 77.38],
      ["neretva", 18.55, 77.2],
      ["jezero", 18.41, 77.69],
    ],
  );
  for (const point of sciencePoints) {
    assert.match(
      point.coordinateSource,
      /planetarynames\.wr\.usgs\.gov\/Feature\//,
    );
    assert.equal(point.coordinate.body, "Mars");
  }
});
