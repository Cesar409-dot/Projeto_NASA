# Visualização cartográfica atual

Somente MOLA — Relevo global e Imagem oficial estão disponíveis. Os documentos de fases anteriores e suas fixtures registram a investigação histórica de CTX/HiRISE; esses produtos não são mais solicitados nem oferecidos no seletor. Registros antigos mantêm suas coordenadas, identificadores de origem e rotas salvas.

## Enquadramento

O zoom mínimo acompanha as dimensões efetivas do canvas e é recalculado pelo ResizeObserver. Usa a escala uniforme necessária para a cobertura preencher a janela, recortando as extremidades quando a proporção da janela difere da base. O botão de recentralizar retorna a esse enquadramento. Pan e zoom ficam limitados à cobertura e à resolução disponível; não há repetição de mundo nem ampliação de cobertura.

O cálculo respeita o zoom fracionário do Leaflet e sua restrição a zoom inteiro quando o navegador não oferece transformações CSS 3D. Em janelas maiores que a própria fonte, pode sobrar fundo: o limite de resolução tem prioridade sobre preencher a tela.

## MOLA

- [Metadados oficiais NASA Mars Trek](https://trek.nasa.gov/tiles/Mars/EQ/Mars_MGS_MOLA_ClrShade_merge_global_463m/1.0.0/WMTSCapabilities.xml), consultados novamente nesta correção: tiles JPEG de 256 × 256, matriz `default028mm`, níveis nativos 0–7, origem −180° / 90°, dimensões 2^(z+1) × 2^z.
- A grade angular marciana existente foi preservada: o serviço não utiliza Web Mercator. Bounds publicados: latitude −89,9991635 a 90; longitude leste −180 a 179,9983271.
- `minNativeZoom=0`, `maxNativeZoom=maxZoom=7`, `tileSize=256`, `noWrap=true`, sem overzoom. O zoom mínimo de exibição pode ser maior que zero conforme a janela.

## Imagem oficial

- [PIA19303 — Jezero Crater](https://science.nasa.gov/photojournal/a-possible-landing-site-for-the-2020-mission-jezero-crater/), NASA/JPL-Caltech/University of Arizona. O arquivo existente `public/images/jezero.jpg` tem 2880 × 1800 pixels.
- CRS.Simple, área editorial 1600 × 1000, mesma proporção 1,6 da fonte. Essa área é uma grade de imagem, não latitude/longitude. Não foi inventado georreferenciamento.
- Zoom máximo 0,75: 1600 × 2^0,75 permanece abaixo de 2880 pixels. Não amplia além da resolução original; nenhuma alteração do arquivo ou distorção de proporção.
- A imagem cobre somente um recorte de Jezero. Avisos no seletor e no canvas deixam essa limitação explícita. Marcadores geográficos continuam no MOLA; pontos e conexões editoriais permanecem esquemáticos na imagem.

## Validação

Os testes com Leaflet real em DOM simulado exercitam MOLA e Imagem oficial em 960 × 540, 350 × 480 e 1200 × 640, nos limites mínimo/máximo e em zoom intermediário, além de resize e recentralização. A suíte também verifica o contrato WMTS, as coordenadas e a persistência de marcadores, rotas e missões.

A conferência visual no Chrome foi impedida pela ferramenta Computer Use, que não conseguiu determinar a URL atual com segurança. Os testes em DOM não substituem uma inspeção visual completa no navegador.

Tiles reais dos níveis MOLA 0, 3 e 7 foram baixados do serviço oficial e decodificados: todos responderam com JPEG de 256 × 256 pixels. A imagem oficial também teve suas dimensões conferidas diretamente no arquivo existente.
