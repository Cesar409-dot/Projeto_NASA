import {
  Browser,
  LatLngBounds,
  latLngBounds,
  type LatLngBoundsExpression,
  type Map,
} from "leaflet";

/** Fill the viewport by cropping, never changing the projection or image aspect ratio. */
export function coverageMinZoom(
  map: Map,
  bounds: LatLngBoundsExpression,
  nativeMinZoom: number,
  maxZoom: number,
): number {
  const area = bounds instanceof LatLngBounds ? bounds : latLngBounds(bounds);
  const extent = map
    .project(area.getNorthEast(), 0)
    .subtract(map.project(area.getSouthWest(), 0));
  const size = map.getSize();
  if (!size.x || !size.y) return nativeMinZoom;
  const scale = Math.max(
    size.x / Math.abs(extent.x),
    size.y / Math.abs(extent.y),
  );
  // Leaflet forces integer zoom without CSS 3D support, even if zoomSnap is fractional.
  const snap = Browser.any3d ? (map.options.zoomSnap ?? 1) : 1;
  const zoom = Math.log2(scale);
  const snapped = snap ? Math.ceil(zoom / snap) * snap : zoom;
  return Math.min(maxZoom, Math.max(nativeMinZoom, snapped));
}

export function frameCoverage(
  map: Map,
  bounds: LatLngBoundsExpression,
  nativeMinZoom: number,
  maxZoom: number,
  reset = false,
) {
  const minZoom = coverageMinZoom(map, bounds, nativeMinZoom, maxZoom);
  map.setMinZoom(minZoom);
  map.setMaxZoom(maxZoom);
  map.setMaxBounds(bounds);
  map.setView(
    reset
      ? (bounds instanceof LatLngBounds
          ? bounds
          : latLngBounds(bounds)
        ).getCenter()
      : map.getCenter(),
    reset ? minZoom : Math.max(minZoom, Math.min(maxZoom, map.getZoom())),
    { animate: false },
  );
  map.panInsideBounds(bounds, { animate: false });
}
