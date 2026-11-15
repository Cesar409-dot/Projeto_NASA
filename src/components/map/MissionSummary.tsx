import type { MapPoint } from "@/lib/mars/exploration";
import { surfaceDistanceMetres } from "@/lib/mars/coordinates";
import u from "../ui.module.css";
import s from "../map.module.css";

export function MissionSummary({
  selected,
  origin,
  destination,
  isLocal,
}: {
  selected: MapPoint;
  origin?: MapPoint;
  destination?: MapPoint;
  isLocal: boolean;
}) {
  const distance =
    origin && destination
      ? surfaceDistanceMetres(origin.coordinate, destination.coordinate)
      : null;
  return (
    <section
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
          <dt>Região selecionada</dt>
          <dd>{selected.name}</dd>
        </div>
        <div>
          <dt>Origem</dt>
          <dd>{origin?.name ?? "A definir"}</dd>
        </div>
        <div>
          <dt>Destino</dt>
          <dd>{destination?.name ?? "A definir"}</dd>
        </div>
        <div>
          <dt>Estimativa geométrica</dt>
          <dd>
            {distance !== null
              ? `≈ ${Math.round(distance / 1000)} km`
              : "Selecione origem e destino"}
          </dd>
        </div>
      </dl>
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
          Modo local: a posição dos marcadores e a linha na imagem são
          esquemáticas. A estimativa numérica usa somente as coordenadas
          catalogadas, não pixels da imagem.
        </p>
      )}
    </section>
  );
}
