import { describe, expect, it } from "vitest";
import { cropCount, crops, scientificSources } from "@/data/crops";

describe("integridade do catálogo científico da estufa", () => {
  it("contém exatamente as dezoito categorias solicitadas, sem duplicar IDs", () => {
    expect(cropCount).toBe(18);
    expect(crops).toHaveLength(18);
    expect(new Set(crops.map((crop) => crop.id)).size).toBe(18);
    expect(crops.map((crop) => crop.category)).toEqual([
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

  it("mantém os pares de espécies identificados e não representa biomassa como planta", () => {
    const grouped = crops.find((crop) => crop.id === "feijao-caupi-ervilha");
    expect(grouped?.species.map((species) => species.scientificName)).toEqual([
      "Vigna unguiculata",
      "Pisum sativum",
    ]);
    expect(
      crops.find((crop) => crop.id === "raizes")?.species,
    ).toHaveLength(3);

    const biomass = crops.find((crop) => crop.id === "biomassa-microbiana");
    expect(biomass?.biologicalType).toBe("microbial");
    expect(biomass?.visual).toBe("microbial");
    expect(biomass?.species[0].scientificName).toBe(
      "Espécie e cepa não especificadas",
    );
  });

  it("preenche os campos de pesquisa, declara limitações e liga cada ficha a fontes", () => {
    for (const crop of crops) {
      expect(crop.nutritionCategory.trim().length).toBeGreaterThan(0);
      expect(crop.nutritionContribution.trim().length).toBeGreaterThan(0);
      expect(crop.cultivationMethod.trim().length).toBeGreaterThan(0);
      expect(crop.waterNeeds.trim().length).toBeGreaterThan(0);
      expect(crop.lightNeeds.trim().length).toBeGreaterThan(0);
      expect(crop.temperature.trim().length).toBeGreaterThan(0);
      expect(crop.nutrients.trim().length).toBeGreaterThan(0);
      expect(crop.cycle.trim().length).toBeGreaterThan(0);
      expect(crop.limitation.trim().length).toBeGreaterThan(0);
      expect(crop.sources.length).toBeGreaterThan(0);
      expect(crop.research.review).toBe("pending-dossier");
      expect(crop.research.status).toBe("qualitative");
      for (const field of [
        crop.waterNeeds,
        crop.lightNeeds,
        crop.temperature,
        crop.nutrients,
        crop.cycle,
      ]) {
        expect(field).not.toMatch(/\d/);
      }
      for (const source of crop.sources) {
        expect(source.url.startsWith("https://")).toBe(true);
        expect(source.title.trim().length).toBeGreaterThan(0);
        expect(source.scope.trim().length).toBeGreaterThan(0);
      }
    }
    expect(scientificSources.xroots.url).toContain("nasa.gov");
    expect(scientificSources.aph02.url).toContain("nasa.gov");
    expect(scientificSources.bionutrients.url).toContain("nasa.gov");
  });
});
