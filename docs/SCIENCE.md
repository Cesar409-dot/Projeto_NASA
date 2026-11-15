# Fontes, proveniência e limites

Consulta inicial: 14/11/2026. Textos são sínteses educativas, não citações literais.

**Estado atual:** o mapa oferece MOLA — Relevo global e Imagem oficial de Jezero. Coordenadas USGS/IAU para três centros e a estimativa geométrica com raio de Marte foram preservadas. Veja a [configuração cartográfica atual](MAP_DISPLAY.md); a [fase 2](PHASE_2.md) e as referências abaixo registram também integrações anteriores.

O planejador oferece agora uma [rota experimental por A* com DEM numérico CTX/USGS](TERRAIN_ROUTING.md), limitada a um recorte de Jezero. A documentação separa alturas reais, agregação de 100 m, inclinações derivadas e custos experimentais; não usa cores do MOLA como elevações.

## Mars Maps

Consulte também os [créditos e referências por produto cartográfico](MAP_ATTRIBUTION.md), incluindo as pendências do mosaico CTX preliminar.

- [PIA19303 — Jezero Crater](https://science.nasa.gov/photojournal/a-possible-landing-site-for-the-2020-mission-jezero-crater/), 04/03/2015. MRO; crédito NASA/JPL-Caltech/University of Arizona. Arquivo `public/images/jezero.jpg`, 2880 × 1800, obtido do domínio oficial `assets.science.nasa.gov`. A imagem contém realces de cor; cor não é elevação.
- [Compositionally and density stratified igneous terrain in Jezero crater, Mars](https://doi.org/10.1126/sciadv.abo3399), Science Advances (2022): aproximadamente 18,4° N, 77,5° E. Referência regional, não posição dos marcadores.
- [Perseverance Explores the Jezero Crater Delta](https://science.nasa.gov/resource/perseverance-explores-the-jezero-crater-delta/): interesse científico do delta, sem afirmar descoberta de vida.
- [Mars 2020 / Perseverance](https://science.nasa.gov/mission/mars-2020-perseverance/).

Na fase 1, as posições eram editoriais. Agora, `science-points.ts` contém coordenadas catalogadas e posições editoriais separadas para o fallback. As fontes, convenções e distâncias geométricas estão detalhadas em `PHASE_2.md`. Não há posição atual de rover, elevação ou rota de caminhada validada.

## Mars Trek / integração futura

Consulte a [investigação dos serviços](MAPS_FEASIBILITY.md) e a [integração histórica da fase 2](PHASE_2.md). Atualmente, somente MOLA é habilitado após verificação no cliente; a imagem local de Jezero funciona também como fallback.

[Mars Trek](https://trek.nasa.gov/mars/) e [documentação oficial WMTS](https://trek.nasa.gov/tiles/apidoc/trekAPI.html?body=mars).

Serviços OGC RESTful WMTS incluem MGS/MOLA, MOC e combinações MOLA/HRSC. Produtos equirretangulares declaram `urn:ogc:def:crs:EPSG::104905`. Os caminhos usam Style, TileMatrixSet, TileMatrix, TileRow e TileCol. A extensão PNG/JPG vem de ResourceURL no GetCapabilities. Ausência de tile pode indicar ausência de cobertura.

Antes de integrar: selecionar cobertura e resolução; ler GetCapabilities e metadados; confirmar origem, dimensões e escalas da matriz e convenção de longitude; configurar projeção planetária; validar alinhamento por pontos de controle. Não aplicar Web Mercator terrestre silenciosamente. Exibir créditos, resolução e falhas de carregamento.

A imagem local funciona sem servidor de tiles. MOLA vem da missão Mars Global Surveyor e apresenta relevo sombreado colorido qualitativo. Não oferece leitura de altitude, declividade ou navegação operacional validada.

## Mind Space

Os cenários da fase 2 usam [NASA: experiências de isolamento](https://www.nasa.gov/humans-in-space/isolation-what-can-we-learn-from-the-experiences-of-nasa-astronauts/) e [NASA: fatores comportamentais e distância da Terra](https://www.nasa.gov/reference/risk-of-behavioral-changes-and-psychiatric-disorders/). Mensagens e atividades são adaptações educativas do projeto, não protocolos oficiais.

- [NASA — The Human Body in Space](https://www.nasa.gov/humans-in-space/the-human-body-in-space/): isolamento e atividades da tripulação.
- [NASA — Space gardening and isolation](https://www.nasa.gov/humans-in-space/can-space-gardening-help-astronauts-cope-with-isolation/): interação com plantas e isolamento.

O cronômetro e os cenários são recursos demonstrativos. O diário guarda as entradas no armazenamento local do navegador, sem backend; não há protocolo clínico, pontuação diagnóstica ou envio de respostas a um servidor.

## Mars Greenhouse

As culturas ativas são alface, batata e rabanete. Referências adicionais: [experimento primário de tubérculos em voo espacial](https://pubmed.ncbi.nlm.nih.gov/11540455/) e [NASA Plant Habitat-02](https://science.nasa.gov/biological-physical/investigations/plant-habitat-02-wvqpm/). Necessidades são descritas qualitativamente. O conjunto anterior com mizuna e tomate pertence à fase 1 e não é o conteúdo atual da comparação.

- [NASA — Growing Plants in Space](https://www.nasa.gov/exploration-research-and-technology/growing-plants-in-space/): Veggie e culturas na ISS.
- [NASA — Veg-05](https://science.nasa.gov/biological-physical/investigations/veg-05-rjtim/): tomates-anões, luz, fertilizantes, segurança alimentar e experiência da tripulação.
- [NASA — Space Crops](https://science.nasa.gov/biological-physical/space-crops/): desafios da produção espacial.

Sem extrapolação de rendimentos, necessidades ou tempos de cultivo da ISS para Marte. Os percentuais ilustrativos da fase 1 foram removidos na comparação da fase 2; não há previsão agronômica ou avaliação de saúde da planta. Cultivo humano não é evidência de vida marciana nativa.

## Mind Space / Astronaut Journal

O diário armazena respostas autorrelatadas no armazenamento local do navegador e limita o envio a uma vez por dia do calendário local. Esse controle é aplicado no dispositivo e não equivale a uma trava de servidor. As escalas de 1 a 5 e os gráficos são recursos de reflexão deste protótipo; não são instrumentos validados pela NASA, avaliações clínicas ou classificações de risco. O cronômetro acompanha a duração de uma meditação livre e não orienta uma técnica específica.

- [NASA — Risk of Behavioral Changes and Psychiatric Disorders](https://www.nasa.gov/reference/risk-of-behavioral-changes-and-psychiatric-disorders/): descreve isolamento e confinamento prolongados como desafios que podem afetar sono, moral e tomada de decisão; a página também menciona o diário como uma opção de autocuidado explorada pela NASA.
- [NASA — The Human Body in Space](https://www.nasa.gov/humans-in-space/the-human-body-in-space/): aborda a importância do sono, possíveis alterações do ritmo circadiano em ambientes pequenos e ruidosos, dias de Marte e fadiga associada a carga de trabalho e mudanças de horário.
- [NASA — Isolation: What Can We Learn From the Experiences of NASA Astronauts?](https://www.nasa.gov/humans-in-space/isolation-what-can-we-learn-from-the-experiences-of-nasa-astronauts/): descreve exercício, alimentação, rotina de sono e trabalho, lazer, contato social e escrita reflexiva entre os temas de bem-estar em isolamento.

Os textos educativos e sugestões do módulo são sínteses próprias dessas fontes. Não representam recomendações clínicas nem protocolos oficiais de missão.
