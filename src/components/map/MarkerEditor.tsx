"use client";
import { useState, type FormEvent } from "react";
import { markerCategories, type PersonalMarker } from "@/lib/mars/exploration";
import { MapDialog } from "./MapDialog";
import u from "../ui.module.css";
import s from "../map.module.css";
export function MarkerEditor({
  marker,
  onSave,
  onClose,
  error,
}: {
  marker: PersonalMarker;
  error?: string;
  onSave: (marker: PersonalMarker) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState(marker);
  function submit(event: FormEvent) {
    event.preventDefault();
    if (draft.name.trim())
      onSave({
        ...draft,
        name: draft.name.trim(),
        description: draft.description.trim(),
      });
  }
  return (
    <MapDialog
      title={marker.name ? "Editar marcador" : "Novo marcador"}
      onClose={onClose}
    >
      {error && <p role="alert">{error}</p>}
      <form onSubmit={submit} className={s.form}>
        <label>
          Nome do marcador
          <input
            autoFocus
            required
            maxLength={120}
            className={u.field}
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          />
        </label>
        <label>
          Descrição
          <textarea
            maxLength={3000}
            className={u.field}
            value={draft.description}
            onChange={(e) =>
              setDraft({ ...draft, description: e.target.value })
            }
          />
        </label>
        <label>
          Categoria
          <select
            className={u.field}
            value={draft.category}
            onChange={(e) =>
              setDraft({
                ...draft,
                category: e.target.value as PersonalMarker["category"],
              })
            }
          >
            {markerCategories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label>
          <input
            type="checkbox"
            checked={draft.visited}
            onChange={(e) => setDraft({ ...draft, visited: e.target.checked })}
          />{" "}
          Ponto visitado
        </label>
        <p className={s.small}>
          Coordenadas obtidas na grade marciana:{" "}
          {draft.coordinate.latitude.toFixed(5)}° N,{" "}
          {draft.coordinate.longitude.toFixed(5)}° E. Base: {draft.layerId}.
          Precisão limitada à base; posição de campo não validada.
        </p>
        <button
          className={u.choice}
          type="submit"
          disabled={!draft.name.trim()}
        >
          Salvar marcador
        </button>
      </form>
    </MapDialog>
  );
}
