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
  type MissionRoute,
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
      layer?: { id: string };
      showRoute: boolean;
      routeFocus?: string;
      origin?: { name: string };
      destination?: { name: string };
      focusCoordinate?: { latitude: number; longitude: number };
      previewCoordinate?: { latitude: number; longitude: number };
    }) {
      return (
        <div
          data-testid="map"
          data-layer-id={props.layer?.id}
          data-route-id={props.routeFocus}
          data-route-visible={props.showRoute}
          data-origin={props.origin?.name}
          data-destination={props.destination?.name}
          data-focus={JSON.stringify(props.focusCoordinate)}
          data-preview={JSON.stringify(props.previewCoordinate)}
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
describe("Coordenadas manuais e retomada do rascunho", () => {
  it("valida, mostra a prévia, persiste e usa um marcador global em uma rota", async () => {
    const view = render(<ScientificExplorer />);
    fireEvent.click(
      screen.getByRole("button", { name: "Informar coordenadas" }),
    );
    fireEvent.change(screen.getByLabelText("Nome do marcador"), {
      target: { value: "Ponto global" },
    });
    fireEvent.change(screen.getByLabelText("Latitude"), {
      target: { value: "91" },
    });
    fireEvent.change(screen.getByLabelText("Longitude"), {
      target: { value: "270" },
    });
    fireEvent.submit(
      screen.getByLabelText("Nome do marcador").closest("form")!,
    );
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    fireEvent.change(screen.getByLabelText("Latitude"), {
      target: { value: "-12,5" },
    });
    await vi.waitFor(() => {
      expect(screen.getByTestId("map").getAttribute("data-layer-id")).toBe(
        "mola",
      );
      expect(
        JSON.parse(screen.getByTestId("map").getAttribute("data-preview")!),
      ).toMatchObject({ latitude: -12.5, longitude: -90 });
    });
    fireEvent.click(screen.getByRole("button", { name: "Salvar marcador" }));
    const marker = parseRecords(localStorage.getItem(STORAGE_KEY)!).markers[0];
    expect(marker.layerId).toBe("manual");
    view.unmount();
    render(<ScientificExplorer />);
    fireEvent.change(screen.getByLabelText("Origem"), {
      target: { value: marker.id },
    });
    fireEvent.change(screen.getByLabelText("Destino"), {
      target: { value: "belva" },
    });
    expect(screen.getByTestId("map").getAttribute("data-layer-id")).toBe(
      "mola",
    );
    expect(screen.getByTestId("map").getAttribute("data-origin")).toBe(
      "Ponto global",
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Ver no mapa Ponto global" }),
    );
    expect(
      JSON.parse(screen.getByTestId("map").getAttribute("data-focus")!),
    ).toEqual(marker.coordinate);
  });
  it("mantém os campos ao escolher outra posição no mapa e ao cancelar essa escolha", () => {
    render(<ScientificExplorer />);
    fireEvent.click(
      screen.getByRole("button", { name: "Informar coordenadas" }),
    );
    fireEvent.change(screen.getByLabelText("Nome do marcador"), {
      target: { value: "Rascunho preservado" },
    });
    fireEvent.change(screen.getByLabelText("Descrição"), {
      target: { value: "Coleta planejada" },
    });
    fireEvent.click(screen.getByLabelText("Posição no mapa"));
    fireEvent.click(
      screen.getByRole("button", { name: "Selecionar posição no mapa" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Cancelar marcador" }));
    expect(
      (screen.getByLabelText("Nome do marcador") as HTMLInputElement).value,
    ).toBe("Rascunho preservado");
    fireEvent.click(screen.getByLabelText("Posição no mapa"));
    fireEvent.click(
      screen.getByRole("button", { name: "Selecionar posição no mapa" }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Selecionar posição de teste" }),
    );
    expect(
      (screen.getByLabelText("Descrição") as HTMLTextAreaElement).value,
    ).toBe("Coleta planejada");
    fireEvent.click(screen.getByRole("button", { name: "Salvar marcador" }));
    expect(
      parseRecords(localStorage.getItem(STORAGE_KEY)!).markers[0],
    ).toMatchObject({
      name: "Rascunho preservado",
      description: "Coleta planejada",
      layerId: "ctx",
      coordinate: { latitude: 18.45, longitude: 77.4 },
    });
  });
});
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

describe("Cadastro de missões", { timeout: 20000 }, () => {
  it.each(["Nome da missão", "Objetivo", "Data planejada"])(
    "exige o campo %s antes de salvar",
    (field) => {
      render(<ScientificExplorer />);
      planRoute();
      fireEvent.click(screen.getByRole("button", { name: "Cadastrar missão" }));
      fillMission();
      const input = screen.getByLabelText(field) as HTMLInputElement;
      expect(input.required).toBe(true);
      fireEvent.change(input, {
        target: { value: field === "Data planejada" ? "" : "   " },
      });
      expect(
        (
          screen.getByRole("button", {
            name: "Salvar missão",
          }) as HTMLButtonElement
        ).disabled,
      ).toBe(true);
      fireEvent.submit(input.closest("form")!);
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
      expect(screen.getByRole("dialog")).toBeTruthy();
      fireEvent.change(input, {
        target: {
          value: field === "Data planejada" ? "2026-12-01" : "Campo preenchido",
        },
      });
      expect(
        (
          screen.getByRole("button", {
            name: "Salvar missão",
          }) as HTMLButtonElement
        ).disabled,
      ).toBe(false);
    },
  );
  it("salva os campos preenchidos e a rota selecionada e apresenta a missão imediatamente", () => {
    const view = render(<ScientificExplorer />);
    planRoute();
    fireEvent.click(screen.getByRole("button", { name: "Cadastrar missão" }));
    const dialog = screen.getByRole("dialog");
    expect(dialog.getAttribute("aria-labelledby")).toBe("map-dialog-title");
    expect(
      within(dialog).getByText(/Cratera Belva → Neretva Vallis/),
    ).toBeTruthy();
    fillMission("  Reconhecimento do delta  ");
    fireEvent.change(within(dialog).getByLabelText("Objetivo"), {
      target: { value: "  Observar depósitos sedimentares  " },
    });
    fireEvent.change(within(dialog).getByLabelText("Descrição"), {
      target: { value: "  Registro planejado pelo astronauta.  " },
    });
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Salvar missão" }),
    );
    expect(screen.queryByRole("dialog")).toBeNull();
    const stored = parseRecords(localStorage.getItem(STORAGE_KEY)!);
    expect(stored.missions).toHaveLength(1);
    expect(stored.missions[0]).toMatchObject({
      name: "Reconhecimento do delta",
      objective: "Observar depósitos sedimentares",
      description: "Registro planejado pelo astronauta.",
      date: "2026-12-01",
      route: {
        origin: { id: "belva", coordinate: sciencePoints[0].coordinate },
        destination: { id: "neretva", coordinate: sciencePoints[1].coordinate },
      },
    });
    const list = screen.getByRole("region", { name: "Minhas missões" });
    expect(
      within(list).getByRole("button", { name: "Reconhecimento do delta" }),
    ).toBeTruthy();
    expect(list.textContent).toContain("Observar depósitos sedimentares");
    expect(list.textContent).toContain("01/12/2026");
    expect(list.textContent).toContain("Origem: Cratera Belva");
    expect(list.textContent).toContain("Destino: Neretva Vallis");
    expect(list.textContent).toContain("Distância estimada: ≈");
    view.unmount();
    render(<ScientificExplorer />);
    expect(
      screen.getByRole("button", { name: "Reconhecimento do delta" }),
    ).toBeTruthy();
  });
  it("descarta o rascunho ao fechar ou cancelar o modal e permite cadastrar sem descrição", () => {
    render(<ScientificExplorer />);
    planRoute();
    const write = vi.spyOn(Storage.prototype, "setItem");
    fireEvent.click(screen.getByRole("button", { name: "Cadastrar missão" }));
    fillMission("Rascunho fechado");
    fireEvent.click(screen.getByRole("button", { name: "Fechar formulário" }));
    fireEvent.click(screen.getByRole("button", { name: "Cadastrar missão" }));
    expect(
      (screen.getByLabelText("Nome da missão") as HTMLInputElement).value,
    ).toBe("");
    fillMission("Rascunho cancelado");
    fireEvent(
      screen.getByRole("dialog"),
      new Event("cancel", { bubbles: true, cancelable: true }),
    );
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(write).not.toHaveBeenCalled();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Cadastrar missão" }));
    fillMission("Missão sem descrição");
    fireEvent.click(screen.getByRole("button", { name: "Salvar missão" }));
    expect(
      parseRecords(localStorage.getItem(STORAGE_KEY)!).missions[0].description,
    ).toBe("");
  });
  it("bloqueia a submissão com apenas a origem selecionada e orienta a completar a rota", () => {
    render(<ScientificExplorer />);
    fireEvent.change(screen.getByLabelText("Origem"), {
      target: { value: "belva" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Cadastrar missão" }));
    fillMission();
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByRole("status").textContent).toContain(
      "Selecione origem e destino diferentes",
    );
    expect(
      (
        within(dialog).getByRole("button", {
          name: "Salvar missão",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
    fireEvent.submit(screen.getByLabelText("Nome da missão").closest("form")!);
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(screen.getByRole("dialog")).toBeTruthy();
  });
  it("permite repetir um cadastro que falhou sem duplicar nem sobrescrever missões existentes", () => {
    render(<ScientificExplorer />);
    planRoute();
    fireEvent.click(screen.getByRole("button", { name: "Cadastrar missão" }));
    fillMission("Missão original");
    fireEvent.click(screen.getByRole("button", { name: "Salvar missão" }));
    const original = localStorage.getItem(STORAGE_KEY)!;
    const existing = parseRecords(original).missions[0];
    fireEvent.click(screen.getByRole("button", { name: "Cadastrar missão" }));
    fillMission("Segunda missão");
    vi.spyOn(Storage.prototype, "setItem").mockImplementationOnce(() => {
      throw new Error("QuotaExceededError");
    });
    fireEvent.click(screen.getByRole("button", { name: "Salvar missão" }));
    expect(localStorage.getItem(STORAGE_KEY)).toBe(original);
    expect(within(screen.getByRole("dialog")).getByRole("alert")).toBeTruthy();
    expect(
      (screen.getByLabelText("Nome da missão") as HTMLInputElement).value,
    ).toBe("Segunda missão");
    fireEvent.click(screen.getByRole("button", { name: "Salvar missão" }));
    const saved = parseRecords(localStorage.getItem(STORAGE_KEY)!).missions;
    expect(saved).toHaveLength(2);
    expect(saved[0]).toEqual(existing);
    expect(saved[1].name).toBe("Segunda missão");
    expect(saved[1].id).not.toBe(existing.id);
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.queryByRole("alert")).toBeNull();
  });
});

describe(
  "Integração de marcadores e missões com rotas",
  { timeout: 20000 },
  () => {
    function seedRouteMission(savedRoute?: MissionRoute) {
      const markers = ["Marco alfa", "Marco beta"].map((name, index) => ({
        id: "personal-route-" + index,
        name,
        description: "Registro pessoal",
        category: "Exploração" as const,
        visited: false,
        layerId: "ctx",
        coordinate: {
          ...sciencePoints[0].coordinate,
          latitude: 18.45 + index * 0.01,
          longitude: 77.4 + index * 0.01,
        },
      }));
      const mission = {
        id: "mission-route",
        name: "Missão entre marcadores",
        objective: "Comparar registros pessoais",
        description: "",
        date: "2026-12-01",
        route: savedRoute ?? {
          origin: structuredClone(markers[0]),
          destination: structuredClone(markers[1]),
        },
      };
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ version: 1, markers, missions: [mission] }),
      );
      return { markers, mission };
    }
    it("usa dois marcadores próprios como extremos, impede duplicação, inverte e cadastra a rota invertida", () => {
      const { markers } = seedRouteMission();
      render(<ScientificExplorer />);
      fireEvent.change(screen.getByLabelText("Origem"), {
        target: { value: markers[0].id },
      });
      expect(
        (
          within(screen.getByLabelText("Destino")).getByRole("option", {
            name: "Marco alfa",
          }) as HTMLOptionElement
        ).disabled,
      ).toBe(true);
      fireEvent.change(screen.getByLabelText("Destino"), {
        target: { value: markers[1].id },
      });
      const distanceBefore = screen
        .getAllByText(/^≈ /)
        .map((element) => element.textContent);
      expect(distanceBefore.length).toBeGreaterThan(0);
      expect(screen.getByTestId("map").getAttribute("data-origin")).toBe(
        "Marco alfa",
      );
      expect(screen.getByTestId("map").getAttribute("data-destination")).toBe(
        "Marco beta",
      );
      fireEvent.click(screen.getByRole("button", { name: "Inverter" }));
      expect((screen.getByLabelText("Origem") as HTMLSelectElement).value).toBe(
        markers[1].id,
      );
      expect(
        (screen.getByLabelText("Destino") as HTMLSelectElement).value,
      ).toBe(markers[0].id);
      expect(
        screen.getAllByText(/^≈ /).map((element) => element.textContent),
      ).toEqual(distanceBefore);
      fireEvent.click(screen.getByRole("button", { name: "Cadastrar missão" }));
      fillMission("Rota invertida");
      fireEvent.click(screen.getByRole("button", { name: "Salvar missão" }));
      const saved = parseRecords(
        localStorage.getItem(STORAGE_KEY)!,
      ).missions.find((m) => m.name === "Rota invertida")!;
      expect(saved.route.origin).toEqual(markers[1]);
      expect(saved.route.destination).toEqual(markers[0]);
    });
    it("destaca a rota salva mesmo se oculta e remove o destaque ao planejar ou limpar, sem alterar a missão", () => {
      const { mission } = seedRouteMission();
      render(<ScientificExplorer />);
      fireEvent.click(screen.getByLabelText("Mostrar conexão"));
      expect(screen.getByTestId("map").getAttribute("data-route-visible")).toBe(
        "false",
      );
      fireEvent.click(screen.getByRole("button", { name: mission.name }));
      expect(screen.getByTestId("map").getAttribute("data-route-visible")).toBe(
        "true",
      );
      expect(screen.getByTestId("map").getAttribute("data-route-id")).toBe(
        mission.id,
      );
      expect(screen.getByTestId("map").getAttribute("data-origin")).toBe(
        "Marco alfa",
      );
      planRoute();
      expect(
        screen.getByTestId("map").getAttribute("data-route-id"),
      ).toBeNull();
      expect(screen.getByTestId("map").getAttribute("data-origin")).toBe(
        sciencePoints[0].name,
      );
      fireEvent.click(screen.getByRole("button", { name: mission.name }));
      fireEvent.click(screen.getByRole("button", { name: "Limpar rota" }));
      expect(screen.getByTestId("map").getAttribute("data-origin")).toBeNull();
      expect(
        screen.getByTestId("map").getAttribute("data-route-id"),
      ).toBeNull();
      expect(
        parseRecords(localStorage.getItem(STORAGE_KEY)!).missions[0],
      ).toEqual(mission);
    });
    it("troca a rota de uma missão somente após escolher a rota atual e salvar a edição", () => {
      const { mission } = seedRouteMission();
      render(<ScientificExplorer />);
      planRoute();
      fireEvent.click(
        screen.getByRole("button", { name: "Editar missão " + mission.name }),
      );
      const dialog = screen.getByRole("dialog");
      expect(within(dialog).getByText(/Marco alfa → Marco beta/)).toBeTruthy();
      fireEvent.click(
        within(dialog).getByRole("button", { name: "Usar rota atual do mapa" }),
      );
      expect(
        within(dialog).getByText(/Cratera Belva → Neretva Vallis/),
      ).toBeTruthy();
      expect(
        parseRecords(localStorage.getItem(STORAGE_KEY)!).missions[0],
      ).toEqual(mission);
      fireEvent.click(
        within(dialog).getByRole("button", { name: "Salvar missão" }),
      );
      const missions = parseRecords(
        localStorage.getItem(STORAGE_KEY)!,
      ).missions;
      expect(missions).toHaveLength(1);
      expect(missions[0].id).toBe(mission.id);
      expect(missions[0].route).toEqual({
        origin: sciencePoints[0],
        destination: sciencePoints[1],
      });
      fireEvent.click(screen.getByRole("button", { name: mission.name }));
      expect(screen.getByTestId("map").getAttribute("data-origin")).toBe(
        sciencePoints[0].name,
      );
    });
    it.each(["ctx-regional", "mola"])(
      "seleciona a cobertura %s ao carregar uma missão fora da base local",
      (layerId) => {
        const global = layerId === "mola";
        const origin = {
          id: "simulated-origin",
          name: "Origem simulada",
          coordinate: {
            ...sciencePoints[0].coordinate,
            latitude: global ? 0 : 18.5,
            longitude: global ? 0 : 78,
          },
        };
        const destination = {
          id: "simulated-destination",
          name: "Destino simulado",
          coordinate: {
            ...origin.coordinate,
            latitude: origin.coordinate.latitude + 0.1,
            longitude: origin.coordinate.longitude + 0.1,
          },
        };
        const { mission } = seedRouteMission({ origin, destination });
        render(<ScientificExplorer />);
        expect(screen.getByTestId("map").getAttribute("data-layer-id")).toBe(
          "ctx",
        );
        fireEvent.click(screen.getByRole("button", { name: mission.name }));
        expect(screen.getByTestId("map").getAttribute("data-layer-id")).toBe(
          layerId,
        );
        expect(screen.getByTestId("map").getAttribute("data-origin")).toBe(
          origin.name,
        );
        expect(screen.getByTestId("map").getAttribute("data-destination")).toBe(
          destination.name,
        );
      },
    );
    it("restaura a rota em planejamento ao excluir a missão destacada e preserva os marcadores", () => {
      const { markers, mission } = seedRouteMission();
      render(<ScientificExplorer />);
      planRoute();
      fireEvent.click(screen.getByRole("button", { name: mission.name }));
      expect(screen.getByTestId("map").getAttribute("data-route-id")).toBe(
        mission.id,
      );
      fireEvent.click(
        screen.getByRole("button", { name: "Excluir missão " + mission.name }),
      );
      expect(
        screen.getByTestId("map").getAttribute("data-route-id"),
      ).toBeNull();
      expect(screen.getByTestId("map").getAttribute("data-origin")).toBe(
        sciencePoints[0].name,
      );
      expect(screen.getByTestId("map").getAttribute("data-destination")).toBe(
        sciencePoints[1].name,
      );
      const records = parseRecords(localStorage.getItem(STORAGE_KEY)!);
      expect(records.missions).toEqual([]);
      expect(records.markers).toEqual(markers);
    });
  },
);

describe("Sincronização da missão destacada", () => {
  it("atualiza a rota selecionada quando outra aba edita a missão e remove o destaque quando ela é excluída", () => {
    const mission = {
      id: "mission-sync",
      name: "Missão sincronizada",
      objective: "Revisar a rota",
      description: "",
      date: "2026-12-01",
      route: { origin: sciencePoints[0], destination: sciencePoints[1] },
    };
    const records = { version: 1, markers: [], missions: [mission] };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    render(<ScientificExplorer />);
    fireEvent.click(screen.getByRole("button", { name: mission.name }));
    expect(screen.getByTestId("map").getAttribute("data-origin")).toBe(
      sciencePoints[0].name,
    );
    const updated = {
      ...records,
      missions: [
        {
          ...mission,
          route: { origin: sciencePoints[1], destination: sciencePoints[0] },
        },
      ],
    };
    function notify(value: typeof records) {
      const raw = JSON.stringify(value);
      localStorage.setItem(STORAGE_KEY, raw);
      fireEvent(
        window,
        new StorageEvent("storage", {
          key: STORAGE_KEY,
          newValue: raw,
          storageArea: localStorage,
        }),
      );
    }
    notify(updated);
    expect(screen.getByTestId("map").getAttribute("data-origin")).toBe(
      sciencePoints[1].name,
    );
    expect(screen.getByTestId("map").getAttribute("data-destination")).toBe(
      sciencePoints[0].name,
    );
    notify({ ...records, missions: [] });
    expect(screen.getByTestId("map").getAttribute("data-route-id")).toBeNull();
    expect(screen.getByTestId("map").getAttribute("data-origin")).toBeNull();
    expect(screen.queryByRole("button", { name: mission.name })).toBeNull();
  });
});
