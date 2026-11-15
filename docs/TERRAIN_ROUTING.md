# Planejamento experimental pelo terreno de Jezero

## Fonte real e reprodução

Fonte: Fred Calef (2021), [Mars 2020 Science Investigation CTX DEM Mosaic, USGS Astrogeology](https://astrogeology.usgs.gov/search/map/mars_2020_science_investigation_ctx_dem_mosaic). O produto é um DEM numérico estéreo CTX/MRO, não a imagem sombreada MOLA. O USGS informa domínio público e solicita citação dos autores. A página descreve a localização vertical dos mosaicos em relação ao MOLA; não foi feita uma validação independente do controle de campo.

- [GeoTIFF oficial](https://planetarymaps.usgs.gov/mosaic/mars2020_trn/CTX/ScienceInvestigationMaps_JPL/M20_JezeroCrater_CTXDEM_20m.tif), 4456 × 5067, Float32, uma banda; espaçamento projetado de 20 m.
- [Rótulo PDS4 oficial](https://planetarymaps.usgs.gov/mosaic/mars2020_trn/CTX/ScienceInvestigationMaps_JPL/M20_JezeroCrater_CTXDEM_20m.xml), preservado em `docs/evidence/jezero-ctx-dem-label.xml`.
- GeoTIFF e PDS4 confirmam esfera de raio 3.396.190 m, equirretangular, paralelo de referência 18,4663°, meridiano central 0°, offsets zero; coordenadas planetocêntricas e longitude positiva para leste. São os valores dos arquivos verificados, mesmo onde o catálogo resumido diverge.
- Elevações em metros. Somente diferenças verticais são utilizadas; o app não oferece cotas absolutas validadas. NoData original: −3,4028234663852886e+38.

Não há nova base cartográfica. MOLA e Imagem oficial permanecem como antes. Os dados numéricos de elevação constituem uma camada de cálculo independente.

Para reproduzir, obtenha o arquivo oficial e execute:

```powershell
npm.cmd ci
node scripts/prepare-jezero-dem.mjs C:/caminho/M20_JezeroCrater_CTXDEM_20m.tif
```

O leitor GeoTIFF é apenas uma dependência de desenvolvimento. O script exige SHA-256 `ba7f706ea1b5d63a562f28a7dcf7a7f3c79bce7f048e6974b57e8a33c30d1ba2` e confere os parâmetros geográficos. Mudanças na fonte exigem revisão científica e novo identificador do modelo.

O recorte entregue em `public/terrain/` cobre 18,2998825–18,6507911° N e 77,0988197–77,8013835° E. São 395 × 208 células, 100 m projetados por célula, 657.280 bytes de dados binários: elevação média Float32 little-endian seguida da maior inclinação nativa estimada por célula. O JSON registra parâmetros, janela original, hashes, autoria e transformação. O Worker verifica SHA-256 antes de calcular.

## Dados reais versus grandezas derivadas

As alturas originais são dados do DEM. Para cada bloco 5 × 5, o preparo calcula a elevação média e a maior inclinação encontrada por diferenças centrais e diferenças unilaterais entre pixels nativos de 20 m. A distância leste/oeste corrige cos(latitude)/cos(paralelo de referência); a distância norte/sul é 20 m. Se qualquer altura ou vizinho necessário for desconhecido, a célula agregada fica desconhecida. Não há preenchimento de lacunas. O recorte atual tem 82.160 células válidas.

Os 100 m são espaçamento da grade de busca, não precisão de campo. A agregação reduz detalhes de relevo; a maior inclinação nativa estimada é conservada para não tratar uma média suave como evidência de ausência de encostas. Ruído do DEM pode também bloquear células. Inclinação máxima e desníveis são estimativas derivadas, não medições de segurança ou inventários de obstáculos.

## Algoritmo e custo

A* percorre uma grade de oito vizinhos com heap binário. Em cada aresta:

1. `d_h` é a distância de grande círculo entre os centros na esfera marciana, em metros; não se equiparam graus a metros.
2. `dz` é a diferença entre elevações médias, em metros, e `d_3D = hypot(d_h, dz)` é uma aproximação local da distância com relevo.
3. `theta` é o maior valor entre a inclinação da aresta `atan2(abs(dz), d_h)` e as inclinações nativas estimadas das duas células.
4. `custo = d_3D × (1 + 15 × tan(theta)²)`. Subidas e descidas são penalizadas igualmente. O custo é uma ponderação experimental de distância; não representa energia ou tempo de caminhada. O fator não é um modelo fisiológico.

O limite configurável na interface é 10°, 15°, 20° (padrão), 25° ou 30°. São parâmetros experimentais, não limites certificados de mobilidade. Células/arestas acima do limite e células desconhecidas são bloqueadas. Diagonais não podem cortar cantos bloqueados nem encostas que impeçam os acessos laterais.

A heurística é a distância esférica horizontal até o destino da grade. É admissível e consistente: cada custo de aresta é pelo menos sua distância horizontal, e distâncias de grande círculo satisfazem a desigualdade triangular. O resultado minimiza o custo **neste grafo finito**, sob os parâmetros escolhidos; não prova um ótimo contínuo fora da grade ou do recorte.

Os pontos exatos são conectados ao centro da célula que os contém, aplicando a elevação média e a inclinação da própria célula. Esses acessos ficam dentro da célula, são incluídos no custo/distância e têm seu comprimento mostrado. Não há resolução subcélula para validar esses trechos. Se ambos os pontos caem na mesma célula, a conexão usa a mesma aproximação sem desvio pelo centro.

## Interface, métricas e persistência

O seletor alterna rota direta (arco laranja tracejado) e rota pelo terreno (verde contínuo). O cálculo pelo terreno não é desenhado na imagem editorial sem georreferenciamento. Falta de cobertura, NoData, limite excedido, ausência de caminho, erro de carregamento ou falha do Worker produzem uma mensagem, sem substituição silenciosa pela rota direta.

A comparação apresenta distância direta, distância do percurso com relevo, diferença percentual e soma das subidas/descidas entre médias da grade, incluindo acessos. A inclinação máxima considera também o maior gradiente nativo estimado nas células percorridas. Não são oferecidos duração, consumo, trânsito garantido ou altitude absoluta validada.

Missões guardam uma cópia dos pontos, da polilinha, métricas, identificador do modelo, versão do algoritmo e parâmetros. Rotas antigas sem esses campos continuam diretas e compatíveis com o armazenamento versão 1. Uma missão de terreno salva usa sua cópia; alterar o limite solicita novo cálculo. A modalidade direta salva somente a rota direta. Enquanto não há cálculo válido, uma nova missão de terreno não pode ser salva como se estivesse pronta.

O processamento e o download local do DEM são acionados apenas na modalidade de terreno, com extremos válidos. O Web Worker mantém a interface livre; a troca de pontos/parâmetros termina o Worker anterior e descarta respostas obsoletas. Um cache em memória de até 16 resultados evita recalcular as mesmas entradas; o processamento tem limite de 20 segundos. O Worker requer suporte do navegador e contexto seguro para verificar integridade (HTTPS ou localhost); falhas são informadas.

O binário local permite calcular sem consultar USGS/NASA durante a demonstração. Isso não transforma o aplicativo em PWA offline: os recursos do aplicativo precisam estar carregados/servidos, e a base MOLA continua dependendo do serviço de tiles.

## Limitações científicas

O modelo não contém rochas, textura do solo, dunas pequenas, obstáculos subpixel, tração, estabilidade, clima ou estado de astronautas/rovers. A elevação média de 100 m suaviza desníveis; as inclinações de 20 m também não representam escalas humanas. O alinhamento absoluto entre rede MDIM 2.1 dos centros catalogados, DEM CTX e a base MOLA não foi validado para navegação. Não se calcula terreno fora do recorte e o melhor trajeto global pode passar fora dele.

**A rota pelo terreno considera inclinações estimadas a partir de dados de elevação. Ela não garante um trajeto seguro ou transitável.**

## Validação

Testes sintéticos exclusivos dos testes verificam A*, referência Dijkstra, mínimos de custo, penalização de inclinação, subida/descida, NoData, cobertura, ausência de caminho, cantos bloqueados e unidades marcianas. Esses dados sintéticos não são publicados em `public/` nem usados na interface.

Os testes com o binário real verificam SHA-256, dimensões e o cálculo Belva–Neretva; testes de integração verificam Worker/cancelamento, alternância, falhas sem fallback, cache, marcadores e persistência de missões de terreno. O build deve ser validado com `npm.cmd run build -- --webpack`.
