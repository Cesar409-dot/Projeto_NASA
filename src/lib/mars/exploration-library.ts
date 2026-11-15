import { routeDistance, type MissionRoute } from "./exploration";
import type { TerrainPlan } from "./terrain-routing";
export type LibraryRouteMode = "direct" | "terrain";

export type LibraryExploration = {
  id: string;
  name: string;
  regionId: string;
  regionName: string;
  route: MissionRoute;
  routeMode: LibraryRouteMode;
  markerIds: string[];
  missionIds: string[];
  missions: { id: string; name: string; objective: string }[];
  analysis: { markerCount: number; missionCount: number; terrain?: TerrainPlan };
  createdAt: string;
  analyzedAt: string;
  updatedAt: string;
  status: "analisada";
};

export const EXPLORATION_LIBRARY_KEY = "mars-maps:library:v1";
export const emptyLibrary: LibraryExploration[] = [];

export function readExplorationLibrary(raw: string | null): LibraryExploration[] {
  if (raw === null) return [];
  const value: unknown = JSON.parse(raw);
  if (!Array.isArray(value) || value.some((entry) => !validEntry(entry))) {
    throw new Error("A biblioteca contém registros incompatíveis; os dados originais foram preservados.");
  }
  return value;
}

function validEntry(value: unknown): value is LibraryExploration {
  if (!value || typeof value !== "object") return false;
  const item = value as LibraryExploration;
  return typeof item.id === "string" &&
    typeof item.regionId === "string" && typeof item.regionName === "string" &&
    typeof item.name === "string" && item.name.length <= 100 &&
    !!item.route?.origin?.coordinate && !!item.route?.destination?.coordinate && routeDistance(item.route) !== null &&
    (item.routeMode === "direct" || item.routeMode === "terrain") &&
    Array.isArray(item.markerIds) && item.markerIds.every((id) => typeof id === "string") && Array.isArray(item.missionIds) && item.missionIds.every((id) => typeof id === "string") && Array.isArray(item.missions) && item.missions.every((mission) => typeof mission?.id === "string" && typeof mission?.name === "string" && typeof mission?.objective === "string") &&
    typeof item.createdAt === "string" && Number.isFinite(Date.parse(item.createdAt)) && typeof item.analyzedAt === "string" && Number.isFinite(Date.parse(item.analyzedAt)) && typeof item.updatedAt === "string" && Number.isFinite(Date.parse(item.updatedAt)) &&
    item.status === "analisada";
}
