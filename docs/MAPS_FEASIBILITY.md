# Mapas reais de Jezero — verificação de viabilidade

Verificação em 14/11/2026. Resultado: **disponibilidade de metadados e tiles confirmada nas amostras testadas; compatibilidade com Leaflet ainda não comprovada**. Este estudo não altera a aplicação.

## Revalidação de disponibilidade — 14/11/2026, aproximadamente 13:04 BRT

Foram feitas novas requisições GET independentes, com `Origin: http://localhost:3000`, sem autenticação. Em cada camada, foram consultados GetCapabilities e o tile `12/1628/5858`, que contém a coordenada de teste 18.45 N, 77.45 E. XMLs foram analisados e PNGs decodificados localmente.

| Camada | GetCapabilities | Tile | Bytes do PNG | Dimensões |
| --- | --- | --- | --- | --- |
| CTX preliminar | 200 / application/xml | 200 / image/png | 55.135 | 256 × 256 |
| CTX controlado | 200 / application/xml | 200 / image/png | 42.455 | 256 × 256 |
| HiRISE controlado | 200 / application/xml | 200 / image/png | 57.385 | 256 × 256 |

As seis respostas retornaram `Access-Control-Allow-Origin: *`. Não ocorreram falhas nesta rodada. Isso confirma disponibilidade pontual das URLs amostradas, sem garantir todos os tiles, todos os níveis, cobertura integral ou disponibilidade contínua. CORS foi verificado nos cabeçalhos HTTP, sem teste de carregamento no navegador.

## Serviços comprovados por requisições diretas

Base dos endpoints: `https://trek.nasa.gov/tiles/Mars/EQ/`.

| Camada | Identificador | Cobertura em longitude/latitude | Matrizes publicadas |
| --- | --- | --- | --- |
| MRO CTX, Jezero, preliminar | `Jezero_CTX_BlockAdj_dd` | 75.1537692 a 78.8717121 E; 15.9058484 a 19.4453003 N | 0–12 |
| MRO HiRISE, Jezero, controlado | `JEZ_hirise_soc_006_orthoMosaic_25cm_Eqc_latTs0_lon0_first_dd` | 77.2229331 a 77.583964 E; 18.3067994 a 18.669315 N | 0–17 |
| MRO CTX, Jezero, controlado | `JEZ_ctx_B_soc_008_orthoMosaic_6m_Eqc_latTs0_lon0` | 77.1604655 a 77.6991776 E; 18.2110274 a 18.7211945 N | 0–13 |

Os três `GetCapabilities` retornaram HTTP 200 com XML e foram lidos, não apenas identificados no catálogo. Nos metadados CTX preliminar e HiRISE também foi confirmado `Access-Control-Allow-Origin: *`. Todos declaram:

- `SupportedCRS`: `urn:ogc:def:crs:EPSG::104905`.
- Estilo `default`; conjunto `default028mm`; tiles PNG de 256 × 256.
- Origem superior esquerda (-180, 90); matriz inicial de duas colunas por uma linha, dobrando em cada nível.

Foram baixados três PNGs reais com HTTP 200 e `Access-Control-Allow-Origin: *`, sem credencial ou chave, em tiles que contêm o ponto de referência 18.45 N, 77.45 E:

| Camada | Nível | Linha | Coluna | Tamanho recebido |
| --- | --- | --- | --- | --- |
| CTX preliminar | 12 | 1628 | 5858 | 55.135 bytes |
| HiRISE controlado | 12 | 1628 | 5858 | 57.385 bytes |
| HiRISE controlado | 16 | 26050 | 93734 | 52.000 bytes |

As dimensões dos arquivos CTX nível 12 e HiRISE nível 16 foram confirmadas como 256 × 256. O tile HiRISE nível 16 foi inspecionado visualmente e contém terreno, não apenas uma imagem vazia. O ponto usado para calcular o tile é uma coordenada de teste, não uma nova posição científica atribuída a qualquer marco.

Exemplo de URL testada:

```text
https://trek.nasa.gov/tiles/Mars/EQ/Jezero_CTX_BlockAdj_dd/1.0.0/default/default028mm/12/1628/5858.png
```

Template para o Leaflet, após configurar a matriz angular corretamente:

```text
https://trek.nasa.gov/tiles/Mars/EQ/{layer}/1.0.0/default/default028mm/{z}/{y}/{x}.png
```

O ResourceURL publicado contém uma barra dupla após `1.0.0/`; o caminho normalizado acima foi testado com sucesso. Não assumir a mesma normalização para outros serviços sem verificar.

