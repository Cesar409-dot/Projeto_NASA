# Roteiro de verificação

## Comandos

Após `npm.cmd ci`: `npm.cmd run lint`, `npm.cmd run typecheck`, `npm.cmd test`, `npm.cmd run build`.

Com um servidor local rodando: `node scripts/check-http.mjs http://localhost:3000`. Para conferir a produção separadamente, rode `npm.cmd start -- --hostname 127.0.0.1 --port 3001` após o build e use a porta 3001 no script HTTP. Não inicie dois servidores na mesma porta.

## Demonstração manual

1. Abrir `/`; seguir CTA, cards e navegação. Conferir destaque da seção ativa.
2. No mapa, aguardar verificação de CTX/HiRISE. Alternar cada camada disponível e imagem local. Conferir legenda, missão, fonte e estados de carregamento/erro. Usar zoom, arraste e recentralização; conferir cobertura e costuras.
3. Selecionar Belva, Neretva Vallis e Jezero pelo painel e mapa. Conferir dados, links e alerta de cobertura HiRISE. Definir origem/destino; conferir objetivos, linha e distância aproximada. Inverter e limpar a rota. Conferir impossibilidade de extremos iguais.
4. Conferir avisos e ausência de métricas científicas inventadas.
5. No Mind Space, selecionar estado, escrever e concluir. Iniciar, pausar e reiniciar cronômetro. Sair e retornar: respostas não persistem.
6. No Mind Space, alternar os três cenários, abrir estratégias e conferir fontes. Na estufa, selecionar alface/batata/rabanete e incluir/remover colunas da comparação, inclusive o estado vazio.
7. Navegar com Tab. Testar 390, 768 e 1440 pixels; conferir foco, rótulos, acesso alternativo aos pontos e ausência de rolagem horizontal.
8. Abrir rota inexistente. Recarregar diretamente cada rota.

## Limites

Checks estáticos não substituem usabilidade, revisão científica ou dispositivos reais. O relatório de entrega registra os checks efetivamente executados e eventuais limites do navegador.

Na fase 2, os controles foram testados em JSDOM e os recursos por HTTP. A inspeção no navegador foi bloqueada pela ferramenta ao não conseguir confirmar a URL do Chrome. Os itens visuais em 390/768/1440 px, console real e alinhamento final continuam pendentes; consulte `PHASE_2.md` para separar os checks executados do roteiro manual.
