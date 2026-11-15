"use client";
import { useState, type FormEvent } from "react";
import {
  distanceLabel,
  mapCoordinateLabel,
  routeDistance,
  validDate,
  type MissionRoute,
  type SavedMission,
} from "@/lib/mars/exploration";
import { MapDialog } from "./MapDialog";
import u from "../ui.module.css";
import s from "../map.module.css";
type MissionDraft = Omit<SavedMission, "route"> & { route?: MissionRoute };
function MissionEditor({
  mission,
  currentRoute,
  onSave,
  onClose,
  error,
}: {
  mission: MissionDraft;
  error?: string;
  currentRoute?: MissionRoute;
  onSave: (mission: SavedMission) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState(mission);
  const valid = routeDistance(draft.route) !== null;
  function submit(e: FormEvent) {
    e.preventDefault();
    if (
      draft.route &&
      valid &&
      draft.name.trim() &&
      draft.objective.trim() &&
      validDate(draft.date)
    )
      onSave({
        ...draft,
        route: draft.route,
        name: draft.name.trim(),
        objective: draft.objective.trim(),
        description: draft.description.trim(),
      });
  }
  return (
    <MapDialog
      title={mission.name ? "Editar missão" : "Cadastrar missão"}
      onClose={onClose}
    >
      {error && <p role="alert">{error}</p>}
      <form onSubmit={submit} className={s.form}>
        <label>
          Nome da missão
          <input
            autoFocus
            className={u.field}
            required
            maxLength={120}
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          />
        </label>
        <label>
          Objetivo
          <input
            className={u.field}
            required
            maxLength={500}
            value={draft.objective}
            onChange={(e) => setDraft({ ...draft, objective: e.target.value })}
          />
        </label>
        <label>
          Descrição
          <textarea
            className={u.field}
            maxLength={3000}
            value={draft.description}
            onChange={(e) =>
              setDraft({ ...draft, description: e.target.value })
            }
          />
        </label>
        <label>
          Data planejada
          <input
            className={u.field}
            type="date"
            required
            value={draft.date}
            onChange={(e) => setDraft({ ...draft, date: e.target.value })}
          />
        </label>
        <div aria-live="polite">
          <strong>Rota selecionada</strong>
          {valid && draft.route ? (
            <p>
              {draft.route.origin.name} → {draft.route.destination.name} ·{" "}
              {distanceLabel(draft.route)}
            </p>
          ) : (
            <p role="status">
              Selecione origem e destino diferentes em “Planejar Marswalk”, ao
              lado do mapa, para cadastrar a missão.
            </p>
          )}
        </div>
        {currentRoute && routeDistance(currentRoute) !== null && (
          <button
            className={u.choice}
            type="button"
            onClick={() =>
              setDraft({ ...draft, route: structuredClone(currentRoute) })
            }
          >
            Usar rota atual do mapa
          </button>
        )}
        <p className={s.small}>
          Estimativa geométrica em Marte, sem relevo ou obstáculos. A linha não
          indica um trajeto operacionalmente seguro.
        </p>
        <button
          className={u.choice}
          type="submit"
          disabled={
            !valid ||
            !draft.name.trim() ||
            !draft.objective.trim() ||
            !validDate(draft.date)
          }
        >
          Salvar missão
        </button>
      </form>
    </MapDialog>
  );
}
export function MissionManager({
  missions,
  currentRoute,
  ready,
  activeId,
  onSave,
  onDelete,
  onSelect,
  error,
}: {
  missions: SavedMission[];
  error?: string;
  currentRoute?: MissionRoute;
  ready: boolean;
  activeId?: string;
  onSave: (m: SavedMission) => boolean;
  onDelete: (id: string) => void;
  onSelect: (m: SavedMission) => void;
}) {
  const [editing, setEditing] = useState<MissionDraft>();
  return (
    <section className={s.mission} aria-labelledby="missions-title">
      <div className={u.row}>
        <h2 id="missions-title">Minhas missões</h2>
        <button
          className={u.choice}
          disabled={!ready}
          onClick={() =>
            setEditing({
              id: crypto.randomUUID(),
              name: "",
              objective: "",
              description: "",
              date: "",
              route: currentRoute ? structuredClone(currentRoute) : undefined,
            })
          }
        >
          Cadastrar missão
        </button>
      </div>
      <p className={s.small}>
        Registros salvos apenas neste navegador. Selecionar uma missão destaca a
        cópia da rota salva, mesmo após alterações nos marcadores.
      </p>
      {!missions.length && <p>Nenhuma missão cadastrada.</p>}
      <div className={s.missionList}>
        {missions.map((m) => (
          <article key={m.id} className={s.record}>
            <button
              className={u.choice}
              aria-pressed={activeId === m.id}
              onClick={() => onSelect(m)}
            >
              {m.name}
            </button>
            <p>{m.objective}</p>
            <p>Data: {m.date.split("-").reverse().join("/")}</p>
            <p>
              Origem: {m.route.origin.name}
              <br />
              Destino: {m.route.destination.name}
              <br />
              Distância estimada: {distanceLabel(m.route)}
            </p>
            <details>
              <summary>Visualizar detalhes</summary>
              <p>{m.description || "Sem descrição."}</p>
              <p className={s.small}>
                Origem: {mapCoordinateLabel(m.route.origin.coordinate)}.
                <br />
                Destino: {mapCoordinateLabel(m.route.destination.coordinate)}.
              </p>
            </details>
            <div className={s.actions}>
              <button
                className={u.choice}
                aria-label={"Editar missão " + m.name}
                onClick={() => setEditing(structuredClone(m))}
              >
                Editar
              </button>
              <button
                className={u.choice}
                aria-label={"Excluir missão " + m.name}
                onClick={() => onDelete(m.id)}
              >
                Excluir
              </button>
            </div>
          </article>
        ))}
      </div>
      {editing && (
        <MissionEditor
          key={editing.id}
          mission={editing}
          error={error}
          currentRoute={currentRoute}
          onClose={() => setEditing(undefined)}
          onSave={(m) => {
            if (onSave(m)) setEditing(undefined);
          }}
        />
      )}
    </section>
  );
}
