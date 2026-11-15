import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import LeafletCanvas from "@/components/map/LeafletCanvas";
import { nasaLayers } from "@/data/map-layers";
import { sciencePoints } from "@/data/science-points";
beforeEach(() => {
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({ matches: true })),
  );
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
describe("Controles nativos do mapa Leaflet", () => {
  it("recentraliza sem criar um marcador e mantém o clique intencional no terreno funcionando", () => {
    const onPosition = vi.fn();
    const { container } = render(
      <LeafletCanvas
        layer={nasaLayers[0]}
        selected={sciencePoints[0]}
        onSelect={vi.fn()}
        showPoints={false}
        showRoute={false}
        onLayerError={vi.fn()}
        adding={true}
        onPosition={onPosition}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Recentralizar mapa" }));
    expect(onPosition).not.toHaveBeenCalled();
    fireEvent.click(container.querySelector(".leaflet-container")!, {
      clientX: 0,
      clientY: 0,
    });
    expect(onPosition).toHaveBeenCalledOnce();
    expect(onPosition.mock.calls[0][0]).toMatchObject({
      body: "Mars",
      latitudeType: "planetocentric",
      longitudeDirection: "east",
    });
  });
});
