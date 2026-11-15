"use client";
import { distanceLabel, type MapPoint } from "@/lib/mars/exploration";
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
}: {
  points?: MapPoint[];
  hasSavedRoute?: boolean;
  route: RouteState;
  dispatch: Dispatch<RouteAction>;
}) {
  return (
    <section className={s.planner} aria-label="Planejamento de Marswalk">
      <h3>Planejar Marswalk</h3>
      <p className={s.small}>
        Escolha dois pontos. A rota aparece automaticamente no mapa.
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
            <select
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
