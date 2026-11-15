import type { TerrainPlan } from "@/lib/mars/terrain-routing";
import { terrainModel, terrainNotice } from "@/data/terrain-model";
import s from "../map.module.css";
const number = (value: number, digits = 0) =>
  value.toLocaleString("pt-BR", { maximumFractionDigits: digits });
export function TerrainRouteInfo({
  plan,
  directDistance,
}: {
  plan: TerrainPlan;
  directDistance: number;
}) {
  return (
    <div className={s.small}>
      <dl>
        <dt>Distância direta</dt>
        <dd>{number(directDistance / 1000, 2)} km</dd>
        <dt>Distância pelo terreno</dt>
        <dd>{number(plan.distanceMetres / 1000, 2)} km</dd>
        <dt>Diferença entre percursos</dt>
        <dd>
          +
          {number(
            Math.max(0, (plan.distanceMetres / directDistance - 1) * 100),
            1,
          )}
          %
        </dd>
        <dt>Subida / descida acumulada estimada</dt>
        <dd>
          {number(plan.ascentMetres)} m / {number(plan.descentMetres)} m
        </dd>
        <dt>Inclinação máxima estimada</dt>
        <dd>{number(plan.maxSlopeDegrees, 1)}°</dd>
      </dl>
      <p>
        Fonte:{" "}
        <a href={terrainModel.source} target="_blank" rel="noreferrer">
          {terrainModel.title}
        </a>
        . Grade de 100 m; inclinações estimadas no DEM nativo de 20 m.
      </p>
      <p>
        Acesso aos centros da grade: {number(plan.startOffsetMetres)} m na
        origem e {number(plan.endOffsetMetres)} m no destino, incluídos no
        percurso usando a elevação média da célula. Subida e descida derivam das
        médias da grade; não descrevem desníveis menores que ela.
      </p>
      <p>{terrainNotice}</p>
    </div>
  );
}
