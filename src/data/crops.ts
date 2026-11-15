export type ModelKey =
  | "potato"
  | "sweet-potato"
  | "wheat"
  | "rye"
  | "rice"
  | "quinoa"
  | "soy"
  | "peanut"
  | "cowpea-pea"
  | "tomato"
  | "pepper"
  | "lettuce"
  | "brassicas"
  | "cress-mustard"
  | "root-trio"
  | "cucumber-strawberry"
  | "clover-lotus"
  | "microbial-bioreactor";

export type ReferenceQuality = "dossier" | "engineering" | "educational";

export type EnvironmentalReference = {
  min: number;
  max: number;
  value: number;
  controlMin: number;
  controlMax: number;
  step: number;
  unit: string;
  label: string;
  quality: ReferenceQuality;
  explanation: string;
};

export type CropSource = {
  title: string;
  url: string;
  scope: string;
};

export type CropSpecies = {
  commonName: string;
  scientificName: string;
  cultivar?: string;
  note?: string;
};

export type Crop = {
  id: string;
  name: string;
  dossierPage: string;
  modelKey: ModelKey;
  biologicalType: "plant" | "biofactory";
  species: CropSpecies[];
  nutritionCategory: string;
  nutritionContribution: string;
  use: string;
  cultivationMethod: string;
  cycle: string;
  description: string;
  evidence: string;
  limitations: string;
  environmentalReferences: {
    water: EnvironmentalReference;
    light: EnvironmentalReference;
    temperature: EnvironmentalReference;
  };
  sources: CropSource[];
  searchTerms: string[];
  // Compatibilidade com o comparador legado ainda presente no projeto.
  latin: string;
  tag: string;
  water: string;
  light: string;
  nutrients: string;
  habitat: string;
  limitation: string;
  research: {
    status: "qualitative";
    review: "dossier-provided";
    notes: string;
  };
};

export const scientificSources = {
  dossier: {
    title: "Dossiê Técnico da Equipe Unus Mundus · seção 4.1",
    url: "#referencias",
    scope:
      "Valores transcritos do material fornecido pela equipe. São referências do projeto, não recomendações universais ou validação NASA de cultivo em Marte.",
  },
  engineering: {
    title: "Dossiê Técnico da Equipe Unus Mundus · seções 3 e 5.2",
    url: "#referencias",
    scope:
      "Parâmetros de arquitetura para módulos de cultivo: usados na interface com o escopo indicado, não como ótimo fisiológico de cada espécie.",
  },
  bvad: {
    title: "NASA · Life Support Baseline Values and Assumptions Document (BVAD), Rev. 2",
    url: "https://ntrs.nasa.gov/citations/20210024855",
    scope:
      "Documento de referência para modelagem de sistemas de suporte à vida; não constitui validação de todas as culturas ou valores do dossiê.",
  },
  veggie: {
    title: "NASA · Growing Plants in Space / Veggie",
    url: "https://www.nasa.gov/exploration-research-and-technology/growing-plants-in-space/",
    scope:
      "Experimentos de plantas em ambiente controlado na ISS; não demonstram cultivo na superfície de Marte.",
  },
  aph: {
    title: "NASA · Advanced Plant Habitat",
    url: "https://science.nasa.gov/mission/advanced-plant-habitat/",
    scope:
      "Câmara automatizada para pesquisa de plantas na ISS; resultados dependem da cultura e do protocolo.",
  },
  aph02: {
    title: "NASA · Plant Habitat-02: rabanetes",
    url: "https://science.nasa.gov/biological-physical/investigations/plant-habitat-02-wvqpm/",
    scope:
      "Investigação com rabanetes no APH da ISS, não valida outras espécies do grupo nem cultivo em Marte.",
  },
  ph04: {
    title: "NASA · colheita de pimentas Plant Habitat-04",
    url: "https://www.nasa.gov/missions/station/nasas-second-pepper-harvest-sets-record-on-space-station/",
    scope:
      "Experimento orbital com pimenta Hatch em APH; cultivar distinta das cultivares listadas para o projeto.",
  },
  veg05: {
    title: "NASA · investigação Veg-05",
    url: "https://science.nasa.gov/biological-physical/investigations/veg-05-rjtim/",
    scope:
      "Página da investigação de tomate-anão; não é usada para inferir resultados que não estejam explicitados.",
  },
  xroots: {
    title: "NASA · XROOTS",
    url: "https://science.nasa.gov/biological-physical/investigations/xroots/",
    scope:
      "Demonstração de hidroponia e aeroponia na ISS; resultados são tecnologia em avaliação para futuras missões.",
  },
  wamelink: {
    title: "Wamelink et al. · ensaio com simulantes de Marte e da Lua",
    url: "https://doi.org/10.1371/journal.pone.0103138",
    scope:
      "Experimento terrestre de 50 dias com simulantes. Não empregou solo de Marte; os autores registram limites dos simulantes.",
  },
  pulschen: {
    title: "Pulschen et al. · leveduras resistentes a UV do Atacama",
    url: "https://pubmed.ncbi.nlm.nih.gov/26147800/",
    scope:
      "Pesquisa de laboratório com isolados terrestres; não demonstra operação de biofábrica em Marte nem alimento seguro.",
  },
  crops: {
    title: "NASA · Space Crops",
    url: "https://science.nasa.gov/biological-physical/space-crops/",
    scope:
      "Contexto de desafios e pesquisas de produção vegetal para missões espaciais.",
  },
  food: {
    title: "USDA · FoodData Central",
    url: "https://fdc.nal.usda.gov/",
    scope:
      "Consulta de composição de alimentos terrestres; o perfil varia por espécie, cultivar, parte e preparo.",
  },
} as const;

