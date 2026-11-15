import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import LeafletCanvas from "@/components/map/LeafletCanvas";
import { nasaLayers } from "@/data/map-layers";
import { sciencePoints } from "@/data/science-points";
import { Map as LeafletMap } from "leaflet";
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
  vi.restoreAllMocks();
});
describe("Controles nativos do mapa Leaflet", () => {
  it("move o mapa para a coordenada informada e preserva o foco ao trocar a base", () => {
    const setView = vi.spyOn(LeafletMap.prototype, "setView");
    const props = {
      layer: nasaLayers[0],
      selected: sciencePoints[0],
      onSelect: vi.fn(),
      showPoints: false,
      showRoute: false,
      onLayerError: vi.fn(),
      focusCoordinate: {
        ...sciencePoints[0].coordinate,
        latitude: 18.5,
        longitude: 77.45,
      },
    };
    const view = render(<LeafletCanvas {...props} />);
    expect(setView).toHaveBeenLastCalledWith(
      [expect.closeTo(18.5), expect.closeTo(77.45)],
      expect.any(Number),
      expect.objectContaining({ animate: false }),
    );
    view.rerender(<LeafletCanvas {...props} layer={nasaLayers[3]} />);
    expect(setView).toHaveBeenLastCalledWith(
      [expect.closeTo(18.5), expect.closeTo(77.45)],
      expect.any(Number),
      expect.objectContaining({ animate: false }),
    );
    const map = setView.mock.contexts.at(-1)!;
    if (!(map instanceof LeafletMap)) throw new Error("Mapa Leaflet não encontrado");
    expect(map.getMaxZoom()).toBe(7);
    expect(map.getZoom()).toBeLessThanOrEqual(7);
  });
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
