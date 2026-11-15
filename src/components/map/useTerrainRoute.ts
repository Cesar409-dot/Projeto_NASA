"use client";
import { useEffect, useState } from "react";
import { routeDistance, type MissionRoute } from "@/lib/mars/exploration";
import { terrainModel } from "@/data/terrain-model";
import type { TerrainOptions, TerrainPlan } from "@/lib/mars/terrain-routing";
import type {
  TerrainRequest,
  TerrainResponse,
} from "@/lib/mars/terrain.worker";

export type RouteMode = "direct" | "terrain";
export type TerrainState = {
  status: "idle" | "loading" | "ready" | "error";
  plan?: TerrainPlan;
  error?: string;
};
const cache = new Map<string, TerrainPlan>();
export function useTerrainRoute(
  route: MissionRoute | undefined,
  mode: RouteMode,
  options: TerrainOptions,
): TerrainState {
  const key =
    route && routeDistance(route) !== null
      ? JSON.stringify({
          origin: route.origin.coordinate,
          destination: route.destination.coordinate,
          options,
        })
      : "";
  const snapshot = route?.terrain;
  const matchingSnapshot =
    snapshot?.modelId === terrainModel.id &&
    snapshot.options.maxSlopeDegrees === options.maxSlopeDegrees &&
    snapshot.options.slopePenalty === options.slopePenalty
      ? snapshot
      : undefined;
  const [state, setState] = useState<{
    key: string;
    plan?: TerrainPlan;
    error?: string;
  }>({ key: "" });
  useEffect(() => {
    if (mode !== "terrain" || !key || matchingSnapshot) return;
    let current = true;
    const cached = cache.get(key);
    if (cached) {
      queueMicrotask(() => {
        if (current) setState({ key, plan: cached });
      });
      return () => {
        current = false;
      };
    }
    let worker: Worker | undefined;
    queueMicrotask(() => {
      if (current) setState({ key });
    });
    const fail = (message: string) => {
      if (current) setState({ key, error: message });
    };
    const timeout = setTimeout(() => {
      fail(
        "O cálculo excedeu o tempo disponível. Altere os pontos ou o limite de inclinação.",
      );
      worker?.terminate();
    }, 20000);
    try {
      worker = new Worker(
        new URL("../../lib/mars/terrain.worker.ts", import.meta.url),
      );
      worker.onmessage = ({ data }: MessageEvent<TerrainResponse>) => {
        if (!current) return;
        clearTimeout(timeout);
        if ("error" in data) fail(data.error);
        else {
          cache.set(key, data.plan);
          if (cache.size > 16) cache.delete(cache.keys().next().value!);
          setState({ key, plan: data.plan });
        }
        worker?.terminate();
      };
      worker.onerror = () => {
        clearTimeout(timeout);
        fail(
          "O processamento local falhou. Use a rota direta ou tente novamente alterando os parâmetros.",
        );
        worker?.terminate();
      };
      worker.postMessage(JSON.parse(key) as TerrainRequest);
    } catch {
      clearTimeout(timeout);
      queueMicrotask(() =>
        fail(
          "Este navegador não disponibilizou o processamento de terreno. A rota direta continua disponível.",
        ),
      );
    }
    return () => {
      current = false;
      clearTimeout(timeout);
      worker?.terminate();
    };
  }, [mode, key, matchingSnapshot]);
  if (mode !== "terrain" || !key) return { status: "idle" };
  if (matchingSnapshot) return { status: "ready", plan: matchingSnapshot };
  if (state.key !== key) return { status: "loading" };
  return state.plan
    ? { status: "ready", plan: state.plan }
    : state.error
      ? { status: "error", error: state.error }
      : { status: "loading" };
}