## Compatibilidade com o projeto — hipótese pendente de validação

### Atribuição das fontes — 14/11/2026

Consulte a [verificação de créditos cartográficos](MAP_ATTRIBUTION.md): crédito da imagem PIA19303 atual confirmado; autores e DOIs dos mosaicos controlados CTX e HiRISE identificados; autoria específica do processamento do CTX preliminar ainda pendente. O relatório distingue produtos científicos originais, serviço de distribuição e anotações do protótipo. As sugestões de crédito curto não são apresentadas como linhas oficiais transcritas.

### Restrições de acesso — 14/11/2026

**Acesso aos serviços:** as consultas de metadados e tiles documentadas acima foram realizadas por HTTPS, sem chave de API ou login solicitado. Não houve resposta 401/403 nas URLs amostradas. Nova rodada de acesso também retornou HTTP 200 para CTX preliminar e HiRISE, com Origin de localhost e de outro domínio. Uma confirmação adicional dos tiles das três camadas usou `curl -q` para desativar configurações pessoais e cabeçalhos Authorization/Cookie explicitamente removidos: os três retornaram HTTP 200 / image/png. Isso comprova acesso anônimo nessas requisições, não uma política imutável para todos os serviços NASA.

**CORS:** as respostas testadas retornaram `Access-Control-Allow-Origin: *`. Esse cabeçalho permite acesso anônimo por origens diferentes, sujeito às demais políticas do navegador e da aplicação. Não foi comprovado suporte a requisições com credenciais; não enviar cookies ou tokens desnecessários. Não houve teste no navegador ou de métodos além de GET.

**Incorporação por iframe:** o endereço oficial `https://mars.nasa.gov/map/` redirecionou para `https://mars.nasa.gov/maps/location/?mission=M20&site=NOW`. Na resposta final, foram encontrados dois cabeçalhos CSP: um inclui `frame-ancestors *`, mas o outro restringe a `frame-ancestors 'self' https://*.nasa.gov https://nasa.gov;`. Políticas CSP simultâneas são aplicadas em conjunto; a permissão ampla não elimina a restrição. Também foram recebidos X-Frame-Options conflitantes, incluindo SAMEORIGIN e ALLOWALL. Portanto, não considerar o mapa oficial incorporável por iframe em localhost ou em domínio próprio; não houve teste de iframe no navegador. Essa restrição não impede, por si só, carregar os tiles como imagens em uma implementação própria. Os tiles Trek testados também possuem `frame-ancestors 'self' aelp.smartsparrow.com;`, que se refere à incorporação em frames, não a `<img>`.

**Limites e disponibilidade:** não foi encontrado um limite numérico específico de requisições, uma política de downloads em massa ou garantia de disponibilidade para esses endpoints na documentação oficial consultada. Nas respostas amostradas, não apareceram cabeçalhos de rate limit ou Retry-After. Isso não significa ausência de limites. Os limites publicados para APIs de `api.nasa.gov` não devem ser transferidos automaticamente para `trek.nasa.gov/tiles/`. Os testes foram pontuais, sem carga ou tentativa de provocar bloqueios.

**Uso do conteúdo:** acesso público e CORS não constituem uma licença irrestrita sobre todos os produtos. A orientação geral NASA permite conteúdo educativo/informativo conforme suas diretrizes, exige reconhecimento da fonte e ressalva material de terceiros. Preservar créditos da missão, instrumento e produtores; consultar as condições de cada produto; manter a identificação de projeto independente, sem endosso da NASA. Não houve criação de conta ou recurso pago.

**Implicação para a implementação:** o acesso direto anônimo aos tiles amostrados é tecnicamente permitido pelos cabeçalhos observados, sem necessidade de proxy apenas para contornar CORS. Usar tratamento de erros e requisições limitadas à visualização; não pressupor autorização para espelhar toda a pirâmide. A compatibilidade cartográfica continua sendo um critério separado.

