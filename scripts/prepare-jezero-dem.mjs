import { fromFile } from "geotiff";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";

// Offline, reproducible extraction. No imagery is decoded into elevation.
const input = process.argv[2];
if (!input)
  throw new Error("Uso: node scripts/prepare-jezero-dem.mjs caminho/DEM.tif");
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const sourceHash = hash(await readFile(input));
if (
  sourceHash !==
  "ba7f706ea1b5d63a562f28a7dcf7a7f3c79bce7f048e6974b57e8a33c30d1ba2"
)
  throw new Error(
    "O hash do DEM difere da fonte verificada. Revise os dados antes de gerar uma nova versão.",
  );
const tiff = await fromFile(input);
try {
  const image = await tiff.getImage();
  const keys = image.getGeoKeys();
  const [ox, oy] = image.getOrigin();
  const [sx, sy] = image.getResolution();
  const radius = keys.GeogSemiMajorAxisGeoKey;
  const parallel = keys.ProjStdParallel1GeoKey;
  if (
    image.getWidth() !== 4456 ||
    image.getHeight() !== 5067 ||
    sx !== 20 ||
    sy !== -20 ||
    radius !== 3396190 ||
    keys.GeogSemiMinorAxisGeoKey !== radius ||
    parallel !== 18.4663 ||
    keys.ProjCoordTransGeoKey !== 17 ||
    keys.ProjLinearUnitsGeoKey !== 9001 ||
    keys.ProjFalseEastingGeoKey !== 0 ||
    keys.ProjFalseNorthingGeoKey !== 0 ||
    keys.ProjCenterLongGeoKey !== 0 ||
    keys.ProjCenterLatGeoKey !== 0 ||
    keys.GTRasterTypeGeoKey !== 1
  )
    throw new Error(
      "Contrato GeoTIFF alterado: revisar projeção, datum, tamanho e unidades.",
    );
  const rad = Math.PI / 180,
    cos = Math.cos(parallel * rad);
  const factor = 5,
    step = sx * factor;
  const leftPixel =
    Math.floor((radius * 77.1 * rad * cos - ox) / step) * factor;
  const topPixel = Math.floor((oy - radius * 18.65 * rad) / step) * factor;
  const width = Math.ceil(
    (radius * 77.8 * rad * cos - ox - leftPixel * sx) / step,
  );
  const height = Math.ceil((oy - radius * 18.3 * rad - topPixel * sx) / step);
  const window = [
    leftPixel - 1,
    topPixel - 1,
    leftPixel + width * factor + 1,
    topPixel + height * factor + 1,
  ];
  const raster = await image.readRasters({
    window,
    samples: [0],
    interleave: true,
  });
  const rw = width * factor + 2;
  const nodata = await image.getGDALNoData();
  const valid = (z) =>
    Number.isFinite(z) && z !== nodata && z > -20000 && z < 30000;
  const count = width * height,
    bytes = Buffer.alloc(count * 8);
  let missing = 0;
  for (let row = 0; row < height; row++)
    for (let col = 0; col < width; col++) {
      let sum = 0,
        slope = 0,
        known = true;
      for (let dy = 0; dy < factor; dy++)
        for (let dx = 0; dx < factor; dx++) {
          const x = 1 + col * factor + dx,
            y = 1 + row * factor + dy,
            i = y * rw + x;
          const z = raster[i],
            west = raster[i - 1],
            east = raster[i + 1],
            north = raster[i - rw],
            south = raster[i + rw];
          if (![z, west, east, north, south].every(valid)) {
            known = false;
            continue;
          }
          const latitude = (oy - (window[1] + y + 0.5) * sx) / radius;
          const horizontal = (sx * Math.cos(latitude)) / cos;
          // Maximum central-difference gradient and one-sided edge slopes in every native pixel.
          const gradient = Math.hypot(
            (east - west) / (2 * horizontal),
            (north - south) / (2 * sx),
          );
          const tangent = Math.max(
            gradient,
            Math.abs(z - west) / horizontal,
            Math.abs(z - east) / horizontal,
            Math.abs(z - north) / sx,
            Math.abs(z - south) / sx,
          );
          slope = Math.max(slope, Math.atan(tangent) / rad);
          sum += z;
        }
      const i = row * width + col;
      bytes.writeFloatLE(known ? sum / 25 : NaN, i * 4);
      bytes.writeFloatLE(known ? slope : NaN, (count + i) * 4);
      if (!known) missing++;
    }
  const metadata = {
    id: "jezero-ctx-100m-v1",
    title: "CTX Jezero · USGS/Calef (2021)",
    source:
      "https://astrogeology.usgs.gov/search/map/mars_2020_science_investigation_ctx_dem_mosaic",
    download:
      "https://planetarymaps.usgs.gov/mosaic/mars2020_trn/CTX/ScienceInvestigationMaps_JPL/M20_JezeroCrater_CTXDEM_20m.tif",
    sourceSha256: sourceHash,
    dataSha256: hash(bytes),
    attribution:
      "Fred Calef · USGS Astrogeology / NASA MRO CTX · domínio público",
    width,
    height,
    left: ox + leftPixel * sx,
    top: oy - topPixel * sx,
    step,
    radius,
    standardParallel: parallel,
    nativeSpacingMetres: 20,
    elevationUnit: "metre",
    latitudeType: "planetocentric",
    longitudeDirection: "east",
    projection: "equirectangular",
    centralMeridian: 0,
    binary: "jezero-ctx-100m-v1.bin",
    encoding:
      "float32-le; elevations then maximum native slope degrees; NaN=unknown",
    extraction: {
      window,
      factor,
      meanElevation: true,
      slope:
        "max native 20m gradient/edge slope in 5x5 block; any unknown stencil blocks cell",
      missing,
    },
    sourceGeoKeys: keys,
    bounds: [
      (oy - (topPixel + height * factor) * sx) / radius / rad,
      (ox + leftPixel * sx) / radius / cos / rad,
      (oy - topPixel * sx) / radius / rad,
      (ox + (leftPixel + width * factor) * sx) / radius / cos / rad,
    ],
  };
  await mkdir("public/terrain", { recursive: true });
  await writeFile("public/terrain/" + metadata.binary, bytes);
  await writeFile(
    "public/terrain/jezero-ctx-100m-v1.json",
    JSON.stringify(metadata, null, 2) + "\n",
  );
  console.log(
    JSON.stringify({
      id: metadata.id,
      width,
      height,
      bytes: bytes.length,
      missing,
      bounds: metadata.bounds,
      sourceHash,
    }),
  );
} finally {
  await tiff.close();
}
