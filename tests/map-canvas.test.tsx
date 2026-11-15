import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import LeafletCanvas from "@/components/map/LeafletCanvas";
import { nasaLayers, officialImage } from "@/data/map-layers";
import { sciencePoints } from "@/data/science-points";
import type { TerrainPlan } from "@/lib/mars/terrain-routing";
import {
  Browser,
  CircleMarker as LeafletCircleMarker,
  Polyline as LeafletPolyline,
  Map as LeafletMap,
  Point,
  latLngBounds,
} from "leaflet";
import type { ViewMemory } from "@/lib/mars/map-view";
import { StrictMode } from "react";
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
    vi.fn((query: string) => ({
      matches: query.includes("prefers-reduced-motion"),
    })),
  );
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  Object.defineProperty(Browser, "any3d", threeDDescriptor);
});
describe("Controles nativos do mapa Leaflet", () => {
  it.each(["mola", "image"])(
    "mostra um único tooltip temporário em %s e preserva seleção",
    (base) => {
      const setView = vi.spyOn(LeafletMap.prototype, "setView");
      const onSelect = vi.fn();
      const props = {
        layer: base === "mola" ? nasaLayers[0] : undefined,
        selected: sciencePoints[0],
        onSelect,
        origin: sciencePoints[0],
        destination: sciencePoints[1],
        showPoints: true,
        showRoute: true,
        onLayerError: vi.fn(),
      };
      const view = render(<LeafletCanvas {...props} />);
      const map = setView.mock.contexts.at(-1);
      if (!(map instanceof LeafletMap)) throw new Error("Mapa não encontrado");
      const markers: LeafletCircleMarker[] = [];
      map.eachLayer((layer) => {
        if (layer instanceof LeafletCircleMarker && layer.getTooltip())
          markers.push(layer);
      });
      expect(markers).toHaveLength(3); // Endpoints share their scientific point tooltip.
      expect(view.container.querySelectorAll(".leaflet-tooltip")).toHaveLength(
        0,
      );
      act(() => markers[0].fire("mouseover"));
      expect(view.container.querySelectorAll(".leaflet-tooltip")).toHaveLength(
        1,
      );
      expect(
        view.container.querySelector(".leaflet-tooltip")?.textContent,
      ).toContain("Origem");
      act(() => markers[1].fire("mouseover"));
      expect(view.container.querySelectorAll(".leaflet-tooltip")).toHaveLength(
        1,
      );
      expect(
        view.container.querySelector(".leaflet-tooltip")?.textContent,
      ).toContain("Destino");
      act(() => markers[1].fire("mouseout"));
      expect(view.container.querySelectorAll(".leaflet-tooltip")).toHaveLength(
        0,
      );
      act(() =>
        markers[1].fire("click", { originalEvent: new MouseEvent("click") }),
      );
      expect(onSelect).toHaveBeenCalledWith(sciencePoints[1].id);
      act(() => map.fire("click"));
      expect(view.container.querySelectorAll(".leaflet-tooltip")).toHaveLength(
        0,
      );
      view.rerender(<LeafletCanvas {...props} selected={sciencePoints[1]} />);
      expect(view.container.querySelectorAll(".leaflet-tooltip")).toHaveLength(
        0,
      );
    },
  );
  it("abre informações no primeiro toque, mantém uma única caixa e permite editar no segundo toque", () => {
    const setView = vi.spyOn(LeafletMap.prototype, "setView"),
      onMarkerSelect = vi.fn();
    const personal = {
      ...sciencePoints[0],
      id: "touch-marker",
      name: "Amostra pessoal",
      description: "",
      category: "Ciência" as const,
      visited: true,
      layerId: "manual",
    };
    const view = render(
      <LeafletCanvas
        layer={nasaLayers[0]}
        selected={sciencePoints[0]}
        onSelect={vi.fn()}
        showPoints={true}
        showRoute={false}
        onLayerError={vi.fn()}
        personalMarkers={[personal]}
        onMarkerSelect={onMarkerSelect}
      />,
    );
    const map = setView.mock.contexts.at(-1);
    if (!(map instanceof LeafletMap)) throw new Error("Mapa não encontrado");
    const markers: LeafletCircleMarker[] = [];
    map.eachLayer((layer) => {
      if (layer instanceof LeafletCircleMarker && layer.getTooltip())
        markers.push(layer);
    });
    const target = markers.find((m) => m.options.fillColor === "#2685b4")!;
    const tap = new MouseEvent("click");
    Object.defineProperty(tap, "pointerType", { value: "touch" });
    act(() => target.fire("click", { originalEvent: tap }));
    expect(onMarkerSelect).not.toHaveBeenCalled();
    expect(view.container.querySelectorAll(".leaflet-tooltip")).toHaveLength(1);
    expect(
      view.container.querySelector(".leaflet-tooltip")?.textContent,
    ).toContain(personal.name);
    act(() => target.fire("click", { originalEvent: tap }));
    expect(onMarkerSelect).toHaveBeenCalledWith(personal);
    act(() =>
      markers.find((m) => m !== target)!.fire("click", { originalEvent: tap }),
    );
    expect(view.container.querySelectorAll(".leaflet-tooltip")).toHaveLength(1);
    act(() => map.fire("click"));
    expect(view.container.querySelectorAll(".leaflet-tooltip")).toHaveLength(0);
  });
  it.each(["mola", "image"])(
    "mantém o contorno e as coordenadas do trajeto ao ampliar %s",
    (base) => {
      const setView = vi.spyOn(LeafletMap.prototype, "setView");
      const view = render(
        <LeafletCanvas
          layer={base === "mola" ? nasaLayers[0] : undefined}
          selected={sciencePoints[0]}
          onSelect={vi.fn()}
          origin={sciencePoints[0]}
          destination={sciencePoints[1]}
          showPoints={true}
          showRoute={true}
          onLayerError={vi.fn()}
        />,
      );
      const map = setView.mock.contexts.at(-1);
      if (!(map instanceof LeafletMap)) throw new Error("Mapa não encontrado");
      const lines: LeafletPolyline[] = [];
      map.eachLayer((layer) => {
        if (layer instanceof LeafletPolyline) lines.push(layer);
      });
      expect(lines).toHaveLength(2);
      expect(lines[0].options.color).toBe("#101719");
      expect(lines[0].options.weight).toBeGreaterThan(lines[1].options.weight!);
      expect(lines.every((l) => l.options.interactive === false)).toBe(true);
      expect(lines[0].getLatLngs()).toEqual(lines[1].getLatLngs());
      const segment = lines[1].getLatLngs()[0] as {
        lat: number;
        lng: number;
      }[];
      const expected =
        base === "mola"
          ? [
              sciencePoints[0].coordinate.latitude,
              sciencePoints[0].coordinate.longitude,
            ]
          : sciencePoints[0].imagePosition;
      expect(segment[0].lat).toBeCloseTo(expected[0]);
      expect(segment[0].lng).toBeCloseTo(expected[1]);
      const end = segment.at(-1)!;
      const destination =
        base === "mola"
          ? [
              sciencePoints[1].coordinate.latitude,
              sciencePoints[1].coordinate.longitude,
            ]
          : sciencePoints[1].imagePosition;
      expect(end.lat).toBeCloseTo(destination[0]);
      expect(end.lng).toBeCloseTo(destination[1]);
      expect(Number(map.getPane("mars-routes")!.style.zIndex)).toBeLessThan(
        Number(map.getPane("mars-points")!.style.zIndex),
      );
      expect(Number(map.getPane("mars-routes")!.style.zIndex)).toBeGreaterThan(
        400,
      );
      for (const zoom of [map.getMinZoom(), map.getMaxZoom()]) {
        act(() => map.setZoom(zoom, { animate: false }));
        expect(lines[1].options.weight).toBe(6);
        expect(
          view.container
            .querySelector('path[stroke="#ffae66"]')
            ?.getAttribute("d"),
        ).toBeTruthy();
      }
    },
  );
  it("restaura o enquadramento de cada base sem misturar os sistemas de coordenadas", () => {
    const setView = vi.spyOn(LeafletMap.prototype, "setView");
    const memory: ViewMemory = { current: {} };
    const props = {
      selected: sciencePoints[0],
      onSelect: vi.fn(),
      origin: sciencePoints[0],
      destination: sciencePoints[1],
      showPoints: true,
      showRoute: true,
      onLayerError: vi.fn(),
      viewMemory: memory,
    };
    const view = render(
      <LeafletCanvas key="mola" {...props} layer={nasaLayers[0]} />,
      { wrapper: StrictMode },
    );
    let map = setView.mock.contexts.at(-1) as LeafletMap;
    act(() => map.setView([18.49, 77.32], 7, { animate: false }));
    const mola = structuredClone(memory.current.mola!);
    view.rerender(<LeafletCanvas key="image" {...props} />);
    map = setView.mock.contexts.at(-1) as LeafletMap;
    act(() => map.setView([600, 800], 0.5, { animate: false }));
    const image = structuredClone(memory.current.image!);
    view.rerender(
      <LeafletCanvas key="mola" {...props} layer={nasaLayers[0]} />,
    );
    map = setView.mock.contexts.at(-1) as LeafletMap;
    expect(map.getZoom()).toBe(mola.zoom);
    expect(map.getCenter().lat).toBeCloseTo(mola.center[0]);
    expect(map.getCenter().lng).toBeCloseTo(mola.center[1]);
    view.rerender(<LeafletCanvas key="image" {...props} />);
    map = setView.mock.contexts.at(-1) as LeafletMap;
    expect(map.getZoom()).toBe(image.zoom);
    expect(map.getCenter().lat).toBeCloseTo(image.center[0]);
    expect(map.getCenter().lng).toBeCloseTo(image.center[1]);
    view.rerender(
      <LeafletCanvas
        key="mola"
        {...props}
        layer={nasaLayers[0]}
        destination={sciencePoints[2]}
      />,
    );
    map = setView.mock.contexts.at(-1) as LeafletMap;
    expect(map.getCenter().lng).not.toBeCloseTo(mola.center[1]);
  });
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
        .querySelector('path[stroke="#ffae66"]')
        ?.getAttribute("stroke-dasharray"),
    ).toBe("12 9");
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
        .querySelector('path[stroke="#a5ffe0"][stroke-width="7"]')
        ?.getAttribute("stroke-dasharray"),
    ).toBeNull();
    expect(view.container.querySelector('path[stroke="#ffae66"]')).toBeNull();
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
      const initialZoom = threeD ? 6.5 : 7;
      if (base === "mola") {
        expect(map.getZoom()).toBe(initialZoom);
        expect(map.getCenter().lat).toBeCloseTo(18.48);
        expect(map.getCenter().lng).toBeCloseTo(77.445);
        for (const point of sciencePoints)
          expect(map.getBounds().contains([point.coordinate.latitude, point.coordinate.longitude])).toBe(true);
      }
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
        if (base === "mola") {
          expect(map.getZoom()).toBe(initialZoom);
          expect(map.getCenter().lat).toBeCloseTo(18.48);
          expect(map.getCenter().lng).toBeCloseTo(77.445);
        } else {
          for (const point of sciencePoints)
            expect(map.getBounds().contains(point.imagePosition)).toBe(true);
        }
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
