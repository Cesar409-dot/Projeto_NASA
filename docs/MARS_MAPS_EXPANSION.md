# Mars Maps — expansão de exploração

Implementação exclusiva de `feat/map-expansion`, baseada em 5776927. Sem backend ou alterações nas frentes de saúde e estufa.

## Funcionalidades e uso

- Mapa mais alto e modo ampliado que oculta o painel lateral; zoom por roda, botões em português e limites de deslocamento por cobertura. “Recentralizar mapa” enquadra a extensão da camada.
- Camadas anteriores CTX controlado e HiRISE preservadas, com imagem local PIA19303 de contingência.
- CTX regional preliminar amplia a exploração contínua do entorno de Jezero. MOLA oferece contexto global de relevo científico, em uma base separada.
- “Adicionar marcador”: escolher uma camada disponível, ativar o botão e clicar dentro da cobertura. Nome obrigatório, descrição, categoria (Exploração, Ciência, Recursos, Risco ou Pessoal) e estado visitado. Editar pelo círculo azul ou pela lista; excluir pela lista. Pontos oficiais permanecem imutáveis.
- Marcadores personalizados podem ser origem ou destino. Inverter e limpar continuam disponíveis. Rotas seguem o arco de grande círculo sobre esfera marciana de raio 3.396.190 m. Arcos antipodais e pontos coincidentes não são aceitos como rota de missão. A linha é dividida no antimeridiano para não produzir conexões falsas na base global.
- “Minhas missões” fica abaixo do mapa. Cadastro em modal nativo com foco contido, Escape e retorno ao botão de origem. Nome, objetivo, data e rota válida obrigatórios; descrição opcional. Sem rota, o modal explica como selecionar os extremos. O usuário pode cancelar, planejar a rota e reabrir.
- A lista apresenta nome, objetivo, data, extremos, distância e detalhes. Permite editar e excluir. Selecionar uma missão destaca sua rota em verde e enquadra os extremos; uma camada disponível que os cubra é selecionada quando necessário.
- Missões armazenam cópias dos nomes e coordenadas dos extremos. Editar ou excluir um marcador não altera uma missão salva. Para trocar a rota da missão, planejar outra rota, editar e escolher “Usar rota atual do mapa”.

## Persistência e integração

Chave `mars-maps:exploration:v1` no localStorage, com esquema `{version:1,markers:[],missions:[]}`. Não reutiliza chaves de outros módulos. A leitura ocorre após a hidratação; não grava valores vazios antes de carregar os registros. Dados inválidos são preservados e a gravação é bloqueada. Falhas de espaço/permissão mantêm os formulários abertos com mensagem. Eventos de outra aba atualizam os registros; uma verificação antes da escrita evita sobrescrever uma atualização já detectável. localStorage não oferece transações entre abas simultâneas.

Integração pela exportação existente `MapExplorer`. Sem dependências novas, mudanças de API, variáveis de ambiente ou migração de backend. Os componentes e tipos são internos à frente de mapas. Não há sincronização entre navegadores; apagar dados do site remove os registros.

## Fontes verificadas em 15/11/2026

