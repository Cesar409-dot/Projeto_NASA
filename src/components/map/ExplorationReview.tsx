"use client";
import { LocalizedTree } from "@/components/LocalizedTree";
import { useState, type ReactNode } from "react";
import Image from "next/image";
import { ArrowLeft, ArrowRight, Check, Circle, Flag, MapPin, Route as RouteIcon } from "lucide-react";
import type { SciencePoint } from "@/data/science-points";
import type { ExplorationRecords, MissionRoute, SavedMission } from "@/lib/mars/exploration";
import { distanceLabel, mapCoordinateLabel } from "@/lib/mars/exploration";
import type { RouteMode } from "./useTerrainRoute";
import type { TerrainPlan } from "@/lib/mars/terrain-routing";
import u from "../ui.module.css";
import s from "../map.module.css";

type Props = {
  stage: "exploration" | "analysis";
  route: MissionRoute;
  routeMode: RouteMode;
  terrainPlan?: TerrainPlan;
  selectedRegion: SciencePoint;
  records: ExplorationRecords;
  associatedMissions: SavedMission[];
  activeMission?: SavedMission;
  mapPreview: ReactNode;
  analysisFinalized: boolean;
  onBackToPlanning: () => void;
  onAdvanceToAnalysis: () => void;
  onBackToExploration: () => void;
  onSelectMission: (mission: SavedMission) => void;
  onFinalizeAnalysis: () => void;
  onSaveToLibrary: (name: string) => boolean;
  librarySaved: boolean;
  libraryReady: boolean;
  libraryError: string;
};

const prettyDistance = (route: MissionRoute) => distanceLabel(route);

