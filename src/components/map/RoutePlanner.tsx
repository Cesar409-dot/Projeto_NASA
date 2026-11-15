"use client";
import {
  distanceLabel,
  routeDistance,
  type MissionRoute,
  type MapPoint,
} from "@/lib/mars/exploration";
import {
  defaultTerrainOptions,
  type TerrainOptions,
} from "@/lib/mars/terrain-routing";
import { terrainModel, terrainNotice } from "@/data/terrain-model";
import type { RouteMode, TerrainState } from "./useTerrainRoute";
import { TerrainRouteInfo } from "./TerrainRouteInfo";
import type { Dispatch } from "react";
import { sciencePoints } from "@/data/science-points";
import type { RouteAction, RouteState } from "@/lib/mars/route-state";
import u from "../ui.module.css";
import s from "../map.module.css";

export function RoutePlanner({
  route,
  dispatch,
  points = sciencePoints,
  hasSavedRoute = false,
  mode = "direct",
  onModeChange,
  options = defaultTerrainOptions,
  onOptionsChange,
  terrain = { status: "idle" },
  comparisonRoute,
}: {
  mode?: RouteMode;
  onModeChange?: (mode: RouteMode) => void;
  options?: TerrainOptions;
  onOptionsChange?: (options: TerrainOptions) => void;
  terrain?: TerrainState;
  comparisonRoute?: MissionRoute;
  points?: MapPoint[];
  hasSavedRoute?: boolean;
  route: RouteState;
  dispatch: Dispatch<RouteAction>;
}) {
  return (
    <section className={s.planner} aria-label="Planejamento de Marswalk">
      <h3>Planejar Marswalk</h3>
      <p className={s.small}>
        Planeje um percurso pela superfície marciana. Escolha onde começa e termina; você também pode usar seus próprios marcadores.
      </p>
      <div className={s.routeFields}>
        {(["origin", "destination"] as const).map((key) => (
          <label className={s.selectLabel} key={key}>
            <span>
              <b className={s.stepNumber} aria-hidden="true">
                {key === "origin" ? "1" : "2"}
              </b>
              {key === "origin" ? "Origem" : "Destino"}
            </span>
            <span className={s.fieldHint}>
              {key === "origin"
                ? "Ponto inicial: onde a exploração começa."
                : "Ponto final: onde a exploração termina."}
            </span>
            <select
              data-guide={key === "origin" ? "origin" : "destination"}
              aria-label={key === "origin" ? "Origem" : "Destino"}
              className={u.field}
              value={route[key]}
              onChange={(e) => dispatch({ type: key, id: e.target.value })}
            >
              <option value="">Selecione um ponto</option>
              {points.map((p) => (
                <option
                  key={p.id}
                  value={p.id}
                  disabled={
                    p.id === route[key === "origin" ? "destination" : "origin"]
                  }
                >
                  {p.name}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
      <label className={s.selectLabel}>
        <span><b className={s.stepNumber} aria-hidden="true">3</b> Tipo de rota</span>
        <span className={s.fieldHint}>Escolha como deseja visualizar a conexão entre os pontos selecionados.</span>
        <select
          data-guide="route-type"
          aria-label="Tipo de rota"
          className={u.field}
          value={mode}
          onChange={(e) => onModeChange?.(e.target.value as RouteMode)}
        >
          <option value="direct">Rota direta</option>
          <option value="terrain">Rota pelo terreno</option>
        </select>
      </label>
      <p className={s.small}>
        {mode === "direct"
          ? "Menor distância geométrica aproximada. Não considera relevo nem obstáculos."
          : "A* busca menor custo estimado na grade de Jezero, penalizando inclinações. Uso experimental."}
      </p>
      {mode === "terrain" && (
        <>
          <label className={s.selectLabel}>
            Limite de inclinação estimada
            <select
              className={u.field}
              value={options.maxSlopeDegrees}
              onChange={(e) =>
                onOptionsChange?.({
                  ...options,
                  maxSlopeDegrees: Number(e.target.value),
                })
              }
            >
              {[10, 15, 20, 25, 30].map((value) => (
                <option key={value} value={value}>
                  {value}°
                </option>
              ))}
            </select>
          </label>
          <p className={s.small}>
            Cobertura: 18,30–18,65° N · 77,10–77,80° E. Dados locais CTX/USGS;
            grade de 100 m. Células desconhecidas são bloqueadas.
          </p>
          <p className={s.small}>
            <a href={terrainModel.source} target="_blank" rel="noreferrer">
              Fonte do modelo de elevação
            </a>
          </p>
          <div role="status" className={s.routeStatus}>
            {terrain.status === "loading"
              ? "Calculando no terreno…"
              : terrain.status === "error"
                ? terrain.error
                : terrain.status === "ready"
                  ? "Rota pelo terreno calculada. Linha contínua verde em MOLA."
                  : "Selecione origem e destino para calcular no terreno."}
          </div>
          {terrain.plan &&
            comparisonRoute &&
            routeDistance(comparisonRoute) !== null && (
              <TerrainRouteInfo
                plan={terrain.plan}
                directDistance={routeDistance(comparisonRoute)!}
              />
            )}
          {!terrain.plan && <p className={s.small}>{terrainNotice}</p>}
        </>
      )}
      <p className={s.routeStatus} aria-live="polite">
        {route.origin && route.destination
          ? distanceLabel({
              origin: points.find((p) => p.id === route.origin)!,
              destination: points.find((p) => p.id === route.destination)!,
            })
          : !route.origin
            ? "Comece selecionando a origem."
            : "Agora selecione o destino."}
      </p>
      <div className={s.actions}>
        <button
          className={u.choice}
          disabled={!route.origin || !route.destination}
          onClick={() => dispatch({ type: "swap" })}
        >
          Inverter
        </button>
        <button
          className={u.choice}
          disabled={!route.origin && !route.destination && !hasSavedRoute}
          onClick={() => dispatch({ type: "clear" })}
        >
          Limpar rota
        </button>
      </div>
      <p className={s.small}>
        Estimativa geométrica em Marte, sem relevo ou obstáculos. A linha não
        indica um trajeto seguro.
      </p>
    </section>
  );
}
