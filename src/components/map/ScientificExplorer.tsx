"use client";
import dynamic from "next/dynamic";
import { useReducer, useState, useCallback, useRef, useEffect } from "react";
import { ArrowRight, Check, Circle, Orbit } from "lucide-react";
import type { ViewMemory } from "@/lib/mars/map-view";
import { Crosshair } from "lucide-react";
import Link from "next/link";
import { useExplorationRecords } from "./useExplorationRecords";
import { MarkerEditor } from "./MarkerEditor";
import { MissionManager } from "./MissionManager";
import { useTerrainRoute, type RouteMode } from "./useTerrainRoute";
import { defaultTerrainOptions } from "@/lib/mars/terrain-routing";
import {
  mapCoordinateLabel,
  routeDistance,
  type SavedMission,
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
import { GuideTour } from "./GuideTour";
import { MarsMapsNavigation } from "./MarsMapsNavigation";
import { ExplorationReview } from "./ExplorationReview";
import { useExplorationLibrary } from "./useExplorationLibrary";
import type { LibraryExploration } from "@/lib/mars/exploration-library";
import u from "../ui.module.css";
import s from "../map.module.css";
const TerrainMap = dynamic(() => import("./LeafletCanvas"), {
  ssr: false,
  loading: () => (
    <div className={s.loading} role="status" data-guide="map">
      Preparando o atlas…
    </div>
  ),
});
export function ScientificExplorer() {
  const [stage, setStage] = useState<"planning" | "exploration" | "analysis">("planning");
  const [highestStage, setHighestStage] = useState(0);
  const [analysisFinalized, setAnalysisFinalized] = useState(false);
  const viewMemory = useRef<ViewMemory["current"]>({});
  const { records, ready, error, save } = useExplorationRecords();
  const library = useExplorationLibrary();
  const [libraryRecordId, setLibraryRecordId] = useState<string>();
  const [openedRoute, setOpenedRoute] = useState<MissionRoute>();
  const openedFromLibrary = useRef(false);
  const [adding, setAdding] = useState(false);
  const [editingMarker, setEditingMarker] = useState<MarkerDraft>();
  const [markerPreview, setMarkerPreview] = useState<MarsCoordinate>();
  const [focusedCoordinate, setFocusedCoordinate] = useState<MarsCoordinate>();
  const [savedMissionId, setSavedMissionId] = useState<string>();
  const savedRoute = records.missions.find((m) => m.id === savedMissionId);
  const [wide, setWide] = useState(false);
  const prepareTourStep = useCallback((step: number) => {
    if (step === 6) setWide(false);
  }, []);
  const [scienceOpen, setScienceOpen] = useState(false);
  const [selectedId, setSelectedId] = useState("belva");
  const [layerId, setLayerId] = useState("mola");
  const [showPoints, setShowPoints] = useState(true),
    [showRoute, setShowRoute] = useState(true);
  const [route, dispatch] = useReducer(routeReducer, emptyRoute);
  const [routeMode, setRouteMode] = useState<RouteMode>("direct");
  const [terrainOptions, setTerrainOptions] = useState(defaultTerrainOptions);
  const { health, fail, retry } = useLayerHealth();
  const selected = sciencePoints.find((p) => p.id === selectedId)!;
  const points = [...sciencePoints, ...records.markers, ...(openedRoute ? [openedRoute.origin, openedRoute.destination].filter((point) => !sciencePoints.some((science) => science.id === point.id) && !records.markers.some((marker) => marker.id === point.id)) : [])];
  const origin = points.find((p) => p.id === route.origin),
    destination = points.find((p) => p.id === route.destination);
  const plannedRoute =
    origin && destination ? { origin, destination } : undefined;
  const displayedRoute: MissionRoute | undefined =
    savedRoute?.route ?? openedRoute ?? plannedRoute;
  const terrain = useTerrainRoute(displayedRoute, routeMode, terrainOptions);
  const currentMissionRoute: MissionRoute | undefined =
    displayedRoute && (routeMode === "direct" || terrain.plan)
      ? {
          origin: displayedRoute.origin,
          destination: displayedRoute.destination,
          ...(routeMode === "terrain" ? { terrain: terrain.plan } : {}),
        }
      : undefined;
  const routeIsValid = !!displayedRoute && routeDistance(displayedRoute) !== null;
  const canStartExploration = routeIsValid && (routeMode !== "terrain" || !!terrain.plan);
  const associatedMissions = displayedRoute
    ? records.missions.filter((mission) =>
        (mission.route.origin.id === displayedRoute.origin.id && mission.route.destination.id === displayedRoute.destination.id) ||
        (mission.route.origin.id === displayedRoute.destination.id && mission.route.destination.id === displayedRoute.origin.id),
      )
    : [];
  // Restore a browser-local saved exploration after storage hydration.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!ready || !library.ready || openedFromLibrary.current) return;
    const id = new URLSearchParams(window.location.search).get("open");
    const item = id ? library.items.find((entry) => entry.id === id) : undefined;
    if (!item) return;
    openedFromLibrary.current = true;
    setOpenedRoute(item.route);
    dispatch({ type: "origin", id: item.route.origin.id });
    dispatch({ type: "destination", id: item.route.destination.id });
    setRouteMode(item.routeMode);
    if (item.route.terrain) setTerrainOptions(item.route.terrain.options);
    setSelectedId(item.regionId);
    setLibraryRecordId(item.id);
    setStage("analysis");
    setHighestStage(2);
    setAnalysisFinalized(true);
    setShowRoute(true);
  }, [ready, library.ready, library.items]);
  /* eslint-enable react-hooks/set-state-in-effect */
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
    else setFocusedCoordinate(undefined);
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
  function selectMission(mission: SavedMission) {
    setFocusedCoordinate(undefined);
    setSavedMissionId(mission.id);
    setRouteMode(mission.route.terrain ? "terrain" : "direct");
    if (mission.route.terrain) setTerrainOptions(mission.route.terrain.options);
    setShowRoute(true);
    setAnalysisFinalized(false);
    showRouteCoverage(mission.route);
  }
  function saveMissionRecord(mission: SavedMission) {
    const missions = records.missions.some((item) => item.id === mission.id)
      ? records.missions.map((item) => item.id === mission.id ? mission : item)
      : [...records.missions, mission];
    return save({ ...records, missions });
  }
  function deleteMissionRecord(id: string) {
    if (save({ ...records, missions: records.missions.filter((mission) => mission.id !== id) }) && savedRoute?.id === id)
      setSavedMissionId(undefined);
  }
  function navigateToStage(target: "planning" | "exploration" | "analysis") {
    if (target === "planning") setStage(target);
    else if (target === "exploration" && canStartExploration && highestStage >= 1)
      setStage(target);
    else if (target === "analysis" && canStartExploration && highestStage >= 2)
      setStage(target);
  }
  function advanceFromPlanning() {
    if (!canStartExploration) return;
    setHighestStage((current) => Math.max(current, 1));
    setStage("exploration");
  }
  function advanceToAnalysis() {
    if (!canStartExploration) return;
    setHighestStage(2);
    setStage("analysis");
  }
  function saveToLibrary(name: string) {
    if (!displayedRoute || !routeIsValid || !name.trim() || !library.ready) return false;
    const existing = library.items.find((item) => item.id === libraryRecordId);
    const now = new Date().toISOString();
    const entry: LibraryExploration = {
      id: existing?.id ?? libraryRecordId ?? crypto.randomUUID(),
      name: name.trim().slice(0, 100),
      regionId: selected.id,
      regionName: selected.name,
      route: currentMissionRoute ?? displayedRoute,
      routeMode,
      markerIds: [displayedRoute.origin, displayedRoute.destination].filter((point) => records.markers.some((marker) => marker.id === point.id)).map((point) => point.id),
      missionIds: associatedMissions.map((mission) => mission.id),
      missions: associatedMissions.map(({ id, name, objective }) => ({ id, name, objective })),
      analysis: { markerCount: [displayedRoute.origin, displayedRoute.destination].filter((point) => records.markers.some((marker) => marker.id === point.id)).length, missionCount: associatedMissions.length, ...(terrain.plan ? { terrain: terrain.plan } : {}) },
      createdAt: existing?.createdAt ?? now,
      analyzedAt: now,
      updatedAt: now,
      status: "analisada",
    };
    const next = existing ? library.items.map((item) => item.id === entry.id ? entry : item) : [...library.items, entry];
    const saved = library.save(next);
    if (saved) setLibraryRecordId(entry.id);
    return saved;
  }
  const startTutorial = useCallback(() => setStage("planning"), []);
  const mapView = (report = false) => (
    <TerrainMap
      key={activeLayer ? "geographic" : "image"}
      layer={activeLayer}
      selected={selected}
      onSelect={selectScience}
      showPoints={report || showPoints}
      showRoute={report || showRoute}
      origin={displayedRoute?.origin}
      destination={displayedRoute?.destination}
      personalMarkers={records.markers}
      onMarkerSelect={(marker) => {
        if (stage === "planning") {
          setEditingMarker(marker);
          showCoordinate(marker.coordinate);
        }
      }}
      adding={stage === "planning" && adding && !!activeLayer}
      onPosition={choosePosition}
      routeFocus={savedRoute?.id}
      onLayerError={fail}
      focusCoordinate={focusedCoordinate}
      previewCoordinate={markerPreview}
      routeMode={routeMode}
      terrainPlan={terrain.plan}
      viewMemory={viewMemory}
      recordsReady={ready}
    />
  );
  return (
    <main id="main" className={`${u.page} ${s.explorer} ${s.marsMapsApp}`}>
      <header className={s.marsMapsHeader}>
        <a className={s.marsMapsBrand} href="#main" aria-label="Mars Maps início">
          <span className={s.brandPlanet}><Orbit size={22} /></span>
          <strong>Mars <i>Maps</i></strong>
        </a>
        <p>Planeje e explore a superfície de Marte</p>
        <div className={s.headerTools}>
          <MarsMapsNavigation />
          <Link className={s.libraryHeaderLink} href="/mars-maps/library">Biblioteca de Explorações</Link>
          <GuideTour onStart={startTutorial} onPrepareStep={prepareTourStep} />
        </div>
      </header>
      <nav className={s.workflowStepper} aria-label="Etapas da exploração">
        {([
          { id: "planning", title: "Planejamento", subtitle: "Planeje sua rota" },
          { id: "exploration", title: "Exploração", subtitle: "Revise o percurso" },
          { id: "analysis", title: "Análise", subtitle: "Consulte o relatório" },
        ] as const).map((item, index) => {
          const currentIndex = stage === "planning" ? 0 : stage === "exploration" ? 1 : 2;
          const complete = index < currentIndex;
          const active = index === currentIndex;
          const allowed = index === 0 || (index === 1 && canStartExploration && highestStage >= 1) || (index === 2 && canStartExploration && highestStage >= 2);
          return <button key={item.id} type="button" className={active ? s.workflowActive : complete ? s.workflowComplete : s.workflowPending} aria-current={active ? "step" : undefined} disabled={!allowed} onClick={() => navigateToStage(item.id)}>
            <span className={s.workflowNumber}>{complete ? <Check size={14} /> : active ? index + 1 : <Circle size={14} />}</span>
            <span><strong>{item.title}</strong><small>{item.subtitle}</small></span>
          </button>;
        })}
      </nav>

      {stage === "planning" && <>
      <div className={s.workspace + (wide ? " " + s.expanded : "")}>
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
          {mapView()}
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
            <span className={s.markerLegend} aria-label="Legenda dos marcadores">
              <span><i className={s.legendScience} />Local científico</span>
              <span><i className={s.legendPersonal} />Marcador próprio</span>
              <span><i className={s.legendOrigin} />Origem</span>
              <span><i className={s.legendDestination} />Destino</span>
            </span>
          </div>
          <div className={s.coordinates}>
            {activeLayer
              ? "COORDENADAS MARCIANAS · PLANETOCÊNTRICAS / LESTE · USO EDUCATIVO"
              : "IMAGEM SEM GEORREFERENCIAMENTO · POSIÇÕES ESQUEMÁTICAS"}
          </div>
        </div>
      </div>
      <section className={s.planningControls} aria-label="Campos de planejamento">
        <div className={s.routePlannerCard}>
          <RoutePlanner route={route} points={points} hasSavedRoute={!!savedRoute} mode={routeMode}
            onModeChange={(mode) => { setRouteMode(mode); setShowRoute(true); setHighestStage(0); setAnalysisFinalized(false); if (mode === "terrain" && displayedRoute) showRouteCoverage(displayedRoute); }}
            options={terrainOptions} onOptionsChange={setTerrainOptions} terrain={terrain} comparisonRoute={displayedRoute}
            dispatch={(action) => { setSavedMissionId(undefined); setOpenedRoute(undefined); setLibraryRecordId(undefined); setFocusedCoordinate(undefined); setHighestStage(0); setAnalysisFinalized(false); const next = routeReducer(route, action); const start = points.find((p) => p.id === next.origin); const end = points.find((p) => p.id === next.destination); if (start && end) showRouteCoverage({ origin: start, destination: end }); dispatch(action); setShowRoute(true); }} />
        </div>
        <div className={s.planningTools}>
          <h2>Ferramentas e visualização</h2>
          <div className={s.planningToolActions}>
            <button className={u.button} data-guide="add-marker" disabled={!activeLayer || !ready} aria-pressed={adding} onClick={() => setAdding(!adding)}>{adding ? "Cancelar marcador" : "Adicionar marcador"}</button>
            <button className={u.choice} data-guide="coordinate-entry" disabled={!ready} onClick={manualMarker}>Informar coordenadas</button>
            <button className={u.choice} aria-pressed={wide} onClick={() => setWide(!wide)}>{wide ? "Mostrar largura normal" : "Ampliar área do mapa"}</button>
          </div>
          <p className={s.small}>{adding ? "Clique no terreno para escolher a posição ou informe latitude e longitude." : "Adicione um ponto no mapa ou informe coordenadas manualmente."}</p>
          {!activeLayer && <p className={s.small}>A imagem local é esquemática. Use coordenadas manuais ou selecione uma base NASA disponível.</p>}
          <LayerPanel activeId={local && health[layerId]?.state !== undefined ? "image" : layerId} onChange={(id) => { setAdding(false); setLayerId(id); }} health={health} retry={retry} />
        </div>
      </section>
      <div className={s.planningBottom}>
        <MissionSummary
          selected={selected}
          origin={displayedRoute?.origin}
          destination={displayedRoute?.destination}
          isLocal={local}
          terrainPlan={routeMode === "terrain" ? terrain.plan : undefined}
        />
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
                  {mapCoordinateLabel(m.coordinate)} · {m.layerId === "manual" ? "Posição informada" : "Base: " + m.layerId}
                </p>
                <div className={s.actions}>
                  <button className={u.choice} aria-label={"Ver no mapa " + m.name} onClick={() => showCoordinate(m.coordinate)}>Ver no mapa</button>
                  <button className={u.choice} aria-label={"Editar marcador " + m.name} onClick={() => setEditingMarker(m)}>Editar</button>
                  <button className={u.choice} aria-label={"Excluir marcador " + m.name} onClick={() => removeMarker(m.id)}>Excluir</button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
      <div className={s.workflowActions}>
        <p className={s.small} role="status">
          {!routeIsValid
            ? "Selecione uma origem e um destino diferentes para iniciar."
            : routeMode === "terrain" && !terrain.plan
              ? terrain.status === "error" ? "O cálculo do terreno não encontrou uma rota válida. Revise os pontos ou escolha uma rota direta." : "Aguarde o cálculo da rota pelo terreno para continuar."
              : "A rota está pronta para revisão."}
        </p>
        <button className={u.button} type="button" disabled={!canStartExploration} onClick={advanceFromPlanning}>
          Iniciar exploração <ArrowRight size={16} />
        </button>
      </div>
      <details className={s.missionManagement}>
        <summary>Gerenciar missões salvas</summary>
        <MissionManager compact title="Missões salvas" error={error} missions={records.missions} ready={ready}
          currentRoute={currentMissionRoute && routeDistance(currentMissionRoute) !== null ? currentMissionRoute : undefined}
          activeId={savedRoute?.id} onSave={saveMissionRecord} onDelete={deleteMissionRecord}
          onSelect={selectMission} onClearSelection={() => setSavedMissionId(undefined)} />
      </details>
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
      </>}
      {stage === "exploration" && canStartExploration && displayedRoute && <ExplorationReview
        stage="exploration"
        route={displayedRoute}
        routeMode={routeMode}
        terrainPlan={terrain.plan}
        selectedRegion={selected}
        records={records}
        associatedMissions={associatedMissions}
        activeMission={savedRoute}
        mapPreview={null}
        analysisFinalized={analysisFinalized}
        onBackToPlanning={() => setStage("planning")}
        onAdvanceToAnalysis={advanceToAnalysis}
        onBackToExploration={() => setStage("exploration")}
        onSelectMission={selectMission}
        onFinalizeAnalysis={() => setAnalysisFinalized(true)}
        onSaveToLibrary={saveToLibrary}
        librarySaved={library.items.some((item) => item.id === libraryRecordId)}
        libraryReady={library.ready}
        libraryError={library.error}
      />}
      {stage === "analysis" && canStartExploration && displayedRoute && <ExplorationReview
        stage="analysis"
        route={displayedRoute}
        routeMode={routeMode}
        terrainPlan={terrain.plan}
        selectedRegion={selected}
        records={records}
        associatedMissions={associatedMissions}
        activeMission={savedRoute}
        mapPreview={mapView(true)}
        analysisFinalized={analysisFinalized}
        onBackToPlanning={() => setStage("planning")}
        onAdvanceToAnalysis={advanceToAnalysis}
        onBackToExploration={() => setStage("exploration")}
        onSelectMission={selectMission}
        onFinalizeAnalysis={() => setAnalysisFinalized(true)}
        onSaveToLibrary={saveToLibrary}
        librarySaved={library.items.some((item) => item.id === libraryRecordId)}
        libraryReady={library.ready}
        libraryError={library.error}
      />}
      {stage !== "planning" && (!canStartExploration || !displayedRoute) && <section className={s.workflowBlocked} role="status">
        <h2>A rota precisa ser recalculada</h2>
        <p>Volte ao planejamento para revisar a origem, o destino e a disponibilidade da rota.</p>
        <button className={u.button} type="button" onClick={() => setStage("planning")}>Voltar ao planejamento</button>
      </section>}
    </main>
  );
}
