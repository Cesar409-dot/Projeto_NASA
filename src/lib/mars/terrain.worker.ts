import { terrainModel } from "../../data/terrain-model";
import { decodeTerrainGrid } from "./terrain-data";
import {
  findTerrainRoute,
  type TerrainOptions,
  type TerrainPlan,
} from "./terrain-routing";
import type { MarsCoordinate } from "./coordinates";
export type TerrainRequest = {
  origin: MarsCoordinate;
  destination: MarsCoordinate;
  options: TerrainOptions;
};
export type TerrainResponse = { plan: TerrainPlan } | { error: string };
const scope = globalThis as unknown as {
  onmessage: ((event: MessageEvent<TerrainRequest>) => void) | null;
  postMessage: (result: TerrainResponse) => void;
};
scope.onmessage = async ({ data }) => {
  try {
    const response = await fetch("/terrain/" + terrainModel.binary, {
      cache: "force-cache",
    });
    if (!response.ok)
      throw new Error("Não foi possível carregar o recorte local de elevação.");
    const bytes = await response.arrayBuffer();
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    const sha = Array.from(new Uint8Array(digest), (b) =>
      b.toString(16).padStart(2, "0"),
    ).join("");
    if (sha !== terrainModel.dataSha256)
      throw new Error("Integridade do arquivo de elevação não confirmada.");
    const plan = findTerrainRoute(
      decodeTerrainGrid(bytes),
      data.origin,
      data.destination,
      data.options,
    );
    scope.postMessage({ plan });
  } catch (error) {
    scope.postMessage({
      error:
        error instanceof Error
          ? error.message
          : "Não foi possível calcular a rota pelo terreno.",
    });
  }
};
