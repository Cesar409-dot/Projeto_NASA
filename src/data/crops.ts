export type CropVisual =
  | "leafy"
  | "tuber"
  | "root"
  | "grain"
  | "legume"
  | "fruit"
  | "vine"
  | "microbial";

export type CropSource = {
  title: string;
  url: string;
  scope: string;
};

export type CropSpecies = {
  commonName: string;
  scientificName: string;
  note?: string;
};

export type Crop = {
  id: string;
  name: string;
  category: string;
  biologicalType: "plant" | "microbial";
  species: CropSpecies[];
  nutritionCategory: string;
  nutritionContribution: string;
  cultivationMethod: string;
  waterNeeds: string;
  lightNeeds: string;
  temperature: string;
  nutrients: string;
  cycle: string;
  limitation: string;
  evidence: string;
  visual: CropVisual;
  searchTerms: string[];
  sources: CropSource[];
  // Mantidos para a tabela comparativa existente do projeto.
  latin: string;
  tag: string;
  description: string;
  water: string;
  light: string;
  habitat: string;
  research: {
    status: "qualitative";
    review: "pending-dossier";
    notes: string;
  };
};

export const scientificSources = {
  spaceCrops: {
    title: "NASA · Space Crops",
    url: "https://science.nasa.gov/biological-physical/space-crops/",
    scope: "Desafios e linhas de pesquisa para culturas em missões espaciais.",
  },
  veggie: {
    title: "NASA · Growing Plants in Space / Veggie",
    url: "https://www.nasa.gov/exploration-research-and-technology/growing-plants-in-space/",
    scope: "Experimentos de plantas e hardware Veggie na Estação Espacial Internacional.",
  },
  aph: {
    title: "NASA · Advanced Plant Habitat",
    url: "https://science.nasa.gov/wp-content/uploads/2023/06/advanced-plant-habitat.pdf",
    scope: "Descrição do habitat vegetal automatizado usado em experimentos na ISS.",
  },
  xroots: {
    title: "NASA · XROOTS",
    url: "https://science.nasa.gov/biological-physical/investigations/xroots/",
    scope: "Demonstração orbital de sistemas hidropônicos e aeropônicos; não é uma receita para Marte.",
  },
  veg05: {
    title: "NASA · investigação Veg-05",
    url: "https://science.nasa.gov/biological-physical/investigations/veg-05-rjtim/",
    scope: "Descrição da investigação de tomate-anão e folhas em Veggie; a página não é usada aqui para inferir resultados.",
  },
  aph02: {
    title: "NASA · Plant Habitat-02",
    url: "https://science.nasa.gov/biological-physical/investigations/plant-habitat-02-wvqpm/",
    scope: "Investigação com rabanetes no Advanced Plant Habitat da ISS.",
  },
  potato: {
    title: "Estudo · Potato tuber formation in the spaceflight environment",
    url: "https://pubmed.ncbi.nlm.nih.gov/11540455/",
    scope: "Estudo de formação de tubérculos em ambiente de voo espacial; não demonstra cultivo em Marte.",
  },
  simulant: {
    title: "Estudo · Can plants grow on Mars and the Moon?",
    url: "https://pubmed.ncbi.nlm.nih.gov/25162657/",
    scope: "Experimento terrestre com simulantes; não utilizou solo coletado em Marte.",
  },
  regolith: {
    title: "NASA · EFRI ELiS",
    url: "https://science.nasa.gov/biological-physical/investigations/efri-elis-kpmsg/",
    scope: "Pesquisa sobre biotransformação de simulantes de regolito; linha de investigação, não protocolo operacional.",
  },
  bionutrients: {
    title: "NASA · BioNutrients",
    url: "https://www.nasa.gov/centers-and-facilities/ames/ames-science/ames-space-biosciences/bionutrients-flight-experiments/",
    scope: "Demonstrações de produção microbiana de nutrientes em voo; não valida biomassa comestível para esta categoria.",
  },
  foodData: {
    title: "USDA · FoodData Central",
    url: "https://fdc.nal.usda.gov/",
    scope: "Base de composição de alimentos; os resultados dependem do alimento, cultivar e forma de preparo.",
  },
} as const;