Referências: [Mars Trek WMTS](https://trek.nasa.gov/tiles/apidoc/trekAPI.html?body=mars), [CSP: múltiplas políticas](https://www.w3.org/TR/CSP3/#multiple-policies), [diretrizes NASA para imagens e mídia](https://www.nasa.gov/nasa-brand-center/images-and-media/), [limites documentados de api.nasa.gov](https://api.nasa.gov/assets/html/authentication.html). Os resultados dos cabeçalhos são observações diretas desta sessão, não garantias futuras.

### Teste com Leaflet 1.9.4 — 14/11/2026

**Resultado: compatibilidade parcial demonstrada para a indexação da grade angular; integração cartográfica completa ainda não validada.**

Foi adicionado `scripts/check-leaflet-grid.mjs`. Execute após `npm.cmd ci`:

```powershell
node scripts/check-leaflet-grid.mjs
```

O teste executa os módulos matemáticos do Leaflet 1.9.4 instalado, transpilados em memória com TypeScript, sem DOM ou navegador. Apenas as funções de animação não utilizadas recebem objetos substitutos. Os dados de comparação são snapshots de GetCapabilities em `docs/evidence/jezero-wmts-grid.json`, incluindo cada nível, origem, dimensões e ScaleDenominator publicados. Não há implementação de uma projeção nova na aplicação.

| Verificação | Resultado e alcance |
| --- | --- |
| Dimensões e origem das matrizes | Correspondência nas 45 matrizes: 13 CTX preliminar, 14 CTX controlado e 18 HiRISE |
| Conversão longitude/latitude ↔ pixels | 135 coordenadas sintéticas dentro dos bounding boxes passaram nos testes de ida/volta e de índices de linha/coluna |
| Tile de referência | 18.45 N, 77.45 E no nível 12 produz linha 1628 e coluna 5858, iguais ao tile consultado nos testes HTTP |
| Template de URL | O helper real do Leaflet aceita a ordem `{z}/{y}/{x}`; o método de TileLayer que usa esse helper foi inspecionado, mas não executado como camada no navegador |
| React Leaflet | Código instalado de TileLayer repassa opções ao Leaflet; isso não valida renderização ou CRS automaticamente |
| Medidas padrão | EPSG4326 herda raio terrestre; `LatLng.distanceTo()` chama o modelo Earth independentemente do CRS do mapa. O teste confirmou esse comportamento |

O teste usa a geometria angular de EPSG4326 como objeto de comparação, **não identifica os dados como WGS84 e não valida o datum anunciado**. Os pontos são sintéticos; não são marcos geográficos independentes. A coincidência dos cálculos não comprova a transformação efetiva do servidor.

O TileLayer padrão não interpreta GetCapabilities nem reprojeta o conteúdo dos PNGs: é necessário configurar explicitamente o CRS/transformação e o mapeamento de nível/linha/coluna. Para a grade examinada, `tileSize=256`, origem no norte, `tms=false` e limites por camada são os candidatos indicados pelos metadados e pela inspeção do código. Confirmar comportamento de bounds, noWrap, níveis nativos e transições de zoom no navegador antes da integração.

Permanecem pendentes: esclarecer a inconsistência de CRS identificada abaixo, comparar marcos independentes, testar costuras entre tiles, alinhamento entre camadas, zoom/arraste, redimensionamento, carregamento real pelo navegador e falhas de rede. Distâncias exigem um método explícito e validado; mudar apenas o raio do CRS não corrige chamadas a `LatLng.distanceTo()` em outros componentes ou plugins.

Fonte de API: [Leaflet 1.9.4](https://leafletjs.com/reference-1.9.4.html#crs). Nenhuma dependência foi adicionada e nenhum mapa da aplicação foi substituído.

### Verificação da projeção cartográfica — 14/11/2026

**Produtos de origem:** a USGS identifica os mosaicos CTX e HiRISE controlados selecionados como equiretangulares. O WKT do CTX controlado no catálogo NASA confirma `Equirectangular`, esfera de raio 3.396.190 m, meridiano central 0°, paralelo padrão 0°, latitude de origem 0° e falsos leste/norte de 0 m; as coordenadas projetadas do raster são métricas. Nessa parametrização esférica, a projeção é do tipo Plate Carrée.

**Forma publicada no serviço:** os três GetCapabilities consultados descrevem uma grade angular com origem (-180°, 90°), tiles 256 × 256 e matriz inicial 2 × 1. O catálogo da camada HiRISE com sufixo `_dd` fornece WKT geográfico em graus, enquanto o CTX controlado fornece WKT projetado em metros. Essa diferença exige tratar separadamente o raster de origem e sua representação no serviço. A geometria da matriz é consistente com exibição equirretangular, mas o GetCapabilities, isoladamente, não comprova a transformação usada na geração da pirâmide ou o alinhamento entre as camadas.

**Outro produto na mesma página USGS:** o texto sobre uma projeção ortográfica refere-se explicitamente ao mosaico derivado JPL Surface Operations, centrado em longitude 77.4298° e latitude 18.4663°. Ele não deve ser usado como definição da projeção do mosaico equiretangular principal ou das três camadas WMTS investigadas. Uma imagem ortorretificada também pode ter projeção equiretangular; o processo de ortorretificação não identifica a projeção cartográfica.

**Resultado deste critério:** projeção de origem equiretangular confirmada para os dois produtos controlados; parametrização completa confirmada no WKT do CTX controlado. A forma angular do serviço foi identificada. A transformação efetiva do WMTS e sua reprodução correta no Leaflet continuam pendentes de validação por pontos de controle. Não usar o valor de ScaleDenominator como resolução métrica marciana sem verificar suas convenções.

Referências: [USGS CTX](https://astrogeology.usgs.gov/search/map/mars_2020_terrain_relative_navigation_context_camera_orthorectified_image_mosaic), [USGS HiRISE e produto derivado JPL](https://astrogeology.usgs.gov/search/map/mars_2020_terrain_relative_navigation_hirise_orthorectified_image_mosaic) e [catálogo NASA](https://trek.nasa.gov/tiles/apidoc/trekAPI.html?body=mars). Os campos WKT foram lidos dos registros públicos do catálogo. Não foi baixado o GeoTIFF completo.

### Verificação do sistema de coordenadas — 14/11/2026

Foram comparados os três GetCapabilities, os registros de projeção do catálogo público Mars Trek e as descrições dos produtos de origem na USGS. É necessário separar o CRS do raster original, o CRS anunciado pelo serviço e a grade dos tiles.

| Evidência | Resultado |
| --- | --- |
| SupportedCRS dos três WMTS | `urn:ogc:def:crs:EPSG::104905` |
| BoundingBox e TopLeftCorner publicados | Pares com valores de longitude/latitude em graus; origem (-180, 90), consistente com X=longitude e Y=latitude |
| CTX preliminar no catálogo | Repete o URN; não fornece definição WKT completa no campo de projeção consultado |
| CTX controlado no catálogo | Equiretangular sobre esfera de raio 3.396.190 m, achatamento zero; meridiano central, paralelo padrão, latitude de origem e falsos deslocamentos iguais a zero; unidades projetadas em metros |
| HiRISE controlado no catálogo | CRS geográfico em graus sobre esfera de raio 3.396.190 m, achatamento zero; datum nomeado como desconhecido no WKT |
| Produtos controlados de origem na USGS | Equiretangular; latitude planetocêntrica, longitude positiva para leste, domínio -180 a 180; raios A=C=3.396.190 m |

**Inconsistência de identificação:** o código 104905 é documentado como **ESRI:104905 / GCS_Mars_2000**, com elipsoide de semieixo maior 3.396.190 m e inverso do achatamento 169,8944472236118. Isso não é o mesmo que a esfera de achatamento zero descrita nos produtos controlados. O WMTS usa o namespace EPSG para esse número; a configuração pública do catálogo também contém um URN IAU2000 com o mesmo número. Não há base para tratar esses namespaces como equivalentes ou resolver automaticamente a definição anunciada.

Os documentos confirmam as convenções dos produtos de origem; não demonstram, sozinhos, qual transformação o servidor aplicou ao gerar cada pirâmide WMTS. O campo WGS84BoundingBox presente nos XMLs também não torna os dados terrestres ou WGS84. A ordem e os valores dos pares publicados devem ser tratados como evidência do contrato do serviço, sem deduzir a ordem dos eixos apenas do código numérico.

**Consequência:** usar um CRS explícito e validado para Marte, em vez de registrar cegamente `EPSG:104905` ou substituir por WGS84/Web Mercator. Antes de sobrepor pontos e trajetórias, confirmar latitude planetocêntrica/planetográfica, sentido e domínio de longitude, ordem dos eixos e transformação efetiva do serviço por pontos de controle. A compatibilidade com Leaflet continua pendente. Nenhum datum vertical foi validado.

Fontes específicas:

- [Catálogo Mars Trek](https://trek.nasa.gov/tiles/apidoc/trekAPI.html?body=mars), registros de projeção consultados pelo serviço público indicado na configuração da própria página.
- [USGS: CTX ortorretificado Mars 2020](https://astrogeology.usgs.gov/search/map/mars_2020_terrain_relative_navigation_context_camera_orthorectified_image_mosaic).
- [USGS: HiRISE ortorretificado Mars 2020](https://astrogeology.usgs.gov/search/map/mars_2020_terrain_relative_navigation_hirise_orthorectified_image_mosaic).
- [USGS: WKT e autoridade ESRI de 104905, páginas 3–4](https://pubs.usgs.gov/of/2012/1259/SP_Dunes_Metadata/Dune-Field_Centroid/SP_Dune_Field_Centroid.pdf). Usado apenas para identificar o código, não como metadado das imagens de Jezero.
- [USGS/IAU: sistemas de coordenadas de Marte](https://planetarynames.wr.usgs.gov/Page/MARS/system).

O mapa atual utiliza `CRS.Simple` em unidades de imagem. Ele não pode receber esses tiles mantendo a mesma configuração ou os mesmos marcadores.

A implementação instalada do Leaflet 1.9.4 possui, em `CRS.EPSG4326`, a projeção angular `LonLat` e transformação `(1/180, 1, -1/180, 0.5)`. Sua grade tem duas colunas no nível zero e origem superior esquerda (-180, 90), características também presentes nos metadados. Essa semelhança sugere uma abordagem a investigar, mas não comprova uma integração correta. Ainda é necessário validar projeção, datum, eixos, transformação, escala, índices e renderização com pontos de controle. Não está comprovado que basta adaptar esse CRS ou que novas dependências serão dispensáveis.

Isso **não torna os dados WGS84**: trata-se de longitude/latitude marciana. Não herdar cálculos de distância da Terra nem usar `EPSG3857`. Distância, área, escala métrica e elevação devem continuar desativadas até validação específica. `ScaleDenominator` e nomes de produtos não devem ser convertidos automaticamente em precisão do terreno ou segurança de deslocamento.

Para a integração:

1. Validar o CRS e a matriz planetários antes de escolher um adaptador ou biblioteca. As URLs testadas utilizam tiles de 256 pixels na ordem nível/linha/coluna; isso não valida automaticamente a indexação gerada pelo Leaflet.
2. Usar CTX preliminar para contexto regional e HiRISE controlado como detalhe restrito à sua cobertura. Não presumir cobertura de toda a cratera pelo mosaico HiRISE.
3. Configurar `bounds`, `noWrap`, limites de zoom por camada e tratamento de `tileerror`.
4. Manter créditos visíveis e identificar CTX como preliminar.
5. Ocultar as anotações editoriais atuais ao ativar o modo geográfico. Adicionar apenas posições científicas com fonte, convenção de coordenadas e data verificadas.
6. Preservar o modo local demonstrativo como alternativa explícita em falha de rede, sem sobrepor dados em sistemas incompatíveis.
7. Validar alinhamento, limites e controles no navegador antes de declarar a integração concluída.

## Outras opções e limites

O mosaico CTX controlado também foi testado: após uma falha transitória de DNS, nova consulta retornou GetCapabilities HTTP 200, 14 matrizes (0–13) e um tile PNG HTTP 200 em `12/1628/5858`, com `Access-Control-Allow-Origin: *`. É uma opção adicional para detalhe local, com cobertura diferente da HiRISE e do CTX preliminar. O episódio de DNS reforça a necessidade de tratar falhas de rede sem apresentar uma tela vazia.

A página oficial do Perseverance incorpora `https://mars.nasa.gov/map/` e descreve bases HiRISE/MRO e HRSC/Mars Express, trajetória e paradas por sol. É uma referência de missão e uma possível origem de dados adicionais; nesta investigação não foi validado um contrato público estável de API para seus dados. Não copiar endpoints internos presumindo suporte ou permanência.

Não foi concluído um teste de renderização no navegador nesta investigação. HTTP, XML, cabeçalhos CORS e arquivos PNG confirmam acesso técnico, mas não constituem garantia de disponibilidade contínua, cobertura completa ou alinhamento final da aplicação.

## Referências

- [Catálogo e documentação oficial Mars Trek](https://trek.nasa.gov/tiles/apidoc/trekAPI.html?body=mars).
- [GetCapabilities CTX preliminar](https://trek.nasa.gov/tiles/Mars/EQ/Jezero_CTX_BlockAdj_dd/1.0.0/WMTSCapabilities.xml).
- [GetCapabilities HiRISE controlado](https://trek.nasa.gov/tiles/Mars/EQ/JEZ_hirise_soc_006_orthoMosaic_25cm_Eqc_latTs0_lon0_first_dd/1.0.0/WMTSCapabilities.xml).
- [Mapa oficial de localização do Perseverance](https://science.nasa.gov/mission/mars-2020-perseverance/location-map/).
- [Documentação Leaflet 1.9.4](https://leafletjs.com/reference-1.9.4.html#crs).