Consultados [Mars Trek](https://trek.nasa.gov/mars/), [documentação WMTS](https://trek.nasa.gov/tiles/apidoc/trekAPI.html?body=mars) e [mapa do Perseverance](https://science.nasa.gov/mission/mars-2020-perseverance/location-map/). O mapa do rover é referência externa; não é apresentado como telemetria ao vivo nem incorporado por iframe.

| Base                    | Produto                                                      | Cobertura (latitude; longitude leste)        | Níveis nativos |
| ----------------------- | ------------------------------------------------------------ | -------------------------------------------- | -------------- |
| CTX controlado          | JEZ_ctx_B_soc_008_orthoMosaic_6m_Eqc_latTs0_lon0             | 18,2110274–18,7211945; 77,1604655–77,6991776 | 0–13           |
| HiRISE controlado       | JEZ_hirise_soc_006_orthoMosaic_25cm_Eqc_latTs0_lon0_first_dd | 18,3067994–18,669315; 77,2229331–77,583964   | 0–17           |
| CTX regional preliminar | Jezero_CTX_BlockAdj_dd                                       | 15,9058484–19,4453003; 75,1537692–78,8717121 | 0–12           |
| MOLA sombreado colorido | Mars_MGS_MOLA_ClrShade_merge_global_463m                     | −89,9991635–90; −180–179,9983271             | 0–7            |

Os novos GetCapabilities e tiles amostrados retornaram HTTP 200 por HTTPS: CTX regional `12/1628/5858.png` e MOLA `0/0/1.jpg`. Snapshots XML estão em `tests/fixtures`. O catálogo oficial publica MOLA como exemplo de serviço global JPEG. Não foi realizado download em massa.

Endpoints novos:

- [CTX regional: metadados](https://trek.nasa.gov/tiles/Mars/EQ/Jezero_CTX_BlockAdj_dd/1.0.0/WMTSCapabilities.xml).
- [MOLA: metadados](https://trek.nasa.gov/tiles/Mars/EQ/Mars_MGS_MOLA_ClrShade_merge_global_463m/1.0.0/WMTSCapabilities.xml).

As quatro bases anunciam `urn:ogc:def:crs:EPSG::104905` e matrizes angulares `default028mm`: origem (−180,90), tiles 256×256, dimensão inicial 2×1, crescimento em potências de 2. A aplicação valida produto, CRS anunciado, cobertura, formato, níveis, origem e dimensões antes de habilitar cada camada, e verifica a assinatura e decodificação do tile amostral. Não utiliza EPSG:3857 nem interpreta as coordenadas como WGS84. Usa o adaptador angular marciano existente. A inconsistência de autoridade/datum do serviço continua documentada em MAPS_FEASIBILITY.md; coincidência de grades não comprova registro geodésico absoluto entre produtos.

## Limites científicos e de verificação

- Imagens locais não são georreferenciadas. Não permitem novos marcadores com coordenadas inventadas. Marcadores próprios e rotas que os usam não são projetados artificialmente nessa imagem; continuam disponíveis nos registros e na estimativa numérica.
- MOLA é visualização qualitativa derivada de altimetria, produto nominal de 463 m. Não há valores de altitude, declividade, análise de riscos ou datum vertical validado. Zoom adicional apenas amplia pixels.
- Cada base é selecionada separadamente. Não há fusão ou continuidade presumida entre mosaicos locais. Bounds não garantem pixels válidos em toda a área; falhas parciais mantêm a base com aviso e ausência total dos tiles solicitados aciona a contingência.
- Nenhuma rota é um trajeto operacionalmente seguro. Distâncias não incluem relevo, obstáculos, duração ou consumo. Centros oficiais têm precisão limitada pelo catálogo USGS/IAU.
- Pontos intermediários não foram incluídos; preservado o planejamento por dois extremos.
- A verificação visual no navegador foi interrompida pelo Computer Use porque a URL atual não pôde ser identificada com confiança. Não foi comprovada a renderização real de tiles, o alinhamento por marcos independentes, costuras, responsividade ou interações de Leaflet em navegador nesta entrega. Os testes de fluxo usam um canvas substituto; os testes de grade exercitam a matemática do CRS e os metadados reais. Revisão visual é uma pendência de integração.

## Verificação automatizada

Executar `npm.cmd test`, `npm.cmd run typecheck` e `npm.cmd run build`. Testes exclusivos em map-exploration.test.tsx e map-expansion.spec.ts cobrem CRUD, persistência após remontagem, extremos personalizados, rota salva após excluir marcador, bloqueio sem rota, armazenamento danificado/indisponível, metadados das bases adicionais e divisão de arcos no antimeridiano. A suíte anterior de cálculo marciano, CRS, WMTS e controles foi preservada.

## Resultado da validação — 15/11/2026

- 7 testes matemáticos e 21 testes Vitest passaram (28 no total).
- TypeScript e lint dos arquivos da frente passaram.
- Build de produção com npm.cmd run build -- --webpack passou e gerou a rota estática /mars-maps. Webpack foi utilizado após o watcher de desenvolvimento Turbopack apresentar atualizações contínuas no diretório sincronizado pelo OneDrive. Não houve mudança da configuração do projeto.
- A verificação visual permanece pendente, pelo encerramento do Computer Use descrito acima.

## Arquivos da entrega

- src/components/map/: LeafletCanvas.tsx, MapDialog.tsx, MarkerEditor.tsx, MissionManager.tsx, MissionSummary.tsx, RoutePlanner.tsx, ScientificExplorer.tsx e useExplorationRecords.ts.
- src/components/map.module.css e src/data/map-layers.ts.
- src/lib/mars/: exploration.ts e wmts.ts.
- tests/: map-exploration.test.tsx, map-expansion.spec.ts e fixtures CTX regional/MOLA.
- docs/MARS_MAPS_EXPANSION.md.
