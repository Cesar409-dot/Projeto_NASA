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
  Pane,
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
import { frameCoverage, type ViewMemory } from "@/lib/mars/map-view";
import s from "../map.module.css";
import type { TerrainPlan } from "@/lib/mars/terrain-routing";
import type { RouteMode } from "./useTerrainRoute";
import { MapPointMarker, PointTooltipControl } from "./MapPointMarker";
const imageBounds = officialImage.bounds;

function ViewControl({
  selected,
  layer,
  viewMemory,
  viewKey,
}: {
  viewMemory?: ViewMemory;
  viewKey: string;
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
  const request = useRef(viewKey);
  useEffect(() => {
    request.current = viewKey;
  }, [viewKey]);
  useEffect(() => {
    const bounds = layer?.bounds ?? imageBounds;
    const nativeMinZoom = layer ? 0 : -8;
    const maxZoom = layer?.maxNativeZoom ?? officialImage.maxZoom;
    const base = layer ? "mola" : "image";
    const saved = viewMemory?.current[base];
    frameCoverage(map, bounds, nativeMinZoom, maxZoom, true);
    if (saved?.request === request.current) {
      map.setView(
        saved.center,
        Math.max(map.getMinZoom(), Math.min(maxZoom, saved.zoom)),
        { animate: false },
      );
      map.panInsideBounds(bounds, { animate: false });
    }
    const remember = () => {
      if (!viewMemory) return;
      const center = map.getCenter();
      viewMemory.current[base] = {
        center: [center.lat, center.lng],
        zoom: map.getZoom(),
        request: request.current,
      };
    };
    map.on("moveend", remember);
    const observer = new ResizeObserver(() => {
      map.invalidateSize({ pan: false });
      frameCoverage(map, bounds, nativeMinZoom, maxZoom);
    });
    observer.observe(map.getContainer());
    return () => {
      observer.disconnect();
      map.off("moveend", remember);
    };
  }, [map, layer, viewMemory]);
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
  viewMemory,
  viewKey,
}: {
  viewMemory?: ViewMemory;
  viewKey: string;
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
  const lastRoute = useRef<unknown[] | undefined>(undefined);
  const lastFocus = useRef<unknown[] | undefined>(undefined);
  const restored = useRef(false);
  useEffect(() => {
    restored.current =
      viewMemory?.current[layer ? "mola" : "image"]?.request === viewKey;
  }, [map, layer, viewMemory, viewKey]);
  useEffect(() => {
    map.getContainer().style.cursor = adding ? "crosshair" : "";
    return () => {
      map.getContainer().style.cursor = "";
    };
  }, [map, adding]);
  useEffect(() => {
    const inputs = [
      map,
      layer,
      origin,
      destination,
      routeFocus,
      terrainPlan,
      routeMode,
    ];
    const previous = lastRoute.current;
    lastRoute.current = inputs;
    if (
      previous?.every((value, i) => value === inputs[i]) ||
      (!previous && restored.current)
    )
      return;
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
    const inputs = [map, layer, focusCoordinate];
    const previous = lastFocus.current;
    lastFocus.current = inputs;
    if (
      previous?.every((value, i) => value === inputs[i]) ||
      (!previous && restored.current)
    )
      return;
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
  viewMemory,
}: {
  viewMemory?: ViewMemory;
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
  const viewKey = JSON.stringify([
    origin?.coordinate,
    destination?.coordinate,
    routeMode,
    terrainPlan?.options,
    routeFocus,
    focusCoordinate,
    selected.id,
  ]);
  const endpoints =
    showRoute &&
    origin &&
    destination &&
    (routeMode === "direct" || (layer && terrainPlan))
      ? [origin, destination]
      : [];
  const position = (p: MapPoint) =>
    layer ? marsLatLng(p.coordinate) : p.imagePosition;
  const pointKey = (p: MapPoint) => p.id + ":" + position(p)?.join(",");
  const roles = new Map(
    endpoints.map((p, i) => [pointKey(p), i ? "Destino" : "Origem"]),
  );
  const markers = new Map<
    string,
    { point: MapPoint; science?: SciencePoint; personal?: PersonalMarker }
  >();
  if (showPoints)
    sciencePoints.forEach((p) =>
      markers.set(pointKey(p), { point: p, science: p }),
    );
  if (layer)
    personalMarkers.forEach((p) =>
      markers.set(pointKey(p), { point: p, personal: p }),
    );
  endpoints.forEach((p) => {
    if (position(p) && !markers.has(pointKey(p)))
      markers.set(pointKey(p), {
        point: p,
        science: sciencePoints.find((q) => pointKey(q) === pointKey(p)),
      });
  });
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
        <ViewControl
          selected={selected}
          layer={layer}
          viewMemory={viewMemory}
          viewKey={viewKey}
        />
        <PointTooltipControl />
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
          viewMemory={viewMemory}
          viewKey={viewKey}
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
        <Pane name="mars-routes" style={{ zIndex: 420, pointerEvents: "none" }}>
          {showRoute && line.length > 0 && (
            <>
              <Polyline
                positions={line}
                interactive={false}
                smoothFactor={routeMode === "terrain" ? 0 : 1}
                pathOptions={{
                  color: "#101719",
                  weight: routeMode === "terrain" ? 11 : 10,
                  opacity: 1,
                  lineCap: "round",
                  lineJoin: "round",
                }}
              />
              <Polyline
                positions={line}
                interactive={false}
                smoothFactor={routeMode === "terrain" ? 0 : 1}
                pathOptions={{
                  color: routeMode === "terrain" ? "#a5ffe0" : "#ffae66",
                  weight: routeMode === "terrain" ? 7 : 6,
                  opacity: 1,
                  dashArray: routeMode === "terrain" ? undefined : "12 9",
                  lineCap: "round",
                  lineJoin: "round",
                }}
              />
            </>
          )}
        </Pane>
        <Pane name="mars-points" style={{ zIndex: 450 }}>
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
              <Tooltip className={s.pointTooltip}>
                Prévia · posição ainda não salva
              </Tooltip>
            </CircleMarker>
          )}
          {[...markers].map(([key, { point: p, science, personal }]) => {
            const center = position(p);
            return center ? (
              <MapPointMarker
                key={key}
                position={center}
                name={p.name}
                role={roles.get(key)}
                info={
                  personal
                    ? personal.category +
                      (personal.visited ? " · Visitado" : "")
                    : science
                      ? science.kind +
                        (layer ? " · centro aproximado" : " · esquema")
                      : "Extremo da missão salva"
                }
                selected={science?.id === selected.id}
                personal={!!personal}
                visited={personal?.visited}
                adding={adding}
                onActivate={
                  personal
                    ? () => onMarkerSelect(personal)
                    : science
                      ? () => onSelect(science.id)
                      : undefined
                }
              />
            ) : null;
          })}
        </Pane>
      </MapContainer>
    </div>
  );
}
