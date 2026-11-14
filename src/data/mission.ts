// Image-space positions are editorial demo annotations, NOT geographic coordinates.
export const points = [
  {
    id: "delta",
    name: "Delta de Jezero",
    kind: "SEDIMENTOS & ÁGUA",
    position: [620, 350] as [number, number],
    description:
      "Deltas se formam pela deposição de sedimentos transportados pela água. Em Jezero, essas rochas ajudam a investigar ambientes antigos e seu potencial de preservar sinais de vida.",
    question: "Como os sedimentos registram a história de um antigo lago?",
    source:
      "https://science.nasa.gov/resource/perseverance-explores-the-jezero-crater-delta/",
  },
  {
    id: "floor",
    name: "Interior da cratera",
    kind: "CONTEXTO GEOLÓGICO",
    position: [390, 710] as [number, number],
    description:
      "A exploração do interior de Jezero conecta observações de superfície à visão orbital. Diferentes tipos de rocha contam partes distintas da história da cratera.",
    question:
      "O que muda quando observamos a mesma região do solo e da órbita?",
    source: "https://science.nasa.gov/mission/mars-2020-perseverance/",
  },
  {
    id: "rim",
    name: "Borda da cratera",
    kind: "PAISAGEM & TEMPO",
    position: [760, 940] as [number, number],
    description:
      "A borda oferece contexto para compreender a formação da cratera e sua relação com a paisagem ao redor. Sua interpretação exige imagens e dados topográficos validados.",
    question: "Quais evidências distinguem processos de impacto e erosão?",
    source: "https://trek.nasa.gov/mars/",
  },
];
export const crops = [
  {
    id: "lettuce",
    name: "Alface",
    latin: "Lactuca sativa",
    tag: "FOLHOSA",
    description:
      "Folhas frescas aproximam a pesquisa espacial da alimentação cotidiana. A alface está entre as culturas estudadas no sistema Veggie na Estação Espacial Internacional.",
    focus: "Qualidade da luz, água e segurança microbiológica.",
    icon: "leaf",
  },
  {
    id: "mizuna",
    name: "Mizuna",
    latin: "Brassica rapa var. japonica",
    tag: "FOLHOSA",
    description:
      "A mizuna foi cultivada no Veggie. A pesquisa investiga como produzir vegetais frescos em ambientes controlados durante missões espaciais.",
    focus: "Disponibilidade de nutrientes e manejo da água.",
    icon: "sprout",
  },
  {
    id: "tomato",
    name: "Tomate-anão",
    latin: "Solanum lycopersicum",
    tag: "FRUTÍFERA",
    description:
      "O experimento Veg-05 investigou tomates-anões no Veggie, incluindo qualidade da luz, formulação de fertilizantes e a experiência da tripulação.",
    focus: "Frutificação, qualidade nutricional e aceitação.",
    icon: "flower",
  },
];
