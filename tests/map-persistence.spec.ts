import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, renderHook } from "@testing-library/react";
import { createElement, StrictMode, type ReactNode } from "react";
import { useExplorationRecords } from "@/components/map/useExplorationRecords";
import {
  emptyRecords,
  parseRecords,
  STORAGE_KEY,
  type ExplorationRecords,
} from "@/lib/mars/exploration";
import { sciencePoints } from "@/data/science-points";
function recordsFixture(): ExplorationRecords {
  const marker = {
    id: "personal-persistence",
    name: "Ponto persistido",
    description: "Anotação pessoal",
    category: "Ciência" as const,
    visited: true,
    layerId: "ctx",
    coordinate: { ...sciencePoints[0].coordinate },
  };
  return {
    version: 1,
    markers: [marker],
    missions: [
      {
        id: "mission-persistence",
        name: "Missão persistida",
        objective: "Comparar observações",
        description: "Planejamento local",
        date: "2026-12-01",
        route: {
          origin: structuredClone(marker),
          destination: structuredClone(sciencePoints[1]),
        },
      },
    ],
  };
}
function remoteRecords(records: ExplorationRecords | null) {
  const newValue = records ? JSON.stringify(records) : null;
  if (newValue === null) localStorage.removeItem(STORAGE_KEY);
  else localStorage.setItem(STORAGE_KEY, newValue);
  act(() => {
    window.dispatchEvent(
      new StorageEvent("storage", {
        key: STORAGE_KEY,
        newValue,
        storageArea: localStorage,
      }),
    );
  });
}
beforeEach(() => localStorage.clear());
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
describe("Persistência local de Mars Maps", () => {
  it("hidrata o estado vazio sem gravar padrões nem alterar dados de outras frentes, mesmo em StrictMode", () => {
    localStorage.setItem("outra-frente", "preservar");
    const write = vi.spyOn(Storage.prototype, "setItem");
    const { result } = renderHook(useExplorationRecords, {
      wrapper: ({ children }: { children: ReactNode }) =>
        createElement(StrictMode, null, children),
    });
    expect(result.current.ready).toBe(true);
    expect(result.current.records).toEqual(emptyRecords);
    expect(write).not.toHaveBeenCalled();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(localStorage.getItem("outra-frente")).toBe("preservar");
  });
  it("restaura marcadores, estado visitado e missões com cópia da rota após salvar e remontar", () => {
    const expected = recordsFixture();
    const { result, unmount } = renderHook(useExplorationRecords);
    act(() => {
      expect(result.current.save(expected)).toBe(true);
    });
    expect(parseRecords(localStorage.getItem(STORAGE_KEY)!)).toEqual(expected);
    unmount();
    const write = vi.spyOn(Storage.prototype, "setItem");
    const restored = renderHook(useExplorationRecords);
    expect(restored.result.current.records).toEqual(expected);
    expect(write).not.toHaveBeenCalled();
    act(() => {
      expect(restored.result.current.save({ ...expected, markers: [] })).toBe(
        true,
      );
    });
    expect(
      parseRecords(localStorage.getItem(STORAGE_KEY)!).missions[0].route,
    ).toEqual(expected.missions[0].route);
  });
  it.each([
    ["JSON inválido", "{dados interrompidos"],
    [
      "versão incompatível",
      JSON.stringify({ version: 99, markers: [], missions: [] }),
    ],
    [
      "coordenadas de outro planeta",
      JSON.stringify({
        ...recordsFixture(),
        markers: [
          {
            ...recordsFixture().markers[0],
            coordinate: { ...sciencePoints[0].coordinate, body: "Earth" },
          },
        ],
      }),
    ],
  ])("preserva %s e bloqueia gravações", (_label, raw) => {
    localStorage.setItem(STORAGE_KEY, raw);
    const write = vi.spyOn(Storage.prototype, "setItem");
    const { result } = renderHook(useExplorationRecords);
    expect(result.current.ready).toBe(false);
    expect(result.current.error).toContain("Não foi possível ler");
    act(() => {
      expect(result.current.save(recordsFixture())).toBe(false);
    });
    expect(write).not.toHaveBeenCalled();
    expect(localStorage.getItem(STORAGE_KEY)).toBe(raw);
  });
  it("não sobrescreve dados quando o navegador impede a leitura do armazenamento", () => {
    const original = JSON.stringify(recordsFixture());
    localStorage.setItem(STORAGE_KEY, original);
    const read = vi
      .spyOn(Storage.prototype, "getItem")
      .mockImplementation(() => {
        throw new Error("SecurityError");
      });
    const write = vi.spyOn(Storage.prototype, "setItem");
    const { result } = renderHook(useExplorationRecords);
    expect(result.current.ready).toBe(false);
    act(() => {
      expect(result.current.save(emptyRecords)).toBe(false);
    });
    expect(write).not.toHaveBeenCalled();
    read.mockRestore();
    expect(localStorage.getItem(STORAGE_KEY)).toBe(original);
  });
  it("mantém o estado anterior em falha de escrita e permite repetir o salvamento", () => {
    const original = recordsFixture();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(original));
    const { result } = renderHook(useExplorationRecords);
    const updated = structuredClone(original);
    updated.markers[0].visited = false;
    vi.spyOn(Storage.prototype, "setItem").mockImplementationOnce(() => {
      throw new Error("QuotaExceededError");
    });
    act(() => {
      expect(result.current.save(updated)).toBe(false);
    });
    expect(result.current.records).toEqual(original);
    expect(parseRecords(localStorage.getItem(STORAGE_KEY)!)).toEqual(original);
    expect(result.current.error).toContain("Não foi possível salvar");
    act(() => {
      expect(result.current.save(updated)).toBe(true);
    });
    expect(result.current.records).toEqual(updated);
    expect(result.current.error).toBe("");
  });
  it("recebe alterações de outra aba sem regravar e ignora chaves de outros módulos", () => {
    const { result } = renderHook(useExplorationRecords);
    act(() => {
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: "outra-frente",
          newValue: "incompatível",
        }),
      );
    });
    expect(result.current.error).toBe("");
    expect(result.current.records).toEqual(emptyRecords);
    const write = vi.spyOn(Storage.prototype, "setItem");
    const remote = recordsFixture();
    remoteRecords(remote);
    expect(result.current.records).toEqual(remote);
    expect(write).toHaveBeenCalledTimes(1);
    remoteRecords(null);
    expect(result.current.records).toEqual(emptyRecords);
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
  it("bloqueia uma atualização inválida de outra aba e recupera com um evento válido", () => {
    const original = recordsFixture();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(original));
    const { result } = renderHook(useExplorationRecords);
    localStorage.setItem(STORAGE_KEY, "arquivo inválido");
    act(() => {
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: STORAGE_KEY,
          newValue: "arquivo inválido",
        }),
      );
    });
    expect(result.current.ready).toBe(false);
    expect(result.current.records).toEqual(original);
    act(() => {
      expect(result.current.save(emptyRecords)).toBe(false);
    });
    expect(localStorage.getItem(STORAGE_KEY)).toBe("arquivo inválido");
    remoteRecords(original);
    expect(result.current.ready).toBe(true);
    expect(result.current.error).toBe("");
  });
  it.each(["alteração", "remoção"])(
    "não sobrescreve uma %s de outra aba mesmo antes de receber o evento",
    (operation) => {
      const original = recordsFixture();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(original));
      const { result } = renderHook(useExplorationRecords);
      const remote = structuredClone(original);
      remote.markers[0].name = "Nome de outra aba";
      if (operation === "remoção") localStorage.removeItem(STORAGE_KEY);
      else localStorage.setItem(STORAGE_KEY, JSON.stringify(remote));
      const latest = localStorage.getItem(STORAGE_KEY);
      const write = vi.spyOn(Storage.prototype, "setItem");
      act(() => {
        expect(result.current.save(original)).toBe(false);
      });
      expect(write).not.toHaveBeenCalled();
      expect(localStorage.getItem(STORAGE_KEY)).toBe(latest);
      expect(result.current.records).toEqual(
        operation === "remoção" ? emptyRecords : remote,
      );
      expect(result.current.error).toContain("Outra aba atualizou");
    },
  );
});