export function ExplorationReview({
  stage,
  route,
  routeMode,
  terrainPlan,
  selectedRegion,
  records,
  associatedMissions,
  activeMission,
  mapPreview,
  analysisFinalized,
  onBackToPlanning,
  onAdvanceToAnalysis,
  onBackToExploration,
  onSelectMission,
  onFinalizeAnalysis,
  onSaveToLibrary,
  librarySaved,
  libraryReady,
  libraryError,
}: Props) {
  const [tab, setTab] = useState<"report" | "markers" | "missions">("report");
  const [libraryName, setLibraryName] = useState("");
  const reportRoute = terrainPlan ? { ...route, terrain: terrainPlan } : route;
  const usedMarkers = [route.origin, route.destination].filter((point) =>
    records.markers.some((marker) => marker.id === point.id),
  );
  const routePoints = [
    { point: route.origin, role: "Origem" },
    { point: route.destination, role: "Destino" },
  ];

  return <LocalizedTree>{(
    <section className={s.journey} aria-label={stage === "exploration" ? "Etapa de exploração" : "Análise da exploração"}>
      <aside className={s.journeyRail}>
        <button className={u.choice} type="button" onClick={onBackToPlanning}>
          <ArrowLeft size={15} /> Voltar ao planejamento
        </button>
        <h2>{stage === "exploration" ? "Sua Exploração" : "Análise da Exploração"}</h2>
        <ol className={s.journeyProgress}>
          <li className={s.progressDone}><Check size={16} /><span>Planejamento<small>Origem: {route.origin.name}</small></span></li>
          <li className={s.progressDone}><Check size={16} /><span>Exploração<small>Destino: {route.destination.name}</small></span></li>
          <li className={stage === "analysis" ? s.progressCurrent : s.progressPending}>
            {stage === "analysis" ? <Check size={16} /> : <Circle size={16} />}
            <span>Análise<small>{stage === "analysis" ? "Relatório da rota" : "Revise os dados para avançar"}</small></span>
          </li>
        </ol>
      </aside>

      {stage === "exploration" ? (
        <div className={s.reviewMain}>
          <div className={s.reviewGrid}>
            <section className={s.reviewCard}>
              <div className={s.reviewCardTitle}><RouteIcon size={18} /><div><h2>Rota planejada</h2><p>{route.origin.name} → {route.destination.name}</p></div><span className={s.statusPill}>Planejada</span></div>
              <strong className={s.distanceHero}>{prettyDistance(reportRoute)}</strong>
              <span className={s.small}>Distância estimada</span>
              <dl className={s.reviewMetrics}>
                <div><dt>Modalidade</dt><dd>{routeMode === "terrain" ? "Rota pelo terreno" : "Rota direta"}</dd></div>
                <div><dt>Tempo de deslocamento</dt><dd>Não estimado pelo sistema</dd></div>
                <div><dt>Subida / descida</dt><dd>{terrainPlan ? `${Math.round(terrainPlan.ascentMetres)} m / ${Math.round(terrainPlan.descentMetres)} m` : "Disponível com rota pelo terreno"}</dd></div>
              </dl>
              {terrainPlan && <p className={s.small}>Inclinação máxima estimada: {terrainPlan.maxSlopeDegrees.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}°. Valores derivados do modelo de elevação de Jezero.</p>}
              <div className={s.profileUnavailable}>
                <strong>Perfil de elevação</strong>
                <p>{terrainPlan ? "O cálculo atual fornece subida, descida e inclinação máxima agregadas, mas não expõe amostras de altitude ao longo da rota para gerar este gráfico." : "Não há amostras de elevação para esta rota direta. Selecione “Rota pelo terreno” em Jezero para obter estimativas agregadas de relevo."}</p>
              </div>
              <p className={s.small}>A distância geométrica não representa duração, segurança ou um trajeto necessariamente transitável.</p>
            </section>
            <section className={s.reviewCard}>
              <span className={u.label}>DETALHES DA REGIÃO</span>
              <Image className={s.regionImage} src="/images/jezero.jpg" width={500} height={320} alt="Imagem da região de Jezero" />
              <h3>{selectedRegion.name}</h3>
              <p>{selectedRegion.description}</p>
              <p className={s.small}>{selectedRegion.significance}</p>
              <p className={s.small}>{selectedRegion.mission}</p>
            </section>
          </div>
          <div className={s.reviewActions}>
            <button className={u.choice} type="button" onClick={onBackToPlanning}><ArrowLeft size={15} /> Voltar</button>
            <button className={u.button} type="button" onClick={onAdvanceToAnalysis}>Avançar para análise <ArrowRight size={15} /></button>
          </div>
        </div>
      ) : (
        <div className={s.analysisMain}>
          <div className={s.analysisTabs} role="tablist" aria-label="Seções da análise">
            {([ ["report", "Relatório"], ["markers", "Marcadores"], ["missions", "Missões"] ] as const).map(([id, label]) => (
              <button key={id} type="button" role="tab" aria-selected={tab === id} className={tab === id ? s.analysisTabActive : s.analysisTab} onClick={() => setTab(id)}>{label}</button>
            ))}
          </div>
          {tab === "report" && <div className={s.analysisGrid}>
            <section className={s.reviewCard}>
              <div className={s.reviewCardTitle}><RouteIcon size={18} /><div><h2>Resumo geral</h2><p>Dados da rota planejada</p></div></div>
              <dl className={s.reportList}>
                <div><dt>Região</dt><dd>{selectedRegion.name}</dd></div>
                <div><dt>Origem</dt><dd>{route.origin.name}</dd></div>
                <div><dt>Destino</dt><dd>{route.destination.name}</dd></div>
                <div><dt>Distância estimada</dt><dd>{prettyDistance(reportRoute)}</dd></div>
                <div><dt>Tipo de rota</dt><dd>{routeMode === "terrain" ? "Rota pelo terreno" : "Rota direta"}</dd></div>
              </dl>
            </section>
            <section className={s.reviewCard}>
              <div className={s.reviewCardTitle}><Flag size={18} /><div><h2>Estatísticas disponíveis</h2><p>Somente dados registrados</p></div></div>
              <dl className={s.reportList}>
                <div><dt>Marcadores próprios utilizados</dt><dd>{usedMarkers.length}</dd></div>
                <div><dt>Missões associadas</dt><dd>{associatedMissions.length}</dd></div>
                <div><dt>Precisão cartográfica</dt><dd>Educativa · sem validação operacional</dd></div>
                {terrainPlan && <div><dt>Subida / descida estimada</dt><dd>{Math.round(terrainPlan.ascentMetres)} m / {Math.round(terrainPlan.descentMetres)} m</dd></div>}
              </dl>
            </section>
            <section className={`${s.reviewCard} ${s.reportMapCard}`}>
              <div className={s.reviewCardTitle}><MapPin size={18} /><div><h2>Mapa da exploração</h2><p>Pontos e conexão da rota planejada</p></div></div>
              {mapPreview}
            </section>
            <section className={`${s.reviewCard} ${analysisFinalized ? s.completionCard : s.pendingCard}`}>
              <div className={s.reviewCardTitle}><Check size={18} /><div><h2>{analysisFinalized ? "Análise finalizada" : "Conclusão"}</h2><p>{analysisFinalized ? "Relatório marcado como finalizado" : "A rota continua sendo um plano, sem registro de deslocamento real."}</p></div></div>
              {!analysisFinalized && <button className={u.button} type="button" onClick={onFinalizeAnalysis}>Finalizar análise</button>}
            </section>
            <section className={s.reviewCard} aria-label="Biblioteca de Explorações">
              <h2>Salvar na Biblioteca de Explorações</h2>
              <p className={s.small}>Guarde esta rota e os dados disponíveis para consultar depois neste navegador.</p>
              {librarySaved ? <p role="status">Exploração salva na biblioteca. Salvar novamente atualiza o mesmo registro.</p> : <div className={s.librarySaveForm}>
                <label>Nome da exploração<input className={u.field} value={libraryName} onChange={(event) => setLibraryName(event.target.value)} placeholder={`${route.origin.name} → ${route.destination.name}`} maxLength={100} /></label>
                <button className={u.button} type="button" disabled={!libraryReady} onClick={() => onSaveToLibrary(libraryName.trim() || `${route.origin.name} → ${route.destination.name}`)}>Salvar na biblioteca</button>
              </div>}
              {libraryError && <p role="alert" className={s.small}>{libraryError}</p>}
            </section>
          </div>}
          {tab === "markers" && <section className={s.reviewCard}>
            <h2>Marcadores utilizados</h2>
            <p className={s.small}>Os pontos exibidos são a origem e o destino desta rota.</p>
            <div className={s.analysisList}>{routePoints.map(({ point, role }) => {
              const personal = records.markers.find((marker) => marker.id === point.id);
              return <article className={s.analysisListItem} key={`${role}-${point.id}`}><div><strong>{point.name}</strong><span>{role} · {personal ? `Marcador próprio · ${personal.category}` : "Local científico do catálogo"}</span></div><code>{mapCoordinateLabel(point.coordinate)}</code></article>;
            })}</div>
          </section>}
          {tab === "missions" && <section className={s.reviewCard}>
            <h2>Missões associadas</h2>
            <p className={s.small}>Missões salvas neste navegador que usam os mesmos pontos da rota.</p>
            {associatedMissions.length ? <div className={s.analysisList}>{associatedMissions.map((mission) => <article className={s.analysisListItem} key={mission.id}><div><strong>{mission.name}</strong><span>{mission.objective} · {mission.date.split("-").reverse().join("/")}</span></div><button className={u.choice} type="button" onClick={() => onSelectMission(mission)}>{activeMission?.id === mission.id ? "Selecionada" : "Usar rota"}</button></article>)}</div> : <p className={s.emptyState}>Nenhuma missão cadastrada para esta combinação de origem e destino.</p>}
          </section>}
          <div className={s.reviewActions}>
            <button className={u.choice} type="button" onClick={onBackToExploration}><ArrowLeft size={15} /> Voltar</button>
            <button className={u.secondary} type="button" onClick={onBackToPlanning}>Voltar ao planejamento</button>
          </div>
        </div>
      )}
    </section>
  )}</LocalizedTree>;
}
