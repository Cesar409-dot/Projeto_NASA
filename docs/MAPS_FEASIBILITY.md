# Mapas reais de Jezero — verificação de viabilidade

Verificação em 14/11/2026. Resultado: **viável com Mars Trek WMTS e a stack atual**, com adaptação do sistema de coordenadas. Este estudo não altera a aplicação.

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

## Compatibilidade com o projeto

O mapa atual utiliza `CRS.Simple` em unidades de imagem. Ele não pode receber esses tiles mantendo a mesma configuração ou os mesmos marcadores.

A implementação instalada do Leaflet 1.9.4 possui, em `CRS.EPSG4326`, a projeção angular `LonLat` e transformação `(1/180, 1, -1/180, 0.5)`. Sua grade tem duas colunas no nível zero e origem superior esquerda (-180, 90), compatíveis com os metadados testados. Isso permite construir um CRS próprio para Marte reutilizando essa geometria de exibição, sem nova biblioteca de projeção para estas duas camadas.

Isso **não torna os dados WGS84**: trata-se de longitude/latitude marciana. Não herdar cálculos de distância da Terra nem usar `EPSG3857`. Distância, área, escala métrica e elevação devem continuar desativadas até validação específica. `ScaleDenominator` e nomes de produtos não devem ser convertidos automaticamente em precisão do terreno ou segurança de deslocamento.

Para a integração:

1. Criar um CRS identificado como marciano com a grade angular validada; manter tiles em 256 pixels e ordem `{z}/{y}/{x}`.
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
