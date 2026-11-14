# Relatório da primeira entrega

## Implementado

Aplicação Next.js com App Router e `src/`, React, TypeScript estrito, CSS Modules, tokens globais, Lucide React e ESLint. Quatro páginas conectadas pela navegação e página 404.

- Landing: identidade de atlas espacial, hero, ilustração artística de Marte, três frentes e contexto do desafio.
- Mars Maps: imagem MRO local, Leaflet no cliente, zoom, arraste, controle de três camadas, seleção de três pontos, detalhes e referências, sequência de exploração com remoção e prevenção de duplicatas.
- Mind Space: seleção de estado, reflexão transitória, confirmação e cronômetro com pausa e reinício; temas educativos de fatores humanos.
- Mars Greenhouse: três culturas, informações de pesquisa na ISS, ilustrações e controles demonstrativos de luz e água.
- Fontes e imagem locais; fontes abertas com licenças incluídas; nenhuma chave, backend ou recurso pago.

## Verificações efetivamente executadas

- `npm.cmd run lint`: passou, sem avisos do projeto.
- `npm.cmd run typecheck`: passou.
- `npm.cmd run build`: passou; quatro rotas pré-renderizadas.
- Servidor de produção: quatro páginas, imagem de Jezero e duas fontes responderam HTTP 200.
- Imagem validada como JPEG de 2880 × 1800; proporção preservada no plano do atlas.
- `git diff --check`: sem erros de whitespace.

Os checks finais são repetidos após a formatação quando necessário. Nenhum teste de interação no navegador foi concluído: a integração direta de navegador estava indisponível e Computer Use interrompeu a tentativa por não conseguir confirmar a URL atual do Chrome. Responsividade, aparência e fluxos interativos ainda precisam da revisão manual descrita em `VERIFICATION.md`. Não foi instalado um navegador alternativo para contornar essa restrição.

## Escopo científico

Há uma imagem orbital real com créditos, referências oficiais e dados locais educativos. Marcadores e linhas são editoriais sem georreferenciamento. Não há WMTS ativo, fusão de múltiplas missões, topografia, cálculo de distância ou modelo de risco. Isso está identificado na interface e em `SCIENCE.md`.

## Entrega Git e execução

Branch: `feat/mars-survival-guide`. Consulte o histórico para o commit final. O resultado do push é informado no relatório da conversa. Não houve publicação em hospedagem externa. Para abrir localmente, execute `npm.cmd ci` e `npm.cmd run dev`.
