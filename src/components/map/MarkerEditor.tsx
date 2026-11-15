"use client";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  markerCategories,
  mapCoordinateLabel,
  manualCoordinate,
  type PersonalMarker,
  type MarkerDraft,
} from "@/lib/mars/exploration";
import type { MarsCoordinate } from "@/lib/mars/coordinates";
import { MapDialog } from "./MapDialog";
import u from "../ui.module.css";
import s from "../map.module.css";
export function MarkerEditor({
  marker,
  onSave,
  onClose,
  error,
  onPickPosition,
  onPreview,
  canPickPosition = false,
}: {
  marker: MarkerDraft;
  error?: string;
  onSave: (marker: PersonalMarker) => void;
  onClose: () => void;
  onPickPosition?: (marker: MarkerDraft) => void;
  onPreview?: (coordinate?: MarsCoordinate) => void;
  canPickPosition?: boolean;
}) {
  const [draft, setDraft] = useState(marker);
  const [method, setMethod] = useState(
    marker.layerId === "manual" || !marker.coordinate ? "manual" : "map",
  );
  const [latitude, setLatitude] = useState(
    marker.coordinate?.latitude.toString() ?? "",
  );
  const [longitude, setLongitude] = useState(
    marker.coordinate?.longitude.toString() ?? "",
  );
  const coordinate = useMemo(
    () =>
      method === "manual"
        ? manualCoordinate(latitude, longitude)
        : marker.coordinate,
    [method, latitude, longitude, marker.coordinate],
  );
  useEffect(() => {
    if (!onPreview) return;
    const timer = setTimeout(() => onPreview(coordinate), 300);
    return () => clearTimeout(timer);
  }, [coordinate, onPreview]);
  function submit(event: FormEvent) {
    event.preventDefault();
    if (draft.name.trim() && coordinate)
      onSave({
        ...draft,
        coordinate,
        layerId: method === "manual" ? "manual" : draft.layerId,
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
        <fieldset className={s.locationFields}>
          <legend>Localização em Marte</legend>
          <p className={s.small}>Um marcador registra um lugar escolhido por você. Depois de salvá-lo, ele pode ser selecionado como origem ou destino.</p>
          <div className={s.methodChoices}>
            <label>
              <input
                type="radio"
                name="marker-location"
                checked={method === "map"}
                onChange={() => setMethod("map")}
              />{" "}
              Posição no mapa
            </label>
            <label>
              <input
                type="radio"
                name="marker-location"
                checked={method === "manual"}
                onChange={() => setMethod("manual")}
              />{" "}
              Coordenadas manuais
            </label>
          </div>
          {method === "manual" ? (
            <>
              <p id="coordinate-format" className={s.small}>
                Graus decimais, com ponto ou vírgula. Latitude de −90 a 90;
                longitude positiva para leste, de −180 a 360. Exemplo em Jezero:
                18,45 e 77,40.
              </p>
              <div className={s.coordinateFields}>
                <label>
                  Latitude
                  <input
                    required
                    className={u.field}
                    inputMode="decimal"
                    aria-describedby="coordinate-format coordinate-status"
                    aria-invalid={
                      !!latitude && !manualCoordinate(latitude, "0")
                    }
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    placeholder="18,45"
                  />
                </label>
                <label>
                  Longitude
                  <input
                    required
                    className={u.field}
                    inputMode="decimal"
                    aria-describedby="coordinate-format coordinate-status"
                    aria-invalid={
                      !!longitude && !manualCoordinate("0", longitude)
                    }
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    placeholder="77,40"
                  />
                </label>
              </div>
              <p id="coordinate-status" className={s.small} role="status">
                {coordinate
                  ? "Posição válida. A prévia aparece na base disponível; confirme os dados antes de salvar."
                  : "Informe latitude e longitude válidas para continuar."}
              </p>
            </>
          ) : (
            <>
              <p className={s.small}>
                {coordinate
                  ? "Posição selecionada no mapa. Você pode escolher outro ponto."
                  : "Selecione uma posição no mapa para continuar."}
              </p>
              {onPickPosition && (
                <button
                  type="button"
                  className={u.choice}
                  disabled={!canPickPosition}
                  onClick={() => onPickPosition({ ...draft, coordinate })}
                >
                  Selecionar posição no mapa
                </button>
              )}
              {!canPickPosition && onPickPosition && (
                <p className={s.small}>
                  Selecione uma base NASA disponível ou use coordenadas manuais.
                </p>
              )}
            </>
          )}
          {coordinate && (
            <p className={s.coordinateValue}>
              {mapCoordinateLabel(coordinate)}
            </p>
          )}
          <p className={s.small}>
            {method === "manual"
              ? "Posição informada pelo usuário; sem validação de campo."
              : "Coordenadas obtidas na grade da base " +
                draft.layerId +
                ". Precisão limitada à base; posição de campo não validada."}
          </p>
        </fieldset>
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
        <div className={s.coordinateFields}>
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
          <label className={s.visitedField}>
            <input
              type="checkbox"
              checked={draft.visited}
              onChange={(e) =>
                setDraft({ ...draft, visited: e.target.checked })
              }
            />{" "}
            Ponto visitado
          </label>
        </div>
        <button
          className={u.button}
          type="submit"
          disabled={!draft.name.trim() || !coordinate}
        >
          Salvar marcador
        </button>
      </form>
    </MapDialog>
  );
}
