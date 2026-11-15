"use client";
import { useCallback, useEffect, useState } from "react";
import { nasaLayers } from "@/data/map-layers";
import { probeLayer, type LayerHealth } from "@/lib/mars/wmts";

export function useLayerHealth() {
  const [revision, setRevision] = useState(0);
  const [health, setHealth] = useState<Record<string, LayerHealth>>({});
  useEffect(() => {
    let disposed = false;
    const controls = nasaLayers.map((layer) => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);
      probeLayer(layer, controller.signal)
        .then(() => {
          if (!disposed)
            setHealth((h) => ({
              ...h,
              [layer.id]: {
                state: "ready",
                message: "Metadados e tile de amostra verificados",
              },
            }));
        })
        .catch(() => {
          if (!disposed)
            setHealth((h) => ({
              ...h,
              [layer.id]: {
                state: "error",
                message:
                  "Serviço indisponível ou metadados incompatíveis. Use a imagem local.",
              },
            }));
        })
        .finally(() => clearTimeout(timeout));
      return controller;
    });
    return () => {
      disposed = true;
      controls.forEach((c) => c.abort());
    };
  }, [revision]);
  const fail = useCallback(
    (id: string) =>
      setHealth((h) => ({
        ...h,
        [id]: {
          state: "error",
          message:
            "Falha no carregamento de tiles. Imagem local ativada; tente novamente.",
        },
      })),
    [],
  );
  const retry = () => {
    setHealth({});
    setRevision((r) => r + 1);
  };
  return { health, fail, retry };
}
