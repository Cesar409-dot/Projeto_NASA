"use client";
import type { Dispatch } from "react";
import type { SciencePoint } from "@/data/science-points";
import { coordinateLabel } from "@/lib/mars/coordinates";
import type { RouteAction } from "@/lib/mars/route-state";
import u from "../ui.module.css";
import s from "../map.module.css";

export function PointDetails({
  point,
  dispatch,
}: {
  point: SciencePoint;
  dispatch: Dispatch<RouteAction>;
}) {
  return (
    <section
      className={s.mapBottom}
      aria-label="Informações do local selecionado"
    >
      <div>
        <span className={u.label}>{point.kind}</span>
        <h3>{point.name}</h3>
        <p>{point.description}</p>
        <p>{point.significance}</p>
        <p className={s.coordinateValue}>
          {coordinateLabel(point.coordinate)} · MARTE
        </p>
        <p>{point.coordinateNote}</p>
        <p>{point.mission}</p>
        <div className={u.source}>
          <a href={point.source} target="_blank" rel="noreferrer">
            Contexto científico NASA
          </a>{" "}
          ·{" "}
          <a href={point.coordinateSource} target="_blank" rel="noreferrer">
            Coordenadas USGS/IAU
          </a>
        </div>
      </div>
      <div className={s.actions}>
        <button
          className={u.button}
          onClick={() => dispatch({ type: "origin", id: point.id })}
        >
          Definir origem
        </button>
        <button
          className={`${u.button} ${u.secondary}`}
          onClick={() => dispatch({ type: "destination", id: point.id })}
        >
          Definir destino
        </button>
      </div>
    </section>
  );
}
