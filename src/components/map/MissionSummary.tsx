import { LocalizedTree } from "@/components/LocalizedTree";
import type { MapPoint } from "@/lib/mars/exploration";
import { surfaceDistanceMetres } from "@/lib/mars/coordinates";
import u from "../ui.module.css";
import s from "../map.module.css";
import type { TerrainPlan } from "@/lib/mars/terrain-routing";
import { TerrainRouteInfo } from "./TerrainRouteInfo";

export function MissionSummary({
  selected,
  origin,
  destination,
  isLocal,
  terrainPlan,
}: {
  terrainPlan?: TerrainPlan;
  selected: MapPoint;
  origin?: MapPoint;
  destination?: MapPoint;
  isLocal: boolean;
}) {
  const distance =
    origin && destination
      ? surfaceDistanceMetres(origin.coordinate, destination.coordinate)
      : null;
  return <LocalizedTree>{(
    <section
      data-guide="summary"
      className={s.mission}
      aria-label="Resumo da missão"
      aria-live="polite"
    >
      <div className={u.row}>
        <h2>RESUMO DA EXPLORAÇÃO</h2>
        <span className={u.badge}>JEZERO / MARTE</span>
      </div>
      <dl className={s.metrics}>
        <div>
          <dt>Região de Marte</dt>
          <dd>{selected.name}</dd>
        </div>
        <div>
          <dt>Origem · {origin ? "concluída" : "pendente"}</dt>
          <dd className={origin ? s.progressComplete : s.progressPending}>{origin?.name ?? "Selecione o ponto inicial da exploração."}</dd>
        </div>
        <div>
          <dt>Destino · {destination ? "concluído" : "pendente"}</dt>
          <dd className={destination ? s.progressComplete : s.progressPending}>{destination?.name ?? (origin ? "Selecione o ponto final da exploração." : "Defina a origem primeiro.")}</dd>
        </div>
        <div>
          <dt>Distância geométrica · {distance !== null ? "calculada" : "pendente"}</dt>
          <dd>
            {distance !== null
              ? `≈ ${Math.round(distance / 1000)} km`
              : "A distância aparece após escolher os dois pontos."}
          </dd>
        </div>
      </dl>
      {terrainPlan && distance !== null && (
        <TerrainRouteInfo plan={terrainPlan} directDistance={distance} />
      )}
      <h3>Objetivos científicos</h3>
      {origin || destination ? (
        <ul>
          {[origin, destination]
            .filter((p): p is MapPoint => !!p)
            .map((p) => (
              <li key={p.id}>
                <strong>{p.name}:</strong>{" "}
                {p.objective ?? "Ponto personalizado de exploração."}
              </li>
            ))}
        </ul>
      ) : (
        <p>Escolha os pontos da exploração para compor os objetivos.</p>
      )}
      <p className={s.small}>
        Distância pelo arco de grande círculo em esfera marciana de raio
        3.396.190 m, arredondada ao quilômetro. Pontos oficiais usam centros do
        catálogo USGS/IAU, rede MDIM 2.1, publicados a 0,01°. Marcadores
        próprios usam posições da grade da base selecionada. Não inclui relevo,
        obstáculos, segurança, duração ou distância efetivamente caminhável. O
        registro espacial com a base orbital MOLA não está validado para
        precisão operacional.
      </p>
      {isLocal && (
        <p className={u.notice}>
          Modo local: os pontos oficiais e a linha na imagem são esquemáticos. A
          estimativa numérica usa as coordenadas marcianas registradas, não
          pixels da imagem. Marcadores próprios não são desenhados nesta base.
        </p>
      )}
    </section>
  )}</LocalizedTree>;
}
