export type Crop = {
  id: string;
  name: string;
  latin: string;
  tag: string;
  description: string;
  water: string;
  light: string;
  nutrients: string;
  habitat: string;
  limitation: string;
  evidence: string;
  sources: { title: string; url: string }[];
  research: {
    status: "qualitative";
    review: "pending-chemistry";
    notes: string;
  };
};
const general = {
  title: "NASA · Growing Plants in Space",
  url: "https://www.nasa.gov/exploration-research-and-technology/growing-plants-in-space/",
};
export const crops: Crop[] = [
  {
    id: "lettuce",
    name: "Alface",
    latin: "Lactuca sativa",
    tag: "FOLHOSA",
    description:
      "Alfaces foram estudadas no sistema Veggie na ISS como fonte complementar de alimento fresco.",
    water:
      "A água deve chegar às raízes sem impedir sua aeração. O sistema de cultivo determina como isso é feito.",
    light:
      "A luz artificial sustenta a fotossíntese; cor, intensidade e ciclo de iluminação precisam ser definidos para a cultivar e o sistema.",
    nutrients:
      "Requer fornecimento de nutrientes minerais em um meio de cultivo planejado. Não há dose universal validada aqui.",
    habitat:
      "Ambiente controlado, água e nutrientes manejados e atenção à segurança microbiológica das folhas consumidas.",
    limitation:
      "Resultados da ISS não validam o cultivo na superfície de Marte nem o uso direto de regolito marciano.",
    evidence: "Veggie / ISS · cultivo experimental de folhas.",
    sources: [general],
    research: {
      status: "qualitative",
      review: "pending-chemistry",
      notes:
        "Incorporar futuramente cultivar, sistema, composição e referência de cada medida revisada pela equipe de Química.",
    },
  },
  {
    id: "potato",
    name: "Batata",
    latin: "Solanum tuberosum",
    tag: "TUBÉRCULO",
    description:
      "Experimentos de voo espacial investigaram a formação de tubérculos de batata em câmaras de cultivo.",
    water:
      "O fornecimento de água precisa ser compatível com o meio de cultivo e com a oxigenação das raízes e tubérculos.",
    light:
      "Iluminação e fotoperíodo são variáveis do experimento e da cultivar. Não apresentamos um regime de cultivo marciano.",
    nutrients:
      "O manejo mineral deve ser definido e acompanhado no sistema experimental, sem extrapolar doses de outros ambientes.",
    habitat:
      "Câmara controlada, espaço para tubérculos e acompanhamento do desenvolvimento da planta e da região das raízes.",
    limitation:
      "Formar tubérculos em voo espacial não demonstra produtividade, autossuficiência alimentar ou viabilidade em Marte.",
    evidence: "Estudo primário · formação de tubérculos em voo espacial.",
    sources: [
      {
        title: "Estudo · Potato tuber formation in the spaceflight environment",
        url: "https://pubmed.ncbi.nlm.nih.gov/11540455/",
      },
      general,
    ],
    research: {
      status: "qualitative",
      review: "pending-chemistry",
      notes:
        "Revisar cultivar, substrato e protocolo antes de incorporar valores numéricos.",
    },
  },
  {
    id: "radish",
    name: "Rabanete",
    latin: "Raphanus sativus",
    tag: "RAIZ COMESTÍVEL",
    description:
      "O experimento Plant Habitat-02 cultivou rabanetes no Advanced Plant Habitat da ISS e investigou respostas das plantas ao ambiente espacial.",
    water:
      "O fornecimento é manejado no habitat experimental. A água é uma variável a controlar, sem recomendação quantitativa nesta comparação.",
    light:
      "O experimento utiliza iluminação controlada. Condições de luz fazem parte das variáveis de pesquisa do crescimento.",
    nutrients:
      "A pesquisa acompanha absorção mineral e respostas fisiológicas; não define aqui uma fórmula universal de nutrientes.",
    habitat:
      "O APH permite acompanhar plantas em um ambiente experimental controlado; uma estufa marciana exigiria validação própria.",
    limitation:
      "Resultados no APH/ISS não equivalem a uma receita para cultivar em Marte ou em seu regolito.",
    evidence: "Plant Habitat-02 / APH / ISS · pesquisa com rabanetes.",
    sources: [
      {
        title: "NASA · Plant Habitat-02",
        url: "https://science.nasa.gov/biological-physical/investigations/plant-habitat-02-wvqpm/",
      },
      general,
    ],
    research: {
      status: "qualitative",
      review: "pending-chemistry",
      notes:
        "Acrescentar valores apenas com unidades, protocolo experimental e referência científica revisados.",
    },
  },
];
export const comparisonFields = [
  { key: "water", label: "Água" },
  { key: "light", label: "Iluminação" },
  { key: "nutrients", label: "Nutrientes" },
  { key: "habitat", label: "Ambiente controlado" },
  { key: "limitation", label: "Limitações em Marte" },
] as const;
