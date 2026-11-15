export type NasaLayer = {
  id: "mola";
  format?: "png" | "jpg";
  name: string;
  product: string;
  mission: string;
  maxNativeZoom: number;
  bounds: [[number, number], [number, number]];
  source: string;
  credit: string;
  legend: string;
};
export const nasaLayers: NasaLayer[] = [
  {
    id: "mola",
    name: "MOLA — Relevo global",
    product: "Mars_MGS_MOLA_ClrShade_merge_global_463m",
    mission: "Mars Global Surveyor · MOLA",
    maxNativeZoom: 7,
    format: "jpg",
    bounds: [
      [-89.9991635, -180],
      [90, 179.9983271],
    ],
    source:
      "https://trek.nasa.gov/tiles/Mars/EQ/Mars_MGS_MOLA_ClrShade_merge_global_463m/1.0.0/WMTSCapabilities.xml",
    credit: "MGS/MOLA · NASA/GSFC · distribuição NASA Mars Trek",
    legend:
      "Relevo sombreado colorido derivado de altimetria MOLA, produto nominal de 463 m. Visualização qualitativa: sem leitura de altitude, declividade ou segurança. Ampliar não acrescenta resolução.",
  },
];
export const nasaEndpoint = (layer: NasaLayer) =>
  `https://trek.nasa.gov/tiles/Mars/EQ/${layer.product}/1.0.0`;
export const capabilitiesUrl = (layer: NasaLayer) =>
  `${nasaEndpoint(layer)}/WMTSCapabilities.xml`;
export const tileTemplate = (layer: NasaLayer) =>
  `${nasaEndpoint(layer)}/default/default028mm/{z}/{y}/{x}.${layer.format ?? "png"}`;
export const sampleTileUrl = (layer: NasaLayer) =>
  tileTemplate(layer)
    .replace("{z}", "0")
    .replace("{y}", "0")
    .replace("{x}", "1");

// Editorial image coordinates stay in the original 1600 × 1000 display grid.
// The source is 2880 × 1800 pixels: same aspect ratio, no geographic transform.
export const officialImage = {
  bounds: [
    [0, 0],
    [1000, 1600],
  ] as [[number, number], [number, number]],
  width: 2880,
  height: 1800,
  maxZoom: Math.floor(Math.log2(2880 / 1600) * 4) / 4,
};
