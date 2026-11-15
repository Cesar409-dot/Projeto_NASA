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
    <section aria-label="Camadas cartográficas">
      <h3>Camadas do atlas</h3>
      <fieldset className={s.layerSet}>
        <legend className={u.label}>BASE CARTOGRÁFICA</legend>
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
                  ? "Disponível · MRO"
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
            Imagem oficial local<small>Sem rede · anotações esquemáticas</small>
          </span>
        </label>
      </fieldset>
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
              Produto e autoria USGS
            </a>{" "}
            ·{" "}
            <a href={capabilitiesUrl(layer)} target="_blank" rel="noreferrer">
              Metadados WMTS
            </a>
          </div>
        ))}
        <p>
          ● Laranja: centro catalogado selecionado. ● Claro: outro centro. Linha
          laranja: arco geométrico; na imagem local, conexão apenas esquemática.
        </p>
      </details>
    </section>
  );
}
