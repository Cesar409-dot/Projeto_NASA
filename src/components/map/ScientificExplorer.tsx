"use client";
import dynamic from "next/dynamic";
import { useReducer, useState, useCallback } from "react";
import { Crosshair } from "lucide-react";
import { useExplorationRecords } from "./useExplorationRecords";
import { MarkerEditor } from "./MarkerEditor";
import { MissionManager } from "./MissionManager";
import {
  mapCoordinateLabel,
  routeDistance,
  type MarkerDraft,
  type MissionRoute,
} from "@/lib/mars/exploration";
import { marsLatLng, type MarsCoordinate } from "@/lib/mars/coordinates";
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
  const [editingMarker, setEditingMarker] = useState<MarkerDraft>();
  const [markerPreview, setMarkerPreview] = useState<MarsCoordinate>();
  const [focusedCoordinate, setFocusedCoordinate] = useState<MarsCoordinate>();
  const [savedMissionId, setSavedMissionId] = useState<string>();
  const savedRoute = records.missions.find((m) => m.id === savedMissionId);
  const [wide, setWide] = useState(false);
  const [scienceOpen, setScienceOpen] = useState(false);
  const [selectedId, setSelectedId] = useState("belva");
  const [layerId, setLayerId] = useState("mola");
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
  const activeLayer = nasaLayers.find(
    (l) => l.id === layerId && health[l.id]?.state === "ready",
  );
  const local = !activeLayer;
  const failed = layerId !== "image" && health[layerId]?.state === "error";
  const showCoordinate = useCallback(
    (coordinate: MarsCoordinate) => {
      setFocusedCoordinate({ ...coordinate });
      const [lat, lon] = marsLatLng(coordinate);
      const covers = (l: (typeof nasaLayers)[number]) =>
        lat >= l.bounds[0][0] &&
        lat <= l.bounds[1][0] &&
        lon >= l.bounds[0][1] &&
        lon <= l.bounds[1][1];
      setLayerId((id) => {
        const current = nasaLayers.find(
          (l) => l.id === id && health[l.id]?.state === "ready",
        );
        return current && covers(current)
          ? id
          : (nasaLayers.find(
              (l) => health[l.id]?.state === "ready" && covers(l),
            )?.id ?? id);
      });
    },
    [health, setLayerId],
  );
  const previewPosition = useCallback(
    (coordinate?: MarsCoordinate) => {
      setMarkerPreview(coordinate);
      if (coordinate) showCoordinate(coordinate);
    },
    [showCoordinate],
  );
  function choosePosition(coordinate: MarsCoordinate) {
    if (!adding || !activeLayer || !ready) return;
    setAdding(false);
    setEditingMarker((previous) =>
      previous
        ? { ...previous, coordinate, layerId: activeLayer.id }
        : {
            id: "personal-" + crypto.randomUUID(),
            name: "",
            coordinate,
            description: "",
            category: "Exploração",
            visited: false,
            layerId: activeLayer.id,
          },
    );
    setFocusedCoordinate(coordinate);
  }
  function closeMarker() {
    setEditingMarker(undefined);
    setMarkerPreview(undefined);
    setAdding(false);
  }
  function manualMarker() {
    setAdding(false);
    setEditingMarker((previous) => ({
      ...(previous ?? {
        id: "personal-" + crypto.randomUUID(),
        name: "",
        description: "",
        category: "Exploração",
        visited: false,
      }),
      layerId: "manual",
    }));
  }
  function removeMarker(id: string) {
    if (
      save({
        ...records,
        markers: records.markers.filter((m) => m.id !== id),
      }) &&
      (route.origin === id || route.destination === id)
    )
      dispatch({ type: "clear" });
  }
  function selectScience(id: string) {
    setSelectedId(id);
    setScienceOpen(true);
    const point = sciencePoints.find((p) => p.id === id);
    if (point && activeLayer) showCoordinate(point.coordinate);
  }
  function showRouteCoverage(missionRoute: MissionRoute) {
    const covers = (layer: (typeof nasaLayers)[number]) =>
      [missionRoute.origin, missionRoute.destination].every((p) => {
        const [lat, lon] = marsLatLng(p.coordinate);
        return (
          lat >= layer.bounds[0][0] &&
          lat <= layer.bounds[1][0] &&
          lon >= layer.bounds[0][1] &&
          lon <= layer.bounds[1][1]
        );
      });
    if (!activeLayer || !covers(activeLayer)) {
      const compatible = nasaLayers.find(
        (l) => health[l.id]?.state === "ready" && covers(l),
      );
      if (compatible) setLayerId(compatible.id);
    }
  }
  return (
    <main id="main" className={u.page + " " + s.explorer}>
      <div className={u.eyebrow}>
        <span className={u.dot} />
        01 / EXPLORAÇÃO GEOGRÁFICA
      </div>
      <div className={u.intro}>
        <h1>
          MARS MAPS<span style={{ color: "var(--accent)" }}>.</span>
        </h1>
        <p>
          Explore Jezero, registre descobertas e prepare sua próxima missão.
        </p>
      </div>
      <p className={s.quickStart}>
        Explore a base, escolha origem e destino no planejador e salve sua rota
        em uma missão.
      </p>
      <div className={s.workspace + (wide ? " " + s.expanded : "")}>
        <aside className={s.sidebar} aria-label="Planejamento e bases">
          <RoutePlanner
            route={route}
            points={points}
            hasSavedRoute={!!savedRoute}
            dispatch={(action) => {
              setSavedMissionId(undefined);
              setFocusedCoordinate(undefined);
              const next = routeReducer(route, action);
              const start = points.find((p) => p.id === next.origin);
              const end = points.find((p) => p.id === next.destination);
              if (start && end)
                showRouteCoverage({ origin: start, destination: end });
              dispatch(action);
              setShowRoute(true);
            }}
          />
          <div className={s.sidebarDivider} />
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
          <div className={s.explorationControls}>
            <button
              className={u.button}
              disabled={!activeLayer || !ready}
              aria-pressed={adding}
              onClick={() => setAdding(!adding)}
            >
              {adding ? "Cancelar marcador" : "Adicionar marcador"}
            </button>
            <button
              className={u.choice}
              disabled={!ready}
              onClick={manualMarker}
            >
              Informar coordenadas
            </button>
            <button
              className={u.choice}
              aria-pressed={wide}
              onClick={() => setWide(!wide)}
            >
              {wide ? "Mostrar painel lateral" : "Ampliar área do mapa"}
            </button>
            <p className={s.small}>
              {adding
                ? "Clique no terreno para escolher a posição, ou informe coordenadas. Seus dados preenchidos serão mantidos."
                : "Adicione um ponto clicando no mapa ou informando latitude e longitude."}
            </p>
            {!activeLayer && (
              <p className={s.small}>
                A imagem local é esquemática. Use coordenadas manuais ou
                selecione uma base NASA disponível.
              </p>
            )}
          </div>
          {failed && (
            <p className={s.mapAlert} role="status">
              Base indisponível. A imagem local mantém os locais e seus
              registros acessíveis.
            </p>
          )}
          {!activeLayer && layerId !== "image" && !failed && (
            <p className={s.mapAlert} role="status">
              Verificando os serviços NASA. Exibindo a imagem local enquanto
              isso.
            </p>
          )}
          <TerrainMap
            key={activeLayer ? "geographic" : "image"}
            layer={activeLayer}
            selected={selected}
            onSelect={selectScience}
            showPoints={showPoints}
            showRoute={showRoute}
            origin={displayedRoute?.origin}
            destination={displayedRoute?.destination}
            personalMarkers={records.markers}
            onMarkerSelect={(marker) => {
              setEditingMarker(marker);
              showCoordinate(marker.coordinate);
            }}
            adding={adding && !!activeLayer}
            onPosition={choosePosition}
            routeFocus={savedRoute?.id}
            onLayerError={fail}
            focusCoordinate={focusedCoordinate}
            previewCoordinate={markerPreview}
          />
          <div className={s.mapDisplay}>
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
            <span className={s.small}>
              ● Laranja: locais oficiais · ● Azul: seus marcadores
            </span>
          </div>
          <div className={s.coordinates}>
            {activeLayer
              ? "COORDENADAS MARCIANAS · PLANETOCÊNTRICAS / LESTE · USO EDUCATIVO"
              : "IMAGEM SEM GEORREFERENCIAMENTO · POSIÇÕES ESQUEMÁTICAS"}
          </div>
        </div>
      </div>
      <details
        className={s.sciencePanel}
        open={scienceOpen}
        onToggle={(e) => setScienceOpen(e.currentTarget.open)}
      >
        <summary>
          <Crosshair size={17} aria-hidden="true" />
          Locais científicos <span>{selected.name}</span>
        </summary>
        <div className={s.scienceContent}>
          <nav aria-label="Locais científicos">
            {sciencePoints.map((p, i) => (
              <button
                key={p.id}
                className={s.place}
                aria-pressed={selectedId === p.id}
                onClick={() => selectScience(p.id)}
              >
                <span>0{i + 1}</span>
                {p.name}
              </button>
            ))}
          </nav>
          <PointDetails point={selected} />
        </div>
      </details>
      {error && (
        <p className={s.mapAlert} role="alert">
          {error}
        </p>
      )}
      <div className={s.recordsGrid}>
        <section className={s.mission} aria-labelledby="markers-title">
          <div className={u.row}>
            <h2 id="markers-title">Meus marcadores</h2>
            <span className={u.badge}>{records.markers.length} PONTOS</span>
          </div>
          {!records.markers.length && (
            <p className={s.emptyState}>
              Seu próximo ponto começa no mapa. Use “Adicionar marcador” ou
              “Informar coordenadas”.
            </p>
          )}
          <div className={s.missionList}>
            {records.markers.map((m) => (
              <article key={m.id} className={s.record}>
                <h3>{m.name}</h3>
                <p className={s.small}>
                  {m.category} · {m.visited ? "Visitado" : "Não visitado"}
                </p>
                {m.description && <p>{m.description}</p>}
                <p className={s.small}>
                  {mapCoordinateLabel(m.coordinate)} ·{" "}
                  {m.layerId === "manual"
                    ? "Posição informada"
                    : "Base: " + m.layerId}
                </p>
                <div className={s.actions}>
                  <button
                    className={u.choice}
                    aria-label={"Ver no mapa " + m.name}
                    onClick={() => showCoordinate(m.coordinate)}
                  >
                    Ver no mapa
                  </button>
                  <button
                    className={u.choice}
                    aria-label={"Editar marcador " + m.name}
                    onClick={() => setEditingMarker(m)}
                  >
                    Editar
                  </button>
                  <button
                    className={u.choice}
                    aria-label={"Excluir marcador " + m.name}
                    onClick={() => removeMarker(m.id)}
                  >
                    Excluir
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
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
              setSavedMissionId(undefined);
          }}
          onSelect={(m) => {
            setFocusedCoordinate(undefined);
            setSavedMissionId(m.id);
            setShowRoute(true);
            showRouteCoverage(m.route);
          }}
        />
      </div>
      {editingMarker && !adding && (
        <MarkerEditor
          key={editingMarker.id}
          marker={editingMarker}
          error={error}
          onClose={closeMarker}
          onPreview={previewPosition}
          canPickPosition={!!activeLayer}
          onPickPosition={(draft) => {
            setEditingMarker(draft);
            setMarkerPreview(undefined);
            setAdding(true);
          }}
          onSave={(marker) => {
            const markers = records.markers.some((p) => p.id === marker.id)
              ? records.markers.map((p) => (p.id === marker.id ? marker : p))
              : [...records.markers, marker];
            if (save({ ...records, markers })) {
              showCoordinate(marker.coordinate);
              closeMarker();
            }
          }}
        />
      )}
      <MissionSummary
        selected={selected}
        origin={displayedRoute?.origin}
        destination={displayedRoute?.destination}
        isLocal={local}
      />
      <details className={s.sourceDisclosure}>
        <summary>Precisão, créditos e fontes</summary>
        <p className={u.notice}>
          Os serviços anunciam um identificador de CRS ambíguo; usamos a grade
          angular marciana publicada. O alinhamento absoluto com a rede de
          controle dos centros catalogados não foi validado. Esta ferramenta é
          educativa, sem navegação ou avaliação de segurança.
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
      </details>
    </main>
  );
}
