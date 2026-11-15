# Atribuição das fontes cartográficas

Verificação em 14/11/2026. Distinguir aquisição das imagens, processamento dos mosaicos e distribuição dos tiles. Creditar apenas o servidor Mars Trek não identifica todos os produtores científicos.

Atualização da fase 2: os dois produtos controlados usam créditos por camada no controle do mapa e no rodapé contextual, com link para os respectivos DOIs. PIA19303 é o fallback local. O CTX preliminar não foi habilitado; sua pendência de atribuição permanece documentada.

## Imagem atualmente exibida

Produto: **PIA19303 — A Possible Landing Site for the 2020 Mission: Jezero Crater**. Missão MRO, instrumento HiRISE, publicado em 04/03/2015.

Crédito confirmado na página oficial: **NASA/JPL-Caltech/University of Arizona**.

[Fonte e crédito oficial](https://science.nasa.gov/photojournal/a-possible-landing-site-for-the-2020-mission-jezero-crater/).

O texto já aparece no Mars Maps, junto ao identificador e ao link da fonte. O bitmap local não deve receber crédito de um mosaico diferente apenas por representar a mesma região. Marcadores e linhas demonstrativos são do protótipo, não dados oficiais da NASA.

## Mosaicos controlados candidatos a integração

O catálogo NASA identifica os dois produtos abaixo como mosaicos gerados pela USGS Astrogeology Science Center. As citações bibliográficas oficiais foram encontradas no catálogo de dados USGS; os campos de autoria dos FGDC HTML servidos pelo Trek estavam vazios na consulta.

Autores dos dois produtos: **Robin L. Fergason, Donna M. Galuszka, Trent M. Hare, David P. Mayer e Bonnie L. Redding**. Ano: **2020**.

| Camada WMTS | Produto de origem e referência |
| --- | --- |
| `JEZ_ctx_B_soc_008_orthoMosaic_6m_Eqc_latTs0_lon0` | Mosaico ortorretificado CTX para navegação relativa ao terreno da Mars 2020; USGS; [DOI 10.5066/P9GV1ND3](https://doi.org/10.5066/P9GV1ND3) |
| `JEZ_hirise_soc_006_orthoMosaic_25cm_Eqc_latTs0_lon0_first_dd` | Mosaico ortorretificado HiRISE para navegação relativa ao terreno da Mars 2020; USGS; [DOI 10.5066/P9QJDP48](https://doi.org/10.5066/P9QJDP48) |

Referências bibliográficas para o painel de fontes, com títulos resumidos em português:

- Fergason, R. L.; Galuszka, D. M.; Hare, T. M.; Mayer, D. P.; Redding, B. L. (2020). Mosaico ortorretificado CTX para Mars 2020 TRN. USGS Data Release. DOI: 10.5066/P9GV1ND3.
- Mesmos autores (2020). Mosaico ortorretificado HiRISE para Mars 2020 TRN. USGS Data Release. DOI: 10.5066/P9QJDP48.

Fontes das citações: [catálogo USGS CTX](https://data.usgs.gov/datacatalog/data/USGS%3Ac21f024d-9ed4-4582-a932-046dc15f97a7), [catálogo USGS HiRISE](https://data.usgs.gov/datacatalog/data/USGS%3A13c20ddb-2a2c-4bbd-bac4-3ef88cd0eabf). A referência descreve o produto científico original; a distribuição e a representação WMTS do Trek devem ser identificadas separadamente.

Sugestões de texto curto para a interface futura — sínteses de atribuição propostas pelo projeto, não transcrições de uma linha de crédito oficial:

- **CTX/MRO · Mosaico USGS, Fergason et al. (2020) · Tiles: NASA Mars Trek** — link para DOI CTX e catálogo Trek.
- **HiRISE/MRO · Mosaico USGS, Fergason et al. (2020) · Tiles: NASA Mars Trek** — link para DOI HiRISE e catálogo Trek.

Manter os detalhes do produto, autoria completa, DOI, identificador WMTS e data de consulta acessíveis no painel de fontes. Preservar eventuais linhas de crédito adicionais dos instrumentos ou produtores que forem identificadas nos metadados definitivos, sem tratar estas sugestões como substitutas de condições específicas.

## CTX preliminar: atribuição específica pendente

Camada: `Jezero_CTX_BlockAdj_dd`.

Foi confirmada no catálogo como **MRO CTX, Jezero Mosaic, Preliminary**, distribuída pelo Mars Trek. O registro consultado não fornece autoria do processamento ou linha de crédito completa. O endpoint FGDC retornou conteúdo vazio nesta rodada, apesar de sucesso HTTP. Não foi possível confirmar uma referência bibliográfica específica para esse mosaico.

Não reutilizar automaticamente os autores ou DOI do CTX controlado: são produtos diferentes. Até esclarecer a proveniência, identificar explicitamente o serviço, missão/instrumento, nome e ID da camada, sua condição preliminar e a pendência de autoria específica. O critério de atribuição desse mosaico permanece incompleto.

## Apresentação e exportação

Recomendação de implementação:

1. Exibir crédito legível junto ao mapa, associado às camadas efetivamente ativas, com link para as respectivas fontes.
2. Disponibilizar a referência completa em um painel de fontes; não deixar a atribuição apenas no README.
3. Ao adicionar TileLayer, usar seu campo `attribution` e habilitar o controle correspondente, ou um componente equivalente sempre visível e acessível.
4. Em capturas/exportações futuras, incluir as fontes das camadas exibidas e identificar recortes, ajustes de cor e anotações do projeto. Não alegar que esses elementos são dados da missão.
5. Manter a indicação de projeto independente, sem endosso da NASA. Créditos científicos não autorizam uso de logotipos como marca do produto.

Estas recomendações não alteram os mapas ou a interface nesta etapa. Acesso público e CORS não substituem a verificação das condições de uso por produto. Referência geral: [NASA — imagens e mídia](https://www.nasa.gov/nasa-brand-center/images-and-media/).
