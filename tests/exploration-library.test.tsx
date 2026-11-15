import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { sciencePoints } from "@/data/science-points";
import { EXPLORATION_LIBRARY_KEY, readExplorationLibrary } from "@/lib/mars/exploration-library";
import { ExplorationLibrary } from "@/components/map/ExplorationLibrary";

const entry = {
  id: "saved-1", name: "Rota de teste", regionId: "belva", regionName: "Cratera Belva",
  route: { origin: sciencePoints[0], destination: sciencePoints[2] }, routeMode: "direct" as const,
  markerIds: [], missionIds: [], missions: [], analysis: { markerCount: 0, missionCount: 0 },
  createdAt: "2026-11-01T10:00:00.000Z", analyzedAt: "2026-11-02T09:00:00.000Z", updatedAt: "2026-11-02T10:00:00.000Z", status: "analisada" as const,
};

beforeEach(() => { localStorage.clear(); vi.restoreAllMocks(); });
afterEach(cleanup);

describe("Biblioteca de Explorações", () => {
  it("lê e persiste os registros no armazenamento local", () => {
    localStorage.setItem(EXPLORATION_LIBRARY_KEY, JSON.stringify([entry]));
    expect(readExplorationLibrary(localStorage.getItem(EXPLORATION_LIBRARY_KEY))).toEqual([entry]);
  });

  it("pesquisa, filtra, renomeia e exclui somente o registro da biblioteca", async () => {
    localStorage.setItem(EXPLORATION_LIBRARY_KEY, JSON.stringify([entry]));
    vi.spyOn(window, "prompt").mockReturnValue("Rota renomeada");
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<ExplorationLibrary />);
    expect(await screen.findByRole("heading", { name: "Rota de teste" })).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Pesquisar pelo nome"), { target: { value: "inexistente" } });
    expect(screen.getByText("Nenhuma exploração encontrada")).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Pesquisar pelo nome"), { target: { value: "Rota" } });
    fireEvent.click(screen.getByRole("button", { name: "Editar nome de Rota de teste" }));
    await waitFor(() => expect(JSON.parse(localStorage.getItem(EXPLORATION_LIBRARY_KEY) ?? "[]")[0].name).toBe("Rota renomeada"));
    fireEvent.click(screen.getByRole("button", { name: "Excluir Rota renomeada" }));
    await waitFor(() => expect(JSON.parse(localStorage.getItem(EXPLORATION_LIBRARY_KEY) ?? "[]").length).toBe(0));
  });

  it("recusa dados incompatíveis sem substituir o conteúdo bruto", () => {
    const malformed = "[{oops]";
    expect(() => readExplorationLibrary(malformed)).toThrow();
    expect(malformed).toBe("[{oops]");
  });
});
