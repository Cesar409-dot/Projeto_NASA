"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowLeft, Search, Trash2, Pencil, MapPinned } from "lucide-react";
import { distanceLabel } from "@/lib/mars/exploration";
import { useExplorationLibrary } from "./useExplorationLibrary";
import u from "../ui.module.css";
import s from "../map.module.css";

export function ExplorationLibrary() {
  const { items, ready, error, save } = useExplorationLibrary();
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState<"updated" | "created">("updated");
  const regions = [...new Set(items.map((item) => item.regionName))].sort();
  const shown = useMemo(() => items.filter((item) =>
    item.name.toLocaleLowerCase("pt-BR").includes(query.toLocaleLowerCase("pt-BR")) &&
    (!region || item.regionName === region) && (!status || item.status === status),
  ).sort((a, b) => sort === "created" ? b.createdAt.localeCompare(a.createdAt) : b.updatedAt.localeCompare(a.updatedAt)), [items, query, region, status, sort]);
  function rename(id: string, current: string) {
    const name = window.prompt("Novo nome da exploração", current)?.trim();
    if (!name || name === current) return;
    save(items.map((item) => item.id === id ? { ...item, name: name.slice(0, 100), updatedAt: new Date().toISOString() } : item));
  }
  function remove(id: string, name: string) {
    if (window.confirm(`Excluir “${name}” da biblioteca? Os marcadores e missões independentes serão mantidos.`)) save(items.filter((item) => item.id !== id));
  }
  return <main id="main" className={`${u.page} ${s.explorer} ${s.marsMapsApp} ${s.libraryPage}`}>
    <section className={s.libraryIntro}>
      <div><Link className={s.libraryBack} href="/mars-maps"><ArrowLeft size={15} /> Voltar ao mapa</Link><h1>Biblioteca de Explorações</h1><p>Consulte, compare e abra novamente as rotas que você salvou.</p></div>
      <span className={u.badge}>{ready ? items.length : "…"} EXPLORAÇÕES</span>
    </section>
    <p className={s.libraryStorageNote}>Os registros ficam armazenados neste navegador e permanecem após recarregar a página. Eles não são sincronizados entre dispositivos.</p>
    {error && <p className={s.mapAlert} role="alert">{error}</p>}
    <section className={s.libraryFilters} aria-label="Pesquisar e filtrar explorações">
      <label className={s.librarySearch}><Search size={16} /><input aria-label="Pesquisar pelo nome" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Pesquisar pelo nome" /></label>
      <label>Região<select className={u.field} aria-label="Filtrar por região" value={region} onChange={(event) => setRegion(event.target.value)}><option value="">Todas</option>{regions.map((item) => <option key={item}>{item}</option>)}</select></label>
      <label>Situação<select className={u.field} aria-label="Filtrar por situação" value={status} onChange={(event) => setStatus(event.target.value)}><option value="">Todas</option><option value="analisada">Analisada</option></select></label>
      <label>Ordenar por<select className={u.field} aria-label="Ordenar explorações" value={sort} onChange={(event) => setSort(event.target.value as "created" | "updated")}><option value="updated">Atualização recente</option><option value="created">Criação recente</option></select></label>
    </section>
    {!ready ? <p role="status" className={s.emptyState}>Carregando biblioteca…</p> : !shown.length ? <div className={s.libraryEmpty}><MapPinned size={30} /><h2>{items.length ? "Nenhuma exploração encontrada" : "Você ainda não possui explorações salvas"}</h2><p>{items.length ? "Ajuste a pesquisa ou os filtros para ver outros percursos." : "Planeje uma nova exploração, analise os resultados e salve seu percurso para consultá-lo posteriormente."}</p>{!items.length && <Link className={u.button} href="/mars-maps">Planejar nova exploração</Link>}</div> : <section className={s.libraryGrid} aria-label="Explorações salvas">{shown.map((item) => <article className={s.libraryCard} key={item.id}>
      <div className={s.libraryCardHead}><span className={s.libraryStatus}>{item.status}</span><span>{item.routeMode === "terrain" ? "Rota pelo terreno" : "Rota direta"}</span></div>
      <h2>{item.name}</h2><p className={s.small}>{item.regionName}</p>
      <dl className={s.libraryMetrics}><div><dt>Origem</dt><dd>{item.route.origin.name}</dd></div><div><dt>Destino</dt><dd>{item.route.destination.name}</dd></div><div><dt>Distância estimada</dt><dd>{distanceLabel(item.route)}</dd></div><div><dt>Missões associadas</dt><dd>{item.missions.length ? item.missions.map((mission) => mission.name).join(", ") : "Nenhuma"}</dd></div><div><dt>Criada</dt><dd>{new Date(item.createdAt).toLocaleDateString("pt-BR")}</dd></div><div><dt>Analisada</dt><dd>{new Date(item.analyzedAt).toLocaleDateString("pt-BR")}</dd></div><div><dt>Última atualização</dt><dd>{new Date(item.updatedAt).toLocaleDateString("pt-BR")}</dd></div></dl>
      <div className={s.libraryCardActions}><Link className={u.button} href={`/mars-maps/library/${encodeURIComponent(item.id)}`}>Visualizar detalhes</Link><Link className={u.choice} href={`/mars-maps?open=${encodeURIComponent(item.id)}`}>Abrir novamente</Link><button className={u.choice} type="button" aria-label={`Editar nome de ${item.name}`} onClick={() => rename(item.id, item.name)}><Pencil size={14} /> Renomear</button><button className={u.choice} type="button" aria-label={`Excluir ${item.name}`} onClick={() => remove(item.id, item.name)}><Trash2 size={14} /> Excluir</button></div>
    </article>)}</section>}
  </main>;
}
