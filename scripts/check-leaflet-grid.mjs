// Numerical checks only: executes installed Leaflet math modules, without a DOM.
// The fixtures are snapshots of NASA GetCapabilities, not validated ground control.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const root = path.resolve(__dirname, "../node_modules/leaflet/src");
const cache = new Map();
const windowForUnusedAnimationHelpers = Object.freeze({
  requestAnimationFrame() { throw new Error("Animation is outside this numerical test"); },
  cancelAnimationFrame() { throw new Error("Animation is outside this numerical test"); },
});

function loadMathModule(filename) {
  filename = path.resolve(filename);
  assert.ok(filename.startsWith(root + path.sep), "Only installed Leaflet source is allowed");
  if (cache.has(filename)) return cache.get(filename).exports;
  const mathModule = { exports: {} };
  cache.set(filename, mathModule);
  const source = fs.readFileSync(filename, "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    fileName: filename,
  }).outputText;
  const localRequire = (specifier) => {
    assert.ok(specifier.startsWith("."), "Unexpected external dependency");
    return loadMathModule(path.resolve(path.dirname(filename), specifier + ".js"));
  };
  new Function("require", "module", "exports", "window", compiled)(
    localRequire, mathModule, mathModule.exports, windowForUnusedAnimationHelpers,
  );
  return mathModule.exports;
}

const { EPSG4326 } = loadMathModule(path.join(root, "geo/crs/CRS.EPSG4326.js"));
const { LatLng } = loadMathModule(path.join(root, "geo/LatLng.js"));
const { template } = loadMathModule(path.join(root, "core/Util.js"));
const fixture = JSON.parse(fs.readFileSync(path.join(__dirname, "../docs/evidence/jezero-wmts-grid.json"), "utf8"));
const version = JSON.parse(fs.readFileSync(path.resolve(root, "../package.json"), "utf8")).version;
assert.equal(version, "1.9.4", "Re-audit source behavior when Leaflet changes");

let roundTrips = 0;
let matrixChecks = 0;
for (const layer of fixture.layers) {
  for (const matrix of layer.matrices) {
    assert.match(matrix.id, /^\d+$/);
    const z = Number(matrix.id);
    const bounds = EPSG4326.getProjectedBounds(z);
    const size = bounds.getSize();
    assert.ok(Math.abs(size.x / matrix.tileWidth - matrix.width) < 1e-8);
    assert.ok(Math.abs(size.y / matrix.tileHeight - matrix.height) < 1e-8);
    const origin = EPSG4326.latLngToPoint(new LatLng(matrix.topLeft[1], matrix.topLeft[0]), z);
    assert.ok(Math.abs(origin.x) < 1e-8 && Math.abs(origin.y) < 1e-8);
    matrixChecks++;

    // Synthetic coordinates within each advertised bbox: not scientific landmarks.
    for (const fraction of [0.2, 0.5, 0.8]) {
      const lon = layer.bbox[0] + (layer.bbox[2] - layer.bbox[0]) * fraction;
      const lat = layer.bbox[1] + (layer.bbox[3] - layer.bbox[1]) * fraction;
      const input = new LatLng(lat, lon);
      const pixel = EPSG4326.latLngToPoint(input, z);
      const expectedCol = Math.floor((lon - matrix.topLeft[0]) / 360 * matrix.width);
      const expectedRow = Math.floor((matrix.topLeft[1] - lat) / 180 * matrix.height);
      assert.equal(Math.floor(pixel.x / matrix.tileWidth), expectedCol);
      assert.equal(Math.floor(pixel.y / matrix.tileHeight), expectedRow);
      const inverse = EPSG4326.pointToLatLng(pixel, z);
      assert.ok(Math.abs(inverse.lat - lat) < 1e-10);
      assert.ok(Math.abs(inverse.lng - lon) < 1e-10);
      roundTrips++;
    }
  }
}

const sample = EPSG4326.latLngToPoint(new LatLng(18.45, 77.45), 12);
assert.equal(Math.floor(sample.x / 256), 5858);
assert.equal(Math.floor(sample.y / 256), 1628);
const sampleUrl = template("https://example.invalid/{z}/{y}/{x}.png", { z: 12, y: 1628, x: 5858 });
assert.equal(sampleUrl, "https://example.invalid/12/1628/5858.png");

// Important limitation: changing a CRS does NOT change LatLng.distanceTo().
assert.equal(EPSG4326.R, 6371000);
const a = new LatLng(0, 0), b = new LatLng(0, 1);
const hypotheticalMarsCRS = { ...EPSG4326, R: 3396190 };
assert.ok(Math.abs(a.distanceTo(b) - hypotheticalMarsCRS.distance(a, b)) > 1);

console.log(JSON.stringify({
  leaflet: version,
  matrixChecks,
  syntheticCoordinateRoundTrips: roundTrips,
  sampleTile: { z: 12, row: 1628, col: 5858 },
  urlTemplate: "passed",
  earthDistanceDefaultDetected: true,
  scope: "Angular grid calculations only. No browser, rendering, reprojection or ground-control validation.",
}, null, 2));
