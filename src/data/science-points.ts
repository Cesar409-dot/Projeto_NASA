import type { MarsCoordinate } from "../lib/mars/coordinates";

export type SciencePoint = {
  id: string;
  name: string;
  kind: string;
  description: string;
  significance: string;
  objective: string;
  mission: string;
  source: string;
  coordinateSource: string;
  coordinate: MarsCoordinate;
  coordinateNote: string;
  imagePosition: [number, number];
};
const coordinate = (latitude: number, longitude: number): MarsCoordinate => ({
  body: "Mars",
  latitudeType: "planetocentric",
  longitudeDirection: "east",
  latitude,
  longitude,
});
const coordinateNote =
  "Centro catalogado USGS/IAU · rede MDIM 2.1 · arredondado a 0,01°. Não é uma posição exata de coleta ou acesso.";

export const sciencePoints: SciencePoint[] = [
  {
    id: "belva",
    name: "Cratera Belva",
    kind: "IMPACTO & ESTRATIGRAFIA",
    description:
      "Uma cratera na região do delta de Jezero, observada pelo Perseverance e pelo helicóptero Ingenuity.",
    significance:
      "As exposições no relevo permitem investigar camadas de rocha e a história geológica local.",
    objective:
      "Comparar exposições rochosas de uma cratera de impacto ao contexto sedimentar de Jezero.",
    mission: "Mars 2020 · Perseverance / Ingenuity; MRO · HiRISE",
    source:
      "https://science.nasa.gov/resource/ingenuity-captures-perseverance-at-belva-crater/",
    coordinateSource: "https://planetarynames.wr.usgs.gov/Feature/15872",
    coordinate: coordinate(18.48, 77.38),
    coordinateNote,
    imagePosition: [620, 350],
  },
  {
    id: "neretva",
    name: "Neretva Vallis",
    kind: "ÁGUA & TRANSPORTE DE SEDIMENTOS",
    description:
      "Um antigo canal fluvial que transportou água para Jezero. O Perseverance explorou a região do vale.",
    significance:
      "O canal conecta a paisagem ao redor da cratera à formação do delta e ao transporte de sedimentos.",
    objective:
      "Investigar a relação entre canais antigos, deposição de sedimentos e ambientes aquosos.",
    mission: "Mars 2020 · Perseverance; MRO · CTX / HiRISE",
    source:
      "https://www.nasa.gov/missions/mars-2020-perseverance/perseverance-rover/nasas-perseverance-fords-an-ancient-river-to-reach-science-target/",
    coordinateSource: "https://planetarynames.wr.usgs.gov/Feature/15879",
    coordinate: coordinate(18.55, 77.2),
    coordinateNote,
    imagePosition: [760, 940],
  },
  {
    id: "jezero",
    name: "Jezero · centro catalogado",
    kind: "CONTEXTO REGIONAL & ASTROBIOLOGIA",
    description:
      "Cratera que preserva evidências de um antigo lago e delta e abriga a exploração do Perseverance.",
    significance:
      "Rochas sedimentares ajudam a investigar ambientes antigos potencialmente habitáveis. Isso não é evidência confirmada de vida.",
    objective:
      "Relacionar a história do lago e do delta ao contexto regional da cratera.",
    mission: "Mars 2020 · Perseverance; MRO · CTX / HiRISE",
    source:
      "https://science.nasa.gov/mission/mars-2020-perseverance/location-map/",
    coordinateSource: "https://planetarynames.wr.usgs.gov/Feature/14300",
    coordinate: coordinate(18.41, 77.69),
    coordinateNote,
    imagePosition: [390, 710],
  },
];
