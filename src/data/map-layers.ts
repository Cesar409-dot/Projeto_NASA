export type NasaLayer = {
  id: "ctx" | "hirise" | "ctx-regional" | "mola";
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
    id: "ctx",
    name: "CTX · Jezero controlado",
    product: "JEZ_ctx_B_soc_008_orthoMosaic_6m_Eqc_latTs0_lon0",
    mission: "Mars Reconnaissance Orbiter · CTX",
    maxNativeZoom: 13,
    bounds: [
      [18.2110274, 77.1604655],
      [18.7211945, 77.6991776],
    ],
    source: "https://doi.org/10.5066/P9GV1ND3",
    credit: "CTX/MRO · USGS, Fergason et al. (2020) · Tiles: NASA Mars Trek",
    legend:
      "Tons de cinza: aparência da superfície, sem correspondência com elevação ou risco.",
  },
  {
    id: "hirise",
    name: "HiRISE · Jezero controlado",
    product: "JEZ_hirise_soc_006_orthoMosaic_25cm_Eqc_latTs0_lon0_first_dd",
    mission: "Mars Reconnaissance Orbiter · HiRISE",
    maxNativeZoom: 17,
    bounds: [
      [18.3067994, 77.2229331],
      [18.669315, 77.583964],
    ],
    source: "https://doi.org/10.5066/P9QJDP48",
    credit: "HiRISE/MRO · USGS, Fergason et al. (2020) · Tiles: NASA Mars Trek",
    legend:
      "Tons de cinza: detalhe orbital. Cobertura local; áreas transparentes não têm imagem neste produto.",
  },
  {
    id: "ctx-regional",
    name: "CTX · Entorno de Jezero (preliminar)",
    product: "Jezero_CTX_BlockAdj_dd",
    mission: "Mars Reconnaissance Orbiter · CTX",
    maxNativeZoom: 12,
    bounds: [
      [15.9058484, 75.1537692],
      [19.4453003, 78.8717121],
    ],
    source:
      "https://trek.nasa.gov/tiles/Mars/EQ/Jezero_CTX_BlockAdj_dd/1.0.0/WMTSCapabilities.xml",
    credit: "CTX/MRO · NASA/JPL-Caltech/MSSS · distribuição NASA Mars Trek",
    legend:
      "Mosaico preliminar regional. Tons de cinza mostram a superfície; não medem elevação. Registro entre produtos não validado para navegação operacional.",
  },
  {
    id: "mola",
    name: "MOLA · Relevo global",
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
    .replace("{z}", layer.id === "mola" ? "0" : "12")
    .replace("{y}", layer.id === "mola" ? "0" : "1628")
    .replace("{x}", layer.id === "mola" ? "1" : "5858");
