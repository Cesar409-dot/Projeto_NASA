"use client";
import type { Dispatch } from "react";
import { sciencePoints } from "@/data/science-points";
import type { RouteAction, RouteState } from "@/lib/mars/route-state";
import u from "../ui.module.css";
import s from "../map.module.css";

export function RoutePlanner({
  route,
  dispatch,
}: {
  route: RouteState;
  dispatch: Dispatch<RouteAction>;
}) {
  return (
    <section className={s.planner} aria-label="Planejamento de Marswalk">
      <h3>Planejar Marswalk</h3>
      {(["origin", "destination"] as const).map((key) => (
        <label className={s.selectLabel} key={key}>
          {key === "origin" ? "Origem" : "Destino"}
          <select
            className={u.field}
            value={route[key]}
            onChange={(e) => dispatch({ type: key, id: e.target.value })}
          >
            <option value="">Selecione um centro catalogado</option>
            {sciencePoints.map((p) => (
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
          disabled={!route.origin && !route.destination}
          onClick={() => dispatch({ type: "clear" })}
        >
          Limpar rota
        </button>
      </div>
      <p className={s.small}>
        Conexão entre centros aproximados de feições. Não representa uma trilha
        ou uma caminhada segura.
      </p>
    </section>
  );
}
