"use client";
import { useEffect, useMemo, useState, useRef } from "react";
import { CRS, DomEvent } from "leaflet";
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
import { officialImage, tileTemplate, type NasaLayer } from "@/data/map-layers";
import { marsLatLng } from "@/lib/mars/coordinates";
import { marsAngularCRS } from "@/lib/mars/crs";
import { frameCoverage } from "@/lib/mars/map-view";
import s from "../map.module.css";
import type { TerrainPlan } from "@/lib/mars/terrain-routing";
import type { RouteMode } from "./useTerrainRoute";
const imageBounds = officialImage.bounds;

function ViewControl({
  selected,
  layer,
}: {
  selected: SciencePoint;
  layer?: NasaLayer;
}) {
  const map = useMap();
  const control = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const button = control.current!;
    DomEvent.disableClickPropagation(button);
    DomEvent.disableScrollPropagation(button);
    return () => {
      DomEvent.off(button);
    };
  }, []);
  const previousSelected = useRef(selected.id);
  useEffect(() => {
    const bounds = layer?.bounds ?? imageBounds;
    const nativeMinZoom = layer ? 0 : -8;
    const maxZoom = layer?.maxNativeZoom ?? officialImage.maxZoom;
    frameCoverage(map, bounds, nativeMinZoom, maxZoom, true);
    const observer = new ResizeObserver(() => {
      map.invalidateSize({ pan: false });
      frameCoverage(map, bounds, nativeMinZoom, maxZoom);
    });
    observer.observe(map.getContainer());
    return () => observer.disconnect();
  }, [map, layer]);
  useEffect(() => {
    const changedPoint = previousSelected.current !== selected.id;
    previousSelected.current = selected.id;
    if (!changedPoint) return;
    if (!layer) {
      map.panTo(selected.imagePosition, { animate: false });
      return;
    }
    const [lat, lon] = marsLatLng(selected.coordinate);
    map.setView([lat, lon], map.getZoom(), { animate: false });
  }, [map, selected, layer]);
  return (
    <button
      ref={control}
      type="button"
      className={s.centerMap}
      onClick={(event) => {
        event.stopPropagation();
        frameCoverage(
          map,
          layer?.bounds ?? imageBounds,
          layer ? 0 : -8,
          layer?.maxNativeZoom ?? officialImage.maxZoom,
          true,
        );
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
  focusCoordinate,
  terrainPlan,
  routeMode,
}: {
  terrainPlan?: TerrainPlan;
  routeMode: RouteMode;
  focusCoordinate?: MarsCoordinate;
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
    if (routeMode === "terrain" && !terrainPlan) return;
    if (
      !origin ||
      !destination ||
      routeDistance({ origin, destination }) === null
    )
      return;
    if (layer)
      map.fitBounds(
        routeMode === "terrain" && terrainPlan
          ? terrainPlan.path
          : [marsLatLng(origin.coordinate), marsLatLng(destination.coordinate)],
        { padding: [50, 50], maxZoom: layer.maxNativeZoom },
      );
    else if (origin.imagePosition && destination.imagePosition)
      map.fitBounds([origin.imagePosition, destination.imagePosition], {
        padding: [50, 50],
      });
  }, [map, layer, origin, destination, routeFocus, terrainPlan, routeMode]);
  useEffect(() => {
    if (!layer || !focusCoordinate) return;
    const [lat, lon] = marsLatLng(focusCoordinate);
    if (
      lat < layer.bounds[0][0] ||
      lat > layer.bounds[1][0] ||
      lon < layer.bounds[0][1] ||
      lon > layer.bounds[1][1]
    )
      return;
    map.setView(
      [lat, lon],
      Math.min(layer.maxNativeZoom, Math.max(map.getMinZoom(), map.getZoom())),
      { animate: false },
    );
  }, [map, layer, focusCoordinate]);
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
  focusCoordinate,
  previewCoordinate,
  routeMode = "direct",
  terrainPlan,
}: {
  routeMode?: RouteMode;
  terrainPlan?: TerrainPlan;
  focusCoordinate?: MarsCoordinate;
  previewCoordinate?: MarsCoordinate;
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
      routeMode === "terrain"
        ? layer && terrainPlan
          ? [terrainPlan.path]
          : []
        : origin &&
            destination &&
            routeDistance({ origin, destination }) !== null
          ? layer
            ? routeSegments({ origin, destination })
            : origin.imagePosition && destination.imagePosition
              ? [[origin.imagePosition, destination.imagePosition]]
              : []
          : [],
    [origin, destination, layer, routeMode, terrainPlan],
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
  return (
    <div className={s.canvasWrap}>
      {loading && (
        <span className={s.tileStatus} role="status">
          Carregando base cartográfica…
        </span>
      )}
      {!layer && (
        <p className={s.mapAlert}>
          Imagem oficial: recorte de Jezero, sem cobertura global ou
          georreferenciamento. Pontos e conexões são esquemáticos.
        </p>
      )}
      {!layer && routeMode === "terrain" && (
        <p className={s.mapAlert} role="status">
          O trajeto pelo terreno não pode ser projetado na imagem sem
          georreferenciamento. Selecione MOLA para visualizá-lo.
        </p>
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
        minZoom={layer ? 0 : -8}
        maxBounds={layer?.bounds ?? imageBounds}
        maxBoundsViscosity={1}
        maxZoom={layer ? layer.maxNativeZoom : officialImage.maxZoom}
        zoomSnap={0.25}
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
          focusCoordinate={focusCoordinate}
          routeMode={routeMode}
          terrainPlan={terrainPlan}
        />
        {layer ? (
          <TileLayer
            key={layer.id}
            url={tileTemplate(layer)}
            tileSize={256}
            minZoom={0}
            minNativeZoom={0}
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
        {showRoute && line.length > 0 && (
          <Polyline
            positions={line}
            smoothFactor={routeMode === "terrain" ? 0 : 1}
            pathOptions={{
              color: routeMode === "terrain" ? "#a5ffe0" : "#f6a578",
              weight: routeMode === "terrain" ? 5 : 3,
              dashArray: routeMode === "terrain" ? undefined : "7 9",
            }}
          />
        )}
        {showRoute &&
          origin &&
          destination &&
          (routeMode === "direct" || !!terrainPlan) &&
          [origin, destination].map((p, i) => {
            const center = layer
              ? marsLatLng(p.coordinate)
              : routeMode === "direct"
                ? p.imagePosition
                : undefined;
            return center ? (
              <CircleMarker
                key={"endpoint-" + i}
                center={center}
                radius={10}
                pathOptions={{
                  color: i ? "#8ed9ff" : "#a5ffe0",
                  fillOpacity: 0,
                  weight: 3,
                }}
              >
                <Tooltip permanent direction={i ? "bottom" : "top"}>
                  {i ? "Destino: " : "Origem: "}
                  {p.name}
                </Tooltip>
              </CircleMarker>
            ) : null;
          })}
        {layer && previewCoordinate && (
          <CircleMarker
            center={marsLatLng(previewCoordinate)}
            radius={12}
            pathOptions={{
              color: "#ffb38b",
              fillColor: "#ffb38b",
              fillOpacity: 0.25,
              weight: 3,
              dashArray: "4 4",
            }}
          >
            <Tooltip permanent>Prévia · posição ainda não salva</Tooltip>
          </CircleMarker>
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
