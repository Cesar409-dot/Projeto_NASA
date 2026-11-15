"use client";

import { LocalizedTree } from "@/components/LocalizedTree";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RotateCcw, RotateCw, ZoomIn, ZoomOut } from "lucide-react";
import type { Crop } from "@/data/crops";
import type { Environment } from "@/lib/greenhouse-simulation";
import { visualInputs } from "@/lib/greenhouse-simulation";
import { CropGlyph } from "./CropGlyph";
import s from "./greenhouse.module.css";

type Props = {
  crop: Crop;
  environment: Environment;
  damage: number;
  status: "loading" | "ready" | "fallback";
  onStatus: (status: "ready" | "fallback") => void;
};

type LeafState = {
  mesh: THREE.Mesh<THREE.ShapeGeometry, THREE.MeshStandardMaterial>;
  baseColor: THREE.Color;
  baseRotation: THREE.Euler;
  baseScale: THREE.Vector3;
};

type PlantRuntime = {
  root: THREE.Group;
  canopy: THREE.Group;
  leaves: LeafState[];
  soil: THREE.Mesh<THREE.CylinderGeometry, THREE.MeshStandardMaterial>;
  soilBase: THREE.Color;
  fluid?: THREE.Mesh<THREE.CylinderGeometry, THREE.MeshStandardMaterial>;
  bubbles: THREE.Mesh<THREE.SphereGeometry, THREE.MeshStandardMaterial>[];
  light: THREE.DirectionalLight;
};

type ModelConfig = {
  height: number;
  leafCount: number;
  leafScale: number;
  leafForm: "oval" | "heart" | "strap" | "wavy" | "spade" | "clover";
  foliage: number;
  stem: number;
  baseKind:
    | "potato"
    | "sweetpotato"
    | "peanut"
    | "grain"
    | "fruit"
    | "pepper"
    | "cucumber"
    | "roots"
    | "clover"
    | "none";
  baseColor?: number;
  grainColor?: number;
  rosette?: boolean;
  branching?: boolean;
};

const models: Record<Crop["modelKey"], ModelConfig> = {
  potato: { height: 1.9, leafCount: 12, leafScale: .55, leafForm: "oval", foliage: 0x799d51, stem: 0x608349, baseKind: "potato", baseColor: 0xc49a69, branching: true },
  "sweet-potato": { height: 1.2, leafCount: 12, leafScale: .62, leafForm: "heart", foliage: 0x628e55, stem: 0x59834d, baseKind: "sweetpotato", baseColor: 0xd08245, branching: true },
  wheat: { height: 2.4, leafCount: 9, leafScale: .45, leafForm: "strap", foliage: 0x9eaa53, stem: 0x8d9850, baseKind: "grain", grainColor: 0xd4b563 },
  rye: { height: 2.3, leafCount: 10, leafScale: .48, leafForm: "strap", foliage: 0x7f9956, stem: 0x82924d, baseKind: "grain", grainColor: 0xb7a36a },
  rice: { height: 1.8, leafCount: 13, leafScale: .54, leafForm: "strap", foliage: 0x789c54, stem: 0x77904b, baseKind: "grain", grainColor: 0xc8bb78 },
  quinoa: { height: 1.65, leafCount: 12, leafScale: .55, leafForm: "spade", foliage: 0x869356, stem: 0x92825f, baseKind: "grain", grainColor: 0xa45c55, branching: true },
  soy: { height: 1.45, leafCount: 12, leafScale: .5, leafForm: "oval", foliage: 0x779259, stem: 0x68814e, baseKind: "peanut", baseColor: 0x8fa05c, branching: true },
  peanut: { height: 1.05, leafCount: 12, leafScale: .4, leafForm: "oval", foliage: 0x7a9b5c, stem: 0x6e8a51, baseKind: "peanut", baseColor: 0xc4a575, branching: true },
  "cowpea-pea": { height: 1.5, leafCount: 12, leafScale: .48, leafForm: "oval", foliage: 0x789660, stem: 0x698753, baseKind: "fruit", baseColor: 0x91a764, branching: true },
  tomato: { height: 1.65, leafCount: 15, leafScale: .45, leafForm: "wavy", foliage: 0x5e8755, stem: 0x66834d, baseKind: "fruit", baseColor: 0xd14c39, branching: true },
  pepper: { height: 1.45, leafCount: 12, leafScale: .52, leafForm: "spade", foliage: 0x688951, stem: 0x71864b, baseKind: "pepper", baseColor: 0x9c4232, branching: true },
  lettuce: { height: 1.12, leafCount: 19, leafScale: .74, leafForm: "wavy", foliage: 0x78a467, stem: 0x759355, baseKind: "none", rosette: true },
  brassicas: { height: 1.25, leafCount: 17, leafScale: .68, leafForm: "wavy", foliage: 0x557c54, stem: 0x5d8153, baseKind: "none", rosette: true, branching: true },
  "cress-mustard": { height: .95, leafCount: 18, leafScale: .4, leafForm: "oval", foliage: 0x8da45a, stem: 0x829451, baseKind: "grain", grainColor: 0xd0bd5a, branching: true },
  "root-trio": { height: 1.4, leafCount: 13, leafScale: .46, leafForm: "spade", foliage: 0x71935c, stem: 0x658451, baseKind: "roots", branching: true },
  "cucumber-strawberry": { height: 1.65, leafCount: 13, leafScale: .53, leafForm: "wavy", foliage: 0x6f9253, stem: 0x67854c, baseKind: "cucumber", baseColor: 0x8caa5c, branching: true },
  "clover-lotus": { height: .82, leafCount: 20, leafScale: .37, leafForm: "clover", foliage: 0x76995b, stem: 0x6b8c52, baseKind: "clover", branching: true },
  "microbial-bioreactor": { height: 1.5, leafCount: 0, leafScale: 0, leafForm: "oval", foliage: 0x719b69, stem: 0x638455, baseKind: "none" },
};

