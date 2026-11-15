# Mars Greenhouse: fontes, parâmetros e limites

Esta página registra a proveniência científica do inventário e da simulação. O conteúdo da interface é educativo, não é recomendação agronômica nem modelo de crescimento de culturas em Marte.

## Proveniência do material da equipe

O usuário forneceu nesta sessão o texto do **Dossiê Técnico e Engenharia de Missão Marte — Frente 2: Astrobiologia, Produção Agrícola e Engenharia de Suporte à Vida**, da equipe Unus Mundus. O PDF original não foi anexado ao repositório; não foi criado um PDF substituto. As categorias, espécies, cultivares mencionadas, ciclos e alvos de engenharia transcritos no catálogo apontam para as páginas 6–8 e seções 3–5.2 do texto recebido.

O dossiê descreve Arcadia Planitia como cenário de uma proposta de missão. A estufa deste módulo permanece um conceito de suporte à vida para uma missão futura e não recebe uma localização operacional. O mapa principal continua independente, com Jezero.

## Como interpretar os números da interface

- **Água — 25–35%:** transcrito do dossiê como retenção hídrica do substrato remediado em geral. Não é volume de irrigação, teor ideal medido para cada espécie ou valor apropriado para hidroponia, aeroponia, canteiro saturado de arroz ou biorreator. O controle usa isso apenas como referência visual para culturas de substrato. A escala da biofábrica é um índice didático sem unidade física.
- **Luz — 200–300 μmol m⁻² s⁻¹ PAR:** alvo de arquitetura LED indicado no dossiê para a Camada 1, não ótimo experimental para todas as culturas. O valor mais amplo associado ao trigo é citado como possibilidade de teste no próprio dossiê. Para o biorreator, a escala é um índice didático, não PPFD.
- **Temperatura:** os pares 20/16 °C e 26/22 °C do dossiê são zonas de engenharia propostas para grupos de culturas. A interface os exibe como envelope de referência simplificado; não afirma que sejam limites fisiológicos comprovados. Onde não há alvo por cultura, o intervalo entre zonas do módulo é uma aproximação educativa.
- **Outros valores agronômicos:** ciclos e associações de culturas foram transcritos das categorias do dossiê, com a ressalva indicada na própria ficha. Não se converteu produtividade seca, índice de colheita ou balanço metabólico em previsão do produto.
- **Qualidade da referência:** cada controle identifica “alvo de engenharia”, “faixa do dossiê” ou “aproximação educativa”. A faixa normalizada para a avaliação visual é um recurso de interface, não uma tolerância agronômica validada.

## Simulação visual

A mensagem “Simulação ambiental ilustrativa. Não representa um modelo biológico validado” aplica-se a toda a interação. A avaliação compara cada controle aos limites mostrados para a categoria e escolhe o fator fora da faixa mais distante segundo limiares heurísticos simples. As diferenças e as pontuações são parâmetros de interface, não curvas dose–resposta.

Baixa água inclina folhagem, reduz saturação e clareia o substrato; excesso de água altera a zona radicular; pouca luz alonga e reduz a iluminação da copa; luz alta clareia folhas; frio e calor aplicam respostas visuais distintas. Esses sinais são representações genéricas de estresse, não diagnóstico específico de uma espécie. O modelo procedural distingue estruturas gerais (por exemplo, panículas, tubérculos, raízes, vagens, folhas em roseta, frutos e biorreator), sem alegar anatomia em escala.

O estresse ambiental atual muda imediatamente. Dano acumulado, em uma escala visual de 0 a 100, só avança quando a pessoa aciona “Avançar etapa de exposição”. Cada ação soma uma parcela determinada pela pontuação heurística do ambiente; não representa horas ou dias. “Avançar recuperação” reduz essa escala apenas quando os fatores retornam às referências. Assim, controles extremos não causam morte instantânea. “Colapso visual” é um estado gráfico e não uma previsão de mortalidade.

## Experimentos e hipóteses: distinções importantes