type SourceKey = keyof typeof scientificSources;

type CropDraft = Omit<
  Crop,
  | "biologicalType"
  | "environmentalReferences"
  | "sources"
  | "latin"
  | "tag"
  | "water"
  | "light"
  | "nutrients"
  | "habitat"
  | "limitation"
  | "research"
> & {
  biologicalType?: "plant" | "biofactory";
  temperature?: {
    min: number;
    max: number;
    label: string;
    quality: ReferenceQuality;
    explanation: string;
  };
  light?: {
    min?: number;
    max?: number;
    label?: string;
    quality?: ReferenceQuality;
    explanation?: string;
  };
  water?: {
    min?: number;
    max?: number;
    value?: number;
    controlMin?: number;
    controlMax?: number;
    step?: number;
    unit?: string;
    label?: string;
    quality?: ReferenceQuality;
    explanation?: string;
  };
  sourceKeys: SourceKey[];
  dossierPage: string;
};

const dossierWater: EnvironmentalReference = {
  min: 25,
  max: 35,
  value: 30,
  controlMin: 0,
  controlMax: 50,
  step: 1,
  unit: "% de umidade",
  label: "Substrato tratado",
  quality: "engineering",
  explanation:
    "O dossiê indica retenção hídrica de 25–35% para o substrato remediado em geral. Não é volume de irrigação nem faixa medida para cada cultura.",
};

const dossierLight: EnvironmentalReference = {
  min: 200,
  max: 300,
  value: 250,
  controlMin: 0,
  controlMax: 1500,
  step: 10,
  unit: "µmol m⁻² s⁻¹ PAR",
  label: "Base de projeto",
  quality: "engineering",
  explanation:
    "Faixa de arquitetura LED indicada para a Camada 1 do dossiê; não é ótimo comprovado para cada cultivar.",
};

const educationalTemperature = {
  min: 16,
  max: 26,
  label: "Envelope de projeto · não específico da cultura",
  quality: "educational" as const,
  explanation:
    "Aproximação entre as duas zonas térmicas de engenharia do dossiê. A temperatura ótima/tolerância desta espécie não foi informada.",
};

function sourceList(
  keys: SourceKey[],
  foodQuery: string,
  dossierPage: string,
  biologicalType: "plant" | "biofactory",
): CropSource[] {
  const foodSource: CropSource = {
    title: "USDA · composição: " + foodQuery,
    url:
      "https://fdc.nal.usda.gov/fdc-app.html#/food-search?query=" +
      encodeURIComponent(foodQuery),
    scope:
      "Busca nutricional de alimento terrestre; não representa a cultivar ou uma amostra cultivada em Marte.",
  };
  return [
    {
      title:
        scientificSources.dossier.title + " · " + dossierPage,
      url: scientificSources.dossier.url,
      scope: scientificSources.dossier.scope,
    },
    ...(biologicalType === "plant" ? [foodSource] : []),
    ...keys.map((key) => scientificSources[key]),
  ];
}

function createCrop(draft: CropDraft): Crop {
  const { sourceKeys, ...cropFields } = draft;
  const water: EnvironmentalReference = {
    min: draft.water?.min ?? dossierWater.min,
    max: draft.water?.max ?? dossierWater.max,
    value: draft.water?.value ?? dossierWater.value,
    controlMin: draft.water?.controlMin ?? dossierWater.controlMin,
    controlMax: draft.water?.controlMax ?? dossierWater.controlMax,
    step: draft.water?.step ?? dossierWater.step,
    unit: draft.water?.unit ?? dossierWater.unit,
    label: draft.water?.label ?? dossierWater.label,
    quality: draft.water?.quality ?? dossierWater.quality,
    explanation: draft.water?.explanation ?? dossierWater.explanation,
  };
  const light: EnvironmentalReference = {
    min: draft.light?.min ?? dossierLight.min,
    max: draft.light?.max ?? dossierLight.max,
    value: dossierLight.value,
    controlMin: 0,
    controlMax: 1500,
    step: 10,
    unit: dossierLight.unit,
    label: draft.light?.label ?? dossierLight.label,
    quality: draft.light?.quality ?? dossierLight.quality,
    explanation: draft.light?.explanation ?? dossierLight.explanation,
  };
  const temp = draft.temperature || educationalTemperature;
  const temperature: EnvironmentalReference = {
    min: temp.min,
    max: temp.max,
    value: Math.round((temp.min + temp.max) / 2),
    controlMin: 0,
    controlMax: 40,
    step: 1,
    unit: "°C",
    label: temp.label,
    quality: temp.quality,
    explanation: temp.explanation,
  };
  const latin = draft.species.map((item) => item.scientificName).join(" · ");
  return {
    ...cropFields,
    biologicalType: draft.biologicalType || "plant",
    environmentalReferences: { water, light, temperature },
    sources: sourceList(
      sourceKeys,
      draft.searchTerms[0] || draft.name,
      draft.dossierPage,
      draft.biologicalType || "plant",
    ),
    latin,
    tag: draft.nutritionCategory,
    water: water.explanation,
    light: light.explanation,
    nutrients: draft.cultivationMethod,
    habitat: draft.cultivationMethod,
    limitation: draft.limitations,
    research: {
      status: "qualitative",
      review: "dossier-provided",
      notes:
        "Valores mostrados com a proveniência do dossiê; alvos de engenharia, ensaios em ISS e resultados com simulantes permanecem evidências distintas.",
    },
  };
}

