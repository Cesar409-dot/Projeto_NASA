import type { CSSProperties } from "react";
import type { Crop } from "@/data/crops";
import type { Environment } from "@/lib/greenhouse-simulation";
import { visualInputs } from "@/lib/greenhouse-simulation";
import s from "./greenhouse.module.css";

const palette: Record<string, string> = {
  potato: "#99bd6f",
  "sweet-potato": "#d08b52",
  wheat: "#d0b468",
  rye: "#aa9d67",
  rice: "#c0bd78",
  quinoa: "#bb826b",
  soy: "#99b679",
  peanut: "#c59561",
  "cowpea-pea": "#93ac70",
  tomato: "#cf7761",
  pepper: "#c97954",
  lettuce: "#86aa77",
  brassicas: "#90aa72",
  "cress-mustard": "#a8a55f",
  "root-trio": "#c1835d",
  "cucumber-strawberry": "#99a970",
  "clover-lotus": "#85a973",
  "microbial-bioreactor": "#94b19b",
};

export function CropGlyph({
  crop,
  large = false,
  health = 0,
  ariaLabel,
  environment,
}: {
  crop: Crop;
  large?: boolean;
  health?: number;
  ariaLabel?: string;
  environment?: Environment;
}) {
  const accent = palette[crop.modelKey] || "#9ab984";
  const symptoms = environment ? visualInputs(crop, environment, health) : null;
  const wilt = Math.min(
    1,
    Math.max(
      0,
      health / 100,
      symptoms
        ? symptoms.waterDeficit * 0.72 +
            symptoms.heat * 0.34 +
            symptoms.cold * 0.18 +
            symptoms.lightDeficit * 0.12
        : 0,
    ),
  );
  const label =
    ariaLabel ||
    (crop.biologicalType === "biofactory"
      ? "Ilustração de biorreator para " + crop.name
      : "Ilustração conceitual de " + crop.name);

  return (
    <div
      className={[
        s.cropGlyph,
        large ? s.cropGlyphLarge : "",
        wilt > 0 ? s.cropGlyphWilt : "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={{
        "--crop-accent": accent,
        "--crop-wilt": wilt,
        "--crop-light-deficit": symptoms?.lightDeficit || 0,
        "--crop-light-excess": symptoms?.lightExcess || 0,
        "--crop-heat": symptoms?.heat || 0,
        "--crop-cold": symptoms?.cold || 0,
      } as CSSProperties}
      data-model={crop.modelKey}
    >
      <svg
        viewBox="0 0 240 230"
        role={large ? "img" : undefined}
        aria-label={large ? label : undefined}
        aria-hidden={large ? undefined : true}
      >
        <ellipse cx="120" cy="196" rx="78" ry="13" className={s.glyphGround} />
        {crop.biologicalType === "biofactory" ? (
          <g className={s.glyphReactor}>
            <path d="M82 57h76v21l-6 91c-1 13-10 21-22 21h-20c-12 0-21-8-22-21l-6-91z" />
            <ellipse cx="120" cy="58" rx="38" ry="10" />
            <path d="M88 119c18-10 43 11 64-2v45c-1 8-7 14-16 14h-32c-9 0-15-6-16-14z" className={s.glyphFluid} />
            <path d="M101 40v18m38-18v18m-19-16v38m-27-18h54m-45 47c11 8 28 8 38 0" className={s.glyphGlass} />
            <circle cx="101" cy="141" r="4" className={s.glyphBubble} />
            <circle cx="122" cy="153" r="5" className={s.glyphBubble} />
            <circle cx="139" cy="134" r="3.5" className={s.glyphBubble} />
            <rect x="96" y="191" width="48" height="8" rx="2" />
          </g>
        ) : (
          <g className={s.glyphPlant}>
            {crop.modelKey === "wheat" ||
            crop.modelKey === "rye" ||
            crop.modelKey === "rice" ||
            crop.modelKey === "quinoa" ? (
              <>
                <path d="M95 191V51m25 140V38m25 153V58" className={s.glyphStem} />
                {crop.modelKey === "wheat" ? (
                  <g className={s.glyphGrain}>
                    <path d="M95 57C76 43 79 26 89 22c11 7 13 19 10 35m26-15c-15-17-9-32 1-37 12 8 14 22 8 40m18 15c-11-19-3-31 8-33 10 10 7 23-3 36" />
                    <path d="M84 30l11 22m18-30l9 25m39-14l-12 29" />
                  </g>
                ) : crop.modelKey === "rye" ? (
                  <g className={s.glyphRye}>
                    <path d="M94 60l-17-23m20 15l-4-29m25 29l-12-25m14 27l10-26m29 36l-17-25m22 19l4-28" />
                    <path d="M77 37l18 18m-2-32l10 31m-5-28l19 27m19-27l-10 31m18-23l11 22" />
                  </g>
                ) : crop.modelKey === "rice" ? (
                  <g className={s.glyphRice}>
                    <path d="M120 57c18 10 28 22 30 38m-24-30c-10 7-17 20-17 32m27-24c13-3 23 2 30 10" />
                    <ellipse cx="151" cy="98" rx="5" ry="8" /><ellipse cx="139" cy="104" rx="5" ry="8" />
                    <ellipse cx="128" cy="100" rx="5" ry="8" /><ellipse cx="166" cy="110" rx="5" ry="8" />
                    <ellipse cx="114" cy="112" rx="5" ry="8" />
                  </g>
                ) : (
                  <g className={s.glyphQuinoa}>
                    <path d="M120 48c-18 18-19 42 0 60m3-58c20 17 23 41 3 60m-2-42c-29 2-39 19-36 38m40-34c28 0 37 18 32 36" />
                    {[
                      [100, 61], [110, 76], [132, 64], [145, 76], [95, 95],
                      [118, 91], [138, 98], [157, 91], [111, 108], [132, 111],
                    ].map(([cx, cy]) => <circle key={cx + "-" + cy} cx={cx} cy={cy} r="4" />)}
                  </g>
                )}
                <path d="M95 122l-23 16m48-22l24 15m-49-3l-28 20m55-16l28 20m-55-3l-24 18m50-14l25 17" className={s.glyphLeafLine} />
              </>
            ) : crop.modelKey === "root-trio" ? (
              <>
                <path d="M73 131l-5 53 10 5 12-48m33-14l-3 66 11 3 10-62m25-3l1 57 11 4 3-49" className={s.glyphRoot} />
                <path d="M120 132V62M78 131V76m91 56V80" className={s.glyphStem} />
                <path d="M118 86C93 63 83 70 83 85c8 13 22 16 36 12m3-23c21-22 37-15 37-2-7 14-22 18-38 11m-44 7C58 75 52 60 62 55c16 5 21 18 16 33m91 8c18-21 34-19 39-7-7 14-22 20-38 15" className={s.glyphLeaf} />
                <path d="M61 131h125" className={s.glyphSoil} />
              </>
            ) : crop.modelKey === "cucumber-strawberry" ? (
              <>
                <path d="M119 187V71c0-18 15-26 27-15m-27 74c-17-18-29-17-37-5m38 25c16-13 29-12 42 0" className={s.glyphStem} />
                <path d="M109 87C90 67 78 74 79 86c8 12 19 16 31 12m24-26c19-18 33-10 32 4-9 12-20 16-32 10m-21 42c-19-19-31-12-30 0 9 11 19 14 31 8m20-8c20-20 32-13 31-1-7 12-18 15-31 10" className={s.glyphLeaf} />
                <path d="M149 91c7-19 28-15 28 3v40c-8 11-22 10-29-1z" className={s.glyphCucumber} />
                <path d="M92 150c2-16 25-17 27 1l-3 17c-6 8-18 8-23-1z" className={s.glyphFruit} />
                <path d="M95 150l8 4 8-4m-17 8l9 3 9-3" className={s.glyphSeeds} />
              </>
            ) : crop.modelKey === "clover-lotus" ? (
              <>
                <path d="M81 186V121m38 65V93m39 93v-66" className={s.glyphStem} />
                <path d="M81 130c-17-19-29-10-25 3 7 10 15 12 25 5m0-8c13-20 28-14 27-1-8 10-17 12-27 6m-1-4c-7-23 7-29 18-21 5 11 1 20-12 27m22-32c-16-19-28-11-24 2 6 11 15 12 24 6m0-9c14-18 28-11 25 2-7 9-15 11-25 5m2-6c-5-22 10-28 20-18 4 11-1 19-15 25m29 13c-16-17-27-8-22 4 6 10 14 11 23 4m0-8c14-16 27-8 23 4-8 9-15 10-23 3m0-6c-4-20 10-25 19-15 4 10 0 17-14 22" className={s.glyphLeaf} />
              </>
            ) : (
              <>
                <path d="M120 190V67m-4 103c-22-28-43-27-51-12 10 21 29 26 52 17m8-35c22-26 42-22 48-8-10 20-29 24-50 15m-9-51c-18-23-36-18-40-5 9 16 23 20 41 13m13 57c18-22 36-18 41-6-10 16-24 20-42 12" className={s.glyphStem + " " + s.glyphLeaf} />
                {crop.modelKey === "potato" || crop.modelKey === "sweet-potato" || crop.modelKey === "peanut" ? (
                  <>
                    <path d="M58 190h124" className={s.glyphSoil} />
                    <ellipse cx="93" cy="201" rx="15" ry="8" className={s.glyphRoot} />
                    <ellipse cx="144" cy="201" rx="19" ry="8" className={s.glyphRoot} />
                  </>
                ) : null}
                {crop.modelKey === "tomato" || crop.modelKey === "pepper" ? (
                  <>
                    <path d="M91 132v18m56-38v19m-57 3c1-17 26-17 28 0l-3 14c-6 8-17 8-22 0zm43-40c2-18 27-17 28 1l-3 15c-6 8-18 7-23 0z" className={s.glyphFruit} />
                    <path d="M94 133l10 5 11-5m37-34l10 4 10-5" className={s.glyphSeeds} />
                  </>
                ) : null}
                {crop.modelKey === "soy" || crop.modelKey === "peanut" || crop.modelKey === "cowpea-pea" ? (
                  <path d="M78 139c-17 13 5 28 20 17 8-6 9-14 3-20m41-24c17-10 31 12 16 24-10 9-21 7-27-1" className={s.glyphPod} />
                ) : null}
                {crop.modelKey === "cress-mustard" ? (
                  <g className={s.glyphFlower}><circle cx="65" cy="62" r="4" /><circle cx="79" cy="49" r="4" /><circle cx="152" cy="59" r="4" /><circle cx="170" cy="70" r="4" /></g>
                ) : null}
              </>
            )}
            {crop.modelKey === "lettuce" || crop.modelKey === "brassicas" ? (
              <path d="M120 139c-30-30-56-27-58-7 13 19 31 23 57 16m4-8c23-32 48-28 51-10-12 18-30 23-52 17m-10 1c-21-26-40-18-38-4 9 14 22 16 40 9m16-5c16-23 34-18 35-5-10 12-20 15-35 10" className={s.glyphLeaf} />
            ) : null}
          </g>
        )}
      </svg>
    </div>
  );
}