- **Veggie:** sistema de cultivo estudado na Estação Espacial Internacional (ISS). Resultados orbitais são experimentos em ambiente controlado, não cultivo na superfície de Marte.
- **Advanced Plant Habitat (APH):** câmara automatizada da ISS. Plant Habitat-02 avaliou rabanetes; Plant Habitat-04 cultivou pimentas Hatch, cultivar diferente da Española Improved listada no dossiê. Isso não valida outras espécies agrupadas no catálogo.
- **XROOTS:** demonstração na ISS de abordagens hidropônicas e aeropônicas. Não é um protocolo completo para as 18 categorias nem prova de uso em Marte.
- **Veg-05:** investigação com tomate-anão em Veggie. A ficha não interpreta a existência do experimento como evidência de um resultado que a fonte não explicite.
- **Wamelink et al. (2014):** experimento terrestre de 50 dias com simulantes preparados de solo marciano e lunar. Os resultados de uma espécie/cultivar e condição do ensaio não se estendem automaticamente a toda a categoria; simulantes não são solo coletado em Marte.
- **Pulschen et al. (2015):** estudo laboratorial de leveduras terrestres isoladas em ambiente vulcânico do Atacama e sua resposta a UV. Isso não valida o consórcio proposto com *Limnospira indica*, segurança alimentar, rendimento ou operação de biofábrica em Marte.
- **NASA BVAD:** documento para valores de referência e modelagem de sistemas de suporte à vida. Não é confirmação experimental de que todas as culturas deste inventário cresceriam em Marte.

## Contexto da estufa

Plantas não são apresentadas como capazes de crescer na superfície desprotegida de Marte. O módulo futuro pressupõe habitat pressurizado e protegido de radiação, controle de temperatura e atmosfera, água tratada, luz artificial e fornecimento de nutrientes. Hidroponia e aeroponia são opções de cultivo sem solo; substratos e regolito precisam de tratamento, medição de contaminantes e validação antes de qualquer uso.

O regolito marciano não tratado não é mostrado como solo diretamente adequado. O dossiê descreve lavagem de percloratos, correção de pH, avaliação de metais e inoculação como proposta de engenharia; essa sequência não é um processo operacional validado.

## Referências

- Dossiê Técnico e Engenharia de Missão Marte — Frente 2, equipe Unus Mundus (texto fornecido pelo usuário nesta sessão), seções 3–5.2, páginas 6–8 para o catálogo.
- NASA, [Growing Plants in Space / Veggie](https://www.nasa.gov/exploration-research-and-technology/growing-plants-in-space/).
- NASA, [Advanced Plant Habitat](https://science.nasa.gov/mission/advanced-plant-habitat/).
- NASA, [Plant Habitat-02](https://science.nasa.gov/biological-physical/investigations/plant-habitat-02-wvqpm/).
- NASA, [XROOTS](https://science.nasa.gov/biological-physical/investigations/xroots/).
- NASA, [Veg-05](https://science.nasa.gov/biological-physical/investigations/veg-05-rjtim/).
- NASA, [Space Crops](https://science.nasa.gov/biological-physical/space-crops/).
- NASA, [Life Support Baseline Values and Assumptions Document (BVAD), Rev. 2](https://ntrs.nasa.gov/citations/20210024855).
- Wamelink, G. W. W. et al. (2014). [Can plants grow on Mars and the Moon? A growth experiment on Mars and Moon soil simulants](https://doi.org/10.1371/journal.pone.0103138). *PLOS ONE*, 9(8), e103138.
- Pulschen, A. A. et al. (2015). [UV-resistant yeasts isolated from a high-altitude volcanic area on the Atacama Desert as eukaryotic models for astrobiology](https://pubmed.ncbi.nlm.nih.gov/26147800/). *MicrobiologyOpen*, 4(4), 574–588.
- NASA, [Plant Habitat-04 pepper harvest on the ISS](https://www.nasa.gov/missions/station/nasas-second-pepper-harvest-sets-record-on-space-station/).
- USDA, [FoodData Central](https://fdc.nal.usda.gov/), fonte de referência para pesquisas de composição de alimentos terrestres.

## Atualização local do dossiê

Quando o PDF original estiver disponível, salve-o em docs/references/astrobiology-dossier.pdf e confira paginação, tabelas e referências diretamente no documento antes de usar novos dados. O texto recebido foi tratado como material da equipe e os seus alvos propostos não foram rotulados como resultados NASA.
