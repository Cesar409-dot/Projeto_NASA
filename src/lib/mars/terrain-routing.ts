import {
  assertMarsCoordinate,
  eastLongitude180,
  surfaceDistanceMetres,
  type MarsCoordinate,
} from "./coordinates";

export type TerrainOptions = { maxSlopeDegrees: number; slopePenalty: number };
export const defaultTerrainOptions: TerrainOptions = {
  maxSlopeDegrees: 20,
  slopePenalty: 15,
};
export type TerrainGrid = {
  id: string;
  width: number;
  height: number;
  left: number;
  top: number;
  step: number;
  radius: number;
  standardParallel: number;
  elevations: Float32Array;
  slopes: Float32Array;
};
export type TerrainPlan = {
  algorithm: "astar-v1";
  modelId: string;
  options: TerrainOptions;
  path: [number, number][];
  distanceMetres: number;
  ascentMetres: number;
  descentMetres: number;
  maxSlopeDegrees: number;
  cost: number;
  visited: number;
  startOffsetMetres: number;
  endOffsetMetres: number;
};
export class TerrainError extends Error {
  constructor(
    public code: "coverage" | "unknown" | "slope" | "no-path" | "invalid",
    message: string,
  ) {
    super(message);
  }
}
const rad = Math.PI / 180;
export function gridCoordinate(
  grid: TerrainGrid,
  index: number,
): MarsCoordinate {
  const row = Math.floor(index / grid.width),
    col = index % grid.width;
  return {
    body: "Mars",
    latitudeType: "planetocentric",
    longitudeDirection: "east",
    latitude: (grid.top - (row + 0.5) * grid.step) / grid.radius / rad,
    longitude:
      (grid.left + (col + 0.5) * grid.step) /
      grid.radius /
      Math.cos(grid.standardParallel * rad) /
      rad,
  };
}
export function gridIndex(grid: TerrainGrid, p: MarsCoordinate): number {
  assertMarsCoordinate(p);
  const x =
    grid.radius *
    eastLongitude180(p.longitude) *
    rad *
    Math.cos(grid.standardParallel * rad);
  const y = grid.radius * p.latitude * rad;
  const col = Math.floor((x - grid.left) / grid.step),
    row = Math.floor((grid.top - y) / grid.step);
  if (row < 0 || col < 0 || row >= grid.height || col >= grid.width)
    throw new TerrainError(
      "coverage",
      "Origem ou destino fora do recorte de elevação de Jezero. Use a rota direta ou escolha pontos na cobertura.",
    );
  return row * grid.width + col;
}

// Binary min-heap. Stale entries are discarded against the best known g score.
class Heap {
  private items: { index: number; g: number; f: number }[] = [];
  get size() {
    return this.items.length;
  }
  push(item: { index: number; g: number; f: number }) {
    let i = this.items.length;
    this.items.push(item);
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (this.items[p].f <= item.f) break;
      this.items[i] = this.items[p];
      i = p;
    }
    this.items[i] = item;
  }
  pop() {
    const first = this.items[0],
      last = this.items.pop()!;
    if (this.items.length) {
      let i = 0;
      while (i * 2 + 1 < this.items.length) {
        let child = i * 2 + 1;
        if (
          child + 1 < this.items.length &&
          this.items[child + 1].f < this.items[child].f
        )
          child++;
        if (this.items[child].f >= last.f) break;
        this.items[i] = this.items[child];
        i = child;
      }
      this.items[i] = last;
    }
    return first;
  }
}