type SourceId = keyof typeof scientificSources;

type CropDraft = {
  id: string;
  category: string;
  biologicalType?: "plant" | "microbial";
  species: CropSpecies[];
  nutritionCategory: string;
  nutritionContribution: string;
  visual: CropVisual;
  searchTerms: string[];
  foodQuery?: string;
  evidence: string;
  limitation?: string;
  sources?: SourceId[];
};

const commonPlantLimits =
  "Este inventário não registra cultivo desta categoria em Marte. Experimentos terrestres, em simulantes ou na ISS não equivalem a validação em Marte. Sem o dossiê da equipe, método e limites específicos de cada cultivar permanecem pendentes.";

function plant(draft: CropDraft): Crop {
  const name = draft.category;
  const sources: CropSource[] = [
    {
      title: "USDA · composição de " + (draft.foodQuery || name),
      url:
        "https://fdc.nal.usda.gov/fdc-app.html#/food-search?query=" +
        encodeURIComponent(draft.foodQuery || name),
      scope: "Busca para composição nutricional de alimento terrestre; não representa amostras produzidas no espaço.",
    },
    {
      title: scientificSources.spaceCrops.title,
      url: scientificSources.spaceCrops.url,
      scope: scientificSources.spaceCrops.scope,
    },
    ...(draft.sources || []).map((key) => scientificSources[key]),
  ];
  const latin = draft.species
    .map((species) => species.scientificName)
    .filter(Boolean)
    .join(" · ");
  const waterNeeds =
    "Faixa e volume de água não cadastrados para esta categoria ou cultivar. O sistema da missão deverá controlar entrega, aeração das raízes, drenagem e recuperação da água.";
  const lightNeeds =
    "Espectro, intensidade e fotoperíodo não especificados para esta categoria. Precisam ser definidos por espécie, cultivar e fase de cultivo; não há receita marciana validada neste inventário.";
  const temperature =
    "Faixa térmica de cultivo não cadastrada. A espécie, a cultivar e a fase da planta precisam ser especificadas antes de indicar uma referência.";
  const nutrients =
    "A solução ou o substrato precisa fornecer nutrientes minerais adequados à espécie. Formulação, concentração e doses não estão verificadas neste inventário.";
  const cultivationMethod =
    "Método específico não atribuído sem o dossiê da equipe. Hidroponia e aeroponia são alternativas pesquisadas para sistemas espaciais, mas precisam ser avaliadas para esta espécie e cultivar.";
  const cycle =
    "Duração não informada: depende de espécie, cultivar, parte colhida e condições experimentais. Nenhum prazo de colheita é estimado aqui.";
  return {
    id: draft.id,
    name,
    category: name,
    biologicalType: "plant",
    species: draft.species,
    nutritionCategory: draft.nutritionCategory,
    nutritionContribution: draft.nutritionContribution,
    cultivationMethod,
    waterNeeds,
    lightNeeds,
    temperature,
    nutrients,
    cycle,
    limitation: draft.limitation || commonPlantLimits,
    evidence: draft.evidence,
    visual: draft.visual,
    searchTerms: [name, ...draft.searchTerms, ...draft.species.map((s) => s.scientificName)],
    sources,
    latin: latin || "Espécie a especificar",
    tag: draft.nutritionCategory,
    description: draft.nutritionContribution,
    water: waterNeeds,
    light: lightNeeds,
    habitat: cultivationMethod,
    research: {
      status: "qualitative",
      review: "pending-dossier",
      notes:
        "Revisar com o dossiê da equipe e registrar cultivar, sistema, condições experimentais e referências antes de incluir recomendações quantitativas.",
    },
  };
}

