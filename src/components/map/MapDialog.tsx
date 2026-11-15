"use client";
import { useEffect, useRef, type ReactNode } from "react";
import s from "../map.module.css";
import u from "../ui.module.css";
export function MapDialog({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current!;
    dialog.showModal();
    return () => dialog.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className={s.dialog}
      aria-labelledby="map-dialog-title"
      onCancel={onClose}
      onClose={onClose}
    >
      <div className={u.row}>
        <h2 id="map-dialog-title">{title}</h2>
        <button
          type="button"
          className={u.choice}
          onClick={onClose}
          aria-label="Fechar formulário"
        >
          Fechar
        </button>
      </div>
      {children}
    </dialog>
  );
}
