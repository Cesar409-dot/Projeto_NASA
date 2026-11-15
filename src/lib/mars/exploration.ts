import {
  assertMarsCoordinate,
  surfaceDistanceMetres,
  greatCircleLine,
  type MarsCoordinate,
} from "./coordinates";
export const markerCategories = [
  "Exploração",
  "Ciência",
  "Recursos",
  "Risco",
  "Pessoal",
] as const;
export type MapPoint = {
  id: string;
  name: string;
  coordinate: MarsCoordinate;
  imagePosition?: [number, number];
  objective?: string;
};
export type PersonalMarker = MapPoint & {
  description: string;
  category: (typeof markerCategories)[number];
  visited: boolean;
  layerId: string;
};
export type MissionRoute = { origin: MapPoint; destination: MapPoint };
export type SavedMission = {
  id: string;
  name: string;
  objective: string;
  description: string;
  date: string;
  route: MissionRoute;
};
export type ExplorationRecords = {
  version: 1;
  markers: PersonalMarker[];
  missions: SavedMission[];
};
export const STORAGE_KEY = "mars-maps:exploration:v1";
export const emptyRecords: ExplorationRecords = {
  version: 1,
  markers: [],
  missions: [],
};
export function routeDistance(route?: MissionRoute): number | null {
  if (
    !route?.origin ||
    !route.destination ||
    route.origin.id === route.destination.id
  )
    return null;
  try {
    greatCircleLine(route.origin.coordinate, route.destination.coordinate);
    const distance = surfaceDistanceMetres(
      route.origin.coordinate,
      route.destination.coordinate,
    );
    return distance > 0 ? distance : null;
  } catch {
    return null;
  }
}
export function distanceLabel(route?: MissionRoute): string {
  const value = routeDistance(route);
  return value === null
    ? "Rota não definida"
    : "≈ " +
        (value / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 2 }) +
        " km";
}
const text = (v: unknown, required = true): v is string =>
  typeof v === "string" && v.length <= 5000 && (!required || !!v.trim());
export function validDate(v: unknown): v is string {
  return (
    typeof v === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(v) &&
    Number.isFinite(Date.parse(v)) &&
    new Date(v).toISOString().slice(0, 10) === v
  );
}
function point(v: unknown): v is MapPoint {
  if (!v || typeof v !== "object") return false;
  const p = v as MapPoint;
  try {
    assertMarsCoordinate(p.coordinate);
  } catch {
    return false;
  }
  return (
    text(p.id) &&
    text(p.name) &&
    (p.objective === undefined || text(p.objective, false)) &&
    (p.imagePosition === undefined ||
      (Array.isArray(p.imagePosition) &&
        p.imagePosition.length === 2 &&
        p.imagePosition.every(Number.isFinite)))
  );
}
export function parseRecords(raw: string): ExplorationRecords {
  const data = JSON.parse(raw) as ExplorationRecords;
  if (
    data?.version !== 1 ||
    !Array.isArray(data.markers) ||
    !Array.isArray(data.missions) ||
    !data.markers.every(
      (m) =>
        point(m) &&
        text(m.description, false) &&
        markerCategories.includes(m.category) &&
        typeof m.visited === "boolean" &&
        text(m.layerId),
    ) ||
    !data.missions.every(
      (m) =>
        m &&
        text(m.id) &&
        text(m.name) &&
        text(m.objective) &&
        text(m.description, false) &&
        validDate(m.date) &&
        point(m.route?.origin) &&
        point(m.route?.destination) &&
        routeDistance(m.route) !== null,
    ) ||
    new Set(data.markers.map((m) => m.id)).size !== data.markers.length ||
    new Set(data.missions.map((m) => m.id)).size !== data.missions.length
  )
    throw new Error(
      "Registros locais incompatíveis ou danificados. Os dados originais foram preservados.",
    );
  return data;
}

/** Split display arcs at the longitude seam instead of drawing a false cross-map segment. */
export function routeSegments(route: MissionRoute): [number, number][][] {
  if (routeDistance(route) === null) return [];
  const line = greatCircleLine(
    route.origin.coordinate,
    route.destination.coordinate,
  );
  const parts: [number, number][][] = [[line[0]]];
  for (let i = 1; i < line.length; i++) {
    const previous = line[i - 1],
      next = line[i];
    if (Math.abs(next[1] - previous[1]) > 180) {
      const edge = previous[1] > 0 ? 180 : -180;
      const unwrapped = next[1] + (previous[1] > 0 ? 360 : -360);
      const t = (edge - previous[1]) / (unwrapped - previous[1]);
      const latitude = previous[0] + t * (next[0] - previous[0]);
      parts[parts.length - 1].push([latitude, edge]);
      parts.push([[latitude, -edge], next]);
    } else parts[parts.length - 1].push(next);
  }
  return parts;
}

/** Display planetocentric latitude and positive-east longitude without changing stored values. */
export function mapCoordinateLabel(coordinate: MarsCoordinate): string {
  assertMarsCoordinate(coordinate);
  const longitude = ((coordinate.longitude % 360) + 360) % 360;
  return (
    Math.abs(coordinate.latitude).toFixed(5) +
    "° " +
    (coordinate.latitude >= 0 ? "N" : "S") +
    ", " +
    longitude.toFixed(5) +
    "° E"
  );
}