function makeLeafShape(form: ModelConfig["leafForm"]) {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  if (form === "heart") {
    shape.bezierCurveTo(-.64, .35, -.7, .86, 0, 1);
    shape.bezierCurveTo(.7, .86, .64, .35, 0, 0);
  } else if (form === "strap") {
    shape.bezierCurveTo(-.22, .22, -.2, .82, 0, 1);
    shape.bezierCurveTo(.2, .82, .22, .22, 0, 0);
  } else if (form === "wavy") {
    shape.bezierCurveTo(-.7, .18, -.48, .52, -.66, .74);
    shape.bezierCurveTo(-.34, 1.02, .38, 1.03, .66, .75);
    shape.bezierCurveTo(.5, .5, .73, .18, 0, 0);
  } else if (form === "spade") {
    shape.bezierCurveTo(-.58, .22, -.68, .7, 0, 1);
    shape.bezierCurveTo(.68, .7, .58, .22, 0, 0);
  } else if (form === "clover") {
    shape.bezierCurveTo(-.62, .3, -.55, .76, 0, .81);
    shape.bezierCurveTo(.55, .76, .62, .3, 0, 0);
  } else {
    shape.bezierCurveTo(-.55, .23, -.48, .8, 0, 1);
    shape.bezierCurveTo(.48, .8, .55, .23, 0, 0);
  }
  shape.closePath();
  return new THREE.ShapeGeometry(shape, 10);
}

function addSphere(
  parent: THREE.Group,
  position: [number, number, number],
  scale: [number, number, number],
  color: number,
  segments = 18,
) {
  const geometry = new THREE.SphereGeometry(1, segments, Math.max(8, segments - 4));
  const material = new THREE.MeshStandardMaterial({
    color,
    roughness: .63,
    metalness: .02,
  });
  const sphere = new THREE.Mesh(geometry, material);
  sphere.position.set(...position);
  sphere.scale.set(...scale);
  parent.add(sphere);
  return sphere;
}

function addTube(
  parent: THREE.Group,
  points: THREE.Vector3[],
  color: number,
  radius: number,
) {
  const curve = new THREE.CatmullRomCurve3(points);
  const geometry = new THREE.TubeGeometry(curve, 16, radius, 6, false);
  const material = new THREE.MeshStandardMaterial({ color, roughness: .7 });
  const tube = new THREE.Mesh(geometry, material);
  parent.add(tube);
  return tube;
}

