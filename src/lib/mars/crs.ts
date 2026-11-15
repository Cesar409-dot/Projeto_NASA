import {
  CRS,
  LatLng,
  Point,
  Bounds,
  Transformation,
  type CRS as LeafletCRS,
} from "leaflet";
import { surfaceDistanceMetres, type MarsCoordinate } from "./coordinates";

/** Explicit angular Mars display grid. Does NOT register an EPSG/WGS84 alias. */
const coordinate = (p: LatLng): MarsCoordinate => ({
  body: "Mars",
  latitudeType: "planetocentric",
  longitudeDirection: "east",
  latitude: p.lat,
  longitude: p.lng,
});
type MarsCRS = LeafletCRS & {
  projection: {
    project: (p: LatLng) => Point;
    unproject: (p: Point) => LatLng;
    bounds: Bounds;
  };
  transformation: Transformation;
};
export const marsAngularCRS: MarsCRS = {
  ...CRS.Simple,
  code: "MARS:JEZERO_ANGULAR_GRID",
  projection: {
    project: (p: LatLng) => new Point(p.lng, p.lat),
    unproject: (p: Point) => new LatLng(p.y, p.x),
    bounds: new Bounds([-180, -90], [180, 90]),
  },
  transformation: new Transformation(1 / 180, 1, -1 / 180, 0.5),
  scale: (zoom) => 256 * 2 ** zoom,
  zoom: (scale) => Math.log2(scale / 256),
  wrapLng: [-180, 180],
  infinite: false,
  distance: (a: LatLng, b: LatLng) =>
    surfaceDistanceMetres(coordinate(a), coordinate(b)),
};