const microbe: Crop = {
  id: "biomassa-microbiana",
  name: "Biomassa microbiana comestível",
  category: "Biomassa microbiana comestível",
  biologicalType: "microbial",
  species: [
    {
      commonName: "Microrganismo produtor",
      scientificName: "Espécie e cepa não especificadas",
      note: "Esta categoria é uma biofábrica, não uma planta convencional.",
    },
  ],
  nutritionCategory: "Biomassa microbiana / biofábrica",
  nutritionContribution:
    "Composição nutricional não atribuída: depende do microrganismo, do processo e do produto final. Segurança e perfil nutricional precisam ser medidos antes de considerar consumo.",
  cultivationMethod:
    "Representação conceitual de biorreator e fermentação controlada. BioNutrients, na ISS, investiga produção microbiana de nutrientes; isso não demonstra que a biomassa desta categoria esteja pronta para consumo em uma missão marciana.",
  waterNeeds:
    "Meio de cultivo e balanço de água não especificados; dependem do organismo e do processo de fermentação.",
  lightNeeds:
    "Requisito luminoso não atribuído. Muitos processos de fermentação são conduzidos sem luz, mas a necessidade depende do organismo selecionado; não se presume uma espécie.",
  temperature:
    "Faixa operacional não informada. Deve ser definida e validada para o organismo, o biorreator e o produto pretendido.",
  nutrients:
    "Composição do meio e fontes de carbono, nitrogênio e minerais não especificadas. Nenhuma formulação é proposta sem a identificação da cepa.",
  cycle:
    "Tempo de processo não informado; depende da cepa, do meio, da escala e dos critérios de segurança e qualidade do produto.",
  limitation:
    "A categoria não informa organismo, cepa, processo, rendimento ou composição. A demonstração BioNutrients da NASA é de produção microbiana de nutrientes em voo, não prova biomassa comestível autossuficiente nem uso em Marte.",
  evidence:
    "Biofábrica conceitual · distinção de plantas preservada",
  visual: "microbial",
  searchTerms: [
    "biomassa",
    "microbiana",
    "biofábrica",
    "biorreator",
    "fermentação",
  ],
  sources: [
    {
      title: scientificSources.bionutrients.title,
      url: scientificSources.bionutrients.url,
      scope: scientificSources.bionutrients.scope,
    },
    {
      title: scientificSources.spaceCrops.title,
      url: scientificSources.spaceCrops.url,
      scope: "Contexto de sistemas de suporte à vida e pesquisa de alimentos para missões.",
    },
  ],
  latin: "Organismo e cepa não especificados",
  tag: "BIOFÁBRICA",
  description:
    "Sistema microbiano conceitual; não deve ser lido como espécie vegetal ou alimento já validado para Marte.",
  water: "Meio e balanço hídrico dependem do organismo e do processo.",
  light: "Requisito de luz não atribuído sem organismo definido.",
  habitat: "Biorreator como conceito de pesquisa, sujeito a validação.",
  research: {
    status: "qualitative",
    review: "pending-dossier",
    notes:
      "Não inferir composição nutricional ou segurança alimentar sem identificação da cepa e análises do produto.",
  },
};

