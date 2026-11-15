# Fase 2 — implementação funcional

Esta entrega trabalha sobre a identidade visual e as quatro rotas existentes. Não há backend, autenticação, banco de dados ou serviços pagos. Node utilizado: 22.20.0; ferramentas de teste: Node test runner, Vitest 5.1 e JSDOM 26.1.

## Mars Maps

Dois produtos do NASA Mars Trek foram conectados ao cliente:

| Camada | ID | Níveis nativos |
| --- | --- | --- |
| CTX Jezero controlado | `JEZ_ctx_B_soc_008_orthoMosaic_6m_Eqc_latTs0_lon0` | 0–13 |
| HiRISE Jezero controlado | `JEZ_hirise_soc_006_orthoMosaic_25cm_Eqc_latTs0_lon0_first_dd` | 0–17 |

As fontes, limites de cobertura, legenda e créditos estão em `src/data/map-layers.ts` e na interface. Referências científicas: [CTX USGS](https://doi.org/10.5066/P9GV1ND3), [HiRISE USGS](https://doi.org/10.5066/P9QJDP48), [serviços NASA](https://trek.nasa.gov/tiles/apidoc/trekAPI.html?body=mars).

Antes de habilitar uma camada, o cliente consulta GetCapabilities e um tile de amostra. Verifica produto, formato, conjunto, níveis únicos, dimensões, origem e cobertura. Apenas camadas aprovadas pela verificação são selecionáveis. Um erro ou timeout durante o carregamento desabilita a camada e ativa a imagem local. Há botão de nova verificação. As consultas são anônimas, sem credenciais.

O CTX preliminar não foi disponibilizado na interface: sua atribuição específica continua pendente e os produtos controlados atendem ao recorte da entrega. A disponibilidade dos tiles não comprova, sozinha, o registro espacial.

### Grade e limitações

O adaptador `MARS:JEZERO_ANGULAR_GRID` é explícito: X=longitude leste em graus, Y=latitude planetocêntrica em graus, transformação `(1/180, 1, -1/180, 0.5)`, escala `256 × 2^z` e tiles 256 × 256. Não utiliza EPSG:3857 ou registra as coordenadas como WGS84. O mapa reaproveita métodos básicos do CRS Simple, substituindo projeção, transformação, escala e distância.

Os serviços declaram um identificador `EPSG::104905` ambíguo; a divergência entre esse rótulo e os produtos de origem está documentada em `MAPS_FEASIBILITY.md`. O adaptador reproduz a grade angular publicada; **não é uma transformação de datum validada nem uma certificação do georreferenciamento absoluto**. O componente avisa isso na interface. Não há escala métrica ou diagnóstico de terreno.

Os testes executaram o CRS realmente usado pela aplicação contra as 45 matrizes registradas no estudo anterior. A inspeção visual de um tile HiRISE próximo de Belva foi apenas uma conferência de contexto, sem validação quantitativa de alinhamento. Não foi concluída a inspeção do mapa renderizado no navegador.

### Pontos científicos

| Centro catalogado | Latitude N | Longitude E | Fonte |
| --- | --- | --- | --- |
| Belva | 18,48° | 77,38° | [USGS/IAU 15872](https://planetarynames.wr.usgs.gov/Feature/15872) |
| Neretva Vallis | 18,55° | 77,20° | [USGS/IAU 15879](https://planetarynames.wr.usgs.gov/Feature/15879) |
| Jezero | 18,41° | 77,69° | [USGS/IAU 14300](https://planetarynames.wr.usgs.gov/Feature/14300) |

Convenção selecionada nas fontes: planetocêntrica, positiva para leste, domínio 0–360, rede MDIM 2.1. A seleção MDIM 2.1 de Jezero também foi conferida no HTML oficial. Longitudes são normalizadas para -180–180 na representação. Não usar os números duplicados em longitude oeste da mesma página. As coordenadas publicadas são arredondadas e representam centros de feições; não pontos de parada do rover.

Cada local possui descrição, relevância, objetivo, missão/instrumento e links separados para contexto NASA e coordenadas USGS. Selecioná-lo destaca o marcador e atualiza o painel. A HiRISE não cobre os três centros; a interface avisa quando um local está fora de sua cobertura, permitindo retornar ao CTX.

### Planejamento geométrico de Marswalk

Selecionar origem/destino pelo painel ou pelos botões do local. Inverter ou limpar preserva a seleção científica. O reducer evita extremos iguais. O painel de missão reage à seleção e apresenta nomes, objetivos e estimativa.

Calcula-se `h = sin²(Δφ/2) + cos(φ1) cos(φ2) sin²(Δλ/2)` e `d = 2R asin(sqrt(clamp(h,0,1)))`, com `R = 3.396.190 m`, raio esférico documentado nos produtos USGS. A linha orbital usa interpolação sobre o mesmo grande círculo. A UI arredonda ao quilômetro por se tratar de centros de catálogo de precisão limitada.

Não se chama `LatLng.distanceTo()` ou outro cálculo terrestre. Não se incluem relevo, obstáculos, tempo, consumo, risco, caminho seguro ou distância percorrível. Diferenças de controle entre o catálogo MDIM e as bases MOLA limitam a interpretação do sobreposicionamento. A estimativa não é planejamento operacional.

No fallback, PIA19303 permanece com atribuição oficial. Marcadores e conexão têm posições editoriais explicitamente identificadas; as coordenadas e distâncias no painel vêm do catálogo e não são extraídas da imagem.

## Mind Space e Greenhouse

Mind Space preserva o check-in e cronômetro e acrescenta três cenários fictícios: isolamento, comunicação com atraso e convivência sob pressão. O usuário seleciona um cenário e expande estratégias. Fontes em `mission-scenarios.ts`; adaptações educativas não são diagnósticos ou protocolos oficiais. Nenhuma resposta é persistida.

Greenhouse compara alface, batata e rabanete por água, iluminação, nutrientes, ambiente controlado e limitações em Marte. É possível selecionar a ficha e incluir/remover colunas da comparação. A tabela tem cabeçalhos, legenda e área rolável por teclado em telas pequenas. Não há ranking, rendimento ou consumo quantitativo sem fonte. `crops.ts` separa as sínteses, fontes e notas de revisão pendente para a equipe de Química. Foram removidos os antigos controles percentuais ilustrativos.

## Verificação e limites da entrega

- TypeScript e lint passaram.
- Build de produção passou, gerando as quatro páginas e o ícone SVG.
- Sete testes matemáticos/estado e dez testes Vitest passaram: controles, CRS real da aplicação, metadados e falhas de tiles. O validador foi exercitado com XML real dos dois produtos controlados.
- Os testes de controles também verificam ausência de chamadas a `console.error` durante esses fluxos em JSDOM. Isso não equivale a conferir o console do Chrome.
- Desenvolvimento: quatro rotas HTTP 200, 33 assets locais/referenciados HTTP 200 e 404 correto para rota inexistente.
- Produção: quatro rotas HTTP 200, 18 assets locais/referenciados HTTP 200 e 404 correto para rota inexistente.
- Metadados e tiles CTX/HiRISE voltaram a responder nas consultas diretas desta fase. Os testes não são uma garantia de uptime.

Não foi possível validar visualmente layout, responsividade ou console em um navegador: o host de navegador estava indisponível e Computer Use encerrou a inspeção por não conseguir confirmar a URL do Chrome. Não foi usado outro mecanismo de automação para contornar essa restrição. Os breakpoints CSS foram preservados/ampliados, mas testes reais em 390/768/1440 px permanecem pendentes.

O 404 originalmente informado não identificava a URL. Os assets atuais passaram nos testes HTTP e um ícone foi adicionado. O aviso de preload de CSS não foi validado no console real; não foi ocultado ou declarado corrigido sem essa evidência.

Execute `npm.cmd test`, `npm.cmd run typecheck`, `npm.cmd run lint` e `npm.cmd run build`. Com um servidor rodando, `node scripts/check-http.mjs http://localhost:3000` verifica rotas e assets. Testes JSDOM não acessam os serviços remotos.
