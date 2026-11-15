import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import {
  render,
  screen,
  fireEvent,
  cleanup,
  act,
} from "@testing-library/react";
import { useReducer, useState } from "react";
import { Greenhouse } from "@/components/Greenhouse";
import { MindSpace } from "@/components/MindSpace";
import { LayerPanel } from "@/components/map/LayerPanel";
import { RoutePlanner } from "@/components/map/RoutePlanner";
import { MissionSummary } from "@/components/map/MissionSummary";
import { sciencePoints } from "@/data/science-points";
import { emptyRoute, routeReducer } from "@/lib/mars/route-state";

beforeEach(() => {
  vi.spyOn(console, "error");
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  const errors = vi.mocked(console.error).mock.calls;
  vi.restoreAllMocks();
  expect(errors).toEqual([]);
});

describe("Marswalk controls", () => {
  function Planner() {
    const [route, dispatch] = useReducer(routeReducer, emptyRoute);
    return (
      <>
        <RoutePlanner route={route} dispatch={dispatch} />
        <MissionSummary
          selected={sciencePoints[0]}
          origin={sciencePoints.find((p) => p.id === route.origin)}
          destination={sciencePoints.find((p) => p.id === route.destination)}
          isLocal={false}
        />
      </>
    );
  }
  it("selects endpoints, calculates a summary, swaps and clears", () => {
    render(<Planner />);
    fireEvent.change(screen.getByLabelText("Origem"), {
      target: { value: "belva" },
    });
    fireEvent.change(screen.getByLabelText("Destino"), {
      target: { value: "neretva" },
    });
    expect(screen.getByText(/≈ \d+ km/)).toBeTruthy();
    expect(
      screen.getByText(sciencePoints[1].objective, { exact: false }),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Inverter" }));
    expect((screen.getByLabelText("Origem") as HTMLSelectElement).value).toBe(
      "neretva",
    );
    expect((screen.getByLabelText("Destino") as HTMLSelectElement).value).toBe(
      "belva",
    );
    fireEvent.click(screen.getByRole("button", { name: "Limpar rota" }));
    expect((screen.getByLabelText("Origem") as HTMLSelectElement).value).toBe(
      "",
    );
    expect(screen.queryByText(/≈ \d+ km/)).toBeNull();
  });
  it("keeps unavailable layers disabled and allows selecting the local fallback", () => {
    const retry = vi.fn();
    function Layers() {
      const [id, setId] = useState("mola");
      return (
        <LayerPanel
          activeId={id}
          onChange={setId}
          health={{
            mola: { state: "error", message: "offline" },
          }}
          retry={retry}
        />
      );
    }
    render(<Layers />);
    expect(
      (screen.getByRole("radio", { name: /MOLA/ }) as HTMLInputElement)
        .disabled,
    ).toBe(true);
    fireEvent.click(screen.getByRole("radio", { name: /Imagem oficial/ }));
    expect(
      (
        screen.getByRole("radio", {
          name: /Imagem oficial/,
        }) as HTMLInputElement
      ).checked,
    ).toBe(true);
    expect(screen.getAllByRole("radio")).toHaveLength(2);
    expect(
      screen.getByText(/Esta imagem cobre apenas uma região de Jezero/),
    ).toBeTruthy();
    fireEvent.click(
      screen.getByRole("button", { name: "Verificar serviços novamente" }),
    );
    expect(retry).toHaveBeenCalledOnce();
  });
});

describe("Greenhouse comparison", () => {
  it("changes crop details and adds/removes comparison columns", () => {
    render(<Greenhouse />);
    fireEvent.click(screen.getByRole("button", { name: /Rabanete/ }));
    expect(screen.getByRole("heading", { name: "RABANETE" })).toBeTruthy();
    fireEvent.click(screen.getByRole("checkbox", { name: "Rabanete" }));
    expect(screen.getByRole("columnheader", { name: "Rabanete" })).toBeTruthy();
    for (const name of ["Alface", "Batata", "Rabanete"])
      fireEvent.click(screen.getByRole("checkbox", { name }));
    expect(screen.queryByRole("table")).toBeNull();
    expect(screen.getByRole("status").textContent).toMatch(
      /Selecione ao menos uma cultura/,
    );
  });
});

describe("Mind Space", () => {
  it("switches scenario and opens a strategy", () => {
    render(<MindSpace />);
    fireEvent.click(
      screen.getByRole("button", { name: /A resposta não chega na hora/ }),
    );
    const summary = screen.getByText("Organizar a mensagem");
    fireEvent.click(summary);
    expect(summary.closest("details")?.open).toBe(true);
    expect(
      screen
        .getByRole("link", { name: "Ler a referência NASA" })
        .getAttribute("href"),
    ).toContain("risk-of-behavioral-changes");
  });
  it("starts, pauses and resets the reflection timer", () => {
    vi.useFakeTimers();
    const view = render(<MindSpace />);
    fireEvent.click(screen.getByRole("button", { name: "Iniciar meditação" }));
    act(() => vi.advanceTimersByTime(3000));
    expect(screen.getByText("00:03")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Pausar meditação" }));
    act(() => vi.advanceTimersByTime(2000));
    expect(screen.getByText("00:03")).toBeTruthy();
    fireEvent.click(
      screen.getByRole("button", { name: "Reiniciar cronômetro de meditação" }),
    );
    expect(screen.getByText("00:00")).toBeTruthy();
    view.unmount();
  });
});
