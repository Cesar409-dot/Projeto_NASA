import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { ScientificExplorer } from "@/components/map/ScientificExplorer";
import {
  STORAGE_KEY,
  parseRecords,
  routeDistance,
} from "@/lib/mars/exploration";
import { sciencePoints } from "@/data/science-points";
vi.mock("@/components/map/useLayerHealth", () => ({
  useLayerHealth: () => ({
    health: {
      ctx: { state: "ready" },
      hirise: { state: "ready" },
      "ctx-regional": { state: "ready" },
      mola: { state: "ready" },
    },
    fail: vi.fn(),
    retry: vi.fn(),
  }),
}));
vi.mock("next/dynamic", () => ({
  default: () =>
    function Canvas(props: {
      adding: boolean;
      onPosition: (p: (typeof sciencePoints)[0]["coordinate"]) => void;
      origin?: { name: string };
      destination?: { name: string };
    }) {
      return (
        <div
          data-testid="map"
          data-origin={props.origin?.name}
          data-destination={props.destination?.name}
        >
          <button
            disabled={!props.adding}
            onClick={() =>
              props.onPosition({
                ...sciencePoints[0].coordinate,
                latitude: 18.45,
                longitude: 77.4,
              })
            }
          >
            Selecionar posição de teste
          </button>
        </div>
      );
    },
}));
beforeEach(() => {
  localStorage.clear();
  HTMLDialogElement.prototype.showModal = vi.fn(function (
    this: HTMLDialogElement,
  ) {
    this.setAttribute("open", "");
  });
  HTMLDialogElement.prototype.close = vi.fn();
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
function addMarker() {
  fireEvent.click(screen.getByRole("button", { name: "Adicionar marcador" }));
  fireEvent.click(
    screen.getByRole("button", { name: "Selecionar posição de teste" }),
  );
  fireEvent.change(screen.getByLabelText("Nome do marcador"), {
    target: { value: "Amostra A" },
  });
  fireEvent.change(screen.getByLabelText("Categoria"), {
    target: { value: "Ciência" },
  });
  fireEvent.click(screen.getByLabelText("Ponto visitado"));
  fireEvent.click(screen.getByRole("button", { name: "Salvar marcador" }));
}
function planRoute() {
  fireEvent.change(screen.getByLabelText("Origem"), {
    target: { value: "belva" },
  });
  fireEvent.change(screen.getByLabelText("Destino"), {
    target: { value: "neretva" },
  });
}
function fillMission(name = "Coleta no delta") {
  fireEvent.change(screen.getByLabelText("Nome da missão"), {
    target: { value: name },
  });
  fireEvent.change(screen.getByLabelText("Objetivo"), {
    target: { value: "Investigar sedimentos" },
  });
  fireEvent.change(screen.getByLabelText("Data planejada"), {
    target: { value: "2026-12-01" },
  });
}
describe("Mars Maps: exploração persistente", { timeout: 20000 }, () => {
  it("creates, reloads, edits and deletes a visited marker, including custom route endpoints", () => {
    const first = render(<ScientificExplorer />);
    addMarker();
    const marker = parseRecords(localStorage.getItem(STORAGE_KEY)!).markers[0];
    expect(marker.visited).toBe(true);
    expect(marker.category).toBe("Ciência");
    expect(marker.coordinate.latitude).toBe(18.45);
    fireEvent.change(screen.getByLabelText("Origem"), {
      target: { value: marker.id },
    });
    fireEvent.change(screen.getByLabelText("Destino"), {
      target: { value: "belva" },
    });
    expect(screen.getByTestId("map").getAttribute("data-origin")).toBe(
      "Amostra A",
    );
    first.unmount();
    render(<ScientificExplorer />);
    fireEvent.click(
      screen.getByRole("button", { name: "Editar marcador Amostra A" }),
    );
    fireEvent.change(screen.getByLabelText("Nome do marcador"), {
      target: { value: "Amostra B" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Salvar marcador" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Excluir marcador Amostra B" }),
    );
    expect(
      parseRecords(localStorage.getItem(STORAGE_KEY)!).markers,
    ).toHaveLength(0);
  });
  it("validates routes, creates a mission in a modal, restores its snapshot and edits/deletes it", () => {
    const view = render(<ScientificExplorer />);
    fireEvent.click(screen.getByRole("button", { name: "Cadastrar missão" }));
    fillMission();
    expect(
      (
        screen.getByRole("button", {
          name: "Salvar missão",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
    expect(
      screen.getByText(/Selecione origem e destino diferentes/),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Fechar formulário" }));
    planRoute();
    fireEvent.click(screen.getByRole("button", { name: "Cadastrar missão" }));
    fillMission();
    fireEvent.click(screen.getByRole("button", { name: "Salvar missão" }));
    const mission = parseRecords(localStorage.getItem(STORAGE_KEY)!)
      .missions[0];
    expect(mission.route.origin.id).toBe("belva");
    expect(routeDistance(mission.route)).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("button", { name: "Limpar rota" }));
    fireEvent.click(screen.getByRole("button", { name: "Coleta no delta" }));
    expect(screen.getByTestId("map").getAttribute("data-origin")).toBe(
      sciencePoints[0].name,
    );
    view.unmount();
    render(<ScientificExplorer />);
    fireEvent.click(screen.getByRole("button", { name: "Coleta no delta" }));
    fireEvent.click(screen.getByRole("button", { name: "Limpar rota" }));
    expect(screen.getByTestId("map").getAttribute("data-origin")).toBeNull();
    fireEvent.click(
      screen.getByRole("button", { name: "Editar missão Coleta no delta" }),
    );
    fireEvent.change(screen.getByLabelText("Nome da missão"), {
      target: { value: "Análise do delta" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Salvar missão" }));
    expect(
      parseRecords(localStorage.getItem(STORAGE_KEY)!).missions[0].name,
    ).toBe("Análise do delta");
    fireEvent.click(
      screen.getByRole("button", { name: "Excluir missão Análise do delta" }),
    );
    expect(
      parseRecords(localStorage.getItem(STORAGE_KEY)!).missions,
    ).toHaveLength(0);
  });
  it("preserves a mission snapshot after its custom marker is deleted", () => {
    render(<ScientificExplorer />);
    addMarker();
    const marker = parseRecords(localStorage.getItem(STORAGE_KEY)!).markers[0];
    fireEvent.change(screen.getByLabelText("Origem"), {
      target: { value: marker.id },
    });
    fireEvent.change(screen.getByLabelText("Destino"), {
      target: { value: "belva" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Cadastrar missão" }));
    fillMission();
    fireEvent.click(screen.getByRole("button", { name: "Salvar missão" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Excluir marcador Amostra A" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Coleta no delta" }));
    expect(screen.getByTestId("map").getAttribute("data-origin")).toBe(
      "Amostra A",
    );
  });
  it("does not invent coordinates on the local image or overwrite damaged records", () => {
    localStorage.setItem(STORAGE_KEY, "dados danificados");
    render(<ScientificExplorer />);
    fireEvent.click(
      screen.getByRole("radio", { name: /Imagem oficial local/ }),
    );
    expect(
      (
        screen.getByRole("button", {
          name: "Adicionar marcador",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
    expect(screen.getByRole("alert")).toBeTruthy();
    expect(localStorage.getItem(STORAGE_KEY)).toBe("dados danificados");
  });
  it("retains the form when storage is full", () => {
    render(<ScientificExplorer />);
    planRoute();
    fireEvent.click(screen.getByRole("button", { name: "Cadastrar missão" }));
    fillMission();
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota");
    });
    fireEvent.click(screen.getByRole("button", { name: "Salvar missão" }));
    expect(
      within(screen.getByRole("dialog")).getByRole("alert").textContent,
    ).toContain("Não foi possível salvar");
    expect(
      (screen.getByLabelText("Nome da missão") as HTMLInputElement).value,
    ).toBe("Coleta no delta");
  });
});
