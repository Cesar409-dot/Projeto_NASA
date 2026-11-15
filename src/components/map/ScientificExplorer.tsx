"use client";
import dynamic from "next/dynamic";
import { useReducer, useState, useMemo } from "react";
import { Crosshair } from "lucide-react";
import { sciencePoints } from "@/data/science-points";
import { nasaLayers } from "@/data/map-layers";
import { emptyRoute, routeReducer } from "@/lib/mars/route-state";
import { LayerPanel } from "./LayerPanel";
import { RoutePlanner } from "./RoutePlanner";
import { PointDetails } from "./PointDetails";
import { MissionSummary } from "./MissionSummary";
import { useLayerHealth } from "./useLayerHealth";
import u from "../ui.module.css";
import s from "../map.module.css";
const TerrainMap = dynamic(() => import("./LeafletCanvas"), {
  ssr: false,
  loading: () => (
    <div className={s.loading} role="status">
      Preparando o atlas…
    </div>
  ),
});

export function ScientificExplorer() {
  const [selectedId, setSelectedId] = useState("belva");
  const [layerId, setLayerId] = useState("ctx");
  const [showPoints, setShowPoints] = useState(true),
    [showRoute, setShowRoute] = useState(true);
  const [route, dispatch] = useReducer(routeReducer, emptyRoute);
  const { health, fail, retry } = useLayerHealth();
  const selected = sciencePoints.find((p) => p.id === selectedId)!;
  const origin = sciencePoints.find((p) => p.id === route.origin),
    destination = sciencePoints.find((p) => p.id === route.destination);
  const activeLayer = useMemo(
    () =>
      nasaLayers.find(
        (l) => l.id === layerId && health[l.id]?.state === "ready",
      ),
    [layerId, health],
  );
  const local = !activeLayer;
  const failed = layerId !== "image" && health[layerId]?.state === "error";
  return (
    <main id="main" className={u.page}>
      <div className={u.eyebrow}>
        <span className={u.dot} />
        01 / EXPLORAÇÃO GEOGRÁFICA
      </div>
      <div className={u.intro}>
        <h1>
          MARS MAPS<span style={{ color: "var(--accent)" }}>.</span>
        </h1>
        <p>
          Explore imagens orbitais de Jezero e conecte centros de feições
          científicas. Planeje perguntas antes de planejar passos.
        </p>
      </div>
      <div className={s.workspace}>
        <aside className={s.sidebar}>
          <span className={u.label}>CONTROLE DE MISSÃO</span>
          <LayerPanel
            activeId={
              local && health[layerId]?.state !== undefined ? "image" : layerId
            }
            onChange={setLayerId}
            health={health}
            retry={retry}
          />
          <div className={u.divider} />
          <div className={u.row}>
            <span className={u.label}>LOCAIS CIENTÍFICOS</span>
            <Crosshair size={16} />
          </div>
          {sciencePoints.map((p, i) => (
            <button
              key={p.id}
              className={s.place}
              aria-pressed={selectedId === p.id}
              onClick={() => setSelectedId(p.id)}
            >
              <span>0{i + 1}</span>
              {p.name}
            </button>
          ))}
          <label className={s.layer}>
            Mostrar pontos
            <input
              type="checkbox"
              checked={showPoints}
              onChange={(e) => setShowPoints(e.target.checked)}
            />
          </label>
          <label className={s.layer}>
            Mostrar conexão
            <input
              type="checkbox"
              checked={showRoute}
              onChange={(e) => setShowRoute(e.target.checked)}
            />
          </label>
          <div className={u.divider} />
          <RoutePlanner route={route} dispatch={dispatch} />
        </aside>
        <div className={s.mapColumn}>
          <div className={s.mapTop}>
            <span>JEZERO / MARTE</span>
            <span className={u.badge}>
              {activeLayer ? activeLayer.name : "IMAGEM LOCAL · ESQUEMA"}
            </span>
          </div>
          {failed && (
            <p className={s.mapAlert} role="status">
              Serviço indisponível. A imagem oficial local mantém a exploração
              acessível.
            </p>
          )}
          {!activeLayer && layerId !== "image" && !failed && (
            <p className={s.mapAlert} role="status">
              Verificando os serviços NASA. A imagem local é exibida enquanto
              isso.
            </p>
          )}
          <TerrainMap
            key={activeLayer?.id ?? "image"}
            layer={activeLayer}
            selected={selected}
            onSelect={setSelectedId}
            showPoints={showPoints}
            showRoute={showRoute}
            origin={origin}
            destination={destination}
            onLayerError={fail}
          />
          <div className={s.coordinates}>
            {activeLayer
              ? "GRADE ANGULAR MARCIANA · PLANETOCÊNTRICA / LESTE · USO EDUCATIVO"
              : "IMAGEM OFICIAL SEM GEORREFERENCIAMENTO · MARCADORES EM POSIÇÕES EDITORIAIS"}
          </div>
          <PointDetails point={selected} dispatch={dispatch} />
        </div>
      </div>
      <MissionSummary
        selected={selected}
        origin={origin}
        destination={destination}
        isLocal={local}
      />
      <p className={u.notice}>
        Os serviços anunciam um identificador de CRS ambíguo; usamos uma grade
        angular marciana explícita baseada nas matrizes publicadas. O
        alinhamento absoluto com a rede de controle dos centros catalogados não
        foi validado. Esta ferramenta é educativa, sem navegação ou avaliação de
        segurança.
      </p>
      <div className={u.source}>
        {activeLayer ? (
          <>
            <strong>{activeLayer.credit}</strong> ·{" "}
            <a href={activeLayer.source} target="_blank" rel="noreferrer">
              Citação e produto
            </a>
          </>
        ) : (
          <>
            Imagem PIA19303 · NASA/JPL-Caltech/University of Arizona ·{" "}
            <a
              href="https://science.nasa.gov/photojournal/a-possible-landing-site-for-the-2020-mission-jezero-crater/"
              target="_blank"
              rel="noreferrer"
            >
              Imagem e créditos
            </a>
          </>
        )}
        <br />
        <a
          href="https://trek.nasa.gov/tiles/apidoc/trekAPI.html?body=mars"
          target="_blank"
          rel="noreferrer"
        >
          NASA Mars Trek · fontes WMTS
        </a>{" "}
        ·{" "}
        <a
          href="https://planetarynames.wr.usgs.gov/Page/MARS/system"
          target="_blank"
          rel="noreferrer"
        >
          Convenções de coordenadas USGS/IAU
        </a>
      </div>
    </main>
  );
}
