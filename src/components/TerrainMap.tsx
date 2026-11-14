"use client";
import { CRS, type LatLngBoundsExpression } from "leaflet";
import {
  MapContainer,
  ImageOverlay,
  CircleMarker,
  Tooltip,
  Polyline,
  useMap,
} from "react-leaflet";
import { useEffect } from "react";
import { points } from "@/data/mission";
import s from "./map.module.css";
const bounds: LatLngBoundsExpression = [
  [0, 0],
  [1000, 1600],
];
function Recenter({ selected }: { selected: string }) {
  const map = useMap();
  useEffect(() => {
    const point = points.find((p) => p.id === selected);
    if (point)
      map.panTo(point.position, {
        animate: !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      });
  }, [selected, map]);
  return null;
}
export default function TerrainMap({
  selected,
  onSelect,
  showPoints,
  showRoute,
  showImage,
  route,
}: {
  selected: string;
  onSelect: (id: string) => void;
  showPoints: boolean;
  showRoute: boolean;
  showImage: boolean;
  route: string[];
}) {
  return (
    <MapContainer
      className={s.map}
      crs={CRS.Simple}
      bounds={bounds}
      minZoom={-2}
      maxZoom={2}
      maxBounds={[
        [-500, -650],
        [1500, 1950],
      ]}
      scrollWheelZoom={false}
      attributionControl={false}
    >
      <Recenter selected={selected} />
      {showImage && (
        <ImageOverlay url="/images/jezero.jpg" bounds={bounds} opacity={0.8} />
      )}{" "}
      {showRoute && route.length > 1 && (
        <Polyline
          positions={route.map(
            (id) => points.find((p) => p.id === id)!.position,
          )}
          pathOptions={{ color: "#f6a578", weight: 2, dashArray: "7 9" }}
        />
      )}
      {showPoints &&
        points.map((p, i) => (
          <CircleMarker
            key={p.id}
            center={p.position}
            radius={selected === p.id ? 11 : 7}
            pathOptions={{
              color: selected === p.id ? "#ffb38b" : "#efeee7",
              fillColor: "#f47b50",
              fillOpacity: 1,
              weight: 2,
            }}
            eventHandlers={{ click: () => onSelect(p.id) }}
          >
            <Tooltip permanent direction="right" offset={[14, 0]}>
              0{i + 1} / {p.name}
            </Tooltip>
          </CircleMarker>
        ))}
    </MapContainer>
  );
}
