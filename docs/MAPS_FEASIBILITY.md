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
