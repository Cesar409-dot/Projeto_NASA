"use client";
import { useEffect, useState } from "react";
import { EXPLORATION_LIBRARY_KEY, readExplorationLibrary, type LibraryExploration } from "@/lib/mars/exploration-library";

export function useExplorationLibrary() {
  const [items, setItems] = useState<LibraryExploration[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    try {
      // Hydrate this browser-only store after SSR; do not overwrite saved records with an empty server snapshot.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setItems(readExplorationLibrary(localStorage.getItem(EXPLORATION_LIBRARY_KEY)));
      setReady(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível ler a biblioteca local.");
    }
    const sync = (event: StorageEvent) => {
      if (event.key !== null && event.key !== EXPLORATION_LIBRARY_KEY) return;
      try {
        setItems(readExplorationLibrary(event.newValue)); setReady(true); setError("");
      } catch { setError("A biblioteca mudou em outra aba e contém dados incompatíveis."); }
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);
  function save(next: LibraryExploration[]) {
    if (!ready) return false;
    try {
      const current = readExplorationLibrary(localStorage.getItem(EXPLORATION_LIBRARY_KEY));
      if (JSON.stringify(current) !== JSON.stringify(items)) {
        setItems(current); setError("Outra aba atualizou a biblioteca. Confira e tente novamente."); return false;
      }
      localStorage.setItem(EXPLORATION_LIBRARY_KEY, JSON.stringify(next));
      setItems(next); setError(""); return true;
    } catch {
      setError("Não foi possível gravar a biblioteca neste navegador."); return false;
    }
  }
  return { items, ready, error, save };
}
