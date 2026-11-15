import { terrainModel } from "../../data/terrain-model";
import type { TerrainGrid } from "./terrain-routing";

export function decodeTerrainGrid(buffer: ArrayBuffer): TerrainGrid {
  const n = terrainModel.width * terrainModel.height;
  if (buffer.byteLength !== n * 8)
    throw new Error("Arquivo de elevação incompleto ou incompatível.");
  const view = new DataView(buffer),
    elevations = new Float32Array(n),
    slopes = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    elevations[i] = view.getFloat32(i * 4, true);
    slopes[i] = view.getFloat32((n + i) * 4, true);
  }
  return { ...terrainModel, elevations, slopes };
}