export function findTerrainRoute(
  grid: TerrainGrid,
  origin: MarsCoordinate,
  destination: MarsCoordinate,
  options: TerrainOptions = defaultTerrainOptions,
): TerrainPlan {
  const n = grid.width * grid.height;
  if (
    !Number.isInteger(n) ||
    n < 1 ||
    n > 250000 ||
    !Number.isInteger(grid.width) ||
    !Number.isInteger(grid.height) ||
    grid.width < 1 ||
    grid.height < 1 ||
    grid.elevations.length !== n ||
    grid.slopes.length !== n ||
    ![
      grid.left,
      grid.top,
      grid.radius,
      grid.step,
      grid.standardParallel,
      options.maxSlopeDegrees,
      options.slopePenalty,
    ].every(Number.isFinite) ||
    grid.radius <= 0 ||
    grid.step <= 0 ||
    Math.abs(grid.standardParallel) >= 90 ||
    options.maxSlopeDegrees < 0 ||
    options.maxSlopeDegrees > 45 ||
    options.slopePenalty < 0 ||
    options.slopePenalty > 100
  )
    throw new TerrainError(
      "invalid",
      "Grade ou parâmetros de terreno inválidos.",
    );
  const start = gridIndex(grid, origin),
    goal = gridIndex(grid, destination);
  const known = (i: number) =>
    Number.isFinite(grid.elevations[i]) &&
    Number.isFinite(grid.slopes[i]) &&
    grid.slopes[i] >= 0;
  for (const i of [start, goal]) {
    if (!known(i))
      throw new TerrainError(
        "unknown",
        "Origem ou destino em célula sem elevação válida. Nenhum caminho foi calculado.",
      );
    if (grid.slopes[i] > options.maxSlopeDegrees)
      throw new TerrainError(
        "slope",
        "Origem ou destino excede o limite de inclinação escolhido.",
      );
  }
  const usable = (i: number) =>
    known(i) && grid.slopes[i] <= options.maxSlopeDegrees;
  const coords = Array.from({ length: n }, (_, i) => gridCoordinate(grid, i));
  const edge = (a: number, b: number) => {
    const horizontal = surfaceDistanceMetres(coords[a], coords[b]);
    const dz = grid.elevations[b] - grid.elevations[a];
    const slope = Math.max(
      grid.slopes[a],
      grid.slopes[b],
      Math.atan2(Math.abs(dz), horizontal) / rad,
    );
    const distance = Math.hypot(horizontal, dz);
    return {
      dz,
      slope,
      distance,
      cost: distance * (1 + options.slopePenalty * Math.tan(slope * rad) ** 2),
    };
  };
  const score = new Float64Array(n).fill(Infinity),
    parent = new Int32Array(n).fill(-1);
  const closed = new Uint8Array(n),
    queue = new Heap();
  score[start] = 0;
  queue.push({
    index: start,
    g: 0,
    f: surfaceDistanceMetres(coords[start], coords[goal]),
  });
  let visited = 0;
  while (queue.size) {
    const current = queue.pop(),
      a = current.index;
    if (current.g !== score[a] || closed[a]) continue;
    closed[a] = 1;
    visited++;
    if (a === goal) break;
    const row = Math.floor(a / grid.width),
      col = a % grid.width;
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++) {
        if (
          (!dx && !dy) ||
          row + dy < 0 ||
          col + dx < 0 ||
          row + dy >= grid.height ||
          col + dx >= grid.width
        )
          continue;
        const b = a + dy * grid.width + dx;
        if (closed[b] || !usable(b)) continue;
        // Do not cut a diagonal across a blocked/unknown cell corner.
        if (
          dx &&
          dy &&
          (!usable(a + dx) ||
            !usable(a + dy * grid.width) ||
            edge(a, a + dx).slope > options.maxSlopeDegrees ||
            edge(a, a + dy * grid.width).slope > options.maxSlopeDegrees ||
            edge(b, a + dx).slope > options.maxSlopeDegrees ||
            edge(b, a + dy * grid.width).slope > options.maxSlopeDegrees)
        )
          continue;
        const step = edge(a, b);
        if (step.slope > options.maxSlopeDegrees) continue;
        const g = score[a] + step.cost;
        if (g < score[b]) {
          score[b] = g;
          parent[b] = a;
          queue.push({
            index: b,
            g,
            f: g + surfaceDistanceMetres(coords[b], coords[goal]),
          });
        }
      }
  }
  if (!closed[goal])
    throw new TerrainError(
      "no-path",
      "Nenhum caminho encontrado neste recorte com o limite escolhido. Áreas desconhecidas permanecem bloqueadas.",
    );
  const indices: number[] = [];
  for (let i = goal; i !== -1; i = parent[i]) indices.push(i);
  indices.reverse();
  const startOffsetMetres = surfaceDistanceMetres(origin, coords[start]);
  const endOffsetMetres = surfaceDistanceMetres(coords[goal], destination);
  // Endpoint connectors stay inside their known cell. Its mean elevation and conservative slope apply.
  let distanceMetres = startOffsetMetres + endOffsetMetres,
    ascentMetres = 0,
    descentMetres = 0;
  let maxSlopeDegrees = Math.max(grid.slopes[start], grid.slopes[goal]);
  let cost =
    score[goal] +
    startOffsetMetres *
      (1 + options.slopePenalty * Math.tan(grid.slopes[start] * rad) ** 2) +
    endOffsetMetres *
      (1 + options.slopePenalty * Math.tan(grid.slopes[goal] * rad) ** 2);
  for (let i = 1; i < indices.length; i++) {
    const step = edge(indices[i - 1], indices[i]);
    distanceMetres += step.distance;
    ascentMetres += Math.max(0, step.dz);
    descentMetres += Math.max(0, -step.dz);
    maxSlopeDegrees = Math.max(maxSlopeDegrees, step.slope);
  }
  const pair = (p: MarsCoordinate): [number, number] => [
    p.latitude,
    eastLongitude180(p.longitude),
  ];
  const path = [
    pair(origin),
    ...indices.map((i) => pair(coords[i])),
    pair(destination),
  ];
  // Same-cell routes use the cell's constant mean elevation, without an unnecessary centre detour.
  if (start === goal) {
    path.splice(0, path.length, pair(origin), pair(destination));
    distanceMetres = surfaceDistanceMetres(origin, destination);
    cost =
      distanceMetres *
      (1 + options.slopePenalty * Math.tan(maxSlopeDegrees * rad) ** 2);
  }
  return {
    algorithm: "astar-v1",
    modelId: grid.id,
    options: { ...options },
    path,
    distanceMetres,
    ascentMetres,
    descentMetres,
    maxSlopeDegrees,
    cost,
    visited,
    startOffsetMetres,
    endOffsetMetres,
  };
}
