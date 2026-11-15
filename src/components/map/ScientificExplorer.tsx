"use client";
import dynamic from "next/dynamic";
import { useReducer, useState } from "react";
import { useExplorationRecords } from "./useExplorationRecords";
import { MarkerEditor } from "./MarkerEditor";
import { MissionManager } from "./MissionManager";
import {
  distanceLabel,
  routeDistance,
  type PersonalMarker,
  type MissionRoute,
  type SavedMission,
} from "@/lib/mars/exploration";
import type { MarsCoordinate } from "@/lib/mars/coordinates";
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
  const { records, ready, error, save } = useExplorationRecords();
  const [adding, setAdding] = useState(false);
  const [editingMarker, setEditingMarker] = useState<PersonalMarker>();
  const [savedRoute, setSavedRoute] = useState<SavedMission>();
  const [wide, setWide] = useState(false);
  const [selectedId, setSelectedId] = useState("belva");
  const [layerId, setLayerId] = useState("ctx");
  const [showPoints, setShowPoints] = useState(true),
    [showRoute, setShowRoute] = useState(true);
  const [route, dispatch] = useReducer(routeReducer, emptyRoute);
  const { health, fail, retry } = useLayerHealth();
  const selected = sciencePoints.find((p) => p.id === selectedId)!;
  const points = [...sciencePoints, ...records.markers];
  const origin = points.find((p) => p.id === route.origin),
    destination = points.find((p) => p.id === route.destination);
  const plannedRoute =
    origin && destination ? { origin, destination } : undefined;
  const displayedRoute: MissionRoute | undefined =
    savedRoute?.route ?? plannedRoute;
  function choosePosition(coordinate: MarsCoordinate) {
    if (!adding || !activeLayer || !ready) return;
    setAdding(false);
    setEditingMarker({
      id: "personal-" + crypto.randomUUID(),
      name: "",
      coordinate,
      description: "",
      category: "Exploração",
      visited: false,
      layerId: activeLayer.id,
    });
  }
  function removeMarker(id: string) {
    if (
      save({ ...records, markers: records.markers.filter((m) => m.id !== id) })
    ) {
      if (route.origin === id || route.destination === id)
        dispatch({ type: "clear" });
    }
  }
  const activeLayer = nasaLayers.find(
    (l) => l.id === layerId && health[l.id]?.state === "ready",
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
      <div className={`${s.workspace} ${wide ? s.expanded : ""}`}>
        <aside className={s.sidebar}>
          <span className={u.label}>CONTROLE DE MISSÃO</span>
          <LayerPanel
            activeId={
              local && health[layerId]?.state !== undefined ? "image" : layerId
            }
            onChange={(id) => {
              setAdding(false);
              setLayerId(id);
            }}
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
          <RoutePlanner
            route={route}
            points={points}
            dispatch={(action) => {
              setSavedRoute(undefined);
              dispatch(action);
            }}
          />
          <p className={s.small} aria-live="polite">
            {distanceLabel(plannedRoute)}
          </p>
        </aside>
        <div className={s.mapColumn}>
          <div className={s.mapTop}>
            <span>
              {activeLayer?.id === "mola"
                ? "MARTE / RELEVO GLOBAL"
                : "JEZERO / MARTE"}
            </span>
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
          <div className={s.explorationControls}>
            <button
              className={u.choice}
              aria-pressed={wide}
              onClick={() => setWide(!wide)}
            >
              {wide ? "Mostrar painel lateral" : "Ampliar área do mapa"}
            </button>
            <button
              className={u.choice}
              disabled={!activeLayer || !ready}
              aria-pressed={adding}
              onClick={() => setAdding(!adding)}
            >
              {adding ? "Cancelar marcador" : "Adicionar marcador"}
            </button>
            <p className={s.small}>
              {adding
                ? "Clique em uma posição dentro da cobertura cartográfica para abrir o formulário."
                : "Arraste para deslocar; use +/− ou a roda para ampliar. Marcadores próprios: azul; locais oficiais: laranja."}
            </p>
            {!activeLayer && (
              <p className={s.small}>
                Para adicionar marcadores, selecione uma camada NASA disponível.
                A imagem local não possui coordenadas verificáveis.
              </p>
            )}
          </div>
          <TerrainMap
            key={activeLayer?.id ?? "image"}
            layer={activeLayer}
            selected={selected}
            onSelect={setSelectedId}
            showPoints={showPoints}
            showRoute={showRoute}
            origin={displayedRoute?.origin}
            destination={displayedRoute?.destination}
            personalMarkers={records.markers}
            onMarkerSelect={setEditingMarker}
            adding={adding && !!activeLayer}
            onPosition={choosePosition}
            routeFocus={savedRoute?.id}
            onLayerError={fail}
          />
          <div className={s.coordinates}>
            {activeLayer
              ? "GRADE ANGULAR MARCIANA · PLANETOCÊNTRICA / LESTE · USO EDUCATIVO"
              : "IMAGEM OFICIAL SEM GEORREFERENCIAMENTO · MARCADORES EM POSIÇÕES EDITORIAIS"}
          </div>
          <PointDetails
            point={selected}
            dispatch={(action) => {
              setSavedRoute(undefined);
              dispatch(action);
            }}
          />
        </div>
      </div>
      {error && (
        <p className={s.mapAlert} role="alert">
          {error}
        </p>
      )}
      <section className={s.mission} aria-labelledby="markers-title">
        <h2 id="markers-title">Meus marcadores</h2>
        {!records.markers.length && (
          <p>Use “Adicionar marcador” e selecione uma posição no mapa.</p>
        )}
        <div className={s.missionList}>
          {records.markers.map((m) => (
            <article key={m.id} className={s.record}>
              <h3>{m.name}</h3>
              <p>
                {m.category} · {m.visited ? "Visitado" : "Não visitado"}
              </p>
              <p>{m.description}</p>
              <p className={s.small}>
                {m.coordinate.latitude.toFixed(5)}° N,{" "}
                {m.coordinate.longitude.toFixed(5)}° E · Base: {m.layerId}
              </p>
              <div className={s.actions}>
                <button
                  className={u.choice}
                  onClick={() => setEditingMarker(m)}
                >
                  Editar marcador {m.name}
                </button>
                <button className={u.choice} onClick={() => removeMarker(m.id)}>
                  Excluir marcador {m.name}
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
      {editingMarker && (
        <MarkerEditor
          key={editingMarker.id}
          marker={editingMarker}
          error={error}
          onClose={() => setEditingMarker(undefined)}
          onSave={(m) => {
            const markers = records.markers.some((p) => p.id === m.id)
              ? records.markers.map((p) => (p.id === m.id ? m : p))
              : [...records.markers, m];
            if (save({ ...records, markers })) setEditingMarker(undefined);
          }}
        />
      )}
      <MissionManager
        error={error}
        missions={records.missions}
        ready={ready}
        currentRoute={
          displayedRoute && routeDistance(displayedRoute) !== null
            ? displayedRoute
            : undefined
        }
        activeId={savedRoute?.id}
        onSave={(m) => {
          const missions = records.missions.some((p) => p.id === m.id)
            ? records.missions.map((p) => (p.id === m.id ? m : p))
            : [...records.missions, m];
          const success = save({ ...records, missions });
          if (success && savedRoute?.id === m.id) setSavedRoute(m);
          return success;
        }}
        onDelete={(id) => {
          if (
            save({
              ...records,
              missions: records.missions.filter((m) => m.id !== id),
            }) &&
            savedRoute?.id === id
          )
            setSavedRoute(undefined);
        }}
        onSelect={(m) => {
          setSavedRoute(m);
          setShowRoute(true);
          const covers = (layer: (typeof nasaLayers)[number]) =>
            [m.route.origin, m.route.destination].every(
              (p) =>
                p.coordinate.latitude >= layer.bounds[0][0] &&
                p.coordinate.latitude <= layer.bounds[1][0] &&
                p.coordinate.longitude >= layer.bounds[0][1] &&
                p.coordinate.longitude <= layer.bounds[1][1],
            );
          if (!activeLayer || !covers(activeLayer)) {
            const compatible = nasaLayers.find(
              (l) => health[l.id]?.state === "ready" && covers(l),
            );
            if (compatible) setLayerId(compatible.id);
          }
        }}
      />
      <MissionSummary
        selected={selected}
        origin={displayedRoute?.origin}
        destination={displayedRoute?.destination}
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
