"use client";
import { LocalizedTree } from "@/components/LocalizedTree";
import type { SciencePoint } from "@/data/science-points";
import { coordinateLabel } from "@/lib/mars/coordinates";
import u from "../ui.module.css";
import s from "../map.module.css";

export function PointDetails({ point }: { point: SciencePoint }) {
  return <LocalizedTree>{(
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
    </section>
  )}</LocalizedTree>;
}
