# Mars Survival Guide

Atlas educativo para o NASA Space Apps Challenge: exploração de Marte, fatores humanos e agricultura espacial. Projeto independente, sem endosso da NASA.

## Executar

Requer Node.js >= 20.9 (utilizado: 22.20.0) e npm (10.9.3).

```powershell
npm.cmd ci
npm.cmd run dev
```

Abra http://localhost:3000. Em outros sistemas, use `npm`.

```powershell
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run build
npm.cmd start
```

Não requer conta, chave, banco de dados, arquivo `.env` ou recurso pago.

## Páginas e interações

- `/`: apresentação, ilustração artística de Marte e acesso às três frentes.
- `/mars-maps`: Leaflet apenas no cliente, zoom e arraste, seleção de pontos, controle de camadas e sequência de exploração com inclusão e remoção de pontos.
- `/mind-space`: check-in demonstrativo, reflexão e cronômetro de pausa. Nenhuma resposta é persistida ou transmitida.
- `/mars-greenhouse`: seleção de alface, mizuna e tomate-anão; controles de luz visual e reserva ilustrativa de água.
- Página 404 com retorno ao início.

## Organização

```text
src/app/           Rotas App Router, metadados e estilos globais
src/components/    Navegação, interfaces interativas e CSS Modules
src/data/          Conteúdo e posições editoriais demonstrativas
public/images/     Imagem orbital local com atribuição
docs/              Fontes, limites e roteiro de verificação
```

Next.js 16, React 19, TypeScript estrito, CSS Modules, tokens globais, Lucide React, Leaflet e React Leaflet. Sem Tailwind ou backend. Versões resolvidas em `package-lock.json`.

## Design e acessibilidade

Atlas de missão com fundo grafite, laranja para exploração, azul para fatores humanos e verde para cultivo. Layouts adaptáveis, foco visível, link de pular conteúdo, rótulos de formulário e estados de seleção. O painel oferece alternativa por teclado aos marcadores. A ilustração de Marte é artística; fontes têm fallback do sistema.

## Integridade científica

A imagem de Jezero é real, mas as anotações são editoriais e **não georreferenciadas**. O mapa usa `CRS.Simple` com coordenadas de imagem. Coordenadas regionais aproximadas aparecem separadamente com referência. Nenhuma elevação, distância, duração de caminhada, risco ou produtividade é inventada. A sequência é uma demonstração de interface, não uma rota navegável.

Não há WMTS ativo nesta entrega. A documentação oficial foi pesquisada; a projeção e a matriz planetárias precisam ser respeitadas antes da integração. Veja [fontes e plano científico](docs/SCIENCE.md).

Mind Space é educativo, sem avaliação clínica. Resultados de cultivo na ISS não validam agricultura em Marte. Os controles da estufa não são modelos físicos.

## Próximas prioridades

1. Validar georreferenciamento de Jezero e revisar conteúdo com as pessoas de Química e Design.
2. Integrar WMTS com CRS e matriz corretos, tratamento de falha e metadados por camada.
3. Adicionar conjuntos reais com missão, resolução, cobertura e incerteza documentados.
4. Calcular trajetos somente após validar topografia, distância planetária e limites do modelo.
5. Ampliar avaliação de acessibilidade e dispositivos reais.

Consulte o [roteiro de verificação](docs/VERIFICATION.md). A aplicação não substitui ferramentas científicas ou planejamento operacional.
