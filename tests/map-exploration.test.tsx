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

describe("Cadastro de marcadores", { timeout: 20000 }, () => {
  function openMarkerForm() {
    fireEvent.click(screen.getByRole("button", { name: "Adicionar marcador" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Selecionar posição de teste" }),
    );
    return screen.getByRole("dialog");
  }
  it("aguarda a posição do mapa e exige um nome que não contenha apenas espaços", () => {
    render(<ScientificExplorer />);
    expect(
      (
        screen.getByRole("button", {
          name: "Selecionar posição de teste",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Adicionar marcador" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    fireEvent.click(
      screen.getByRole("button", { name: "Selecionar posição de teste" }),
    );
    const name = screen.getByLabelText("Nome do marcador");
    const save = screen.getByRole("button", {
      name: "Salvar marcador",
    }) as HTMLButtonElement;
    expect((name as HTMLInputElement).required).toBe(true);
    expect(save.disabled).toBe(true);
    fireEvent.change(name, { target: { value: "   " } });
    expect(save.disabled).toBe(true);
    fireEvent.submit(name.closest("form")!);
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(screen.getByRole("dialog")).toBeTruthy();
    fireEvent.change(name, { target: { value: "  Ponto inicial  " } });
    fireEvent.click(save);
    const records = parseRecords(localStorage.getItem(STORAGE_KEY)!);
    expect(records.markers).toHaveLength(1);
    expect(records.markers[0]).toMatchObject({
      name: "Ponto inicial",
      description: "",
      category: "Exploração",
      visited: false,
    });
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getByRole("heading", { name: "Ponto inicial" })).toBeTruthy();
  });
  it("salva os campos informados e mantém as coordenadas e a origem cartográfica", () => {
    render(<ScientificExplorer />);
    const dialog = openMarkerForm();
    const category = within(dialog).getByLabelText("Categoria");
    expect(
      within(category)
        .getAllByRole("option")
        .map((option) => option.textContent),
    ).toEqual(["Exploração", "Ciência", "Recursos", "Risco", "Pessoal"]);
    fireEvent.change(within(dialog).getByLabelText("Nome do marcador"), {
      target: { value: "  Afloramento oeste  " },
    });
    fireEvent.change(within(dialog).getByLabelText("Descrição"), {
      target: { value: "  Observação registrada pelo astronauta.  " },
    });
    fireEvent.change(category, { target: { value: "Risco" } });
    fireEvent.click(within(dialog).getByLabelText("Ponto visitado"));
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Salvar marcador" }),
    );
    const records = parseRecords(localStorage.getItem(STORAGE_KEY)!);
    expect(records.markers).toHaveLength(1);
    expect(records.markers[0]).toMatchObject({
      name: "Afloramento oeste",
      description: "Observação registrada pelo astronauta.",
      category: "Risco",
      visited: true,
      layerId: "ctx",
      coordinate: {
        body: "Mars",
        latitudeType: "planetocentric",
        longitudeDirection: "east",
        latitude: 18.45,
        longitude: 77.4,
      },
    });
    expect(
      screen.getByRole("heading", { name: "Afloramento oeste" }),
    ).toBeTruthy();
    expect(
      screen.getAllByRole("option", { name: "Afloramento oeste" }),
    ).toHaveLength(2);
  });
  it("cancela a seleção ou fecha o formulário sem cadastrar um marcador", () => {
    render(<ScientificExplorer />);
    fireEvent.click(screen.getByRole("button", { name: "Adicionar marcador" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancelar marcador" }));
    expect(
      (
        screen.getByRole("button", {
          name: "Selecionar posição de teste",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
    openMarkerForm();
    fireEvent.change(screen.getByLabelText("Nome do marcador"), {
      target: { value: "Rascunho cancelado" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Fechar formulário" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(
      screen.queryByRole("heading", { name: "Rascunho cancelado" }),
    ).toBeNull();
  });
  it("preserva o formulário quando a gravação falha e permite tentar novamente sem duplicar", () => {
    render(<ScientificExplorer />);
    openMarkerForm();
    fireEvent.change(screen.getByLabelText("Nome do marcador"), {
      target: { value: "Amostra para revisão" },
    });
    const storage = vi
      .spyOn(Storage.prototype, "setItem")
      .mockImplementationOnce(() => {
        throw new Error("QuotaExceededError");
      });
    fireEvent.click(screen.getByRole("button", { name: "Salvar marcador" }));
    expect(
      within(screen.getByRole("dialog")).getByRole("alert").textContent,
    ).toContain("Não foi possível salvar");
    expect(
      (screen.getByLabelText("Nome do marcador") as HTMLInputElement).value,
    ).toBe("Amostra para revisão");
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Salvar marcador" }));
    expect(storage).toHaveBeenCalledTimes(2);
    expect(
      parseRecords(localStorage.getItem(STORAGE_KEY)!).markers,
    ).toHaveLength(1);
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});

describe("Edição e exclusão de marcadores", { timeout: 20000 }, () => {
  function seedMarkers() {
    const markers = ["Ponto norte", "Ponto sul"].map((name, index) => ({
      id: "personal-test-" + index,
      name,
      description: "Descrição original",
      category: "Pessoal" as const,
      visited: true,
      layerId: "ctx",
      coordinate: {
        ...sciencePoints[0].coordinate,
        latitude: 18.44 + index * 0.01,
        longitude: 77.4,
      },
    }));
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: 1, markers, missions: [] }),
    );
    return markers;
  }
  it("edita os campos, preserva identificação e coordenadas e restaura a alteração após recarregar", () => {
    const original = seedMarkers();
    const view = render(<ScientificExplorer />);
    fireEvent.change(screen.getByLabelText("Origem"), {
      target: { value: original[0].id },
    });
    fireEvent.change(screen.getByLabelText("Destino"), {
      target: { value: "neretva" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Editar marcador Ponto norte" }),
    );
    expect(
      (screen.getByLabelText("Nome do marcador") as HTMLInputElement).value,
    ).toBe("Ponto norte");
    expect(
      (screen.getByLabelText("Descrição") as HTMLTextAreaElement).value,
    ).toBe("Descrição original");
    fireEvent.change(screen.getByLabelText("Nome do marcador"), {
      target: { value: "  Ponto revisado  " },
    });
    fireEvent.change(screen.getByLabelText("Descrição"), {
      target: { value: "  Observação revisada  " },
    });
    fireEvent.change(screen.getByLabelText("Categoria"), {
      target: { value: "Recursos" },
    });
    fireEvent.click(screen.getByLabelText("Ponto visitado"));
    fireEvent.click(screen.getByRole("button", { name: "Salvar marcador" }));
    const records = parseRecords(localStorage.getItem(STORAGE_KEY)!);
    expect(records.markers).toHaveLength(2);
    expect(records.markers[0]).toEqual({
      ...original[0],
      name: "Ponto revisado",
      description: "Observação revisada",
      category: "Recursos",
      visited: false,
    });
    expect(records.markers[1]).toEqual(original[1]);
    expect(screen.getByTestId("map").getAttribute("data-origin")).toBe(
      "Ponto revisado",
    );
    view.unmount();
    render(<ScientificExplorer />);
    expect(
      screen.getByRole("heading", { name: "Ponto revisado" }),
    ).toBeTruthy();
    expect(
      within(screen.getByLabelText("Origem")).getByRole("option", {
        name: "Ponto revisado",
      }),
    ).toBeTruthy();
  });
  it("descarta alterações ao cancelar uma edição, sem gravar ou alterar o registro existente", () => {
    seedMarkers();
    const before = localStorage.getItem(STORAGE_KEY);
    render(<ScientificExplorer />);
    const write = vi.spyOn(Storage.prototype, "setItem");
    fireEvent.click(
      screen.getByRole("button", { name: "Editar marcador Ponto norte" }),
    );
    fireEvent.change(screen.getByLabelText("Nome do marcador"), {
      target: { value: "Edição cancelada" },
    });
    fireEvent.change(screen.getByLabelText("Categoria"), {
      target: { value: "Risco" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Fechar formulário" }));
    expect(write).not.toHaveBeenCalled();
    expect(localStorage.getItem(STORAGE_KEY)).toBe(before);
    expect(screen.getByRole("heading", { name: "Ponto norte" })).toBeTruthy();
    expect(
      screen.queryByRole("heading", { name: "Edição cancelada" }),
    ).toBeNull();
  });
  it("exclui somente o marcador escolhido, limpa a rota que o usa e mantém os pontos oficiais", () => {
    const markers = seedMarkers();
    const official = structuredClone(sciencePoints);
    const view = render(<ScientificExplorer />);
    fireEvent.change(screen.getByLabelText("Origem"), {
      target: { value: markers[0].id },
    });
    fireEvent.change(screen.getByLabelText("Destino"), {
      target: { value: "neretva" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Excluir marcador Ponto norte" }),
    );
    expect(parseRecords(localStorage.getItem(STORAGE_KEY)!).markers).toEqual([
      markers[1],
    ]);
    expect(screen.queryByRole("heading", { name: "Ponto norte" })).toBeNull();
    expect((screen.getByLabelText("Origem") as HTMLSelectElement).value).toBe(
      "",
    );
    expect((screen.getByLabelText("Destino") as HTMLSelectElement).value).toBe(
      "",
    );
    expect(screen.getByTestId("map").getAttribute("data-origin")).toBeNull();
    view.unmount();
    render(<ScientificExplorer />);
    expect(screen.getByRole("heading", { name: "Ponto sul" })).toBeTruthy();
    expect(
      within(screen.getByLabelText("Origem")).queryByRole("option", {
        name: "Ponto norte",
      }),
    ).toBeNull();
    for (const point of official) {
      expect(
        within(screen.getByLabelText("Origem")).getByRole("option", {
          name: point.name,
        }),
      ).toBeTruthy();
      expect(
        screen.queryByRole("button", { name: "Editar marcador " + point.name }),
      ).toBeNull();
      expect(
        screen.queryByRole("button", {
          name: "Excluir marcador " + point.name,
        }),
      ).toBeNull();
    }
    expect(sciencePoints).toEqual(official);
  });
  it.each(["edição", "exclusão"])(
    "preserva o registro quando a gravação da %s falha e permite tentar novamente",
    (operation) => {
      const markers = seedMarkers();
      const before = localStorage.getItem(STORAGE_KEY);
      render(<ScientificExplorer />);
      vi.spyOn(Storage.prototype, "setItem").mockImplementationOnce(() => {
        throw new Error("QuotaExceededError");
      });
      if (operation === "edição") {
        fireEvent.click(
          screen.getByRole("button", { name: "Editar marcador Ponto norte" }),
        );
        fireEvent.change(screen.getByLabelText("Nome do marcador"), {
          target: { value: "Nome revisado" },
        });
        fireEvent.click(
          screen.getByRole("button", { name: "Salvar marcador" }),
        );
        expect(
          within(screen.getByRole("dialog")).getByRole("alert"),
        ).toBeTruthy();
        expect(
          (screen.getByLabelText("Nome do marcador") as HTMLInputElement).value,
        ).toBe("Nome revisado");
      } else {
        fireEvent.click(
          screen.getByRole("button", { name: "Excluir marcador Ponto norte" }),
        );
        expect(screen.getByRole("alert")).toBeTruthy();
      }
      expect(localStorage.getItem(STORAGE_KEY)).toBe(before);
      expect(screen.getByRole("heading", { name: "Ponto norte" })).toBeTruthy();
      fireEvent.click(
        screen.getByRole("button", {
          name:
            operation === "edição"
              ? "Salvar marcador"
              : "Excluir marcador Ponto norte",
        }),
      );
      const remaining = parseRecords(
        localStorage.getItem(STORAGE_KEY)!,
      ).markers;
      if (operation === "edição")
        expect(remaining).toEqual([
          { ...markers[0], name: "Nome revisado" },
          markers[1],
        ]);
      else expect(remaining).toEqual([markers[1]]);
      expect(screen.queryByRole("alert")).toBeNull();
    },
  );
});
