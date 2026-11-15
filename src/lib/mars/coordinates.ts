/** Angular coordinates of Mars, never terrestrial WGS84. */
export type MarsCoordinate = Readonly<{
  body: "Mars";
  latitudeType: "planetocentric";
  longitudeDirection: "east";
  latitude: number;
  longitude: number;
}>;

/** Spherical reference used by the USGS controlled Jezero products, in metres. */
export const MARS_RADIUS_METRES = 3_396_190;

export function assertMarsCoordinate(point: MarsCoordinate): void {
  if (
    point.body !== "Mars" ||
    point.latitudeType !== "planetocentric" ||
    point.longitudeDirection !== "east" ||
    !Number.isFinite(point.latitude) ||
    !Number.isFinite(point.longitude) ||
    Math.abs(point.latitude) > 90 ||
    point.longitude < -180 ||
    point.longitude > 360
  ) {
    throw new RangeError(
      "É necessária uma coordenada planetocêntrica marciana, positiva para leste.",
    );
  }
}

export function eastLongitude180(longitude: number): number {
  if (!Number.isFinite(longitude)) throw new RangeError("Longitude inválida");
  return ((((longitude + 180) % 360) + 360) % 360) - 180;
}

export function marsLatLng(point: MarsCoordinate): [number, number] {
  assertMarsCoordinate(point);
  return [point.latitude, eastLongitude180(point.longitude)];
}

/** Shortest great-circle arc on the documented Mars sphere. No terrain model. */
export function surfaceDistanceMetres(
  a: MarsCoordinate,
  b: MarsCoordinate,
): number {
  assertMarsCoordinate(a);
  assertMarsCoordinate(b);
  const radians = Math.PI / 180;
  const p1 = a.latitude * radians,
    p2 = b.latitude * radians;
  const dp = (b.latitude - a.latitude) * radians;
  const dl = eastLongitude180(b.longitude - a.longitude) * radians;
  const h =
    Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
  return (
    2 * MARS_RADIUS_METRES * Math.asin(Math.sqrt(Math.max(0, Math.min(1, h))))
  );
}

export function greatCircleLine(
  a: MarsCoordinate,
  b: MarsCoordinate,
  segments = 48,
): [number, number][] {
  assertMarsCoordinate(a);
  assertMarsCoordinate(b);
  if (!Number.isInteger(segments) || segments < 1)
    throw new RangeError("Segmentos inválidos");
  const rad = Math.PI / 180;
  const vector = (p: MarsCoordinate) => [
    Math.cos(p.latitude * rad) * Math.cos(p.longitude * rad),
    Math.cos(p.latitude * rad) * Math.sin(p.longitude * rad),
    Math.sin(p.latitude * rad),
  ];
  const v1 = vector(a),
    v2 = vector(b);
  const angle = surfaceDistanceMetres(a, b) / MARS_RADIUS_METRES;
  if (angle < 1e-12) return [marsLatLng(a), marsLatLng(b)];
  if (Math.abs(Math.PI - angle) < 1e-8)
    throw new RangeError("Arco antipodal indefinido");
  return Array.from({ length: segments + 1 }, (_, i) => {
    if (i === 0) return marsLatLng(a);
    if (i === segments) return marsLatLng(b);
    const t = i / segments;
    const w1 = Math.sin((1 - t) * angle) / Math.sin(angle),
      w2 = Math.sin(t * angle) / Math.sin(angle);
    const [x, y, z] = v1.map((v, j) => v * w1 + v2[j] * w2);
    return [
      Math.atan2(z, Math.hypot(x, y)) / rad,
      eastLongitude180(Math.atan2(y, x) / rad),
    ];
  });
}

export function coordinateLabel(point: MarsCoordinate): string {
  assertMarsCoordinate(point);
  return `${Math.abs(point.latitude).toFixed(2)}° ${point.latitude >= 0 ? "N" : "S"} · ${point.longitude.toFixed(2)}° E`;
}
