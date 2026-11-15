"use client";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useRef } from "react";
import { sciencePoints } from "@/data/science-points";
import { nasaLayers } from "@/data/map-layers";
import { distanceLabel, mapCoordinateLabel } from "@/lib/mars/exploration";
import type { ViewMemory } from "@/lib/mars/map-view";
import { useExplorationLibrary } from "./useExplorationLibrary";
import { useExplorationRecords } from "./useExplorationRecords";
import u from "../ui.module.css";
import s from "../map.module.css";

const TerrainMap = dynamic(() => import("./LeafletCanvas"), { ssr: false, loading: () => <div className={s.loading}>Carregando mapa…</div> });

export function ExplorationLibraryDetail() {
  const params = useParams<{ id: string }>();
  const id = decodeURIComponent(params.id);
  const { items, ready } = useExplorationLibrary();
  const { records } = useExplorationRecords();
  const memory = useRef<ViewMemory["current"]>({});
  const item = items.find((entry) => entry.id === id);
  if (!ready) return <main id="main" className={`${u.page} ${s.marsMapsApp}`}><p role="status">Carregando exploração…</p></main>;
  if (!item) return <main id="main" className={`${u.page} ${s.marsMapsApp}`}><Link href="/mars-maps/library" className={s.libraryBack}><ArrowLeft size={15} /> Biblioteca</Link><h1>Exploração não encontrada</h1><p>Este registro pode ter sido excluído ou o navegador não contém a biblioteca original.</p></main>;
  const selected = sciencePoints.find((point) => point.id === item.regionId) ?? sciencePoints[0];
  const associatedMissions = records.missions.filter((mission) => item.missionIds.includes(mission.id));
  return <main id="main" className={`${u.page} ${s.explorer} ${s.marsMapsApp} ${s.libraryDetail}`}>
    <Link className={s.libraryBack} href="/mars-maps/library"><ArrowLeft size={15} /> Biblioteca de Explorações</Link>
    <section className={s.libraryDetailIntro}><div><span className={s.libraryStatus}>{item.status}</span><h1>{item.name}</h1><p>{item.regionName} · {item.routeMode === "terrain" ? "Rota pelo terreno" : "Rota direta"}</p></div><span className={u.badge}>{distanceLabel(item.route)}</span></section>
    <section className={s.libraryDetailGrid}>
      <article className={s.reviewCard}><h2>Informações gerais</h2><dl className={s.reportList}><div><dt>Origem</dt><dd>{item.route.origin.name}</dd></div><div><dt>Coordenadas</dt><dd>{mapCoordinateLabel(item.route.origin.coordinate)}</dd></div><div><dt>Destino</dt><dd>{item.route.destination.name}</dd></div><div><dt>Coordenadas</dt><dd>{mapCoordinateLabel(item.route.destination.coordinate)}</dd></div><div><dt>Distância estimada</dt><dd>{distanceLabel(item.route)}</dd></div><div><dt>Região</dt><dd>{item.regionName}</dd></div><div><dt>Criada</dt><dd>{new Date(item.createdAt).toLocaleString("pt-BR")}</dd></div><div><dt>Última análise</dt><dd>{new Date(item.analyzedAt).toLocaleString("pt-BR")}</dd></div><div><dt>Última atualização</dt><dd>{new Date(item.updatedAt).toLocaleString("pt-BR")}</dd></div></dl></article>
      <article className={`${s.reviewCard} ${s.libraryDetailMap}`}><h2>Mapa da exploração</h2><p className={s.small}>Pontos e rota recuperados com as coordenadas salvas.</p><TerrainMap layer={nasaLayers[0]} selected={selected} onSelect={() => {}} showPoints origin={item.route.origin} destination={item.route.destination} showRoute personalMarkers={records.markers.filter((marker) => item.markerIds.includes(marker.id))} routeMode={item.routeMode} terrainPlan={item.route.terrain} onLayerError={() => {}} viewMemory={memory} recordsReady /></article>
      <article className={s.reviewCard}><h2>Análise</h2><dl className={s.reportList}><div><dt>Situação</dt><dd>Exploração analisada e salva</dd></div><div><dt>Marcadores próprios utilizados</dt><dd>{item.analysis.markerCount}</dd></div><div><dt>Missões associadas no salvamento</dt><dd>{item.analysis.missionCount}</dd></div>{item.analysis.terrain && <div><dt>Subida / descida estimada</dt><dd>{Math.round(item.analysis.terrain.ascentMetres)} m / {Math.round(item.analysis.terrain.descentMetres)} m</dd></div>}<div><dt>Tempo de percurso</dt><dd>Não estimado pelo sistema</dd></div></dl><p className={s.small}>A distância e os valores do modelo de terreno são estimativas educativas, sem validação operacional de segurança ou transitabilidade.</p></article>
      <article className={s.reviewCard}><h2>Missões associadas</h2>{item.missions.length ? <ul className={s.libraryMissionList}>{item.missions.map((mission) => <li key={mission.id}><strong>{mission.name}</strong><span>{mission.objective}</span><small>{associatedMissions.some((saved) => saved.id === mission.id) ? "Missão atualizada disponível" : "Registro da missão não está mais disponível; dados do salvamento"}</small></li>)}</ul> : <p className={s.small}>Nenhuma missão associada ao salvar esta exploração.</p>}</article>
    </section>
  </main>;
}
