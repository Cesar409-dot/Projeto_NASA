"use client";
import { LocalizedTree } from "@/components/LocalizedTree";
import { useRef, useState } from "react";
import { CircleMarker, Tooltip, useMapEvents } from "react-leaflet";
import type { LatLngExpression, Tooltip as LeafletTooltip } from "leaflet";
import s from "../map.module.css";

/** One transient tooltip at a time, including touch tooltips left open by Leaflet. */
export function PointTooltipControl() {
  const active = useRef<LeafletTooltip | undefined>(undefined);
  const close = () => {
    active.current?.close();
    active.current = undefined;
  };
  useMapEvents({
    tooltipopen(event) {
      if (active.current !== event.tooltip) active.current?.close();
      active.current = event.tooltip;
    },
    click: close,
    dragstart: close,
    zoomstart: close,
  });
  return null;
}

export function MapPointMarker({
  position,
  name,
  info,
  role,
  selected = false,
  personal = false,
  visited = false,
  adding,
  onActivate,
}: {
  position: LatLngExpression;
  name: string;
  info: string;
  role?: string;
  selected?: boolean;
  personal?: boolean;
  visited?: boolean;
  adding: boolean;
  onActivate?: () => void;
}) {
  const armed = useRef(false);
  const [touch, setTouch] = useState(false);
  return <LocalizedTree>{(
    <>
      {role && (
        <CircleMarker
          center={position}
          radius={13}
          interactive={false}
          pathOptions={{
            color: role === "Origem" ? "#a5ffe0" : "#8ed9ff",
            fill: false,
            weight: 3,
          }}
        />
      )}
      <CircleMarker
        center={position}
        radius={selected ? 10 : personal ? 8 : 7}
        bubblingMouseEvents={adding}
        pathOptions={{
          color: personal
            ? visited
              ? "#a5ffe0"
              : "#8ed9ff"
            : selected
              ? "#ffb38b"
              : "#efeee7",
          fillColor: personal ? "#2685b4" : "#f47b50",
          fillOpacity: 1,
          weight: 2,
        }}
        eventHandlers={{
          tooltipclose: () => {
            armed.current = false;
          },
          click(event) {
            if (adding) return;
            const original = event.originalEvent as MouseEvent & {
              pointerType?: string;
              sourceCapabilities?: { firesTouchEvents?: boolean };
            };
            const isTouch =
              original?.pointerType === "touch" ||
              original?.type.startsWith("touch") ||
              original?.sourceCapabilities?.firesTouchEvents ||
              window.matchMedia("(hover: none)").matches;
            if (isTouch && !armed.current) {
              armed.current = true;
              setTouch(true);
              return;
            }
            onActivate?.();
          },
        }}
      >
        {!adding && (
          <Tooltip direction="top" opacity={1} className={s.pointTooltip}>
            <strong>{name}</strong>
            <span>
              {role ? role + " · " : ""}
              {info}
            </span>
            {touch && onActivate && <span>Toque novamente para abrir.</span>}
          </Tooltip>
        )}
      </CircleMarker>
    </>
  )}</LocalizedTree>;
}