function createPlant(
  crop: Crop,
  scene: THREE.Scene,
  light: THREE.DirectionalLight,
): PlantRuntime {
  const config = models[crop.modelKey];
  const root = new THREE.Group();
  const canopy = new THREE.Group();
  const leaves: LeafState[] = [];
  const bubbles: THREE.Mesh<THREE.SphereGeometry, THREE.MeshStandardMaterial>[] =
    [];
  scene.add(root);
  const soilBase = new THREE.Color(
    crop.modelKey === "rice" ? 0x425146 : 0x66513d,
  );
  const soil = new THREE.Mesh(
    new THREE.CylinderGeometry(1.35, 1.48, .24, 40),
    new THREE.MeshStandardMaterial({
      color: soilBase,
      roughness: 1,
      metalness: 0,
    }),
  );
  soil.position.y = .02;
  root.add(soil);
  const rim = new THREE.Mesh(
    new THREE.CylinderGeometry(1.47, 1.48, .07, 40),
    new THREE.MeshStandardMaterial({
      color: crop.modelKey === "rice" ? 0x3c4e47 : 0x363e32,
      roughness: .55,
      metalness: .2,
    }),
  );
  rim.position.y = .17;
  root.add(rim);

  if (crop.biologicalType === "biofactory") {
    return createBioreactor(crop, scene, light, root, soil, soilBase);
  }

  const baseY = .22;
  const stemGeometry = new THREE.CylinderGeometry(.035, .065, config.height, 8);
  const stemMaterial = new THREE.MeshStandardMaterial({
    color: config.stem,
    roughness: .8,
  });
  const centerStem = new THREE.Mesh(stemGeometry, stemMaterial);
  centerStem.position.set(0, baseY + config.height / 2, 0);
  canopy.add(centerStem);
  root.add(canopy);

  if (config.branching || config.rosette) {
    const branches = config.rosette ? 2 : 4;
    for (let branch = 0; branch < branches; branch++) {
      const theta = (branch / branches) * Math.PI * 2 + .38;
      const height = config.rosette ? config.height * .55 : config.height * (.48 + branch * .075);
      const end = new THREE.Vector3(
        Math.cos(theta) * (config.rosette ? .42 : .55),
        baseY + height,
        Math.sin(theta) * (config.rosette ? .42 : .55),
      );
      addTube(
        canopy,
        [
          new THREE.Vector3(0, baseY + height * .36, 0),
          new THREE.Vector3(end.x * .55, baseY + height * .7, end.z * .55),
          end,
        ],
        config.stem,
        .023,
      );
    }
  }

  const leafGeometry = makeLeafShape(config.leafForm);
  for (let index = 0; index < config.leafCount; index++) {
    const t = (index + 1) / (config.leafCount + 1);
    const angle = index * 2.39996;
    const radial = config.rosette
      ? .25 + (index % 4) * .16
      : .13 + (index % 3) * .055;
    const h = config.rosette
      ? baseY + .18 + (index % 4) * .12
      : baseY + .2 + t * config.height * .82;
    const x = Math.cos(angle) * radial;
    const z = Math.sin(angle) * radial;
    const length =
      config.leafScale *
      (config.rosette ? .76 + (index % 4) * .16 : .68 + .34 * Math.sin(Math.PI * t));
    const material = new THREE.MeshStandardMaterial({
      color: config.foliage,
      roughness: .72,
      metalness: 0,
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(leafGeometry, material);
    mesh.position.set(x, h, z);
    mesh.rotation.set(
      config.rosette ? .04 : (index % 2 ? .27 : -.26),
      angle,
      (index % 2 ? -1 : 1) * (config.rosette ? .85 + (index % 3) * .12 : 1.0),
    );
    mesh.scale.set(length * .76, length, 1);
    canopy.add(mesh);
    leaves.push({
      mesh,
      baseColor: new THREE.Color(config.foliage),
      baseRotation: mesh.rotation.clone(),
      baseScale: mesh.scale.clone(),
    });
  }

  addCropStructures(crop, root, canopy, config, baseY);
  return { root, canopy, leaves, soil, soilBase, bubbles, light };
}

function createBioreactor(
  crop: Crop,
  scene: THREE.Scene,
  light: THREE.DirectionalLight,
  root: THREE.Group,
  soil: PlantRuntime["soil"],
  soilBase: THREE.Color,
): PlantRuntime {
  const leaves: LeafState[] = [];
  const bubbles: THREE.Mesh<THREE.SphereGeometry, THREE.MeshStandardMaterial>[] =
    [];
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(.73, .8, 2.1, 32, 1, true),
    new THREE.MeshPhysicalMaterial({
      color: 0xb2dcc3,
      roughness: .08,
      metalness: .12,
      transparent: true,
      opacity: .27,
      transmission: .55,
      thickness: .15,
      side: THREE.DoubleSide,
    }),
  );
  body.position.y = 1.34;
  root.add(body);
  const fluidMaterial = new THREE.MeshStandardMaterial({
    color: 0x65a476,
    roughness: .35,
    transparent: true,
    opacity: .82,
    emissive: 0x183b27,
  });
  const fluid = new THREE.Mesh(
    new THREE.CylinderGeometry(.69, .75, 1.25, 32),
    fluidMaterial,
  );
  fluid.position.y = .97;
  root.add(fluid);
  const neck = new THREE.Mesh(
    new THREE.CylinderGeometry(.3, .37, .24, 28),
    new THREE.MeshStandardMaterial({
      color: 0x4e6659,
      roughness: .3,
      metalness: .42,
    }),
  );
  neck.position.y = 2.55;
  root.add(neck);
  const lid = new THREE.Mesh(
    new THREE.CylinderGeometry(.35, .35, .1, 28),
    new THREE.MeshStandardMaterial({
      color: 0x71877a,
      roughness: .35,
      metalness: .5,
    }),
  );
  lid.position.y = 2.72;
  root.add(lid);
  for (let index = 0; index < 17; index++) {
    const angle = index * 2.39996;
    const y = .5 + ((index * 37) % 100) / 100 * 1.35;
    const radius = .42 + (index % 3) * .09;
    const bubble = addSphere(
      root,
      [Math.cos(angle) * radius, y, Math.sin(angle) * radius],
      [.027 + (index % 3) * .009, .027 + (index % 3) * .009, .027 + (index % 3) * .009],
      index % 4 === 0 ? 0xc4d791 : 0xe0cf9c,
      10,
    );
    bubbles.push(bubble as PlantRuntime["bubbles"][number]);
  }
  addSphere(root, [-.84, .68, .05], [.15, .22, .15], 0xb66e68);
  addSphere(root, [.84, .91, -.02], [.12, .17, .12], 0x7fa75f);
  const bracketMaterial = new THREE.MeshStandardMaterial({
    color: 0x809187,
    roughness: .4,
    metalness: .52,
  });
  for (const x of [-.89, .89]) {
    const bracket = new THREE.Mesh(
      new THREE.BoxGeometry(.1, 1.65, .13),
      bracketMaterial,
    );
    bracket.position.set(x, 1.35, 0);
    root.add(bracket);
  }
  void crop;
  void scene;
  return { root, canopy: root, leaves, soil, soilBase, fluid, bubbles, light };
}

function addCropStructures(
  crop: Crop,
  root: THREE.Group,
  canopy: THREE.Group,
  config: ModelConfig,
  baseY: number,
) {
  const color = config.baseColor || 0xc48754;
  const key = crop.modelKey;
  if (config.baseKind === "potato" || config.baseKind === "sweetpotato") {
    const sizes =
      key === "sweet-potato"
        ? [[.28, .18, .17], [.34, .2, .18], [.24, .15, .15]]
        : [[.23, .2, .17], [.24, .17, .16], [.19, .15, .14]];
    sizes.forEach((size, index) => {
      const x = index === 1 ? .52 : -.42;
      const z = index === 2 ? .42 : -.18;
      addSphere(
        root,
        [x, -.16, z],
        size as [number, number, number],
        key === "sweet-potato" ? 0xd07a3e : 0xc49a69,
      );
    });
    return;
  }
  if (key === "root-trio") {
    const roots = [
      { x: -.63, scale: [.13, .68, .13] as [number, number, number], color: 0xc05551 },
      { x: 0, scale: [.15, .83, .15] as [number, number, number], color: 0xe49c46 },
      { x: .63, scale: [.17, .7, .17] as [number, number, number], color: 0x89505e },
    ];
    for (const item of roots) {
      const mesh = addSphere(root, [item.x, -.36, .2], item.scale, item.color, 20);
      mesh.rotation.z = item.x * .28;
    }
    return;
  }
  if (key === "peanut") {
    for (const x of [-.44, -.17, .15, .42]) {
      const pod = addSphere(root, [x, -.16 - Math.abs(x) * .12, .28], [.09, .2, .075], 0xc4a575, 12);
      pod.rotation.z = x * .7;
    }
  }
  if (key === "wheat" || key === "rye" || key === "rice" || key === "quinoa" || key === "cress-mustard") {
    const mainColor = config.grainColor || color;
    const positions =
      key === "cress-mustard"
        ? [[-.55, .7, .2], [-.21, .9, -.25], [.28, .72, .18], [.58, .85, -.2]]
        : key === "quinoa"
          ? [[0, 2.0, 0], [-.28, 1.65, .1], [.31, 1.72, -.16]]
          : key === "rice"
            ? [[-.35, 1.72, .18], [.17, 1.6, -.12], [.47, 1.5, .22]]
            : [[-.3, 2.22, .12], [.18, 2.15, -.15], [.48, 2.02, .15]];
    positions.forEach((position, cluster) => {
      const [x, y, z] = position;
      if (key === "cress-mustard") {
        for (let petal = 0; petal < 5; petal++) {
          const angle = (petal / 5) * Math.PI * 2;
          addSphere(
            canopy,
            [x + Math.cos(angle) * .08, y + Math.sin(angle) * .06, z],
            [.055, .055, .05],
            0xd7c85b,
            10,
          );
        }
      } else if (key === "quinoa") {
        for (let seed = 0; seed < 12; seed++) {
          const angle = seed * 2.39996;
          const radius = .09 + (seed % 3) * .065;
          addSphere(
            canopy,
            [x + Math.cos(angle) * radius, y - (seed % 4) * .08, z + Math.sin(angle) * radius],
            [.07, .07, .07],
            seed % 3 === 0 ? mainColor : 0x9c6258,
            10,
          );
        }
      } else {
        const head = new THREE.Mesh(
          new THREE.ConeGeometry(key === "rye" ? .14 : .19, key === "rice" ? .62 : .72, 8),
          new THREE.MeshStandardMaterial({ color: mainColor, roughness: .62 }),
        );
        head.position.set(x, y, z);
        if (key === "rice") head.rotation.z = .45 + cluster * .13;
        canopy.add(head);
        const seedCount = key === "rice" ? 7 : 9;
        for (let seed = 0; seed < seedCount; seed++) {
          const angle = seed * 2.39996;
          const radius = key === "rye" ? .18 : .13;
          addSphere(
            canopy,
            [x + Math.cos(angle) * radius, y + (seed % 3) * .12 - .22, z + Math.sin(angle) * radius],
            [.065, .11, .055],
            mainColor,
            9,
          );
        }
      }
    });
    return;
  }
  if (key === "tomato" || key === "pepper") {
    const fruitColor = key === "tomato" ? 0xd34b3a : 0x8f4e39;
    for (let index = 0; index < (key === "tomato" ? 5 : 4); index++) {
      const angle = index * 2.39996;
      const x = Math.cos(angle) * (.48 + (index % 2) * .1);
      const y = baseY + config.height * (.38 + (index % 3) * .12);
      const z = Math.sin(angle) * .44;
      const fruit = addSphere(
        canopy,
        [x, y, z],
        key === "tomato" ? [.19, .18, .18] : [.14, .3, .15],
        index % 3 === 0 ? 0x78984b : fruitColor,
        18,
      );
      if (key === "pepper") fruit.rotation.z = Math.cos(angle) * .18;
    }
    return;
  }
  if (key === "soy" || key === "cowpea-pea") {
    for (let index = 0; index < 5; index++) {
      const angle = index * 2.39996;
      const pod = addSphere(
        canopy,
        [Math.cos(angle) * .43, baseY + config.height * (.34 + (index % 3) * .12), Math.sin(angle) * .4],
        [.09, .24, .075],
        0x94a966,
        12,
      );
      pod.rotation.z = Math.cos(angle) * .55;
    }
    return;
  }
  if (key === "cucumber-strawberry") {
    const cucumber = addSphere(canopy, [.58, 1.0, .18], [.14, .58, .14], 0x80a250, 20);
    cucumber.rotation.z = -.12;
    for (let index = 0; index < 4; index++) {
      const x = -.52 + (index % 2) * .19;
      const y = .6 + Math.floor(index / 2) * .18;
      const berry = addSphere(canopy, [x, y, .27], [.12, .14, .12], 0xc95e58, 16);
      berry.rotation.z = -.12;
      for (let seed = 0; seed < 4; seed++) {
        const angle = seed * Math.PI / 2;
        addSphere(canopy, [x + Math.cos(angle) * .075, y + Math.sin(angle) * .082, .36], [.018, .018, .018], 0xf0d99d, 7);
      }
    }
  }
  if (key === "clover-lotus") {
    for (let index = 0; index < 3; index++) {
      const angle = index * 2.39996;
      const flower = new THREE.Mesh(
        new THREE.SphereGeometry(.14, 12, 10),
        new THREE.MeshStandardMaterial({ color: 0xd8d5ac, roughness: .64 }),
      );
      flower.position.set(Math.cos(angle) * .44, baseY + .64, Math.sin(angle) * .42);
      canopy.add(flower);
    }
  }
  void root;
}

function updatePlant(
  runtime: PlantRuntime,
  crop: Crop,
  environment: Environment,
  damage: number,
) {
  const symptoms = visualInputs(crop, environment, damage);
  const stress = Math.max(
    symptoms.waterDeficit,
    symptoms.waterExcess * .72,
    symptoms.lightDeficit * .55,
    symptoms.lightExcess * .68,
    symptoms.cold * .6,
    symptoms.heat * .75,
  );
  runtime.canopy.scale.y = 1 + symptoms.lightDeficit * .2;
  runtime.light.intensity = Math.max(.45, 1.35 - symptoms.lightDeficit * .52);
  runtime.soil.material.color
    .copy(runtime.soilBase)
    .lerp(new THREE.Color(0x7d6552), symptoms.waterDeficit * .32)
    .lerp(new THREE.Color(0x516c69), symptoms.waterExcess * .38);
  for (const leaf of runtime.leaves) {
    const droop =
      symptoms.waterDeficit * .62 +
      symptoms.heat * .24 +
      symptoms.cold * .14 +
      symptoms.accumulatedDamage * 1.05;
    leaf.mesh.rotation.set(
      leaf.baseRotation.x + symptoms.cold * .17,
      leaf.baseRotation.y,
      leaf.baseRotation.z + Math.sign(leaf.baseRotation.z || 1) * droop,
    );
    leaf.mesh.scale.set(
      leaf.baseScale.x * (1 - symptoms.accumulatedDamage * .24),
      leaf.baseScale.y * (1 - symptoms.accumulatedDamage * .18),
      leaf.baseScale.z,
    );
    const yellowing = Math.min(
      .9,
      symptoms.waterDeficit * .14 +
        symptoms.lightDeficit * .25 +
        symptoms.lightExcess * .25 +
        symptoms.heat * .18 +
        symptoms.cold * .18 +
        symptoms.accumulatedDamage * .78,
    );
    const targetColor = symptoms.cold > symptoms.heat
      ? new THREE.Color(0x715d69)
      : symptoms.heat > .08
        ? new THREE.Color(0x9e6948)
        : symptoms.waterDeficit > .08
          ? new THREE.Color(0xb49a57)
          : new THREE.Color(0xb8a75e);
    leaf.mesh.material.color.copy(leaf.baseColor).lerp(targetColor, yellowing);
    leaf.mesh.material.roughness = .64 + stress * .2;
  }
  if (runtime.fluid) {
    const waterRef = crop.environmentalReferences.water;
    const waterRatio = Math.max(
      .18,
      Math.min(
        1,
        environment.water /
          Math.max(1, waterRef.controlMax),
      ),
    );
    runtime.fluid.scale.y = waterRatio;
    runtime.fluid.position.y = .4 + waterRatio * .57;
    runtime.fluid.material.color.set(
      symptoms.accumulatedDamage > .5
        ? 0x7a6657
        : symptoms.lightDeficit > .4
          ? 0x668574
          : symptoms.heat > .2
            ? 0x9a7852
            : 0x65a476,
    );
    runtime.fluid.material.emissive.set(
      symptoms.lightDeficit > .2 ? 0x101c17 : 0x183b27,
    );
    runtime.bubbles.forEach((bubble, index) => {
      bubble.visible = index < Math.round(17 * (1 - symptoms.accumulatedDamage * .7));
      bubble.position.y =
        .45 + ((index * 37 + Math.round(environment.light)) % 100) / 100 * 1.28;
      bubble.material.color.set(
        symptoms.accumulatedDamage > .65 ? 0xa57862 : 0xe0cf9c,
      );
    });
  }
}

function disposeObject(object: THREE.Object3D) {
  object.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.geometry.dispose();
      const materials = Array.isArray(child.material)
        ? child.material
        : [child.material];
      materials.forEach((material) => material.dispose());
    }
  });
}