const plantLimit =
  "A referência é uma proposta do dossiê para cultivo controlado ou em simulante. Não significa que esta espécie/cultivar tenha sido cultivada com sucesso em Marte. Os efeitos no modelo são didáticos e não predizem produtividade, sobrevivência ou tempo de dano.";

export const crops: Crop[] = [
  createCrop({
    id: "batata",
    name: "Batata",
    modelKey: "potato",
    species: [
      {
        commonName: "Batata",
        scientificName: "Solanum tuberosum",
        cultivar: "Norland / Denali",
      },
    ],
    nutritionCategory: "Base calórica",
    nutritionContribution:
      "O dossiê a classifica como cultura de base calórica; tubérculo rico em amido, com folhas e tubérculos identificados como partes distintas.",
    use: "Tubérculos comestíveis e propagação vegetativa por tubérculos-semente.",
    cultivationMethod:
      "Hidroponia/aeroponia na fase inicial; substrato tratado na proposta de cultivo extensivo. O método e o regime precisam ser testados para a cultivar.",
    cycle: "90–105 dias (ciclo indicado no dossiê para Norland / Denali).",
    description:
      "Tubérculo de base calórica no catálogo da missão; o modelo separa a parte aérea dos tubérculos subterrâneos.",
    evidence:
      "NASA KSC/BVAD citados no dossiê · voo orbital não equivale a cultivo em Marte",
    limitations: plantLimit,
    temperature: {
      min: 16,
      max: 20,
      label: "Zona de projeto: 20 °C dia / 16 °C noite",
      quality: "engineering",
      explanation:
        "Regime de engenharia transcrito do dossiê; é um par dia/noite, não uma faixa fisiológica validada para Norland ou Denali.",
    },
    searchTerms: ["batata inglesa", "tubérculo", "Solanum tuberosum"],
    sourceKeys: ["bvad", "veggie"],
    dossierPage: "p. 6",
  }),
  createCrop({
    id: "batata-doce",
    name: "Batata-doce",
    modelKey: "sweet-potato",
    species: [
      {
        commonName: "Batata-doce",
        scientificName: "Ipomoea batatas",
        cultivar: "TU-82-155",
      },
    ],
    nutritionCategory: "Base calórica",
    nutritionContribution:
      "O dossiê destaca carboidratos e β-caroteno; raízes tuberosas e folhas jovens aparecem como partes comestíveis.",
    use: "Raízes tuberosas e folhas jovens; propagação por ramas.",
    cultivationMethod:
      "Hidroponia/aeroponia para pesquisa inicial ou substrato tratado na proposta de cultivo extensivo; protocolo por cultivar pendente.",
    cycle: "90–120 dias (ciclo indicado no dossiê para TU-82-155).",
    description:
      "Raiz tuberosa e ramas comestíveis; a ilustração mostra hábito rasteiro e reservas subterrâneas.",
    evidence:
      "Cultivar TU-82-155 indicada no dossiê · referência de missão",
    limitations: plantLimit,
    temperature: {
      min: 22,
      max: 26,
      label: "Zona de projeto: 26 °C dia / 22 °C noite",
      quality: "engineering",
      explanation:
        "Regime dia/noite de engenharia transcrito do dossiê; não é faixa de tolerância validada para a cultivar.",
    },
    searchTerms: ["raiz tuberosa", "rama", "Ipomoea batatas"],
    sourceKeys: ["bvad", "crops"],
    dossierPage: "p. 6",
  }),
  createCrop({
    id: "trigo-anao",
    name: "Trigo-anão",
    modelKey: "wheat",
    species: [
      {
        commonName: "Trigo",
        scientificName: "Triticum aestivum",
        cultivar: "Apogee / Yecora Rojo",
        note: "“Anão” descreve o porte/cultivar, não uma espécie diferente.",
      },
    ],
    nutritionCategory: "Cereal / proteína",
    nutritionContribution:
      "Grão cereal com carboidratos e proteínas; a contribuição depende do processamento e da fração do grão.",
    use: "Grãos e reprodução por sementes em ambiente controlado.",
    cultivationMethod:
      "Módulo LED com colheita de grãos; o dossiê descreve cultivo em câmaras fechadas e propõe substrato tratado.",
    cycle: "75–85 dias (ciclo indicado no dossiê para Apogee / Yecora Rojo).",
    description:
      "Cereal de porte baixo para câmaras; o modelo apresenta espigas e folhas estreitas.",
    evidence:
      "Cultivares indicadas no dossiê; trigo também aparece em ensaio terrestre com simulante",
    limitations:
      plantLimit +
      " O ensaio de Wamelink usou simulante preparado em laboratório, não regolito marciano.",
    temperature: {
      min: 16,
      max: 20,
      label: "Zona de projeto: 20 °C dia / 16 °C noite",
      quality: "engineering",
      explanation:
        "Regime dia/noite transcrito do dossiê. O PPFD alto citado para trigo é uma possibilidade de teste, não faixa ótima.",
    },
    light: {
      min: 200,
      max: 1500,
      label: "Base 200–300; PPFD alto até 1.000–1.500 citado",
      quality: "engineering",
      explanation:
        "O dossiê apresenta 200–300 µmol m⁻² s⁻¹ como base da Camada 1 e diz que trigo pode usar intensidades maiores; o limite superior não é um ótimo validado.",
    },
    searchTerms: ["cereal", "grão", "espiga", "Triticum aestivum"],
    sourceKeys: ["bvad", "wamelink"],
    dossierPage: "p. 6",
  }),
  createCrop({
    id: "centeio",
    name: "Centeio",
    modelKey: "rye",
    species: [{ commonName: "Centeio", scientificName: "Secale cereale" }],
    nutritionCategory: "Cereal rústico",
    nutritionContribution:
      "Grão cereal; fibras, carboidratos e outros nutrientes variam com o processamento e a parte consumida.",
    use: "Grãos e possível produção de sementes em estudos com simulante.",
    cultivationMethod:
      "O dossiê propõe cultivo em substrato tratado e descreve o centeio como cultura de regulito simulado; método e cultivar devem ser especificados.",
    cycle: "85–100 dias (faixa indicada no dossiê).",
    description:
      "Cereal de folhas longas e espiga delgada; o resultado em simulante depende do protocolo e não valida cultivo marciano.",
    evidence:
      "Dossiê cita ensaios com simulante · experiência realizada na Terra",
    limitations:
      plantLimit +
      " A fonte de Wamelink lista experimentos com simulante, mas não confirma a cultivar ou o regime térmico desta ficha.",
    temperature: {
      min: 16,
      max: 20,
      label: "16–20 °C citado como condição amena",
      quality: "dossier",
      explanation:
        "Faixa transcrita da matriz do dossiê; não é apresentada como tolerância fisiológica validada para cultivar definida.",
    },
    searchTerms: ["cereal", "grão", "espiga", "Secale cereale", "rye"],
    sourceKeys: ["bvad", "wamelink"],
    dossierPage: "p. 6",
  }),
  createCrop({
    id: "arroz-anao",
    name: "Arroz-anão",
    modelKey: "rice",
    species: [
      {
        commonName: "Arroz",
        scientificName: "Oryza sativa",
        cultivar: "Ai-Nan-Tsao / Super Dwarf",
        note: "“Anão” descreve o porte/cultivar, não uma espécie diferente.",
      },
    ],
    nutritionCategory: "Base calórica",
    nutritionContribution:
      "Grão de base calórica; a composição depende do tipo de arroz e do beneficiamento.",
    use: "Grãos e reprodução por sementes em sistema fechado.",
    cultivationMethod:
      "O dossiê propõe canteiros saturados com água purificada. Esse método é uma hipótese de projeto, não validação em Marte.",
    cycle: "80–95 dias (ciclo indicado no dossiê para Ai-Nan-Tsao / Super Dwarf).",
    description:
      "Cereal de canteiro alagado na proposta de missão; o modelo inclui panículas e uma lâmina d'água ilustrativa.",
    evidence: "Cultivares de arroz indicadas no dossiê · proposta agrícola",
    limitations: plantLimit,
    water: {
      min: 40,
      max: 80,
      value: 60,
      controlMin: 0,
      controlMax: 100,
      step: 1,
      unit: "% do índice didático",
      label: "Canteiro saturado · escala didática",
      quality: "educational",
      explanation:
        "O dossiê propõe canteiros saturados, mas não informa um teor quantitativo para arroz. O índice do controle não é um volume ou teor de água medido.",
    },
    searchTerms: ["cereal", "grão", "panícula", "Oryza sativa"],
    sourceKeys: ["bvad", "crops"],
    dossierPage: "p. 6",
  }),
  createCrop({
    id: "quinoa",
    name: "Quinoa",
    modelKey: "quinoa",
    species: [
      {
        commonName: "Quinoa",
        scientificName: "Chenopodium quinoa",
        cultivar: "NASA ALS / Andina",
      },
    ],
    nutritionCategory: "Proteína e grão",
    nutritionContribution:
      "Pseudocereal com proteínas e aminoácidos; o perfil nutricional varia por variedade e processamento.",
    use: "Sementes comestíveis.",
    cultivationMethod:
      "O dossiê propõe cultivo em substrato tratado e cita tolerância a salinidade como hipótese de seleção; o protocolo marciano não foi demonstrado.",
    cycle: "75–90 dias (ciclo indicado no dossiê).",
    description:
      "Pseudocereal de panícula ramificada; a variedade exata precisa ser confirmada antes de usar recomendações de cultivo.",
    evidence: "Variedades indicadas no dossiê · cultivo marciano não demonstrado",
    limitations: plantLimit,
    searchTerms: ["pseudocereal", "semente", "Chenopodium quinoa"],
    sourceKeys: ["bvad", "crops"],
    dossierPage: "p. 6",
  }),
  createCrop({
    id: "soja",
    name: "Soja",
    modelKey: "soy",
    species: [
      {
        commonName: "Soja",
        scientificName: "Glycine max",
        cultivar: "Hoyt / McCall",
      },
    ],
    nutritionCategory: "Proteína e lipídio",
    nutritionContribution:
      "O dossiê indica o grão como fonte de proteína e lipídios; composição varia com cultivar e processamento.",
    use: "Grãos comestíveis; a fixação de nitrogênio exige simbiose com bactérias compatíveis.",
    cultivationMethod:
      "Ciclo em câmara de cultivo com rizóbios; dose de inoculante e manejo não são definidos na ficha.",
    cycle: "85–95 dias (ciclo indicado no dossiê para Hoyt / McCall).",
    description:
      "Leguminosa com vagens; a proposta de fixação de nitrogênio depende da simbiose e das condições do substrato.",
    evidence:
      "Cultivares NASA BPC citadas pelo dossiê · hipótese de simbiose no sistema",
    limitations: plantLimit,
    temperature: {
      min: 22,
      max: 26,
      label: "Zona de projeto: 26 °C dia / 22 °C noite",
      quality: "engineering",
      explanation:
        "Regime dia/noite transcrito da seção de operação do dossiê, não validado como ótimo para Hoyt / McCall.",
    },
    searchTerms: ["leguminosa", "vagem", "Glycine max"],
    sourceKeys: ["bvad", "engineering"],
    dossierPage: "p. 6",
  }),
  createCrop({
    id: "amendoim",
    name: "Amendoim",
    modelKey: "peanut",
    species: [
      {
        commonName: "Amendoim",
        scientificName: "Arachis hypogaea",
        cultivar: "Georgia Red",
      },
    ],
    nutritionCategory: "Lipídio e caloria",
    nutritionContribution:
      "Semente oleaginosa com lipídios e proteínas; composição depende de cultivar, preparo e processamento.",
    use: "Sementes e vagens subterrâneas.",
    cultivationMethod:
      "O dossiê propõe leito profundo de substrato tratado, permitindo o desenvolvimento subterrâneo das vagens.",
    cycle: "100–110 dias (ciclo indicado no dossiê para Georgia Red).",
    description:
      "Leguminosa com formação de vagens sob o substrato; o modelo mostra a estrutura subterrânea separada.",
    evidence: "Georgia Red indicada no dossiê · proposta de cultivo em leito",
    limitations: plantLimit,
    searchTerms: ["oleaginosa", "vagem", "Arachis hypogaea"],
    sourceKeys: ["bvad"],
    dossierPage: "p. 7",
  }),
  createCrop({
    id: "feijao-caupi-ervilha",
    name: "Feijão-caupi / Ervilha",
    modelKey: "cowpea-pea",
    species: [
      {
        commonName: "Feijão-caupi",
        scientificName: "Vigna unguiculata",
      },
      { commonName: "Ervilha", scientificName: "Pisum sativum" },
    ],
    nutritionCategory: "Proteína e vitamina B1",
    nutritionContribution:
      "As duas culturas são leguminosas distintas; o dossiê destaca proteínas e vitamina B1, sem atribuir a mesma composição a todas as cultivares.",
    use: "Vagens e sementes comestíveis; potencial de fixação de nitrogênio quando há inoculante adequado.",
    cultivationMethod:
      "Cultivo em sistema fechado; separar protocolos e resultados de feijão-caupi e ervilha antes de extrapolar necessidades.",
    cycle: "60–75 dias (faixa indicada no dossiê para a categoria).",
    description:
      "Categoria agrupada para navegação; a ficha mantém Vigna unguiculata e Pisum sativum como espécies diferentes.",
    evidence:
      "NASA Space Crop Considerations citado no dossiê · categorias não intercambiáveis",
    limitations: plantLimit,
    searchTerms: ["feijão", "feijao", "caupi", "ervilha", "leguminosa"],
    sourceKeys: ["crops", "bvad"],
    dossierPage: "p. 7",
  }),
  createCrop({
    id: "tomate-anao",
    name: "Tomate-anão",
    modelKey: "tomato",
    species: [
      {
        commonName: "Tomate",
        scientificName: "Solanum lycopersicum",
        cultivar: "Red Robin / Micro-Tina",
        note: "“Anão” descreve o porte/cultivar, não uma espécie diferente.",
      },
    ],
    nutritionCategory: "Antioxidante / licopeno",
    nutritionContribution:
      "Fruto com carotenoides como licopeno; teor depende de cultivar e maturação.",
    use: "Frutos comestíveis e sementes para reprodução.",
    cultivationMethod:
      "Cultivo em Veggie foi proposto na investigação Veg-05; o dossiê também cita simulante terrestre. As evidências não se combinam como uma validação marciana.",
    cycle: "60–75 dias (ciclo indicado no dossiê; cultivar e condição devem ser confirmadas).",
    description:
      "Hortaliça de fruto; o modelo separa caule, folhas e tomates para mostrar reações distintas.",
    evidence:
      "Dossiê cita Veg-05 e Wamelink; experimento com simulante foi terrestre",
    limitations:
      plantLimit +
      " O artigo de Wamelink relata tomates em simulante terrestre; a página Veg-05 é uma descrição de investigação espacial, não um ensaio em Marte.",
    temperature: {
      min: 22,
      max: 26,
      label: "Zona de projeto: 26 °C dia / 22 °C noite",
      quality: "engineering",
      explanation:
        "Regime de engenharia transcrito do dossiê; não define tolerância térmica da Red Robin ou Micro-Tina.",
    },
    searchTerms: ["fruto", "Solanum lycopersicum", "tomate"],
    sourceKeys: ["veg05", "wamelink", "veggie"],
    dossierPage: "p. 7",
  }),
  createCrop({
    id: "pimentao-anao",
    name: "Pimentão-anão",
    modelKey: "pepper",
    species: [
      {
        commonName: "Pimentão / pimenta",
        scientificName: "Capsicum annuum",
        cultivar: "Española Improved",
        note: "O PH-04 da NASA usou pimenta Hatch, cultivar diferente da indicada no dossiê.",
      },
    ],
    nutritionCategory: "Vitamina C / capsaicina",
    nutritionContribution:
      "Frutos de Capsicum fornecem vitamina C; pungência/capsaicina depende da variedade. O pimentão doce pode não conter capsaicina em nível pungente.",
    use: "Frutos comestíveis; polinização assistida pode ser necessária em câmara fechada.",
    cultivationMethod:
      "O dossiê associa a categoria ao PH-04. A NASA cultivou pimenta Hatch no APH/ISS; isso não valida a cultivar Española nem cultivo marciano.",
    cycle: "75–95 dias (faixa indicada no dossiê; cultivar a confirmar).",
    description:
      "Planta de fruto com diferentes formatos por cultivar; o modelo usa frutos em forma de pimenta e mostra a variação de cor.",
    evidence:
      "NASA PH-04 cultivou pimenta Hatch na ISS; cultivar não é a do catálogo",
    limitations: plantLimit,
    searchTerms: ["fruto", "Capsicum annuum", "pimenta", "hortaliça"],
    sourceKeys: ["ph04", "aph", "bvad"],
    dossierPage: "p. 7",
  }),
  createCrop({
    id: "alface-folhosas",
    name: "Alface / Folhosas",
    modelKey: "lettuce",
    species: [
      {
        commonName: "Alface",
        scientificName: "Lactuca sativa",
        cultivar: "Outredgeous / Waldmann’s Green",
      },
      {
        commonName: "Outras folhosas",
        scientificName: "Espécies dependem da cultura escolhida",
      },
    ],
    nutritionCategory: "Micronutrientes / folhas",
    nutritionContribution:
      "A matriz nutricional depende da espécie e da folha. O dossiê associa alface a vitaminas K e folato; não atribuímos o mesmo perfil a todas as folhosas.",
    use: "Folhas comestíveis; cortes repetidos dependem da espécie e do protocolo.",
    cultivationMethod:
      "Veggie utiliza substrato poroso e luz LED na ISS; hidroponia/aeroponia também são avaliadas no programa XROOTS.",
    cycle: "28–33 dias (ciclo indicado no dossiê para alface romana).",
    description:
      "Folhosa de roseta; alfaces foram cultivadas e consumidas na ISS, sem extrapolação para Marte.",
    evidence:
      "Alfaces e folhosas cultivadas em Veggie na ISS · não é evidência marciana",
    limitations: plantLimit,
    searchTerms: ["folha", "folhosa", "salada", "Lactuca sativa", "alface"],
    sourceKeys: ["veggie", "xroots"],
    dossierPage: "p. 7",
  }),
  createCrop({
    id: "brassicas",
    name: "Brássicas",
    modelKey: "brassicas",
    species: [
      { commonName: "Colza", scientificName: "Brassica napus" },
      {
        commonName: "Mizuna / Pak choi",
        scientificName: "Brassica rapa",
      },
      { commonName: "Mostarda etíope", scientificName: "Brassica carinata" },
    ],
    nutritionCategory: "Vitaminas C, K e luteína",
    nutritionContribution:
      "O perfil depende da espécie e da parte consumida; não existe um único valor nutricional para toda a família Brassicaceae.",
    use: "Folhas, inflorescências ou outras partes alimentares variam por espécie.",
    cultivationMethod:
      "Dossiê propõe colheita de folhas e rebrota; a NASA tem experiências em órbita com kale, mizuna e outras folhosas.",
    cycle: "25–40 dias (faixa indicada no dossiê para a categoria).",
    description:
      "Grupo de espécies diferentes. O modelo enfatiza folhas largas e uma pequena inflorescência para distingui-las.",
    evidence:
      "Mizuna e kale cultivadas em Veggie na ISS; não valida todas as brássicas",
    limitations:
      plantLimit +
      " As evidências da ISS cobrem espécies/cultivares específicas, não toda a família.",
    searchTerms: ["couve", "mizuna", "wasabi", "pak choi", "brassica"],
    sourceKeys: ["veggie", "crops"],
    dossierPage: "p. 7",
  }),
  createCrop({
    id: "agriao-mostarda",
    name: "Agrião-de-jardim / Mostarda",
    modelKey: "cress-mustard",
    species: [
      {
        commonName: "Agrião-de-jardim",
        scientificName: "Lepidium sativum",
      },
      {
        commonName: "Mostarda-do-campo",
        scientificName: "Sinapis arvensis",
      },
    ],
    nutritionCategory: "Ciclo rápido / folhas",
    nutritionContribution:
      "Folhas comestíveis; o perfil depende de espécie, cultivar e estágio de colheita.",
    use: "Folhas e sementes; agrião e mostarda continuam identificados como espécies distintas.",
    cultivationMethod:
      "O artigo de Wamelink avaliou simulantes terrestres; os resultados valem para suas condições experimentais, não para cultivo aberto em Marte.",
    cycle: "18–30 dias (faixa indicada no dossiê).",
    description:
      "Duas espécies de crescimento foliar agrupadas no catálogo; a representação mostra brotos e inflorescências distintas.",
    evidence:
      "Wamelink estudou agrião e mostarda-do-campo em simulantes na Terra",
    limitations: plantLimit,
    searchTerms: [
      "agrião",
      "agriao",
      "mostarda",
      "Lepidium sativum",
      "Sinapis arvensis",
    ],
    sourceKeys: ["wamelink", "veggie"],
    dossierPage: "p. 8",
  }),
  createCrop({
    id: "raizes",
    name: "Rabanete / Cenoura / Beterraba",
    modelKey: "root-trio",
    species: [
      {
        commonName: "Rabanete",
        scientificName: "Raphanus sativus",
        cultivar: "Cherry Belle (referência do dossiê)",
      },
      {
        commonName: "Cenoura",
        scientificName: "Daucus carota",
      },
      {
        commonName: "Beterraba",
        scientificName: "Beta vulgaris",
      },
    ],
    nutritionCategory: "Raízes e nitratos",
    nutritionContribution:
      "As três culturas não são intercambiáveis: pigmentos, fibras e micronutrientes variam por espécie e parte comestível.",
    use: "Raízes comestíveis; folhas também podem ser avaliadas por espécie e segurança.",
    cultivationMethod:
      "Rabanete foi estudado no APH/ISS. Cenoura e beterraba na mesma categoria não compartilham automaticamente o resultado.",
    cycle: "21–55 dias (faixa indicada no dossiê para a categoria; rabanete é a cultura de ciclo mais curto).",
    description:
      "Grupo de três raízes. O modelo exibe rabanete, cenoura e beterraba lado a lado com cores e formas próprias.",
    evidence:
      "NASA Plant Habitat-02 estudou rabanete na ISS; não valida cenoura ou beterraba",
    limitations: plantLimit,
    searchTerms: [
      "rabanete",
      "cenoura",
      "beterraba",
      "raiz",
      "Raphanus sativus",
    ],
    sourceKeys: ["aph02", "wamelink"],
    dossierPage: "p. 8",
  }),
  createCrop({
    id: "pepino-morango",
    name: "Pepino / Morango-anão",
    modelKey: "cucumber-strawberry",
    species: [
      { commonName: "Pepino", scientificName: "Cucumis sativus" },
      {
        commonName: "Morango",
        scientificName: "Fragaria × ananassa",
        note: "“Anão” descreve o porte/cultivar, não uma espécie diferente.",
      },
    ],
    nutritionCategory: "Hidratação e bem-estar",
    nutritionContribution:
      "Pepino e morango são alimentos diferentes; o dossiê destaca água, polifenóis e bem-estar sem atribuir um perfil comum aos dois.",
    use: "Pepino e morango comestíveis; morangueiro pode propagar-se por estolões.",
    cultivationMethod:
      "Dossiê menciona o framework NASA Space Crops; cada cultura exige câmara, polinização e protocolo próprios.",
    cycle: "42–70 dias (faixa indicada no dossiê; cultura/cultivar não detalhada).",
    description:
      "Duas culturas de fruto distintas; a cena 3D inclui treliça de pepino e morangos com estolão.",
    evidence:
      "Categoria do dossiê; experimento NASA específico de Marte não encontrado",
    limitations: plantLimit,
    searchTerms: ["pepino", "morango", "Cucumis sativus", "Fragaria"],
    sourceKeys: ["crops", "veggie"],
    dossierPage: "p. 8",
  }),
  createCrop({
    id: "trevo-lotus",
    name: "Trevo-doce / Lotus",
    modelKey: "clover-lotus",
    species: [
      {
        commonName: "Trevo-doce-amarelo",
        scientificName: "Melilotus officinalis",
      },
      {
        commonName: "Cornichão-grande",
        scientificName: "Lotus pedunculatus",
      },
    ],
    nutritionCategory: "Adubação verde / nitrogênio",
    nutritionContribution:
      "Categoria de cobertura e condicionamento do substrato, não um alimento de consumo regular da tripulação.",
    use: "Adubação verde e aporte de biomassa; simbiose fixadora requer rizóbios compatíveis.",
    cultivationMethod:
      "Wamelink avaliou espécies de adubação verde em simulantes. O tratamento e a inoculação no plano de missão são hipóteses de engenharia.",
    cycle: "45–60 dias até incorporação (faixa indicada no dossiê).",
    description:
      "Duas leguminosas de cobertura; o modelo representa ramos rasteiros e pequenos folíolos, não cultura alimentar.",
    evidence:
      "Wamelink avaliou plantas de cobertura em simulantes terrestres",
    limitations:
      plantLimit +
      " Fixação de nitrogênio requer microrganismo compatível e condições que não são reproduzidas pelo modelo.",
    searchTerms: [
      "trevo",
      "cornichão",
      "lotus",
      "Melilotus officinalis",
      "Lotus pedunculatus",
    ],
    sourceKeys: ["wamelink", "engineering"],
    dossierPage: "p. 8",
  }),
  createCrop({
    id: "biomassa-microbiana",
    name: "Biomassa microbiana comestível",
    modelKey: "microbial-bioreactor",
    biologicalType: "biofactory",
    species: [
      {
        commonName: "Levedura",
        scientificName: "Rhodosporidium toruloides",
        note: "Organismo proposto para biofábrica no dossiê; não é planta.",
      },
      {
        commonName: "Cianobactéria",
        scientificName: "Limnospira indica",
        note: "O dossiê a chama Spirulina; composição e segurança dependem do processo.",
      },
    ],
    nutritionCategory: "Proteína, óleo e carotenoides (proposta)",
    nutritionContribution:
      "Composição da biomassa final não é informada por análise no dossiê. Não presumir segurança alimentar, rendimento ou balanço nutricional do consórcio.",
    use: "Biofábrica em biorreator fechado; categoria separada das plantas convencionais.",
    cultivationMethod:
      "Conceito de fermentação e fotobiorreator. Os dados de resistência UV das leveduras do Atacama não comprovam produção de alimento seguro em Marte.",
    cycle: "Colheita contínua / 24–72 h (hipótese indicada no dossiê, não rendimento validado).",
    description:
      "Consórcio proposto de levedura e cianobactéria; a cena mostra um fotobiorreator, não uma planta.",
    evidence:
      "Pulschen et al. estudaram leveduras em laboratório; a biofábrica é hipótese de missão",
    limitations:
      "Resistência a UV ou frio em ensaios terrestres não prova crescimento, segurança alimentar, produção de nutrientes ou desempenho do consórcio em Marte. O tempo de 24–72 h é uma hipótese do dossiê, não taxa de produção validada.",
    water: {
      min: 40,
      max: 60,
      value: 50,
      controlMin: 0,
      controlMax: 100,
      step: 1,
      unit: "% do índice didático",
      label: "Meio de biorreator",
      quality: "educational",
      explanation:
        "Sem faixa quantitativa de água/meio para o consórcio no dossiê. O índice 0–100 é apenas uma escala visual, não um teor de umidade real.",
    },
    light: {
      min: 40,
      max: 60,
      label: "Índice do LED · escala didática",
      quality: "educational",
      explanation:
        "O dossiê propõe LED para o fotobiorreator, mas não informa PPFD ou fotoperíodo para o consórcio. Índice da interface não é medida biológica.",
    },
    temperature: {
      min: 16,
      max: 26,
      label: "Envelope do módulo · não da cepa",
      quality: "educational",
      explanation:
        "O dossiê não especifica condição do biorreator para a combinação R. toruloides + L. indica. O envelope é apenas a zona térmica geral da estufa.",
    },
    searchTerms: [
      "biomassa",
      "microbiana",
      "biofábrica",
      "biorreator",
      "fermentação",
      "Rhodosporidium",
      "Limnospira",
    ],
    sourceKeys: ["pulschen", "crops"],
    dossierPage: "p. 8",
  }),
];

export const comparisonFields = [
  { key: "water", label: "Água" },
  { key: "light", label: "Iluminação" },
  { key: "nutrients", label: "Nutrientes" },
  { key: "habitat", label: "Método" },
  { key: "limitation", label: "Limitações" },
] as const;

export const cropCount = 18;
