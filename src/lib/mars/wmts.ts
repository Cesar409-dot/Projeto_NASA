import {
  capabilitiesUrl,
  sampleTileUrl,
  type NasaLayer,
} from "../../data/map-layers";

export type LayerHealth = {
  state: "checking" | "ready" | "error";
  message: string;
};

/** Check the specific matrix contract; no generic WMTS compatibility assumption. */
export function validateWmts(xml: string, layer: NasaLayer): void {
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  if (doc.getElementsByTagName("parsererror").length)
    throw new Error("Metadados XML inválidos");
  const descendants = (node: Document | Element, name: string) =>
    Array.from(node.getElementsByTagNameNS("*", name));
  const identifier = (node: Element) =>
    Array.from(node.children)
      .find((n) => n.localName === "Identifier")
      ?.textContent?.trim();
  const product = descendants(doc, "Layer").find(
    (n) => identifier(n) === layer.product,
  );
  const set = descendants(doc, "Contents")
    .flatMap((n) => Array.from(n.children))
    .find(
      (n) =>
        n.localName === "TileMatrixSet" && identifier(n) === "default028mm",
    );
  if (!product || !set)
    throw new Error("Produto ou matriz WMTS diferente do esperado");
  const crs = descendants(set, "SupportedCRS")[0]?.textContent?.trim();
  if (crs !== "urn:ogc:def:crs:EPSG::104905")
    throw new Error("O CRS anunciado mudou; revisar a camada");
  if (
    !descendants(product, "Format").some(
      (n) =>
        n.textContent === (layer.format === "jpg" ? "image/jpeg" : "image/png"),
    )
  )
    throw new Error("Formato de imagem não suportado");
  const matrices = descendants(set, "TileMatrix");
  if (
    matrices.length !== layer.maxNativeZoom + 1 ||
    new Set(matrices.map(identifier)).size !== matrices.length
  )
    throw new Error("Níveis WMTS diferentes dos verificados");
  const bbox = descendants(product, "BoundingBox")[0];
  const lower =
    bbox &&
    descendants(bbox, "LowerCorner")[0]
      ?.textContent?.trim()
      .split(/\s+/)
      .map(Number);
  const upper =
    bbox &&
    descendants(bbox, "UpperCorner")[0]
      ?.textContent?.trim()
      .split(/\s+/)
      .map(Number);
  if (
    !lower ||
    !upper ||
    [
      lower[1] - layer.bounds[0][0],
      lower[0] - layer.bounds[0][1],
      upper[1] - layer.bounds[1][0],
      upper[0] - layer.bounds[1][1],
    ].some((d) => !Number.isFinite(d) || Math.abs(d) > 1e-7)
  )
    throw new Error("A cobertura anunciada mudou; revisar a camada");
  for (const m of matrices) {
    const z = Number(identifier(m));
    const value = (name: string) =>
      Number(descendants(m, name)[0]?.textContent);
    const origin = descendants(m, "TopLeftCorner")[0]
      ?.textContent?.trim()
      .split(/\s+/)
      .map(Number);
    if (
      !Number.isInteger(z) ||
      z < 0 ||
      z > layer.maxNativeZoom ||
      value("TileWidth") !== 256 ||
      value("TileHeight") !== 256 ||
      value("MatrixWidth") !== 2 ** (z + 1) ||
      value("MatrixHeight") !== 2 ** z ||
      origin?.[0] !== -180 ||
      origin?.[1] !== 90
    )
      throw new Error(
        "A grade publicada não corresponde ao adaptador marciano",
      );
  }
}

export async function probeLayer(
  layer: NasaLayer,
  signal: AbortSignal,
): Promise<void> {
  const response = await fetch(capabilitiesUrl(layer), {
    signal,
    credentials: "omit",
  });
  if (!response.ok)
    throw new Error(`Metadados indisponíveis (HTTP ${response.status})`);
  validateWmts(await response.text(), layer);
  const tile = await fetch(sampleTileUrl(layer), {
    signal,
    credentials: "omit",
  });
  if (!tile.ok)
    throw new Error(`Tile de verificação indisponível (HTTP ${tile.status})`);
  const bytes = new Uint8Array(await tile.arrayBuffer());
  const blob = new Blob([bytes], {
    type: layer.format === "jpg" ? "image/jpeg" : "image/png",
  });
  const signature =
    layer.format === "jpg"
      ? bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
      : [137, 80, 78, 71, 13, 10, 26, 10].every((b, i) => bytes[i] === b);
  if (!signature) throw new Error("Formato inesperado do tile (PNG/JPEG)");
  const bitmap = await createImageBitmap(blob);
  const validSize = bitmap.width === 256 && bitmap.height === 256;
  bitmap.close();
  if (!validSize) throw new Error("Dimensões inesperadas do tile");
}
