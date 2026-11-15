export type NasaLayer = {
  id: "ctx" | "hirise";
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
];
export const nasaEndpoint = (layer: NasaLayer) =>
  `https://trek.nasa.gov/tiles/Mars/EQ/${layer.product}/1.0.0`;
export const capabilitiesUrl = (layer: NasaLayer) =>
  `${nasaEndpoint(layer)}/WMTSCapabilities.xml`;
export const tileTemplate = (layer: NasaLayer) =>
  `${nasaEndpoint(layer)}/default/default028mm/{z}/{y}/{x}.png`;
export const sampleTileUrl = (layer: NasaLayer) =>
  tileTemplate(layer)
    .replace("{z}", "12")
    .replace("{y}", "1628")
    .replace("{x}", "5858");
