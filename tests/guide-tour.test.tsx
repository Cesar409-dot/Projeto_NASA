import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { GuideTour } from "@/components/map/GuideTour";

const targets = ["map", "origin", "destination", "route-type", "add-marker", "coordinate-entry", "basemap", "summary"];
const titles = [
  "Conhecendo o Mars Maps",
  "Escolhendo a origem",
  "Escolhendo o destino",
  "Entendendo o tipo de rota",
  "Adicionando marcadores",
  "Informando coordenadas",
  "Escolhendo a base cartográfica",
  "Analisando a exploração",
];

beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => window.setTimeout(() => callback(0), 0));
  vi.stubGlobal("cancelAnimationFrame", (id: number) => window.clearTimeout(id));
  HTMLElement.prototype.scrollIntoView = vi.fn();
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("tutorial guiado do Mars Maps", () => {
  it("destaca as oito etapas e permite voltar, concluir e reabrir manualmente", async () => {
    render(<>
      <div>{targets.map((target) => <button key={target} data-guide={target}>{target}</button>)}</div>
      <GuideTour />
    </>);
    expect(await screen.findByRole("dialog")).toBeTruthy();
    for (let index = 0; index < titles.length; index++) {
      expect(await screen.findByRole("heading", { name: titles[index] })).toBeTruthy();
      if (index < titles.length - 1)
        fireEvent.click(screen.getByRole("button", { name: "Avançar" }));
    }
    fireEvent.click(screen.getByRole("button", { name: "Voltar" }));
    expect(await screen.findByRole("heading", { name: titles[6] })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Avançar" }));
    fireEvent.click(screen.getByRole("button", { name: "Concluir" }));
    await waitFor(() => expect(localStorage.getItem("mars-maps-guide-complete")).toBe("1"));
    expect(screen.queryByRole("dialog")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Como utilizar?" }));
    expect(await screen.findByRole("heading", { name: titles[0] })).toBeTruthy();
  });

  it("permite pular e não exibe automaticamente após concluir", async () => {
    const view = render(<>
      <div>{targets.map((target) => <button key={target} data-guide={target}>{target}</button>)}</div>
      <GuideTour />
    </>);
    expect(await screen.findByRole("dialog")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Pular tutorial" }));
    await waitFor(() => expect(localStorage.getItem("mars-maps-guide-complete")).toBe("1"));
    view.unmount();
    render(<>
      <div>{targets.map((target) => <button key={target} data-guide={target}>{target}</button>)}</div>
      <GuideTour />
    </>);
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