export const crops: Crop[] = [
  plant({
    id: "batata",
    category: "Batata",
    species: [
      { commonName: "Batata", scientificName: "Solanum tuberosum" },
    ],
    nutritionCategory: "Tubérculo / alimento energético",
    nutritionContribution:
      "Predominam carboidratos no tubérculo; proteínas, fibras, vitaminas e minerais variam com cultivar e preparo.",
    visual: "tuber",
    searchTerms: ["tubérculo", "tuberculo", "batata inglesa"],
    foodQuery: "potato",
    evidence: "Estudo de formação de tubérculos em voo espacial",
    sources: ["potato"],
  }),
  plant({
    id: "batata-doce",
    category: "Batata-doce",
    species: [
      { commonName: "Batata-doce", scientificName: "Ipomoea batatas" },
    ],
    nutritionCategory: "Raiz tuberosa / alimento energético",
    nutritionContribution:
      "Fonte de carboidratos e fibras; carotenoides, incluindo provitamina A, variam muito com a cor da polpa e a cultivar.",
    visual: "tuber",
    searchTerms: ["raiz", "tubérculo", "tuberculo"],
    foodQuery: "sweet potato",
    evidence: "Categoria do catálogo · cultivo espacial específico não verificado",
  }),
  plant({
    id: "trigo-anao",
    category: "Trigo-anão",
    species: [
      {
        commonName: "Trigo",
        scientificName: "Triticum aestivum",
        note: "“Anão” descreve o porte/cultivar, não uma espécie; cultivar não especificada.",
      },
    ],
    nutritionCategory: "Cereal / grão",
    nutritionContribution:
      "O grão fornece principalmente carboidratos e também proteínas; fibras e micronutrientes dependem do processamento e da parte do grão.",
    visual: "grain",
    searchTerms: ["cereal", "grão", "grao"],
    foodQuery: "wheat",
    evidence: "Trigo estudado em simulante terrestre · cultivar anã não especificada",
    sources: ["simulant"],
  }),
  plant({
    id: "centeio",
    category: "Centeio",
    species: [{ commonName: "Centeio", scientificName: "Secale cereale" }],
    nutritionCategory: "Cereal / grão",
    nutritionContribution:
      "O grão é fonte de carboidratos e fibras; a composição depende do grau de refino e do produto consumido.",
    visual: "grain",
    searchTerms: ["cereal", "grão", "grao"],
    foodQuery: "rye",
    evidence: "Categoria do catálogo · cultivo espacial específico não verificado",
  }),
  plant({
    id: "arroz-anao",
    category: "Arroz-anão",
    species: [
      {
        commonName: "Arroz",
        scientificName: "Oryza sativa",
        note: "“Anão” descreve o porte/cultivar, não uma espécie; cultivar não especificada.",
      },
    ],
    nutritionCategory: "Cereal / grão",
    nutritionContribution:
      "O grão é predominantemente fonte de carboidratos; fibras e micronutrientes variam com o tipo e o beneficiamento.",
    visual: "grain",
    searchTerms: ["cereal", "grão", "grao"],
    foodQuery: "rice",
    evidence: "Categoria do catálogo · cultivar e cultivo espacial não verificados",
  }),
  plant({
    id: "quinoa",
    category: "Quinoa",
    species: [
      { commonName: "Quinoa", scientificName: "Chenopodium quinoa" },
    ],
    nutritionCategory: "Pseudocereal / semente",
    nutritionContribution:
      "A semente fornece carboidratos, proteínas e fibras; o perfil de aminoácidos e minerais depende da variedade e do preparo.",
    visual: "grain",
    searchTerms: ["pseudocereal", "semente"],
    foodQuery: "quinoa",
    evidence: "Categoria do catálogo · cultivo espacial específico não verificado",
  }),
  plant({
    id: "soja",
    category: "Soja",
    species: [{ commonName: "Soja", scientificName: "Glycine max" }],
    nutritionCategory: "Leguminosa / grão",
    nutritionContribution:
      "O grão fornece proteínas e lipídios, além de carboidratos; a composição muda conforme cultivar e processamento.",
    visual: "legume",
    searchTerms: ["leguminosa", "grão", "grao"],
    foodQuery: "soybeans",
    evidence: "Categoria do catálogo · cultivo espacial específico não verificado",
  }),
  plant({
    id: "amendoim",
    category: "Amendoim",
    species: [
      { commonName: "Amendoim", scientificName: "Arachis hypogaea" },
    ],
    nutritionCategory: "Leguminosa / semente oleaginosa",
    nutritionContribution:
      "A semente é rica em lipídios e fornece proteínas; valores variam com a forma de consumo e o processamento.",
    visual: "legume",
    searchTerms: ["leguminosa", "semente", "oleaginosa"],
    foodQuery: "peanuts",
    evidence: "Categoria do catálogo · cultivo espacial específico não verificado",
  }),
  plant({
    id: "feijao-caupi-ervilha",
    category: "Feijão-caupi / Ervilha",
    species: [
      {
        commonName: "Feijão-caupi",
        scientificName: "Vigna unguiculata",
      },
      { commonName: "Ervilha", scientificName: "Pisum sativum" },
    ],
    nutritionCategory: "Leguminosas / sementes",
    nutritionContribution:
      "As sementes fornecem proteínas vegetais, carboidratos e fibras em proporções que variam entre as espécies e cultivares.",
    visual: "legume",
    searchTerms: ["feijão", "feijao", "ervilha", "leguminosa"],
    foodQuery: "cowpeas peas",
    evidence: "Duas culturas distintas agrupadas pelo catálogo",
  }),
  plant({
    id: "tomate-anao",
    category: "Tomate-anão",
    species: [
      {
        commonName: "Tomate",
        scientificName: "Solanum lycopersicum",
        note: "“Anão” descreve o porte/cultivar, não uma espécie; cultivar não especificada.",
      },
    ],
    nutritionCategory: "Fruto / hortaliça",
    nutritionContribution:
      "O fruto fornece fibras e vitamina C; carotenoides como o licopeno variam com a cultivar e a maturação.",
    visual: "fruit",
    searchTerms: ["fruto", "hortaliça", "hortalica"],
    foodQuery: "tomatoes",
    evidence: "NASA descreve investigação de tomate-anão na ISS; simulante terrestre estudado",
    sources: ["veg05", "simulant"],
  }),
  plant({
    id: "pimentao-anao",
    category: "Pimentão-anão",
    species: [
      {
        commonName: "Pimentão",
        scientificName: "Capsicum annuum",
        note: "“Anão” descreve o porte/cultivar, não uma espécie; cultivar não especificada.",
      },
    ],
    nutritionCategory: "Fruto / hortaliça",
    nutritionContribution:
      "O fruto fornece fibras e vitamina C; composição e pigmentos variam com a cultivar e a maturação.",
    visual: "fruit",
    searchTerms: ["fruto", "hortaliça", "hortalica", "pimenta"],
    foodQuery: "sweet bell peppers",
    evidence: "Categoria do catálogo · cultivo espacial específico não verificado",
  }),
  plant({
    id: "alface-folhosas",
    category: "Alface / Folhosas",
    species: [
      {
        commonName: "Alface",
        scientificName: "Lactuca sativa",
      },
      {
        commonName: "Outras folhosas",
        scientificName: "Espécies dependem da cultura selecionada",
      },
    ],
    nutritionCategory: "Folhas / hortaliças",
    nutritionContribution:
      "Folhas comestíveis podem fornecer fibras, folato e vitaminas; o perfil depende da espécie, da folha e da cultivar.",
    visual: "leafy",
    searchTerms: ["folha", "folhosa", "salada", "lettuce"],
    foodQuery: "lettuce",
    evidence: "Alfaces e outras folhosas cultivadas em Veggie na ISS",
    sources: ["veggie"],
  }),
  plant({
    id: "brassicas",
    category: "Brássicas",
    species: [
      {
        commonName: "Grupo das brássicas",
        scientificName: "Brassicaceae",
        note: "Família botânica; espécie e parte comestível não especificadas no catálogo.",
      },
    ],
    nutritionCategory: "Hortaliças da família Brassicaceae",
    nutritionContribution:
      "A contribuição depende da espécie e da parte consumida; não se atribui um perfil único a toda a família.",
    visual: "leafy",
    searchTerms: ["brassica", "couve", "repolho", "folhosa"],
    foodQuery: "brassica vegetables",
    evidence: "Vegetais folhosos do grupo foram cultivados em Veggie; espécie varia",
    sources: ["veggie"],
  }),
  plant({
    id: "agriao-mostarda",
    category: "Agrião-de-jardim / Mostarda",
    species: [
      {
        commonName: "Agrião-de-jardim",
        scientificName: "Lepidium sativum",
      },
      {
        commonName: "Mostarda",
        scientificName: "Brassica spp.",
        note: "Espécie de mostarda não especificada no catálogo.",
      },
    ],
    nutritionCategory: "Folhas / hortaliças condimentares",
    nutritionContribution:
      "Folhas comestíveis; vitaminas e compostos bioativos variam bastante entre espécie, cultivar e parte consumida.",
    visual: "leafy",
    searchTerms: ["agrião", "agriao", "mostarda", "folhosa", "cress"],
    foodQuery: "garden cress mustard greens",
    evidence: "Agrião e mostarda não são tratados como uma única espécie",
    sources: ["simulant", "veggie"],
  }),
  plant({
    id: "raizes",
    category: "Rabanete / Cenoura / Beterraba",
    species: [
      { commonName: "Rabanete", scientificName: "Raphanus sativus" },
      {
        commonName: "Cenoura",
        scientificName: "Daucus carota subsp. sativus",
      },
      { commonName: "Beterraba", scientificName: "Beta vulgaris" },
    ],
    nutritionCategory: "Raízes e órgãos de reserva",
    nutritionContribution:
      "A contribuição muda entre as três culturas: carotenoides são característicos da cenoura, enquanto rabanete e beterraba têm outros perfis. Não são nutricionalmente intercambiáveis.",
    visual: "root",
    searchTerms: ["rabanete", "cenoura", "beterraba", "raiz", "root"],
    foodQuery: "radish carrot beet",
    evidence: "Rabanete cultivado no APH/ISS; categoria também reúne duas espécies diferentes",
    sources: ["aph02", "simulant"],
  }),
  plant({
    id: "pepino-morango",
    category: "Pepino / Morango-anão",
    species: [
      { commonName: "Pepino", scientificName: "Cucumis sativus" },
      {
        commonName: "Morango",
        scientificName: "Fragaria × ananassa",
        note: "“Anão” descreve o porte/cultivar, não uma espécie; cultivar não especificada.",
      },
    ],
    nutritionCategory: "Frutos comestíveis / hortaliças e frutas",
    nutritionContribution:
      "Pepino e morango são culturas distintas. O fruto de morango fornece vitamina C e fibras; a composição do pepino depende da parte e do preparo.",
    visual: "vine",
    searchTerms: ["pepino", "morango", "fruto", "fruta", "vine"],
    foodQuery: "cucumber strawberry",
    evidence: "Duas culturas distintas agrupadas pelo catálogo; cultivo espacial específico não verificado",
  }),
  plant({
    id: "trevo-lotus",
    category: "Trevo-doce / Lotus",
    species: [
      {
        commonName: "Trevo-doce",
        scientificName: "Melilotus spp.",
        note: "Espécie não especificada.",
      },
      {
        commonName: "Lotus",
        scientificName: "Lotus spp.",
        note: "Espécie não especificada.",
      },
    ],
    nutritionCategory: "Leguminosas / plantas de cobertura",
    nutritionContribution:
      "Categoria sem espécie ou parte alimentar definidas. Não há contribuição nutricional humana atribuída sem confirmar identificação botânica, parte comestível e segurança.",
    visual: "legume",
    searchTerms: ["trevo", "lotus", "leguminosa", "cobertura"],
    foodQuery: "sweet clover lotus",
    evidence: "Espécies e uso alimentar não especificados no catálogo",
  }),
];

// A biomassa microbiana é uma categoria de biofábrica, nunca uma planta.
crops.push(microbe);

export const comparisonFields = [
  { key: "water", label: "Água" },
  { key: "light", label: "Iluminação" },
  { key: "habitat", label: "Método em avaliação" },
  { key: "limitation", label: "Limitações científicas" },
] as const;

export const cropCount = 18;
