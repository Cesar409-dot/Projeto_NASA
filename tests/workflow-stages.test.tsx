import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ScientificExplorer } from "@/components/map/ScientificExplorer";
import { sciencePoints } from "@/data/science-points";
import { EXPLORATION_LIBRARY_KEY } from "@/lib/mars/exploration-library";

vi.mock("@/components/map/useLayerHealth", () => ({
  useLayerHealth: () => ({ health: { mola: { state: "ready" } }, fail: vi.fn(), retry: vi.fn() }),
}));
vi.mock("next/dynamic", () => ({
  default: () => function MockMap(props: { origin?: { name: string }; destination?: { name: string }; showRoute: boolean }) {
    return <div data-testid="workflow-map" data-guide="map" data-origin={props.origin?.name} data-destination={props.destination?.name} data-route-visible={props.showRoute} />;
  },
}));

beforeEach(() => localStorage.clear());
afterEach(() => { cleanup(); vi.restoreAllMocks(); window.history.replaceState(null, "", "/mars-maps"); });

describe("fluxo planejamento, exploração e análise", () => {
  it("bloqueia o avanço sem rota e preserva os pontos ao navegar para frente e para trás", async () => {
    render(<ScientificExplorer />);
    expect(screen.getByRole("navigation", { name: "Navegação do Mars Maps" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Mind Space" }).getAttribute("href")).toBe("/mind-space");
    expect(screen.getByRole("link", { name: "Mars Greenhouse" }).getAttribute("href")).toBe("/mars-greenhouse");
    expect(screen.getAllByRole("heading", { name: "Meus marcadores" }).length).toBe(1);
    expect(screen.queryByRole("heading", { name: "Minhas missões" })).toBeNull();
    const start = screen.getByRole("button", { name: /Iniciar exploração/ });
    expect((start as HTMLButtonElement).disabled).toBe(true);
    await waitFor(() => expect((screen.getByRole("button", { name: "Adicionar marcador" }) as HTMLButtonElement).disabled).toBe(false));

    fireEvent.change(screen.getByLabelText("Origem"), { target: { value: sciencePoints[0].id } });
    fireEvent.change(screen.getByLabelText("Destino"), { target: { value: sciencePoints[2].id } });
    expect((start as HTMLButtonElement).disabled).toBe(false);
    fireEvent.click(start);
    expect(screen.getByRole("heading", { name: "Sua Exploração" })).toBeTruthy();
    expect(screen.getByText("Rota planejada")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /Avançar para análise/ }));
    expect(screen.getByRole("tab", { name: "Relatório" })).toBeTruthy();
    expect(screen.getAllByText("Jezero · centro catalogado").length).toBeGreaterThan(0);
    expect(screen.getByTestId("workflow-map").getAttribute("data-destination")).toContain("Jezero");
    await waitFor(() => expect(localStorage.getItem("mars-maps:library:v1")).toBeNull());
    fireEvent.click(screen.getByRole("button", { name: "Salvar na biblioteca" }));
    const savedExplorations = JSON.parse(localStorage.getItem("mars-maps:library:v1") ?? "[]");
    expect(savedExplorations.length).toBe(1);
    expect(savedExplorations[0].route.origin.id).toBe(sciencePoints[0].id);
    expect(savedExplorations[0].route.destination.id).toBe(sciencePoints[2].id);
    expect(screen.getByText(/Exploração salva na biblioteca/)).toBeTruthy();

    fireEvent.click(screen.getByRole("tab", { name: "Marcadores" }));
    expect(screen.getByText("Origem · Local científico do catálogo")).toBeTruthy();
    expect(screen.getByText("Destino · Local científico do catálogo")).toBeTruthy();
    fireEvent.click(screen.getByRole("tab", { name: "Missões" }));
    expect(screen.getByText(/Nenhuma missão cadastrada para esta combinação/)).toBeTruthy();
    fireEvent.click(screen.getAllByRole("button", { name: "Voltar ao planejamento" })[0]);
    const missionManager = screen.getByText("Gerenciar missões salvas").closest("details");
    if (missionManager) missionManager.open = true;
    expect(screen.getByRole("heading", { name: "Missões salvas" })).toBeTruthy();

    expect((screen.getByLabelText("Origem") as HTMLSelectElement).value).toBe(sciencePoints[0].id);
    expect((screen.getByLabelText("Destino") as HTMLSelectElement).value).toBe(sciencePoints[2].id);
  });

  it("reabre uma exploração salva diretamente na análise com as coordenadas originais", async () => {
    const saved = {
      id: "reopen-me", name: "Rota salva", regionId: "belva", regionName: "Cratera Belva",
      route: { origin: sciencePoints[0], destination: sciencePoints[2] }, routeMode: "direct",
      markerIds: [], missionIds: [], missions: [], analysis: { markerCount: 0, missionCount: 0 },
      createdAt: "2026-11-01T10:00:00.000Z", analyzedAt: "2026-11-02T10:00:00.000Z", updatedAt: "2026-11-02T10:00:00.000Z", status: "analisada",
    };
    localStorage.setItem(EXPLORATION_LIBRARY_KEY, JSON.stringify([saved]));
    window.history.replaceState(null, "", "/mars-maps?open=reopen-me");
    render(<ScientificExplorer />);
    expect(await screen.findByRole("heading", { name: "Análise da Exploração" })).toBeTruthy();
    await waitFor(() => expect(screen.getByTestId("workflow-map").getAttribute("data-destination")).toContain("Jezero"));
    fireEvent.click(screen.getByRole("tab", { name: "Marcadores" }));
    expect(screen.getByText(/18\.41000° N, 77\.69000° E/)).toBeTruthy();
  });
});
