import { describe, expect, it } from "vitest";
import { cropCount, crops, scientificSources } from "@/data/crops";
import { advanceDamage, defaultEnvironment, evaluateEnvironment, healthStage, recoveryDamage, visualInputs } from "@/lib/greenhouse-simulation";

describe("integridade do catálogo da Mars Greenhouse", () => {
  it("mantém as 18 categorias do dossiê, na ordem, com identificadores únicos", () => {
    expect(cropCount).toBe(18);
    expect(crops).toHaveLength(18);
    expect(new Set(crops.map((crop) => crop.id)).size).toBe(18);
    expect(crops.map((crop) => crop.name)).toEqual([
      "Batata",
      "Batata-doce",
      "Trigo-anão",
      "Centeio",
      "Arroz-anão",
      "Quinoa",
      "Soja",
      "Amendoim",
      "Feijão-caupi / Ervilha",
      "Tomate-anão",
      "Pimentão-anão",
      "Alface / Folhosas",
      "Brássicas",
      "Agrião-de-jardim / Mostarda",
      "Rabanete / Cenoura / Beterraba",
      "Pepino / Morango-anão",
      "Trevo-doce / Lotus",
      "Biomassa microbiana comestível",
    ]);
  });

  it("preserva distinção entre espécies, cultivares e biomassa não vegetal", () => {
    const grouped = crops.find((crop) => crop.id === "feijao-caupi-ervilha");
    expect(grouped?.species.map((item) => item.scientificName)).toEqual(["Vigna unguiculata", "Pisum sativum"]);
    expect(crops.find((crop) => crop.id === "raizes")?.species).toHaveLength(3);
    const microbial = crops.find((crop) => crop.id === "biomassa-microbiana");
    expect(microbial?.biologicalType).toBe("biofactory");
    expect(microbial?.modelKey).toBe("microbial-bioreactor");
    expect(microbial?.species).toHaveLength(2);
    expect(microbial?.description).toMatch(/fotobiorreator|biorreator/i);
    expect(microbial?.limitations).toMatch(/segurança alimentar/i);
  });

  it("fornece uma ficha completa, fontes HTTPS e limites explícitos para cada categoria", () => {
    for (const crop of crops) {
      expect(crop.species.length).toBeGreaterThan(0);
      expect(crop.nutritionCategory.trim()).not.toBe("");
      expect(crop.nutritionContribution.trim()).not.toBe("");
      expect(crop.cultivationMethod.trim()).not.toBe("");
      expect(crop.use.trim()).not.toBe("");
      expect(crop.cycle.trim()).not.toBe("");
      expect(crop.limitations.trim()).not.toBe("");
      expect(crop.sources.length).toBeGreaterThan(0);
      expect(crop.dossierPage).toMatch(/^p\. [6-8]$/);
      for (const ref of Object.values(crop.environmentalReferences)) {
        expect(ref.min).toBeLessThanOrEqual(ref.max);
        expect(ref.value).toBeGreaterThanOrEqual(ref.controlMin);
        expect(ref.value).toBeLessThanOrEqual(ref.controlMax);
        expect(ref.explanation.trim()).not.toBe("");
        expect(["dossier", "engineering", "educational"]).toContain(ref.quality);
      }
      for (const source of crop.sources) {
        expect(source.url.startsWith("https://") || source.url.startsWith("#")).toBe(true);
        expect(source.title.trim()).not.toBe("");
        expect(source.scope.trim()).not.toBe("");
      }
    }
    expect(scientificSources.veggie.url).toContain("nasa.gov");
    expect(scientificSources.aph.url).toContain("nasa.gov");
    expect(scientificSources.wamelink.url).toContain("doi.org");
    expect(scientificSources.pulschen.url).toContain("pubmed.ncbi.nlm.nih.gov");
  });

  it("marca condições por referência e separa estresse ambiental de dano acumulado manual", () => {
    const crop = crops[0];
    const reference = defaultEnvironment(crop);
    expect(evaluateEnvironment(crop, reference).score).toBe(0);
    const dry = evaluateEnvironment(crop, { ...reference, water: 0 });
    expect(dry.primary?.id).toBe("water");
    expect(dry.primary?.direction).toBe("abaixo");
    expect(healthStage(0)).toBe("saudável");
    const afterOneStep = advanceDamage(0, dry.score);
    expect(afterOneStep).toBeGreaterThan(0);
    expect(afterOneStep).toBeLessThan(100);
    expect(healthStage(afterOneStep)).toBe("estresse leve");
    expect(recoveryDamage(afterOneStep, 0)).toBeLessThan(afterOneStep);
    expect(recoveryDamage(afterOneStep, 1)).toBe(afterOneStep);
  });

  it("diferencia deficiência e excesso de água/luz e extremos térmicos na avaliação visual", () => {
    const crop = crops[0];
    const reference = defaultEnvironment(crop);
    const dry = visualInputs(crop, { ...reference, water: 0 }, 0);
    const wet = visualInputs(crop, { ...reference, water: 50 }, 0);
    const dark = visualInputs(crop, { ...reference, light: 0 }, 0);
    const bright = visualInputs(crop, { ...reference, light: 1500 }, 0);
    const hot = visualInputs(crop, { ...reference, temperature: 40 }, 0);
    const cold = visualInputs(crop, { ...reference, temperature: 0 }, 0);
    expect(dry.waterDeficit).toBe(1);
    expect(wet.waterExcess).toBe(1);
    expect(dark.lightDeficit).toBe(1);
    expect(bright.lightExcess).toBe(1);
    expect(hot.heat).toBe(1);
    expect(cold.cold).toBe(1);
  });
});
