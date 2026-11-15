"use client";
import { useEffect, useState } from "react";
import {
  emptyRecords,
  parseRecords,
  STORAGE_KEY,
  type ExplorationRecords,
} from "@/lib/mars/exploration";
export function useExplorationRecords() {
  const [records, setRecords] = useState(emptyRecords);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      // Hydrate browser-only records after SSR without writing defaults over saved data.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRecords(raw ? parseRecords(raw) : emptyRecords);
      setReady(true);
    } catch {
      setError(
        "Não foi possível ler os registros locais. Os dados existentes foram preservados; recarregue após verificar o armazenamento do navegador.",
      );
    }
    const sync = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY) return;
      try {
        setRecords(
          event.newValue ? parseRecords(event.newValue) : emptyRecords,
        );
        setError("");
        setReady(true);
      } catch {
        setReady(false);
        setError(
          "Os registros de outra aba são incompatíveis. Recarregue para verificar os dados.",
        );
      }
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);
  function save(next: ExplorationRecords): boolean {
    if (!ready) return false;
    try {
      // Refuse to overwrite changes from another tab that have not been rendered yet.
      const current = localStorage.getItem(STORAGE_KEY);
      const latest = current ? parseRecords(current) : emptyRecords;
      if (JSON.stringify(latest) !== JSON.stringify(records)) {
        setRecords(latest);
        setError(
          "Outra aba atualizou seus registros. Confira os dados e salve novamente.",
        );
        return false;
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setRecords(next);
      setError("");
      return true;
    } catch {
      setError(
        "Não foi possível salvar no navegador. Verifique espaço e permissões; o formulário continua aberto.",
      );
      return false;
    }
  }
  return { records, ready, error, save };
}
