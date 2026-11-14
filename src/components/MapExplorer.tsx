"use client";
import dynamic from "next/dynamic";
import { useState } from "react";
import { Layers, Crosshair, Route, Plus, ArrowUpRight, X } from "lucide-react";
import { points } from "@/data/mission";
import u from "./ui.module.css";
import s from "./map.module.css";
const TerrainMap = dynamic(() => import("./TerrainMap"), {
  ssr: false,
  loading: () => <div className={s.loading}>Carregando atlas…</div>,
});
export function MapExplorer() {
  const [selected, setSelected] = useState("delta");
  const [showPoints, setShowPoints] = useState(true);
  const [showRoute, setShowRoute] = useState(true);
  const [showImage, setShowImage] = useState(true);
  const [route, setRoute] = useState<string[]>([]);
  const point = points.find((p) => p.id === selected)!;
  return (
    <main id="main" className={u.page}>
      <div className={u.eyebrow}>
        <span className={u.dot} /> 01 / EXPLORAÇÃO GEOGRÁFICA
      </div>
      <div className={u.intro}>
        <h1>
          MARS MAPS<span style={{ color: "var(--accent)" }}>.</span>
        </h1>
        <p>
          Leia a paisagem. Faça perguntas. Conecte os pontos.
          <br />
          Seu primeiro reconhecimento da Cratera Jezero.
        </p>
      </div>
      <div className={s.workspace}>
        <aside className={s.sidebar}>
          <div className={u.row}>
            <span className={u.label}>CONTROLE DE MISSÃO</span>
            <Layers size={17} />
          </div>
          <h3>Camadas do atlas</h3>
          {[
            [showImage, setShowImage, "Imagem orbital · MRO"],
            [showPoints, setShowPoints, "Pontos de exploração"],
            [showRoute, setShowRoute, "Sequência planejada"],
          ].map(([value, setter, label]) => (
            <label className={s.layer} key={String(label)}>
              {String(label)}
              <input
                type="checkbox"
                checked={Boolean(value)}
                onChange={(e) =>
                  (setter as (v: boolean) => void)(e.target.checked)
                }
              />
            </label>
          ))}
          <div className={u.divider} />
          <div className={u.row}>
            <span className={u.label}>PONTOS DE INTERESSE</span>
            <Crosshair size={16} />
          </div>
          {points.map((p, i) => (
            <button
              key={p.id}
              className={s.place}
              aria-pressed={selected === p.id}
              onClick={() => setSelected(p.id)}
            >
              <span>0{i + 1}</span>
              {p.name}
            </button>
          ))}
          <div className={u.divider} />
          <div className={u.row}>
            <span className={u.label}>PLANEJAR EXPLORAÇÃO</span>
            <Route size={16} />
          </div>
          <div className={s.route}>
            {route.length ? (
              <ol>
                {route.map((id) => (
                  <li key={id}>
                    {points.find((p) => p.id === id)?.name}
                    <button
                      aria-label={`Remover ${points.find((p) => p.id === id)?.name}`}
                      onClick={() => setRoute(route.filter((p) => p !== id))}
                    >
                      <X size={12} />
                    </button>
                  </li>
                ))}
              </ol>
            ) : (
              <p>Selecione um ponto e adicione à sua sequência.</p>
            )}
            <p>
              Distância, elevação e tempo: indisponíveis. Sem cálculo de
              segurança ou rota caminhável.
            </p>
          </div>
        </aside>
        <section
          className={s.mapColumn}
          aria-label="Atlas interativo de Jezero"
        >
          <div className={s.mapTop}>
            <span>JEZERO / MARTE</span>
            <span className={u.badge}>
              IMAGEM REAL · ANOTAÇÕES DEMONSTRATIVAS
            </span>
          </div>
          <TerrainMap
            selected={selected}
            onSelect={setSelected}
            showPoints={showPoints}
            showRoute={showRoute}
            showImage={showImage}
            route={route}
          />
          <div className={s.coordinates}>
            REFERÊNCIA REGIONAL ≈ 18,4° N / 77,5° E · MARTE · NÃO É A POSIÇÃO DO
            CURSOR
          </div>
          <div className={s.mapBottom}>
            <div>
              <span className={u.label}>{point.kind}</span>
              <h3>{point.name}</h3>
              <p>{point.description}</p>
              <p style={{ marginTop: 12, color: "var(--text)" }}>
                {point.question}
              </p>
              <a
                className={u.source}
                style={{ display: "inline-block" }}
                href={point.source}
                target="_blank"
                rel="noreferrer"
              >
                Consultar referência <ArrowUpRight size={12} />
              </a>
            </div>
            <div>
              <button
                className={u.button}
                disabled={route.includes(selected)}
                onClick={() => setRoute([...route, selected])}
              >
                <Plus size={15} />
                {route.includes(selected)
                  ? "Adicionado"
                  : "Adicionar à sequência"}
              </button>
              <p
                className={u.status}
                aria-live="polite"
                style={{ marginTop: 10 }}
              >
                {route.length} ponto(s) na sequência
              </p>
            </div>
          </div>
        </section>
      </div>
      <p className={u.notice}>
        Imagem orbital real; marcadores e linhas são ilustrações editoriais sem
        georreferenciamento. A sequência demonstra uma interação de planejamento
        e não orienta deslocamentos reais.
      </p>
      <p className={u.source}>
        Imagem: PIA19303 · NASA/JPL-Caltech/University of Arizona · MRO.{" "}
        <a
          href="https://science.nasa.gov/photojournal/a-possible-landing-site-for-the-2020-mission-jezero-crater/"
          target="_blank"
          rel="noreferrer"
        >
          Imagem e créditos
        </a>{" "}
        ·{" "}
        <a
          href="https://doi.org/10.1126/sciadv.abo3399"
          target="_blank"
          rel="noreferrer"
        >
          Referência das coordenadas regionais
        </a>{" "}
        ·{" "}
        <a href="https://trek.nasa.gov/mars/" target="_blank" rel="noreferrer">
          Abrir Mars Trek
        </a>{" "}
        ·{" "}
        <a
          href="https://trek.nasa.gov/tiles/apidoc/trekAPI.html?body=mars"
          target="_blank"
          rel="noreferrer"
        >
          Serviços WMTS para integração futura
        </a>
      </p>
    </main>
  );
}
