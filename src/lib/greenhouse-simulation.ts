import type { Crop, EnvironmentalReference } from "@/data/crops";

export type Environment = {
  water: number;
  light: number;
  temperature: number;
};

export type StressLevel =
  | "adequada"
  | "leve"
  | "moderada"
  | "severa"
  | "crítica";

export type HealthStage =
  | "saudável"
  | "estresse leve"
  | "estresse moderado"
  | "estresse severo"
  | "crítico"
  | "colapso visual";

export type FactorId = keyof Environment;

export type FactorAssessment = {
  id: FactorId;
  name: string;
  value: number;
  reference: EnvironmentalReference;
  score: 0 | 1 | 2 | 3 | 4;
  level: StressLevel;
  direction: "abaixo" | "dentro" | "acima";
  summary: string;
  symptoms: string;
  adjustment: string;
};

export type EnvironmentAssessment = {
  level: StressLevel;
  score: 0 | 1 | 2 | 3 | 4;
  primary: FactorAssessment | null;
  secondary: FactorAssessment[];
  factors: FactorAssessment[];
};

const scoreLabels: StressLevel[] = [
  "adequada",
  "leve",
  "moderada",
  "severa",
  "crítica",
];

const factorNames: Record<FactorId, string> = {
  water: "Água",
  light: "Luz",
  temperature: "Temperatura",
};

function scoreFromDistance(
  id: FactorId,
  distance: number,
  direction: "abaixo" | "acima" | "dentro",
): 0 | 1 | 2 | 3 | 4 {
  if (distance <= 0) return 0;
  if (id === "water") {
    if (distance <= 5) return 1;
    if (distance <= 10) return 2;
    if (distance <= 18) return 3;
    return 4;
  }
  if (id === "light") {
    if (direction === "abaixo") {
      if (distance <= 50) return 1;
      if (distance <= 150) return 2;
      if (distance <= 300) return 3;
      return 4;
    }
    if (distance <= 100) return 1;
    if (distance <= 300) return 2;
    if (distance <= 600) return 3;
    return 4;
  }
  if (distance <= 2) return 1;
  if (distance <= 5) return 2;
  if (distance <= 10) return 3;
  return 4;
}

function factorCopy(
  id: FactorId,
  direction: FactorAssessment["direction"],
): Pick<FactorAssessment, "summary" | "symptoms" | "adjustment"> {
  if (id === "water" && direction === "abaixo") {
    return {
      summary: "A umidade está abaixo da referência usada nesta simulação.",
      symptoms:
        "O modelo inclina as folhas para baixo e reduz gradualmente a coloração verde. Na natureza, a resposta varia por espécie e intensidade do estresse.",
      adjustment:
        "Aumente a umidade do substrato até a faixa de referência indicada para este cenário.",
    };
  }
  if (id === "water" && direction === "acima") {
    return {
      summary: "A umidade está acima da referência usada nesta simulação.",
      symptoms:
        "O modelo escurece a zona radicular e altera levemente a postura. Saturação e baixa aeração podem estressar raízes, mas este efeito não é um diagnóstico da cultivar.",
      adjustment:
        "Reduza a umidade do substrato e mantenha drenagem e aeração adequadas ao sistema.",
    };
  }
  if (id === "light" && direction === "abaixo") {
    return {
      summary: "A luz está abaixo da referência de projeto do cenário.",
      symptoms:
        "O modelo alonga os caules e empalidece as folhas para ilustrar resposta a baixa luz. A intensidade citada é de arquitetura geral, não ótimo desta espécie.",
      adjustment:
        "Eleve a intensidade de luz em direção à faixa indicada e confira o espectro e o fotoperíodo da cultura.",
    };
  }
  if (id === "light" && direction === "acima") {
    return {
      summary: "A luz está acima da referência adotada para este cenário.",
      symptoms:
        "O modelo clareia folhas e marca bordas para representar sobrecarga luminosa. O limiar visual é didático e não mede fotoinibição nesta cultivar.",
      adjustment:
        "Reduza a intensidade em direção à referência de projeto; a resposta real depende da espécie e da aclimatação.",
    };
  }
  if (id === "temperature" && direction === "abaixo") {
    return {
      summary: "A temperatura está abaixo do alvo térmico usado pela simulação.",
      symptoms:
        "A cena aplica uma tonalidade fria e reduz a postura das folhas. O impacto real depende da espécie, cultivar, duração e fase.",
      adjustment:
        "Aproxime a temperatura da zona térmica indicada e confirme se ela é apropriada à cultivar.",
    };
  }
  if (id === "temperature" && direction === "acima") {
    return {
      summary: "A temperatura está acima do alvo térmico usado pela simulação.",
      symptoms:
        "A cena inclina e escurece gradualmente as folhas para ilustrar estresse por calor. O modelo não estima dano fisiológico real.",
      adjustment:
        "Reduza a temperatura em direção à zona térmica indicada para o cenário.",
    };
  }
  return {
    summary: "O fator está dentro da referência atual.",
    symptoms: "Não há alteração visual atribuída a este fator.",
    adjustment: "Mantenha a condição dentro da faixa de referência.",
  };
}

