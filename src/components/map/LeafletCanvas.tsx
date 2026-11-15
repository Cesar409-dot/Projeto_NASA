"use client";
import { useEffect, useMemo, useState, useRef } from "react";
import { CRS, type LatLngBoundsExpression } from "leaflet";
import {
  MapContainer,
  TileLayer,
  ZoomControl,
  ImageOverlay,
  CircleMarker,
  Tooltip,
  Polyline,
  useMap,
  useMapEvents,
} from "react-leaflet";
import type { MapPoint, PersonalMarker } from "@/lib/mars/exploration";
import { routeDistance, routeSegments } from "@/lib/mars/exploration";
import type { MarsCoordinate } from "@/lib/mars/coordinates";
import { sciencePoints, type SciencePoint } from "@/data/science-points";
import { tileTemplate, type NasaLayer } from "@/data/map-layers";
import { marsLatLng } from "@/lib/mars/coordinates";
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
    if (inside && layer.id === "mola") map.setView([lat, lon], 7);
    else if (inside)
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

function MapInteraction({
  layer,
  adding,
  onPosition,
  origin,
  destination,
  routeFocus,
}: {
  layer?: NasaLayer;
  adding: boolean;
  onPosition: (p: MarsCoordinate) => void;
  origin?: MapPoint;
  destination?: MapPoint;
  routeFocus?: string;
}) {
  const map = useMapEvents({
    click(event) {
      if (!adding || !layer) return;
      const { lat, lng } = event.latlng;
      if (
        lat < layer.bounds[0][0] ||
        lat > layer.bounds[1][0] ||
        lng < layer.bounds[0][1] ||
        lng > layer.bounds[1][1]
      )
        return;
      onPosition({
        body: "Mars",
        latitudeType: "planetocentric",
        longitudeDirection: "east",
        latitude: lat,
        longitude: lng,
      });
    },
  });
  useEffect(() => {
    map.getContainer().style.cursor = adding ? "crosshair" : "";
    return () => {
      map.getContainer().style.cursor = "";
    };
  }, [map, adding]);
  useEffect(() => {
    if (!routeFocus || !origin || !destination) return;
    if (layer)
      map.fitBounds(
        [marsLatLng(origin.coordinate), marsLatLng(destination.coordinate)],
        { padding: [50, 50], maxZoom: layer.maxNativeZoom },
      );
    else if (origin.imagePosition && destination.imagePosition)
      map.fitBounds([origin.imagePosition, destination.imagePosition], {
        padding: [50, 50],
      });
  }, [map, layer, origin, destination, routeFocus]);
  return null;
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
  personalMarkers = [],
  onMarkerSelect = () => {},
  adding = false,
  onPosition = () => {},
  routeFocus,
}: {
  layer?: NasaLayer;
  selected: SciencePoint;
  onSelect: (id: string) => void;
  showPoints: boolean;
  showRoute: boolean;
  origin?: MapPoint;
  destination?: MapPoint;
  personalMarkers?: PersonalMarker[];
  onMarkerSelect?: (marker: PersonalMarker) => void;
  adding?: boolean;
  onPosition?: (point: MarsCoordinate) => void;
  routeFocus?: string;
  onLayerError: (id: string) => void;
}) {
  const [loading, setLoading] = useState(Boolean(layer));
  const [imageError, setImageError] = useState(false);
  const [partialError, setPartialError] = useState(false);
  const tileCounts = useRef({ loaded: 0, failed: 0 });
  const line = useMemo(
    () =>
      origin && destination && routeDistance({ origin, destination }) !== null
        ? layer
          ? routeSegments({ origin, destination })
          : origin.imagePosition && destination.imagePosition
            ? [[origin.imagePosition, destination.imagePosition]]
            : []
        : [],
    [origin, destination, layer],
  );
  const tileEvents = useMemo(
    () => ({
      loading: () => {
        tileCounts.current = { loaded: 0, failed: 0 };
        setLoading(true);
        setPartialError(false);
      },
      tileload: () => {
        tileCounts.current.loaded++;
      },
      load: () => {
        setLoading(false);
        if (tileCounts.current.failed && !tileCounts.current.loaded && layer)
          onLayerError(layer.id);
      },
      tileerror: () => {
        tileCounts.current.failed++;
        setPartialError(true);
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
          Carregando base cartográfica…
        </span>
      )}
      {outside && (
        <span className={s.coverageNotice} role="status">
          Local fora desta cobertura. Selecione CTX regional ou MOLA para
          contexto.
        </span>
      )}
      {partialError && (
        <span className={s.coverageNotice} role="status">
          Alguns tiles não carregaram ou não têm dados. Áreas vazias não indicam
          terreno conhecido.
        </span>
      )}
      {!layer &&
        ((origin && !origin.imagePosition) ||
          (destination && !destination.imagePosition)) && (
          <span className={s.coverageNotice} role="status">
            Esta rota possui marcadores geográficos e não pode ser desenhada na
            imagem local. Ative uma camada NASA disponível.
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
        minZoom={layer ? 1 : -2}
        maxBounds={layer?.bounds ?? imageBounds}
        maxBoundsViscosity={0.8}
        maxZoom={layer ? layer.maxNativeZoom + 2 : 2}
        scrollWheelZoom={true}
        attributionControl={true}
        zoomControl={false}
      >
        <ZoomControl zoomInTitle="Ampliar" zoomOutTitle="Reduzir" />
        <ViewControl selected={selected} layer={layer} />
        <MapInteraction
          layer={layer}
          adding={adding}
          onPosition={onPosition}
          origin={origin}
          destination={destination}
          routeFocus={routeFocus}
        />
        {layer ? (
          <TileLayer
            url={tileTemplate(layer)}
            tileSize={256}
            noWrap={true}
            tms={false}
            maxNativeZoom={layer.maxNativeZoom}
            maxZoom={layer.maxNativeZoom + 2}
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
        {showRoute && line.length > 0 && (
          <Polyline
            positions={line}
            pathOptions={{
              color: routeFocus ? "#a5ffe0" : "#f6a578",
              weight: routeFocus ? 5 : 3,
              dashArray: "7 9",
            }}
          />
        )}
        {layer &&
          personalMarkers.map((p) => (
            <CircleMarker
              key={p.id}
              center={marsLatLng(p.coordinate)}
              radius={8}
              pathOptions={{
                color: p.visited ? "#a5ffe0" : "#8ed9ff",
                fillColor: "#2685b4",
                fillOpacity: 1,
                weight: 3,
              }}
              eventHandlers={{
                click: () => {
                  if (!adding) onMarkerSelect(p);
                },
              }}
            >
              <Tooltip>
                {p.name} · {p.category}
                {p.visited ? " · Visitado" : ""}
              </Tooltip>
            </CircleMarker>
          ))}
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