export function Crop3DViewer({ crop, environment, damage, status, onStatus }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const runtimeRef = useRef<PlantRuntime | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const renderRef = useRef<(() => void) | null>(null);
  const liveRef = useRef({
    crop,
    environment,
    damage,
    onStatus,
  });
  useEffect(() => {
    liveRef.current = { crop, environment, damage, onStatus };
  }, [crop, environment, damage, onStatus]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let renderer: THREE.WebGLRenderer | undefined;
    let controls: OrbitControls | undefined;
    let runtime: PlantRuntime | undefined;
    let frame: number | null = null;
    let resizeObserver: ResizeObserver | undefined;
    let lostHandler: ((event: Event) => void) | undefined;
    let scene: THREE.Scene | undefined;
    let camera: THREE.PerspectiveCamera | undefined;
    let canvas: HTMLCanvasElement;

    try {
      if (typeof window.WebGLRenderingContext === "undefined" && typeof window.WebGL2RenderingContext === "undefined") {
        throw new Error("WebGL indisponível");
      }
      canvas = document.createElement("canvas");
      canvas.setAttribute("aria-hidden", "true");
      host.replaceChildren(canvas);
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: "low-power",
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      renderer.setSize(host.clientWidth || 680, host.clientHeight || 540, false);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.1;
      scene = new THREE.Scene();
      scene.background = new THREE.Color(0x141b18);
      camera = new THREE.PerspectiveCamera(
        36,
        Math.max(.5, (host.clientWidth || 680) / (host.clientHeight || 540)),
        .1,
        50,
      );
      camera.position.set(3.8, 2.9, 6.3);
      controls = new OrbitControls(camera, renderer.domElement);
      controlsRef.current = controls;
      controls.target.set(0, 1.18, 0);
      controls.enableDamping = true;
      controls.dampingFactor = .09;
      controls.minDistance = 3.1;
      controls.maxDistance = 9.5;
      controls.maxPolarAngle = Math.PI * .49;

      scene.add(new THREE.HemisphereLight(0xdde9ce, 0x2b382f, 2.0));
      const keyLight = new THREE.DirectionalLight(0xffe4b4, 1.35);
      keyLight.position.set(4, 7, 5);
      scene.add(keyLight);
      const rimLight = new THREE.DirectionalLight(0x9cc79b, .85);
      rimLight.position.set(-5, 4, -3);
      scene.add(rimLight);
      const floor = new THREE.Mesh(
        new THREE.CircleGeometry(5, 48),
        new THREE.MeshStandardMaterial({
          color: 0x17201b,
          roughness: .88,
          metalness: .04,
        }),
      );
      floor.rotation.x = -Math.PI / 2;
      floor.position.y = -.16;
      scene.add(floor);
      const grid = new THREE.GridHelper(7, 18, 0x54624c, 0x29372e);
      grid.position.y = -.145;
      scene.add(grid);
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(1.55, .018, 6, 72),
        new THREE.MeshStandardMaterial({
          color: 0x80956d,
          emissive: 0x1d3121,
          roughness: .45,
        }),
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.y = -.04;
      scene.add(ring);
      runtime = createPlant(liveRef.current.crop, scene, keyLight);
      runtimeRef.current = runtime;

      const draw = () => {
        frame = null;
        if (!renderer || !scene || !camera || !controls) return;
        controls.update();
        renderer.render(scene, camera);
      };
      const schedule = () => {
        if (frame === null) frame = window.requestAnimationFrame(draw);
      };
      renderRef.current = () => renderer?.render(scene!, camera!);
      controls.addEventListener("change", schedule);
      schedule();
      lostHandler = (event) => {
        event.preventDefault();
        liveRef.current.onStatus("fallback");
      };
      canvas.addEventListener("webglcontextlost", lostHandler);
      resizeObserver = new ResizeObserver(() => {
        if (!host.clientWidth || !host.clientHeight || !camera) return;
        camera.aspect = host.clientWidth / host.clientHeight;
        camera.updateProjectionMatrix();
        renderer?.setSize(host.clientWidth, host.clientHeight, false);
        schedule();
      });
      resizeObserver.observe(host);
      updatePlant(runtime, liveRef.current.crop, liveRef.current.environment, liveRef.current.damage);
      liveRef.current.onStatus("ready");

      return () => {
        if (frame !== null) window.cancelAnimationFrame(frame);
        resizeObserver?.disconnect();
        if (lostHandler) canvas.removeEventListener("webglcontextlost", lostHandler);
        controls?.removeEventListener("change", schedule);
        controls?.dispose();
        runtimeRef.current = null;
        controlsRef.current = null;
        renderRef.current = null;
        if (scene) disposeObject(scene);
        renderer?.dispose();
        host.replaceChildren();
      };
    } catch {
      liveRef.current.onStatus("fallback");
      renderer?.dispose();
      return () => {
        controls?.dispose();
      controlsRef.current = null;
        resizeObserver?.disconnect();
      };
    }
  }, [crop.id, onStatus]);

  useEffect(() => {
    if (status === "fallback" || !runtimeRef.current) return;
    updatePlant(runtimeRef.current, crop, environment, damage);
    renderRef.current?.();
  }, [crop, environment, damage, status]);

  function adjustView(action: "left" | "right" | "in" | "out") {
    const controls = controlsRef.current;
    if (!controls || status !== "ready") return;
    if (action === "left") controls.rotateLeft(Math.PI / 12);
    if (action === "right") controls.rotateLeft(-Math.PI / 12);
    if (action === "in") controls.dollyIn(1.15);
    if (action === "out") controls.dollyOut(1.15);
    controls.update();
    renderRef.current?.();
  }

  return <LocalizedTree>{(
    <div className={s.webglViewer}>
      {status === "fallback" ? (
        <CropGlyph
          crop={crop}
          large
          health={damage}
          environment={environment}
          ariaLabel={"Representação 2D de fallback de " + crop.name}
        />
      ) : null}
      <div className={s.canvasHost} ref={hostRef} />
      <div className={s.webglControls} role="group" aria-label="Controles do modelo 3D">
        <button type="button" aria-label="Girar modelo para a esquerda" title="Girar para a esquerda" disabled={status !== "ready"} onClick={() => adjustView("left")}><RotateCcw size={16} aria-hidden="true" /></button>
        <button type="button" aria-label="Girar modelo para a direita" title="Girar para a direita" disabled={status !== "ready"} onClick={() => adjustView("right")}><RotateCw size={16} aria-hidden="true" /></button>
        <span aria-hidden="true" />
        <button type="button" aria-label="Aproximar modelo" title="Aproximar" disabled={status !== "ready"} onClick={() => adjustView("in")}><ZoomIn size={16} aria-hidden="true" /></button>
        <button type="button" aria-label="Afastar modelo" title="Afastar" disabled={status !== "ready"} onClick={() => adjustView("out")}><ZoomOut size={16} aria-hidden="true" /></button>
      </div>
      {status === "fallback" ? (
        <div className={s.webglFallback} role="status">
          WebGL indisponível; usando ilustração vetorial de contingência.
        </div>
      ) : null}
    </div>
  )}</LocalizedTree>;
}
