import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import LeafletCanvas from "@/components/map/LeafletCanvas";
import { nasaLayers, officialImage } from "@/data/map-layers";
import { sciencePoints } from "@/data/science-points";
import type { TerrainPlan } from "@/lib/mars/terrain-routing";
import { Browser, Map as LeafletMap, Point, latLngBounds } from "leaflet";
const threeDDescriptor = Object.getOwnPropertyDescriptor(Browser, "any3d")!;
let viewport = new Point(960, 540);
let resize: () => void;
beforeEach(() => {
  viewport = new Point(960, 540);
  vi.spyOn(LeafletMap.prototype, "getSize").mockImplementation(() =>
    viewport.clone(),
  );
  vi.stubGlobal(
    "ResizeObserver",
    class {
      constructor(callback: () => void) {
        resize = callback;
      }
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
  Object.defineProperty(Browser, "any3d", threeDDescriptor);
});
describe("Controles nativos do mapa Leaflet", () => {
  it("distingue as linhas e nunca desenha fallback direto ao solicitar terreno indisponível", () => {
    const props = {
      layer: nasaLayers[0],
      selected: sciencePoints[0],
      onSelect: vi.fn(),
      origin: sciencePoints[0],
      destination: sciencePoints[1],
      showPoints: false,
      showRoute: true,
      onLayerError: vi.fn(),
    };
    const view = render(
      <LeafletCanvas key="mola" {...props} routeMode="terrain" />,
    );
    expect(
      view.container.querySelectorAll("path.leaflet-interactive"),
    ).toHaveLength(0);
    view.rerender(<LeafletCanvas key="mola" {...props} routeMode="direct" />);
    expect(
      view.container
        .querySelector('path[stroke="#f6a578"]')
        ?.getAttribute("stroke-dasharray"),
    ).toBe("7 9");
    // Synthetic display fixture, only used by this test.
    const terrain: TerrainPlan = {
      algorithm: "astar-v1",
      modelId: "test-only",
      options: { maxSlopeDegrees: 20, slopePenalty: 15 },
      path: [
        [18.48, 77.38],
        [18.5, 77.3],
        [18.55, 77.2],
      ],
      distanceMetres: 13000,
      cost: 15000,
      ascentMetres: 10,
      descentMetres: 10,
      maxSlopeDegrees: 10,
      visited: 100,
      startOffsetMetres: 0,
      endOffsetMetres: 0,
    };
    view.rerender(
      <LeafletCanvas
        key="mola"
        {...props}
        routeMode="terrain"
        terrainPlan={terrain}
      />,
    );
    expect(
      view.container
        .querySelector('path[stroke="#a5ffe0"][stroke-width="5"]')
        ?.getAttribute("stroke-dasharray"),
    ).toBeNull();
    expect(view.container.querySelector('path[stroke="#f6a578"]')).toBeNull();
    view.rerender(
      <LeafletCanvas
        key="image"
        {...props}
        layer={undefined}
        routeMode="terrain"
        terrainPlan={terrain}
      />,
    );
    expect(
      view.container.querySelectorAll("path.leaflet-interactive"),
    ).toHaveLength(0);
    expect(
      screen.getByText(/O trajeto pelo terreno não pode ser projetado/),
    ).toBeTruthy();
  });
  it("move MOLA para a coordenada informada respeitando o zoom nativo", () => {
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
    view.rerender(
      <LeafletCanvas
        {...props}
        focusCoordinate={{ ...props.focusCoordinate }}
      />,
    );
    expect(setView).toHaveBeenLastCalledWith(
      [expect.closeTo(18.5), expect.closeTo(77.45)],
      expect.any(Number),
      expect.objectContaining({ animate: false }),
    );
    const map = setView.mock.contexts.at(-1)!;
    if (!(map instanceof LeafletMap))
      throw new Error("Mapa Leaflet não encontrado");
    expect(map.getMaxZoom()).toBe(7);
    expect(map.getZoom()).toBeLessThanOrEqual(7);
  });
  it.each(
    ["mola", "image"].flatMap((base) =>
      [true, false].map((threeD) => ({ base, threeD })),
    ),
  )(
    "enquadra $base (CSS 3D: $threeD) em desktop e celular, limita zoom e recalcula ao redimensionar",
    ({ base, threeD }) => {
      Object.defineProperty(Browser, "any3d", {
        ...threeDDescriptor,
        value: threeD,
      });
      const setView = vi.spyOn(LeafletMap.prototype, "setView");
      render(
        <LeafletCanvas
          layer={base === "mola" ? nasaLayers[0] : undefined}
          selected={sciencePoints[0]}
          onSelect={vi.fn()}
          showPoints={false}
          showRoute={false}
          onLayerError={vi.fn()}
        />,
      );
      const map = setView.mock.contexts.at(-1);
      if (!(map instanceof LeafletMap))
        throw new Error("Mapa Leaflet não encontrado");
      const bounds = latLngBounds(
        base === "mola" ? nasaLayers[0].bounds : officialImage.bounds,
      );
      const max = base === "mola" ? 7 : officialImage.maxZoom;
      for (const size of [
        new Point(960, 540),
        new Point(350, 480),
        new Point(1200, 640),
      ]) {
        viewport = size;
        resize();
        expect(map.getMaxZoom()).toBe(max);
        for (const zoom of [
          map.getMinZoom(),
          (map.getMinZoom() + max) / 2,
          max,
        ]) {
          map.setZoom(zoom, { animate: false });
          const extent = map
            .project(bounds.getNorthEast())
            .subtract(map.project(bounds.getSouthWest()));
          expect(Math.abs(extent.x)).toBeGreaterThanOrEqual(size.x);
          expect(Math.abs(extent.y)).toBeGreaterThanOrEqual(size.y);
          expect(map.getZoom()).toBeLessThanOrEqual(max);
        }
        map.setZoom(-10, { animate: false });
        expect(map.getZoom()).toBe(map.getMinZoom());
        map.setZoom(20, { animate: false });
        expect(map.getZoom()).toBeLessThanOrEqual(max);
        fireEvent.click(
          screen.getByRole("button", { name: "Recentralizar mapa" }),
        );
        expect(map.getZoom()).toBe(map.getMinZoom());
        expect(map.getCenter().lat).toBeCloseTo(bounds.getCenter().lat, 2);
        expect(map.getCenter().lng).toBeCloseTo(bounds.getCenter().lng, 2);
      }
      if (base === "image") {
        expect(1600 * 2 ** max).toBeLessThanOrEqual(officialImage.width);
        expect(1000 * 2 ** max).toBeLessThanOrEqual(officialImage.height);
      }
    },
  );
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
