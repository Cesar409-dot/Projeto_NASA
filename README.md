# Mars Survival Guide

Atlas educativo para o NASA Space Apps Challenge: exploração de Marte, fatores humanos e agricultura espacial. Projeto independente, sem endosso da NASA.

## Executar

Use Node.js 22 LTS a partir de 22.12 (utilizado: 22.20.0) e npm (10.9.3). O ambiente de testes também suporta as versões indicadas pelo Vitest instalado.

```powershell
npm.cmd ci
npm.cmd run dev
```

Abra http://localhost:3000. Em outros sistemas, use `npm`.

```powershell
npm.cmd run lint
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
npm.cmd start
```

Não requer conta, chave, banco de dados, arquivo `.env` ou recurso pago.

## Páginas e interações

- `/`: apresentação, ilustração artística de Marte e acesso às três frentes.
- `/mars-maps`: MOLA — Relevo global (NASA/WMTS verificado) e Imagem oficial (recorte de Jezero sem georreferenciamento), enquadramento responsivo com zoom limitado à resolução disponível, três centros científicos selecionáveis, marcadores próprios, origem/destino, arco e distância geométrica marciana, inversão/limpeza e missões persistentes. Veja [configuração cartográfica atual](docs/MAP_DISPLAY.md).

O planejador também compara a rota direta com uma [rota experimental pelo terreno de Jezero](docs/TERRAIN_ROUTING.md), calculada por A* em um recorte local de DEM CTX/USGS. Inclinações são estimadas e não garantem trânsito seguro.

- `/mind-space`: check-in e cronômetro preservados; três cenários interativos sobre isolamento, comunicação e convivência sob pressão. Nenhuma resposta é persistida ou transmitida.
- `/mars-greenhouse`: seleção e comparação qualitativa de alface, batata e rabanete; água, luz, nutrientes, ambiente e limitações, com fontes e estrutura para revisão de Química.
- Página 404 com retorno ao início.

## Organização

```text
src/app/           Rotas App Router, metadados e estilos globais
src/components/    Interfaces e CSS Modules; map/ separa canvas, camadas e painéis
src/data/          Camadas, pontos, cenários e culturas com fontes
src/lib/mars/      Coordenadas, CRS explícito, distância, rota e verificação WMTS
public/images/     Imagem orbital local com atribuição
tests/             Geometria, controles em DOM simulado, CRS e falhas WMTS
scripts/           Verificação HTTP e estudo anterior da grade Leaflet
docs/              Fontes, limites e roteiro de verificação
```

Next.js 16, React 19, TypeScript estrito, CSS Modules, tokens globais, Lucide React, Leaflet e React Leaflet. Sem Tailwind ou backend. Versões resolvidas em `package-lock.json`.

## Design e acessibilidade

Atlas de missão com fundo grafite, laranja para exploração, azul para fatores humanos e verde para cultivo. Layouts adaptáveis, foco visível, link de pular conteúdo, rótulos de formulário e estados de seleção. O painel oferece alternativa por teclado aos marcadores. A ilustração de Marte é artística; fontes têm fallback do sistema.

## Integridade científica

O modo orbital usa uma grade angular explicitamente marciana, sem alias WGS84/EPSG:4326 e sem medidas terrestres. Os centros de Belva, Neretva Vallis e Jezero vêm do catálogo USGS/IAU, em latitude planetocêntrica e longitude positiva para leste, rede MDIM 2.1. São centros aproximados publicados a 0,01°, não locais exatos de coleta ou acesso.

Marswalk estima o arco de grande círculo em uma esfera de Marte de raio 3.396.190 m. O resultado é arredondado ao quilômetro e não inclui relevo, risco ou viabilidade de caminhada. O fallback usa imagem oficial com posições editoriais: sua linha é apenas esquemática; a distância do painel usa as coordenadas do catálogo, nunca pixels.

O identificador de CRS anunciado pelo WMTS é ambíguo. A grade implementada corresponde às matrizes publicadas e passou em testes numéricos, mas o alinhamento absoluto entre MDIM 2.1 e os produtos orbitais controlados a MOLA não foi validado para precisão operacional. As limitações aparecem na interface. Veja [metodologia e entrega da fase 2](docs/PHASE_2.md), [fontes](docs/SCIENCE.md) e [créditos](docs/MAP_ATTRIBUTION.md).

Mind Space é educativo, sem avaliação clínica. Resultados de cultivo na ISS não validam agricultura em Marte. Os controles da estufa não são modelos físicos.

## Próximas prioridades

1. Testar visualmente a integração orbital e a responsividade em navegador; validar alinhamento por pontos de controle independentes.
2. Esclarecer o CRS anunciado pelo serviço com os produtores e validar transformações entre redes de controle.
3. Revisar conteúdo e cultivares com as pessoas de Química e Design, incluindo unidades e protocolos antes de adicionar números.
4. Incorporar topografia apenas com resolução, datum vertical e limites do modelo documentados.
5. Ampliar a avaliação de acessibilidade e dispositivos reais.

## Recursos 404 e avisos de desenvolvimento

Não há preload manual de CSS. Foram verificados os assets referenciados nas quatro rotas, tanto no servidor de desenvolvimento quanto no de produção, sem 404. Um ícone SVG foi incluído pela convenção do Next.js. Após atualizações ou troca entre servidores, uma aba antiga pode precisar de recarga completa; não hardcode URLs de chunks `/_next/`. O aviso específico de preload no console do Chrome ainda requer confirmação visual, pois o controle do navegador estava indisponível.

Consulte o [roteiro de verificação](docs/VERIFICATION.md). A aplicação não substitui ferramentas científicas ou planejamento operacional.
