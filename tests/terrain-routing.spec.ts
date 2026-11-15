import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { describe, it, expect } from "vitest";
import {
  findTerrainRoute,
  gridCoordinate,
  gridIndex,
  type TerrainGrid,
} from "@/lib/mars/terrain-routing";
import { decodeTerrainGrid } from "@/lib/mars/terrain-data";
import { terrainModel } from "@/data/terrain-model";
import { sciencePoints } from "@/data/science-points";
import {
  parseRecords,
  emptyRecords,
  routeDistance,
} from "@/lib/mars/exploration";
import {
  MARS_RADIUS_METRES,
  surfaceDistanceMetres,
} from "@/lib/mars/coordinates";

// SYNTHETIC fixtures for algorithm tests only. Never exported to the application.
function synthetic(width = 5, height = 3): TerrainGrid {
  return {
    id: "synthetic-test-only",
    width,
    height,
    left: 0,
    top: 300,
    step: 100,
    radius: MARS_RADIUS_METRES,
    standardParallel: 0,
    elevations: new Float32Array(width * height),
    slopes: new Float32Array(width * height),
  };
}
const options = { maxSlopeDegrees: 45, slopePenalty: 15 };
describe("A* de terreno em grades sintéticas", () => {
  it("usa metros e a esfera marciana para a rota direta e para vizinhos da grade", () => {
    const grid = synthetic();
    const a = gridCoordinate(grid, 5),
      b = gridCoordinate(grid, 9);
    expect(surfaceDistanceMetres(a, b)).toBeCloseTo(400, 4);
    const plan = findTerrainRoute(grid, a, b, options);
    expect(plan.distanceMetres).toBeCloseTo(400, 4);
    expect(plan.cost).toBeCloseTo(400, 4);
    expect(plan.ascentMetres).toBe(0);
    expect(plan.maxSlopeDegrees).toBe(0);
    expect(gridIndex(grid, a)).toBe(5);
  });
  it("penalizar inclinação prefere um desvio de menor custo em vez de passar pela elevação", () => {
    const grid = synthetic();
    grid.elevations[7] = 40;
    const a = gridCoordinate(grid, 5),
      b = gridCoordinate(grid, 9);
    const shortest = findTerrainRoute(grid, a, b, {
      ...options,
      slopePenalty: 0,
    });
    const smooth = findTerrainRoute(grid, a, b, {
      ...options,
      slopePenalty: 100,
    });
    expect(
      shortest.path.some(
        ([latitude, longitude]) =>
          gridIndex(grid, { ...a, latitude, longitude }) === 7,
      ),
    ).toBe(true);
    expect(
      smooth.path.some(
        ([latitude, longitude]) =>
          gridIndex(grid, { ...a, latitude, longitude }) === 7,
      ),
    ).toBe(false);
    expect(smooth.distanceMetres).toBeGreaterThan(shortest.distanceMetres);
    expect(smooth.ascentMetres).toBe(0);
    expect(shortest.ascentMetres).toBe(40);
    expect(shortest.descentMetres).toBe(40);
    expect(shortest.maxSlopeDegrees).toBeCloseTo(
      (Math.atan(0.4) * 180) / Math.PI,
      4,
    );
    expect(smooth.cost).toBeLessThan(
      shortest.distanceMetres + 2 * Math.hypot(100, 40) * 100 * 0.4 ** 2,
    );
  });
  it("bloqueia o limite configurado, respeita a inclinação nativa e não presume NoData seguro", () => {
    const grid = synthetic();
    grid.slopes[7] = 30;
    grid.elevations[2] = NaN;
    const a = gridCoordinate(grid, 5),
      b = gridCoordinate(grid, 9);
    const plan = findTerrainRoute(grid, a, b, {
      maxSlopeDegrees: 10,
      slopePenalty: 15,
    });
    expect(plan.maxSlopeDegrees).toBeLessThanOrEqual(10);
    expect(
      plan.path.every(
        ([latitude, longitude]) =>
          ![2, 7].includes(gridIndex(grid, { ...a, latitude, longitude })),
      ),
    ).toBe(true);
    expect(() =>
      findTerrainRoute(grid, gridCoordinate(grid, 7), b, {
        maxSlopeDegrees: 10,
        slopePenalty: 15,
      }),
    ).toThrow(/excede/);
    expect(() =>
      findTerrainRoute(grid, gridCoordinate(grid, 2), b, options),
    ).toThrow(/sem elevação/);
  });
  it("retorna ausência de caminho em uma barreira e não corta diagonais desconhecidas", () => {
    const grid = synthetic();
    [2, 7, 12].forEach((i) => (grid.elevations[i] = NaN));
    expect(() =>
      findTerrainRoute(
        grid,
        gridCoordinate(grid, 5),
        gridCoordinate(grid, 9),
        options,
      ),
    ).toThrow(/Nenhum caminho/);
    const corner = synthetic(2, 2);
    corner.elevations[1] = corner.elevations[2] = NaN;
    expect(() =>
      findTerrainRoute(
        corner,
        gridCoordinate(corner, 0),
        gridCoordinate(corner, 3),
        options,
      ),
    ).toThrow(/Nenhum caminho/);
  });
  it("rejeita origem e destino fora da cobertura e parâmetros incompatíveis", () => {
    const grid = synthetic(),
      a = gridCoordinate(grid, 5),
      b = { ...a, latitude: 20 };
    expect(() => findTerrainRoute(grid, a, b, options)).toThrow(
      /fora do recorte/,
    );
    expect(() => findTerrainRoute(grid, b, a, options)).toThrow(
      /fora do recorte/,
    );
    expect(() =>
      findTerrainRoute(grid, a, a, { ...options, slopePenalty: -1 }),
    ).toThrow(/inválidos/);
  });
  it("encontra o mesmo custo mínimo de uma referência Dijkstra independente", () => {
    const grid = synthetic(4, 4);
    grid.elevations.set([0, 5, 15, 0, 0, 10, 20, 0, 0, 0, 8, 0, 0, 0, 0, 0]);
    grid.slopes.set([0, 10, 12, 0, 0, 5, 15, 0, 0, 0, 4, 0, 0, 0, 0, 0]);
    const coordinates = Array.from({ length: 16 }, (_, i) =>
      gridCoordinate(grid, i),
    );
    const distances = Array(16).fill(Infinity),
      remaining = new Set(coordinates.map((_, i) => i));
    distances[0] = 0;
    while (remaining.size) {
      const a = [...remaining].sort((x, y) => distances[x] - distances[y])[0];
      remaining.delete(a);
      for (const b of remaining) {
        if (
          Math.abs((a % 4) - (b % 4)) > 1 ||
          Math.abs(Math.floor(a / 4) - Math.floor(b / 4)) > 1
        )
          continue;
        const d = surfaceDistanceMetres(coordinates[a], coordinates[b]),
          dz = grid.elevations[b] - grid.elevations[a];
        const slope = Math.max(
          grid.slopes[a],
          grid.slopes[b],
          (Math.atan2(Math.abs(dz), d) * 180) / Math.PI,
        );
        const cost =
          Math.hypot(d, dz) *
          (1 + options.slopePenalty * Math.tan((slope * Math.PI) / 180) ** 2);
        distances[b] = Math.min(distances[b], distances[a] + cost);
      }
    }
    const plan = findTerrainRoute(
      grid,
      coordinates[0],
      coordinates[15],
      options,
    );
    expect(plan.cost).toBeCloseTo(distances[15], 6);
    expect(
      surfaceDistanceMetres(coordinates[0], coordinates[15]),
    ).toBeLessThanOrEqual(plan.cost);
  });
  it("corrige o espaçamento longitudinal pela latitude, sem equiparar graus a metros", () => {
    const grid = synthetic(2, 2);
    grid.top = (grid.radius * Math.PI) / 3;
    grid.standardParallel = 0;
    expect(
      surfaceDistanceMetres(gridCoordinate(grid, 0), gridCoordinate(grid, 1)),
    ).toBeCloseTo(50, 1);
    expect(
      surfaceDistanceMetres(gridCoordinate(grid, 0), gridCoordinate(grid, 2)),
    ).toBeCloseTo(100, 4);
  });
});
describe("Recorte científico local e persistência", () => {
  const bytes = readFileSync("public/terrain/jezero-ctx-100m-v1.bin");
  const grid = decodeTerrainGrid(
    bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
  );
  it("verifica integridade, dimensões, unidades, projeção e resolução declaradas", () => {
    expect(createHash("sha256").update(bytes).digest("hex")).toBe(
      terrainModel.dataSha256,
    );
    expect(bytes.length).toBe(395 * 208 * 8);
    expect(grid.radius).toBe(MARS_RADIUS_METRES);
    expect(terrainModel.nativeSpacingMetres).toBe(20);
    expect(terrainModel.elevationUnit).toBe("metre");
    expect(terrainModel.sourceGeoKeys.ProjStdParallel1GeoKey).toBe(18.4663);
    expect(() => decodeTerrainGrid(new ArrayBuffer(4))).toThrow(/incompleto/);
    expect(grid.elevations.every(Number.isFinite)).toBe(true);
    expect(Math.min(...grid.elevations)).toBeLessThan(-2000);
    expect(Math.max(...grid.elevations)).toBeLessThan(0);
  });
  it("calcula uma rota real entre pontos científicos e conserva sua cópia em uma missão", () => {
    const route = { origin: sciencePoints[0], destination: sciencePoints[1] };
    const started = performance.now();
    const plan = findTerrainRoute(
      grid,
      route.origin.coordinate,
      route.destination.coordinate,
    );
    console.log(
      "Jezero A*: ",
      JSON.stringify({
        ms: performance.now() - started,
        distance: plan.distanceMetres,
        cost: plan.cost,
        visited: plan.visited,
        maxSlope: plan.maxSlopeDegrees,
      }),
    );
    expect(plan.distanceMetres).toBeGreaterThanOrEqual(routeDistance(route)!);
    expect(plan.modelId).toBe(terrainModel.id);
    expect(plan.maxSlopeDegrees).toBeLessThanOrEqual(20);
    const records = {
      ...emptyRecords,
      missions: [
        {
          id: "terrain-mission",
          name: "Rota real",
          objective: "Comparar relevo",
          description: "",
          date: "2026-12-01",
          route: { ...route, terrain: plan },
        },
      ],
    };
    expect(
      parseRecords(JSON.stringify(records)).missions[0].route.terrain,
    ).toEqual(plan);
    const broken = structuredClone(records);
    broken.missions[0].route.terrain.path[0][0] = 0;
    expect(() => parseRecords(JSON.stringify(broken))).toThrow(/incompatíveis/);
  });
});
