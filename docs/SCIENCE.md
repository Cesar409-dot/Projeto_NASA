# Fontes, proveniência e limites

Consulta inicial: 14/11/2026. Textos são sínteses educativas, não citações literais.

## Mars Maps

Consulte também os [créditos e referências por produto cartográfico](MAP_ATTRIBUTION.md), incluindo as pendências do mosaico CTX preliminar.

- [PIA19303 — Jezero Crater](https://science.nasa.gov/photojournal/a-possible-landing-site-for-the-2020-mission-jezero-crater/), 04/03/2015. MRO; crédito NASA/JPL-Caltech/University of Arizona. Arquivo `public/images/jezero.jpg`, 2880 × 1800, obtido do domínio oficial `assets.science.nasa.gov`. A imagem contém realces de cor; cor não é elevação.
- [Compositionally and density stratified igneous terrain in Jezero crater, Mars](https://doi.org/10.1126/sciadv.abo3399), Science Advances (2022): aproximadamente 18,4° N, 77,5° E. Referência regional, não posição dos marcadores.
- [Perseverance Explores the Jezero Crater Delta](https://science.nasa.gov/resource/perseverance-explores-the-jezero-crater-delta/): interesse científico do delta, sem afirmar descoberta de vida.
- [Mars 2020 / Perseverance](https://science.nasa.gov/mission/mars-2020-perseverance/).

As posições em `src/data/mission.ts` são editoriais no plano da imagem. Não são posições oficiais de amostras, rover ou coleta. Linhas conectam os pontos pela ordem de seleção. Não há escala métrica, direção norte, coordenadas de cursor, altitude ou distância calculada.

## Mars Trek / integração futura

Atualização: consulte a [verificação prática de serviços de Jezero](MAPS_FEASIBILITY.md), que registra os endpoints, metadados, tiles e compatibilidade com Leaflet efetivamente testados. A aplicação ainda utiliza a imagem local.

[Mars Trek](https://trek.nasa.gov/mars/) e [documentação oficial WMTS](https://trek.nasa.gov/tiles/apidoc/trekAPI.html?body=mars).

Serviços OGC RESTful WMTS incluem MGS/MOLA, MOC e combinações MOLA/HRSC. Produtos equirretangulares declaram `urn:ogc:def:crs:EPSG::104905`. Os caminhos usam Style, TileMatrixSet, TileMatrix, TileRow e TileCol. A extensão PNG/JPG vem de ResourceURL no GetCapabilities. Ausência de tile pode indicar ausência de cobertura.

Antes de integrar: selecionar cobertura e resolução; ler GetCapabilities e metadados; confirmar origem, dimensões e escalas da matriz e convenção de longitude; configurar projeção planetária; validar alinhamento por pontos de controle. Não aplicar Web Mercator terrestre silenciosamente. Exibir créditos, resolução e falhas de carregamento.

A imagem local funciona sem servidor de tiles. A entrega não representa integração de múltiplas missões ou topografia validada.

## Mind Space

- [NASA — The Human Body in Space](https://www.nasa.gov/humans-in-space/the-human-body-in-space/): isolamento e atividades da tripulação.
- [NASA — Space gardening and isolation](https://www.nasa.gov/humans-in-space/can-space-gardening-help-astronauts-cope-with-isolation/): interação com plantas e isolamento.

Check-in e cronômetro são recursos demonstrativos, sem protocolo clínico, pontuação, diagnóstico ou coleta de dados.

## Mars Greenhouse

- [NASA — Growing Plants in Space](https://www.nasa.gov/exploration-research-and-technology/growing-plants-in-space/): Veggie e culturas na ISS.
- [NASA — Veg-05](https://science.nasa.gov/biological-physical/investigations/veg-05-rjtim/): tomates-anões, luz, fertilizantes, segurança alimentar e experiência da tripulação.
- [NASA — Space Crops](https://science.nasa.gov/biological-physical/space-crops/): desafios da produção espacial.

Sem extrapolação de rendimentos, necessidades ou tempos de cultivo da ISS para Marte. Percentuais são estados da interface, sem unidade física ou previsão agronômica. Não indicam sobrevivência ou saúde da planta. Cultivo humano não é evidência de vida marciana nativa.
