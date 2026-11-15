import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { readFileSync } from "node:fs";
import { ScientificExplorer } from "@/components/map/ScientificExplorer";
import { decodeTerrainGrid } from "@/lib/mars/terrain-data";
import { findTerrainRoute, type TerrainPlan } from "@/lib/mars/terrain-routing";
import { sciencePoints } from "@/data/science-points";
import { parseRecords, STORAGE_KEY } from "@/lib/mars/exploration";
import type {
  TerrainRequest,
  TerrainResponse,
} from "@/lib/mars/terrain.worker";
import { useTerrainRoute } from "@/components/map/useTerrainRoute";
import { renderHook } from "@testing-library/react";

vi.mock("@/components/map/useLayerHealth", () => ({
  useLayerHealth: () => ({
    health: { mola: { state: "ready" } },
    fail: vi.fn(),
    retry: vi.fn(),
  }),
}));
vi.mock("next/dynamic", () => ({
  default: () =>
    function Canvas(props: {
      routeMode: string;
      terrainPlan?: TerrainPlan;
      origin?: { name: string };
      destination?: { name: string };
    }) {
      return (
        <div
          data-testid="terrain-map"
          data-mode={props.routeMode}
          data-plan={props.terrainPlan?.modelId}
          data-origin={props.origin?.name}
          data-destination={props.destination?.name}
        />
      );
    },
}));
class LocalWorker {
  static instances: LocalWorker[] = [];
  onmessage?: (event: MessageEvent<TerrainResponse>) => void;
  onerror?: () => void;
  request?: TerrainRequest;
  terminate = vi.fn();
  constructor() {
    LocalWorker.instances.push(this);
  }
  postMessage(request: TerrainRequest) {
    this.request = request;
  }
  respond(data: TerrainResponse) {
    this.onmessage?.({ data } as MessageEvent<TerrainResponse>);
  }
}
const bytes = readFileSync("public/terrain/jezero-ctx-100m-v1.bin");
const grid = decodeTerrainGrid(
  bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
);
const realPlan = findTerrainRoute(
  grid,
  sciencePoints[0].coordinate,
  sciencePoints[1].coordinate,
);
beforeEach(() => {
  localStorage.clear();
  LocalWorker.instances = [];
  vi.stubGlobal("Worker", LocalWorker);
  HTMLDialogElement.prototype.showModal = vi.fn(function (
    this: HTMLDialogElement,
  ) {
    this.setAttribute("open", "");
  });
  HTMLDialogElement.prototype.close = vi.fn();
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});
function plan() {
  fireEvent.change(screen.getByLabelText("Origem"), {
    target: { value: "belva" },
  });
  fireEvent.change(screen.getByLabelText("Destino"), {
    target: { value: "neretva" },
  });
  fireEvent.change(screen.getByLabelText("Tipo de rota"), {
    target: { value: "terrain" },
  });
}
describe("Planejamento experimental integrado", () => {
  it("compara modalidades, preserva marcadores e salva/restaura a rota real com parâmetros na missão", async () => {
    const marker = {
      ...sciencePoints[0],
      id: "personal-terrain",
      name: "Ponto pessoal",
      description: "",
      category: "Ciência",
      visited: false,
      layerId: "manual",
    };
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: 1, markers: [marker], missions: [] }),
    );
    const view = render(<ScientificExplorer />);
    plan();
    expect(screen.getByText("Calculando no terreno…")).toBeTruthy();
    act(() => LocalWorker.instances[0].respond({ plan: realPlan }));
    expect(
      screen.getAllByText("Distância pelo terreno").length,
    ).toBeGreaterThan(0);
    expect(screen.getByTestId("terrain-map").getAttribute("data-plan")).toBe(
      realPlan.modelId,
    );
    fireEvent.change(screen.getByLabelText("Tipo de rota"), {
      target: { value: "direct" },
    });
    expect((screen.getByLabelText("Origem") as HTMLSelectElement).value).toBe(
      "belva",
    );
    fireEvent.change(screen.getByLabelText("Tipo de rota"), {
      target: { value: "terrain" },
    });
    await vi.waitFor(() =>
      expect(screen.getByTestId("terrain-map").getAttribute("data-plan")).toBe(
        realPlan.modelId,
      ),
    );
    expect(LocalWorker.instances).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "Cadastrar missão" }));
    fireEvent.change(screen.getByLabelText("Nome da missão"), {
      target: { value: "Comparação do terreno" },
    });
    fireEvent.change(screen.getByLabelText("Objetivo"), {
      target: { value: "Estudar o relevo" },
    });
    fireEvent.change(screen.getByLabelText("Data planejada"), {
      target: { value: "2026-12-01" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Salvar missão" }));
    const records = parseRecords(localStorage.getItem(STORAGE_KEY)!);
    expect(records.markers[0]).toEqual(marker);
    expect(records.missions[0].route.terrain).toEqual(realPlan);
    view.unmount();
    render(<ScientificExplorer />);
    fireEvent.click(
      screen.getByRole("button", { name: "Comparação do terreno" }),
    );
    expect(
      (screen.getByLabelText("Tipo de rota") as HTMLSelectElement).value,
    ).toBe("terrain");
    expect(screen.getByTestId("terrain-map").getAttribute("data-plan")).toBe(
      realPlan.modelId,
    );
    expect(LocalWorker.instances).toHaveLength(1);
    expect(
      screen.getByRole("button", { name: "Editar marcador Ponto pessoal" }),
    ).toBeTruthy();
  });
  it("não troca silenciosamente falhas por uma rota direta e não permite salvar terreno sem cálculo", () => {
    render(<ScientificExplorer />);
    plan();
    fireEvent.change(screen.getByLabelText("Limite de inclinação estimada"), {
      target: { value: "10" },
    });
    const worker = LocalWorker.instances.at(-1)!;
    act(() =>
      worker.respond({
        error: "Origem ou destino fora do recorte de elevação de Jezero.",
      }),
    );
    expect(screen.getByText(/Origem ou destino fora do recorte/)).toBeTruthy();
    expect(screen.getByTestId("terrain-map").getAttribute("data-mode")).toBe(
      "terrain",
    );
    expect(
      screen.getByTestId("terrain-map").getAttribute("data-plan"),
    ).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Cadastrar missão" }));
    const modal = screen.getByRole("dialog");
    expect(
      (
        within(modal).getByRole("button", {
          name: "Salvar missão",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
    fireEvent.click(
      within(modal).getByRole("button", { name: "Fechar formulário" }),
    );
    fireEvent.change(screen.getByLabelText("Tipo de rota"), {
      target: { value: "direct" },
    });
    expect(screen.getByTestId("terrain-map").getAttribute("data-mode")).toBe(
      "direct",
    );
  });
  it("cancela o worker obsoleto e ignora sua resposta ao mudar os pontos", () => {
    const options = { maxSlopeDegrees: 25, slopePenalty: 15 };
    const first = { origin: sciencePoints[0], destination: sciencePoints[1] };
    const second = { origin: sciencePoints[0], destination: sciencePoints[2] };
    const hook = renderHook(
      ({ route }) => useTerrainRoute(route, "terrain", options),
      { initialProps: { route: first } },
    );
    const previous = LocalWorker.instances[0];
    hook.rerender({ route: second });
    expect(previous.terminate).toHaveBeenCalled();
    act(() => previous.respond({ plan: realPlan }));
    expect(hook.result.current.plan).toBeUndefined();
    act(() =>
      LocalWorker.instances
        .at(-1)!
        .respond({ error: "Nenhum caminho encontrado" }),
    );
    expect(hook.result.current.status).toBe("error");
  });
});
