"use client";
import { nasaLayers, capabilitiesUrl } from "@/data/map-layers";
import type { LayerHealth } from "@/lib/mars/wmts";
import u from "../ui.module.css";
import s from "../map.module.css";

export function LayerPanel({
  activeId,
  onChange,
  health,
  retry,
}: {
  activeId: string;
  onChange: (id: string) => void;
  health: Record<string, LayerHealth>;
  retry: () => void;
}) {
  return (
    <section aria-label="Camadas cartográficas" data-guide="basemap">
      <h3>Bases cartográficas</h3>
      <p className={s.small}>A base cartográfica é a imagem de fundo. Trocar a visualização não altera os pontos nem a rota planejada.</p>
      <fieldset className={s.layerSet}>
        <legend className={u.label}>ESCOLHA A VISUALIZAÇÃO</legend>
        {nasaLayers.map((layer) => (
          <label className={s.layerOption} key={layer.id}>
            <input
              type="radio"
              name="basemap"
              checked={activeId === layer.id}
              disabled={health[layer.id]?.state !== "ready"}
              onChange={() => onChange(layer.id)}
            />
            <span>
              {layer.name}
              <small>
                {health[layer.id]?.state === "ready"
                  ? "Disponível"
                  : health[layer.id]?.state === "error"
                    ? "Indisponível nesta sessão"
                    : "Verificando serviço…"}
              </small>
            </span>
          </label>
        ))}
        <label className={s.layerOption}>
          <input
            type="radio"
            name="basemap"
            checked={activeId === "image"}
            onChange={() => onChange("image")}
          />
          <span>
            Imagem oficial
            <small>Recorte de Jezero · sem georreferenciamento</small>
          </span>
        </label>
      </fieldset>
      {activeId === "image" && (
        <p className={s.small}>
          Esta imagem cobre apenas uma região de Jezero, não todo Marte. Os
          pontos e conexões são esquemáticos. Para coordenadas e marcadores
          geográficos, use MOLA.
        </p>
      )}
      <div className={s.health} role="status">
        {nasaLayers
          .filter((l) => health[l.id]?.state === "error")
          .map((l) => (
            <p key={l.id}>
              {l.name}: {health[l.id].message}
            </p>
          ))}
      </div>
      <button className={u.choice} onClick={retry}>
        Verificar serviços novamente
      </button>
      <details className={s.layerDetails}>
        <summary>Legenda, missões e fontes</summary>
        {nasaLayers.map((layer) => (
          <div key={layer.id}>
            <strong>{layer.name}</strong>
            <p>{layer.mission}</p>
            <p>{layer.legend}</p>
            <a href={layer.source} target="_blank" rel="noreferrer">
              Produto e autoria
            </a>{" "}
            ·{" "}
            <a href={capabilitiesUrl(layer)} target="_blank" rel="noreferrer">
              Metadados WMTS
            </a>
          </div>
        ))}
        <p>
          Laranja: locais catalogados. Azul: marcadores próprios. Linha laranja
          tracejada: rota direta. Linha verde contínua: rota pelo terreno. Na
          imagem local, somente a conexão direta esquemática é exibida.
        </p>
      </details>
    </section>
  );
}
