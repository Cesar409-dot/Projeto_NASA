"use client";
import { useEffect, useMemo, useState } from "react";
import { CRS, type LatLngBoundsExpression } from "leaflet";
import {
  MapContainer,
  TileLayer,
  ImageOverlay,
  CircleMarker,
  Tooltip,
  Polyline,
  useMap,
} from "react-leaflet";
import { sciencePoints, type SciencePoint } from "@/data/science-points";
import { tileTemplate, type NasaLayer } from "@/data/map-layers";
import { greatCircleLine, marsLatLng } from "@/lib/mars/coordinates";
import { marsAngularCRS } from "@/lib/mars/crs";
import s from "../map.module.css";
const imageBounds: LatLngBoundsExpression = [
  [0, 0],
  [1000, 1600],
];

function ViewControl({
  selected,
  layer,
}: {
  selected: SciencePoint;
  layer?: NasaLayer;
}) {
  const map = useMap();
  useEffect(() => {
    if (!layer) {
      map.panTo(selected.imagePosition, { animate: false });
      return;
    }
    const [lat, lon] = marsLatLng(selected.coordinate);
    const inside =
      lat >= layer.bounds[0][0] &&
      lat <= layer.bounds[1][0] &&
      lon >= layer.bounds[0][1] &&
      lon <= layer.bounds[1][1];
    if (inside)
      map.panTo([lat, lon], {
        animate: !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      });
    else map.fitBounds(layer.bounds);
  }, [map, selected, layer]);
  useEffect(() => {
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(map.getContainer());
    return () => observer.disconnect();
  }, [map]);
  return (
    <button
      className={s.centerMap}
      onClick={(event) => {
        event.stopPropagation();
        if (layer) map.fitBounds(layer.bounds);
        else map.fitBounds(imageBounds);
      }}
    >
      Recentralizar mapa
    </button>
  );
}

export default function LeafletCanvas({
  layer,
  selected,
  onSelect,
  showPoints,
  showRoute,
  origin,
  destination,
  onLayerError,
}: {
  layer?: NasaLayer;
  selected: SciencePoint;
  onSelect: (id: string) => void;
  showPoints: boolean;
  showRoute: boolean;
  origin?: SciencePoint;
  destination?: SciencePoint;
  onLayerError: (id: string) => void;
}) {
  const [loading, setLoading] = useState(Boolean(layer));
  const [imageError, setImageError] = useState(false);
  const line = useMemo(
    () =>
      origin && destination
        ? layer
          ? greatCircleLine(origin.coordinate, destination.coordinate)
          : [origin.imagePosition, destination.imagePosition]
        : [],
    [origin, destination, layer],
  );
  const tileEvents = useMemo(
    () => ({
      loading: () => setLoading(true),
      load: () => setLoading(false),
      tileerror: () => {
        if (layer) onLayerError(layer.id);
      },
    }),
    [layer, onLayerError],
  );
  useEffect(() => {
    if (!loading || !layer) return;
    const timer = setTimeout(() => onLayerError(layer.id), 15000);
    return () => clearTimeout(timer);
  }, [loading, layer, onLayerError]);
  const outside =
    layer &&
    !sciencePoints.some(
      (p) =>
        p.id === selected.id &&
        p.coordinate.latitude >= layer.bounds[0][0] &&
        p.coordinate.latitude <= layer.bounds[1][0] &&
        p.coordinate.longitude >= layer.bounds[0][1] &&
        p.coordinate.longitude <= layer.bounds[1][1],
    );
  return (
    <div className={s.canvasWrap}>
      {loading && (
        <span className={s.tileStatus} role="status">
          Carregando imagem orbital…
        </span>
      )}
      {outside && (
        <span className={s.coverageNotice} role="status">
          Local fora da cobertura HiRISE. Selecione CTX para contexto.
        </span>
      )}
      {imageError && (
        <span className={s.coverageNotice} role="alert">
          A imagem local não carregou. Os locais e o painel de missão continuam
          disponíveis.
        </span>
      )}
      <MapContainer
        className={s.map}
        crs={layer ? marsAngularCRS : CRS.Simple}
        bounds={layer?.bounds ?? imageBounds}
        minZoom={layer ? 9 : -2}
        maxZoom={layer?.maxNativeZoom ?? 2}
        scrollWheelZoom={false}
        attributionControl={true}
      >
        <ViewControl selected={selected} layer={layer} />
        {layer ? (
          <TileLayer
            url={tileTemplate(layer)}
            tileSize={256}
            noWrap={true}
            tms={false}
            maxNativeZoom={layer.maxNativeZoom}
            maxZoom={layer.maxNativeZoom}
            bounds={layer.bounds}
            detectRetina={false}
            keepBuffer={1}
            updateWhenIdle={true}
            attribution={`${layer.credit} · <a href="${layer.source}" target="_blank" rel="noreferrer">Fonte</a>`}
            eventHandlers={tileEvents}
          />
        ) : (
          <ImageOverlay
            url="/images/jezero.jpg"
            bounds={imageBounds}
            attribution="PIA19303 · NASA/JPL-Caltech/University of Arizona · posições esquemáticas"
            eventHandlers={{ error: () => setImageError(true) }}
          />
        )}
        {showRoute && line.length > 1 && (
          <Polyline
            positions={line}
            pathOptions={{ color: "#f6a578", weight: 3, dashArray: "7 9" }}
          />
        )}
        {showPoints &&
          sciencePoints.map((p, i) => (
            <CircleMarker
              key={p.id}
              center={layer ? marsLatLng(p.coordinate) : p.imagePosition}
              radius={selected.id === p.id ? 10 : 7}
              pathOptions={{
                color: selected.id === p.id ? "#ffb38b" : "#efeee7",
                fillColor: "#f47b50",
                fillOpacity: 1,
                weight: 2,
              }}
              eventHandlers={{ click: () => onSelect(p.id) }}
            >
              <Tooltip direction="top" permanent={selected.id === p.id}>
                0{i + 1} / {p.name}
                {!layer ? " · esquema" : " · centro aproximado"}
              </Tooltip>
            </CircleMarker>
          ))}
      </MapContainer>
    </div>
  );
}