function assessFactor(
  id: FactorId,
  value: number,
  reference: EnvironmentalReference,
): FactorAssessment {
  const direction =
    value < reference.min
      ? "abaixo"
      : value > reference.max
        ? "acima"
        : "dentro";
  const distance =
    direction === "abaixo"
      ? reference.min - value
      : direction === "acima"
        ? value - reference.max
        : 0;
  const score = scoreFromDistance(id, distance, direction);
  return {
    id,
    name: factorNames[id],
    value,
    reference,
    score,
    level: scoreLabels[score],
    direction,
    ...factorCopy(id, direction),
  };
}

export function defaultEnvironment(crop: Crop): Environment {
  return {
    water: crop.environmentalReferences.water.value,
    light: crop.environmentalReferences.light.value,
    temperature: crop.environmentalReferences.temperature.value,
  };
}

export function evaluateEnvironment(
  crop: Crop,
  environment: Environment,
): EnvironmentAssessment {
  const factors: FactorAssessment[] = [
    assessFactor("water", environment.water, crop.environmentalReferences.water),
    assessFactor("light", environment.light, crop.environmentalReferences.light),
    assessFactor(
      "temperature",
      environment.temperature,
      crop.environmentalReferences.temperature,
    ),
  ];
  const score = Math.max(...factors.map((factor) => factor.score)) as
    | 0
    | 1
    | 2
    | 3
    | 4;
  const outside = factors
    .filter((factor) => factor.score > 0)
    .sort((a, b) => b.score - a.score);
  return {
    level: scoreLabels[score],
    score,
    primary: outside[0] || null,
    secondary: outside.slice(1),
    factors,
  };
}

export function healthStage(damage: number): HealthStage {
  if (damage >= 100) return "colapso visual";
  if (damage >= 80) return "crítico";
  if (damage >= 60) return "estresse severo";
  if (damage >= 40) return "estresse moderado";
  if (damage >= 20) return "estresse leve";
  return "saudável";
}

export function advanceDamage(
  damage: number,
  currentStress: EnvironmentAssessment["score"],
): number {
  const increment = [0, 8, 14, 20, 26][currentStress];
  return Math.min(100, Math.max(0, damage + increment));
}

export function recoveryDamage(
  damage: number,
  currentStress: EnvironmentAssessment["score"],
): number {
  if (currentStress > 0 || damage >= 100) return damage;
  return Math.max(0, damage - 14);
}

export function visualInputs(
  crop: Crop,
  environment: Environment,
  damage: number,
) {
  const refs = crop.environmentalReferences;
  const clamp = (value: number) => Math.max(0, Math.min(1, value));
  const water = refs.water;
  const light = refs.light;
  const temperature = refs.temperature;
  const waterDeficit = clamp(
    (water.min - environment.water) / Math.max(1, water.min - water.controlMin),
  );
  const waterExcess = clamp(
    (environment.water - water.max) /
      Math.max(1, water.controlMax - water.max),
  );
  const lightDeficit = clamp(
    (light.min - environment.light) / Math.max(1, light.min - light.controlMin),
  );
  const lightExcess = clamp(
    (environment.light - light.max) /
      Math.max(1, light.controlMax - light.max),
  );
  const cold = clamp(
    (temperature.min - environment.temperature) /
      Math.max(1, temperature.min - temperature.controlMin),
  );
  const heat = clamp(
    (environment.temperature - temperature.max) /
      Math.max(1, temperature.controlMax - temperature.max),
  );
  return {
    waterDeficit,
    waterExcess,
    lightDeficit,
    lightExcess,
    cold,
    heat,
    accumulatedDamage: clamp(damage / 100),
  };
}
