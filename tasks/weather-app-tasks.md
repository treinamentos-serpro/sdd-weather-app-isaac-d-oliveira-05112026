# Weather App — Tarefas de Implementação

Backlog derivado de [`plans/weather-app-plan.md`](../plans/weather-app-plan.md) e rastreável à [`specs/weather-app-spec.md`](../specs/weather-app-spec.md). Os IDs atuais foram preservados como referências; a sequência abaixo define a ordem de execução por fase. Cada tarefa lista suas predecessoras técnicas diretas.

## Ordem de execução

1. **Tipos e base:** T-03; em seguida, bootstrap e estilos T-01 → T-02
2. **Funções puras:** T-04–T-07 e T-12
3. **Services e persistência:** T-13 → T-14; T-15 → T-16
4. **Hook:** T-33 → T-34 → T-35
5. **Componentes:** T-22–T-28
6. **Integração:** T-53 → T-39
7. **Testes:** T-08–T-11, T-17–T-21, T-29–T-32, T-36–T-38, T-40–T-43, T-47–T-48, T-49–T-52
8. **Hardening:** T-44 → T-45 → T-46

As definições detalhadas abaixo continuam agrupadas por área para facilitar consulta; para implementar, seguir a sequência de fases acima e respeitar as dependências declaradas em cada tarefa.

## Status do backlog

Status inferidos pela inspeção do código, dos testes e da documentação existentes no repositório. “Concluída” indica evidência suficiente dos critérios de aceite nos artefatos encontrados; “Iniciada” indica implementação ou testes relacionados, mas com critérios ainda sem evidência suficiente; “Não iniciada” indica que não foi encontrado o entregável esperado. Os comandos `pnpm lint`, `pnpm build` e `pnpm test` não foram executados nesta verificação.

| Status | Quantidade |
| --- | ---: |
| Concluídas | 28 |
| Iniciadas, mas não concluídas | 22 |
| Não iniciadas | 3 |
| **Total** | **53** |

## Prioridade e tamanho

Prioridade: **P0** bloqueia a primeira demonstração utilizável ou o piloto controlado; **P1** completa requisitos de robustez e hardening do MVP; **P2** validação de produto posterior ao MVP. Tamanho relativo: **P** pequeno, **M** médio, **G** grande, considerando complexidade e esforço de implementação/teste.

| Tarefa | Prioridade | Tamanho | Tarefa | Prioridade | Tamanho |
| --- | --- | --- | --- | --- | --- |
| T-01 | P0 | P | T-28 | P1 | P |
| T-02 | P0 | P | T-29 | P0 | M |
| T-03 | P0 | M | T-30 | P0 | M |
| T-04 | P0 | P | T-31 | P0 | P |
| T-05 | P0 | M | T-32 | P0 | P |
| T-06 | P0 | M | T-33 | P0 | G |
| T-07 | P0 | P | T-34 | P0 | G |
| T-08 | P0 | P | T-35 | P1 | G |
| T-09 | P0 | P | T-36 | P0 | M |
| T-10 | P0 | P | T-37 | P0 | M |
| T-11 | P0 | P | T-38 | P1 | M |
| T-12 | P0 | M | T-39 | P0 | G |
| T-13 | P0 | M | T-40 | P0 | M |
| T-14 | P0 | G | T-41 | P0 | M |
| T-15 | P1 | P | T-42 | P1 | M |
| T-16 | P1 | M | T-43 | P1 | G |
| T-17 | P0 | M | T-44 | P1 | G |
| T-18 | P0 | M | T-45 | P0 | M |
| T-19 | P0 | G | T-46 | P1 | M |
| T-20 | P1 | P | T-47 | P2 | M |
| T-21 | P1 | P | T-48 | P2 | G |
| T-22 | P0 | P | T-49 | P0 | P |
| T-23 | P0 | P | T-50 | P0 | P |
| T-24 | P0 | M | T-51 | P1 | P |
| T-25 | P0 | M | T-52 | P0 | G |
| T-26 | P1 | M | T-53 | P0 | M |
| T-27 | P0 | M |  |  |  |

## Fatias verticais sugeridas

1. **Busca visível:** T-03, T-01–T-02, T-12–T-13, T-22–T-24, T-33 e T-53; validar com T-17–T-18, T-29, T-32, T-36, T-40, T-49 e T-50. Entrega uma tela funcional que busca cidades, mostra sugestões e confirma a cidade escolhida.
2. **Clima e previsão:** T-04–T-07, T-10, T-14–T-16, T-25–T-28, T-34–T-35 e T-39; validar com T-08–T-11, T-19–T-21, T-30–T-31, T-37–T-38, T-41 e T-52. A mesma tela passa a mostrar clima atual e previsão de cinco dias.
3. **Confiabilidade e lançamento:** T-26, T-42–T-48; validar cache, falhas, persistência, atualização, acessibilidade, limites operacionais e a meta de usabilidade.

Cada fatia inclui implementação e validação correspondente; tarefas P1/P2 podem seguir após a primeira tela visível sem bloquear a demonstração inicial.

## Entrega 1 — Base e contratos

### T-01 — Inicializar a aplicação React — **Status: Concluída**
- **Tipo:** Infra
- **Descrição:** Conectar o bootstrap React ao componente raiz.
- **Critérios de aceite:** `pnpm build` termina com código 0; `main.tsx` monta `App.tsx` no elemento raiz existente; `src/` não adiciona provider/contexto nem biblioteca de estado global.
- **Dependências:** —
- **Arquivos prováveis:** `src/main.tsx`, `src/App.tsx`
- **Requisitos:** NFR7
- **Refinamento de validação:** restaurar o bootstrap ausente e conectar a busca ao serviço real para que E2E valide a API interceptada, preservando o mock em demonstrações isoladas. Recusar resultados ambíguos até implementar a seleção explícita de T-24.

### T-02 — Preparar estilos globais e Tailwind — **Status: Concluída**
- **Tipo:** Infra
- **Descrição:** Configurar a folha global e os estilos Tailwind necessários à interface responsiva.
- **Critérios de aceite:** O CSS global é importado pelo bootstrap e contém as diretivas Tailwind `base`, `components` e `utilities`; `pnpm build` termina com código 0. A ausência de rolagem horizontal nas larguras da spec é verificada em T-44.
- **Dependências:** T-01
- **Arquivos prováveis:** `src/styles/index.css`, `tailwind.config.js`
- **Requisitos:** NFR1; AC49
- **Refinamento de validação:** restaurar as diretivas globais ausentes e o setup do Testing Library; ajustar expectativas de previsão e E2E aos dados efetivamente fornecidos pelas fixtures.

### T-03 — Definir contratos compartilhados de clima — **Status: Iniciada**
- **Tipo:** Data
- **Descrição:** Declarar tipos de domínio, preferências, cache e estados/erros usados pelas camadas.
- **Critérios de aceite:** `weather.ts` declara `City`, `CurrentWeather`, `ForecastDay`, `WeatherSnapshot`, `WeatherCacheEntry`, `Preferences` e `TemperatureUnit`; cada campo meteorológico opcional aceita `null`; os estados e erros são discriminados por `status`/`kind`; `pnpm build` passa sem importar React, Fetch ou storage nesse módulo.
- **Dependências:** —
- **Arquivos prováveis:** `src/types/weather.ts`
- **Requisitos:** RF1–RF5, RF8

## Entrega 2 — Regras de domínio

### T-04 — Implementar conversão e arredondamento de temperatura — **Status: Concluída**
- **Tipo:** Data
- **Descrição:** Criar funções puras de conversão e arredondamento de temperaturas.
- **Critérios de aceite:** Celsius permanece inalterado; 0 °C resulta em 32 °F, 20 °C em 68 °F, 18 °C em 64 °F e 19 °C em 66 °F; o arredondamento ocorre após converter e empates como 2,5 e -2,5 resultam em 3 e -3; `null` permanece `null`.
- **Dependências:** T-03
- **Arquivos prováveis:** `src/lib/temperature.ts`
- **Requisitos:** RF2, RF4; AC11–AC14, AC53

### T-05 — Mapear códigos WMO — **Status: Concluída**
- **Tipo:** Data
- **Descrição:** Traduzir códigos meteorológicos suportados para condições em pt-BR.
- **Critérios de aceite:** Cada código WMO suportado na tabela de mapeamento retorna seu rótulo pt-BR; código desconhecido e `null` retornam o resultado indisponível definido; a função é determinística e não faz I/O.
- **Dependências:** T-03
- **Arquivos prováveis:** `src/lib/weatherCodes.ts`
- **Requisitos:** RF2, RF3; AC6, AC10, AC29, AC31

### T-06 — Normalizar horário e validar atualidade — **Status: Concluída**
- **Tipo:** Data
- **Descrição:** Converter o horário local da resposta para instante UTC e avaliar se a referência está dentro da janela de atualidade.
- **Critérios de aceite:** Dada uma string de horário local e `utc_offset_seconds`, a função produz o instante UTC correspondente sem consultar o fuso do processo; com relógio injetado, idade de 60 minutos é atual e idade superior a 60 minutos, instante futuro ou entrada inválida não são atuais.
- **Dependências:** T-03
- **Arquivos prováveis:** `src/lib/weatherTime.ts`
- **Requisitos:** RF2; AC7–AC9, AC30, AC47–AC48

### T-07 — Formatar datas, horários e números locais — **Status: Iniciada**
- **Tipo:** Data
- **Descrição:** Criar formatadores determinísticos para pt-BR e fuso IANA da cidade.
- **Critérios de aceite:** Para fixtures fixas, horário é formatado em pt-BR com ciclo de 24 horas e fuso IANA recebido; data corresponde ao calendário desse fuso; números usam vírgula decimal e ponto de milhar; função de idade do modelo retorna “Indisponível” quando não há metadado confiável.
- **Dependências:** T-03
- **Arquivos prováveis:** `src/lib/formatting.ts`
- **Requisitos:** RF2, RF3, RF9; AC26–AC28, AC48

### T-08 — Testar conversão e arredondamento — **Status: Concluída**
- **Tipo:** Test
- **Descrição:** Cobrir conversões Celsius/Fahrenheit e arredondamento.
- **Critérios de aceite:** Testes passam para 0 °C → 32 °F, 20 °C → 68 °F, 18 °C → 64 °F e 19 °C → 66 °F; verificam 2,5 → 3, -2,5 → -3, conversão antes do arredondamento e preservação de `null`.
- **Dependências:** T-04
- **Arquivos prováveis:** `tests/lib/temperature.test.ts`
- **Requisitos:** RF2, RF4; AC12, AC53

### T-09 — Testar tradução de códigos WMO — **Status: Concluída**
- **Tipo:** Test
- **Descrição:** Verificar códigos conhecidos, desconhecidos e ausentes.
- **Critérios de aceite:** Há pelo menos um teste para cada código da tabela WMO implementada; todos comparam o rótulo pt-BR esperado; código não mapeado e `null` retornam indisponível.
- **Dependências:** T-05
- **Arquivos prováveis:** `tests/lib/weatherCodes.test.ts`
- **Requisitos:** RF2, RF3; AC6, AC29, AC31

### T-10 — Testar normalização e atualidade temporal — **Status: Iniciada**
- **Tipo:** Test
- **Descrição:** Validar conversão de horário local e limites de atualidade com relógio controlado.
- **Critérios de aceite:** Com fixtures e relógio fixo, testes comparam o ISO UTC esperado para offsets positivo e negativo; confirmam atualidade em 60 minutos exatos e não atualidade em 60 minutos mais 1 ms, além de rejeitar instante futuro e entrada inválida, independentemente do fuso do processo.
- **Dependências:** T-06
- **Arquivos prováveis:** `tests/lib/weatherTime.test.ts`
- **Requisitos:** RF2; AC8–AC9, AC30

### T-11 — Testar formatação por locale e fuso — **Status: Iniciada**
- **Tipo:** Test
- **Descrição:** Verificar datas, horários e números formatados para a cidade consultada.
- **Critérios de aceite:** Asserções verificam data e hora esperadas em `pt-BR`/24 horas para dois fusos diferentes, a troca do dia local quando a data UTC ainda não mudou, e os separadores de número `1.234,5`.
- **Dependências:** T-07
- **Arquivos prováveis:** `tests/lib/formatting.test.ts`
- **Requisitos:** RF3, RF9; AC26–AC28

## Entrega 3 — Busca, serviços e persistência

### T-12 — Normalizar e ordenar resultados de cidades — **Status: Concluída**
- **Tipo:** Data
- **Descrição:** Implementar a regra pura que valida, identifica, ordena e determina a elegibilidade de seleção de cidades.
- **Critérios de aceite:** Rejeita nome vazio, latitude fora de [-90, 90] e longitude fora de [-180, 180]; ordena resultados em grupos exato, prefixo e parcial, mantendo o índice de origem entre empates; marca seleção automática somente quando há exatamente um resultado válido com `admin1` e `country` não vazios.
- **Dependências:** T-03
- **Arquivos prováveis:** `src/lib/citySearch.ts`
- **Requisitos:** RF1; AC1, AC3–AC4

### T-13 — Implementar serviço de geocoding — **Status: Iniciada**
- **Tipo:** Data
- **Descrição:** Consultar Geocoding Open-Meteo e converter resposta para resultados de domínio.
- **Critérios de aceite:** Consulta vazia/apenas espaços resulta em zero chamadas Fetch; consulta aparada mantém acentos, hífen e apóstrofo; URL codificada contém `count=10`, `language=pt` e `format=json`; respostas vazias viram lista vazia; no máximo 10 candidatos válidos são processados mesmo se a resposta exceder `count`; a ausência de um nome parcial não é tratada como prova de inexistência da cidade; falhas de rede/HTTP são rejeições tipadas; o service encerra em até cinco segundos mesmo quando recebe um `AbortSignal` que não tem prazo próprio, preservando o cancelamento externo; HTTP 429 não dispara retry automático. A busca complementar para nomes omitidos fica pendente da decisão registrada nas Open Questions da spec.
- **Dependências:** T-03, T-12
- **Arquivos prováveis:** `src/services/openMeteo.ts`
- **Requisitos:** RF1; AC2, AC5, AC32–AC33, AC56

### T-14 — Implementar serviço de previsão — **Status: Concluída**
- **Tipo:** Data
- **Descrição:** Consultar Forecast API e normalizar clima atual e registros diários.
- **Critérios de aceite:** URL contém latitude/longitude, todos os campos `current`/`daily` do plano, `temperature_unit=celsius`, `wind_speed_unit=kmh`, `precipitation_unit=mm`, `timezone=auto` e `forecast_days=5`; campos ausentes/inválidos viram `null` e arrays são pareados por índice sem criar registros; no máximo cinco registros diários são processados mesmo se a resposta exceder `forecast_days`; `current.time` é normalizado com o offset da resposta e fuso IANA inválido é rejeitado; timeout ocorre em cinco segundos mesmo quando o service recebe um `AbortSignal` sem prazo próprio, preservando o cancelamento externo; 429 não repete e define `retryAt` a partir de `Retry-After` em segundos/data HTTP ou 60 segundos quando ausente/inválido; `modelRunAt` fica `null` sem metadado confiável.
- **Dependências:** T-03, T-06, T-13
- **Arquivos prováveis:** `src/services/openMeteo.ts`
- **Requisitos:** RF2, RF3, RF8, RF9; AC6–AC10, AC29–AC31, AC34, AC38, AC52

### T-15 — Persistir preferências locais — **Status: Concluída**
- **Tipo:** Data
- **Descrição:** Implementar leitura e gravação de unidade e última cidade selecionada.
- **Critérios de aceite:** Em storage vazio/inválido a leitura retorna Celsius e `lastCity: null`; valores válidos de cidade/unidade sobrevivem a gravação e releitura; JSON corrompido e exceção de storage retornam padrão sem lançar erro; nenhuma chave persiste consulta digitada ou histórico.
- **Dependências:** T-03
- **Arquivos prováveis:** `src/services/weatherStorage.ts`
- **Requisitos:** RF4, RF5; AC11, AC14–AC16

### T-16 — Persistir e validar cache meteorológico — **Status: Concluída**
- **Tipo:** Data
- **Descrição:** Implementar a entrada única de cache e a regra de elegibilidade para fallback.
- **Critérios de aceite:** A entrada persistida contém somente `snapshot` e `storedAt` e substitui a entrada anterior; relógio controlado confirma elegibilidade em idade 0 e 3 horas exatas, rejeição de idade negativa ou acima de 3 horas, referência inválida/futura e snapshot malformado.
- **Dependências:** T-03, T-06, T-15
- **Arquivos prováveis:** `src/services/weatherStorage.ts`
- **Requisitos:** RF8; AC23–AC24

### T-17 — Testar regras de cidade — **Status: Concluída**
- **Tipo:** Test
- **Descrição:** Cobrir validação, ordenação estável e elegibilidade de seleção.
- **Critérios de aceite:** Testes verificam rejeição de coordenadas fora dos limites, ordenação exata antes de prefixo e parcial, preservação da ordem original em empate, nenhuma seleção automática para homônimos ou contexto incompleto, e seleção elegível no único resultado completo.
- **Dependências:** T-12
- **Arquivos prováveis:** `tests/lib/citySearch.test.ts`
- **Requisitos:** RF1; AC1–AC4

### T-18 — Testar serviço de geocoding — **Status: Iniciada**
- **Tipo:** Test
- **Descrição:** Validar URL, parsing e erros do serviço de busca sem rede real.
- **Critérios de aceite:** Toda chamada usa Fetch mockado; asserts conferem os parâmetros `count=10`, `language=pt`, `format=json`, consulta vazia sem chamada, preservação de acentos/pontuação, resposta sem resultados como lista vazia, uma resposta que omite uma localidade parcial exibindo apenas os candidatos retornados, limite local de 10 resultados mesmo diante de payload maior, timeout com e sem sinal externo e erros HTTP/rede rejeitados com o tipo esperado.
- **Dependências:** T-13
- **Arquivos prováveis:** `tests/services/geocoding.test.ts`
- **Requisitos:** RF1; AC2, AC5, AC32–AC33, AC56

### T-19 — Testar serviço de previsão — **Status: Iniciada**
- **Tipo:** Test
- **Descrição:** Validar request, normalização e falhas do Forecast API com fixtures.
- **Critérios de aceite:** Toda chamada usa fixture/Fetch mockado; asserts conferem cada parâmetro do contrato, conversão de campos ausentes para `null`, arrays curtos sem dias fabricados, limite de cinco dias para respostas maiores, UTC calculado pelo offset, timeout/abortamento em cinco segundos com e sem sinal externo e preservação do cancelamento externo, classificação HTTP/rede, zero retries automáticos em 429 e `retryAt` para `Retry-After` em segundos, data HTTP e header ausente/inválido (60 segundos); nenhuma chamada real ocorre.
- **Dependências:** T-14
- **Arquivos prováveis:** `tests/services/forecast.test.ts`
- **Requisitos:** RF2, RF3, RF8, RF9; AC29–AC31, AC34, AC52

### T-20 — Testar persistência de preferências — **Status: Concluída**
- **Tipo:** Test
- **Descrição:** Verificar leitura, validação e gravação da última cidade e unidade.
- **Critérios de aceite:** Testes confirmam padrão Celsius e cidade nula, round-trip de cidade/unidade válidas, fallback para padrões para JSON corrompido/enum inválido e ausência de exceção quando localStorage lança erro.
- **Dependências:** T-15
- **Arquivos prováveis:** `tests/services/weatherPreferences.test.ts`
- **Requisitos:** RF4, RF5; AC14–AC16

### T-21 — Testar cache e janela de elegibilidade — **Status: Concluída**
- **Tipo:** Test
- **Descrição:** Verificar serialização e elegibilidade do cache por `storedAt` e timestamp meteorológico.
- **Critérios de aceite:** Com relógio fixo, testes confirmam aceitação em 0 e 3 horas, rejeição após 3 horas e para `storedAt` futuro; timestamp meteorológico futuro/inválido, snapshot inválido e JSON corrompido são rejeitados.
- **Dependências:** T-16
- **Arquivos prováveis:** `tests/services/weatherCache.test.ts`
- **Requisitos:** RF8; AC23–AC24

## Entrega 4 — Componentes de interface

### T-22 — Implementar estados de carregamento e vazio — **Status: Concluída**
- **Tipo:** UI
- **Descrição:** Criar apresentações reutilizáveis para loading e estado vazio.
- **Critérios de aceite:** Loading renderiza conteúdo com role `status`; estado de busca vazia contém mensagem de cidade não encontrada; estado inicial sem cidade solicita uma consulta; a ação de nova busca é um controle focável e acionável por teclado.
- **Dependências:** T-02
- **Arquivos prováveis:** `src/components/states/LoadingState.tsx`, `src/components/states/EmptyState.tsx`
- **Requisitos:** RF1; AC5, AC32

### T-23 — Implementar estado de erro e retry — **Status: Concluída**
- **Tipo:** UI
- **Descrição:** Apresentar erro meteorológico compreensível e ação de nova tentativa.
- **Critérios de aceite:** Erro 429 mostra mensagem de limite temporário e botão retry desabilitado antes de `retryAt`, habilitado ao atingir o prazo; erro não-429 mostra botão habilitado; ambos são acessíveis por role e teclado.
- **Dependências:** T-02
- **Arquivos prováveis:** `src/components/states/ErrorState.tsx`
- **Requisitos:** RF8; AC22, AC24–AC25, AC34, AC52

### T-24 — Criar busca e seleção acessível de cidade — **Status: Iniciada**
- **Tipo:** UI
- **Descrição:** Exibir entrada de busca e sugestões com identidade geográfica.
- **Critérios de aceite:** Campo tem nome acessível e aceita edição/submissão por teclado; cada opção mostra nome, região/estado e país; loading, lista vazia e erro têm conteúdo distinto; Enter seleciona a opção focada e chama o callback com seu `City`; editar a busca preserva a cidade atualmente exibida.
- **Dependências:** T-12, T-22, T-23
- **Arquivos prováveis:** `src/components/CitySearch.tsx`
- **Requisitos:** RF1; AC1–AC5, AC32–AC33, AC49

### T-25 — Exibir clima atual e atualidade — **Status: Concluída**
- **Tipo:** UI
- **Descrição:** Renderizar condição, temperaturas e demais medidas atuais com seus metadados temporais.
- **Critérios de aceite:** Renderiza temperatura, sensação térmica, condição, umidade, vento e precipitação; cada valor ausente mostra “Indisponível”; unidades exibidas são °C/°F, %, km/h e mm; não adiciona pressão sem campo no contrato; mostra “Dados referentes a HH:mm” no fuso recebido e “Idade da execução do modelo: Indisponível” sem metadado; referência futura/inválida/mais antiga que 60 minutos não recebe apresentação de dado atual.
- **Dependências:** T-04, T-05, T-06, T-07
- **Arquivos prováveis:** `src/components/CurrentWeather.tsx`
- **Requisitos:** RF2, RF9; AC6–AC9, AC29–AC30, AC47–AC48

### T-26 — Exibir cache como desatualizado — **Status: Concluída**
- **Tipo:** UI
- **Descrição:** Apresentar fallback meteorológico elegível sem confundi-lo com dados atuais.
- **Critérios de aceite:** Com fallback elegível, a tela identifica explicitamente os dados como desatualizados e mostra seu horário meteorológico de origem; com fallback ausente, expirado ou inválido, não renderiza valores desse cache.
- **Dependências:** T-16, T-23, T-25
- **Arquivos prováveis:** `src/components/CurrentWeather.tsx`
- **Requisitos:** RF8; AC23–AC24

### T-27 — Exibir previsão diária — **Status: Concluída**
- **Tipo:** UI
- **Descrição:** Renderizar os dias locais, condição e temperaturas mínima/máxima disponíveis.
- **Critérios de aceite:** Para cada item recebido renderiza data, condição e mín./máx.; campo ausente aparece como “Indisponível”; não exibe probabilidade de chuva sem campo no contrato; previsão com menos de cinco dias ou campo faltante exibe sinal de incompleta e não cria registros; resposta completa exibe exatamente cinco datas locais consecutivas.
- **Dependências:** T-04, T-05, T-07
- **Arquivos prováveis:** `src/components/Forecast.tsx`
- **Requisitos:** RF3, RF9; AC10, AC26–AC28, AC31

### T-28 — Implementar controle de unidade — **Status: Concluída**
- **Tipo:** UI
- **Descrição:** Permitir alternar Celsius/Fahrenheit na apresentação.
- **Critérios de aceite:** Controle tem nome acessível e estado selecionado identificável; sem preferência marca Celsius; clicar ou usar teclado alterna °C/°F e persiste a escolha; spy do serviço registra zero chamadas causadas pela troca; vento continua em km/h e precipitação em mm.
- **Dependências:** T-04, T-15
- **Arquivos prováveis:** `src/components/UnitToggle.tsx`
- **Requisitos:** RF2, RF4; AC11–AC14, AC53

### T-29 — Testar busca e seleção na interface — **Status: Iniciada**
- **Tipo:** Test
- **Descrição:** Testar estados e interação por teclado de `CitySearch`.
- **Critérios de aceite:** Testing Library localiza o campo por label e opções por role; confirma texto de cidade/região/país, seleção por teclado, ausência de auto-seleção ambígua, mensagem vazia, e que editar o campo mantém a cidade/clima já renderizados.
- **Dependências:** T-24
- **Arquivos prováveis:** `tests/components/CitySearch.test.tsx`
- **Requisitos:** RF1; AC1–AC5, AC32–AC33, AC42

### T-30 — Testar exibição de clima atual e cache — **Status: Iniciada**
- **Tipo:** Test
- **Descrição:** Verificar valores, indisponibilidades, atualidade e indicação stale.
- **Critérios de aceite:** Asserções verificam cada campo requerido e unidade no cenário completo, “Indisponível” para cada campo nulo, ausência de pressão sem suporte, rótulo de horário, metadado do modelo indisponível, referência inválida/antiga não atual e fallback elegível marcado stale; cache inelegível não aparece.
- **Dependências:** T-25, T-26
- **Arquivos prováveis:** `tests/components/CurrentWeather.test.tsx`
- **Requisitos:** RF2, RF8; AC6–AC9, AC23–AC24, AC29–AC30, AC47–AC48

### T-31 — Testar exibição da previsão — **Status: Concluída**
- **Tipo:** Test
- **Descrição:** Verificar renderização de dias completos e parciais.
- **Critérios de aceite:** Com fixture de cinco dias, asserts conferem as cinco datas no fuso da cidade e ausência de probabilidade de chuva sem suporte; com fixture curta/parcial, conferem somente os registros recebidos, “Indisponível” nos campos meteorológicos requeridos nulos e aviso de previsão incompleta.
- **Dependências:** T-27
- **Arquivos prováveis:** `tests/components/Forecast.test.tsx`
- **Requisitos:** RF3, RF9; AC10, AC26–AC28, AC31

### T-32 — Testar componente de carregamento — **Status: Concluída**
- **Tipo:** Test
- **Descrição:** Testar exclusivamente a semântica e a renderização do componente de carregamento.
- **Critérios de aceite:** Testing Library localiza o indicador por role `status`; o texto de carregamento é renderizado enquanto o estado está ativo e removido quando o componente não é renderizado.
- **Dependências:** T-22
- **Arquivos prováveis:** `tests/components/LoadingState.test.tsx`
- **Requisitos:** NFR4; AC42

### T-49 — Testar componente de estado vazio — **Status: Concluída**
- **Tipo:** Test
- **Descrição:** Testar os estados vazios de busca e de aplicação sem cidade selecionada.
- **Critérios de aceite:** Testing Library distingue a mensagem “cidade não encontrada” do estado inicial sem cidade; a ação de nova busca recebe foco por teclado e invoca o callback uma vez.
- **Dependências:** T-22
- **Arquivos prováveis:** `tests/components/EmptyState.test.tsx`
- **Requisitos:** RF1; AC5, AC32

### T-50 — Testar componente de erro e retry — **Status: Concluída**
- **Tipo:** Test
- **Descrição:** Testar mensagens de erro, retry e bloqueio de rate limit.
- **Critérios de aceite:** Erro comum apresenta retry habilitado; erro 429 apresenta mensagem de limite, mantém retry desabilitado antes de `retryAt` e habilita no prazo; botão é localizável por role e operável por teclado.
- **Dependências:** T-23
- **Arquivos prováveis:** `tests/components/ErrorState.test.tsx`
- **Requisitos:** RF8; AC22, AC25, AC52

### T-51 — Testar controle de unidade — **Status: Concluída**
- **Tipo:** Test
- **Descrição:** Testar alternância acessível e persistente entre Celsius e Fahrenheit no componente.
- **Critérios de aceite:** Testing Library alterna unidade por teclado, verifica o estado selecionado e chama o callback de persistência uma vez; mock do serviço meteorológico registra zero chamadas causadas pela alternância.
- **Dependências:** T-28
- **Arquivos prováveis:** `tests/components/UnitToggle.test.tsx`
- **Requisitos:** RF4; AC11–AC14

## Entrega 5 — Orquestração e composição

### T-33 — Orquestrar busca e descarte de respostas tardias — **Status: Iniciada**
- **Tipo:** Data
- **Descrição:** Implementar no hook o fluxo de busca, debounce, cancelamento e estado independente da meteorologia.
- **Critérios de aceite:** Com timers falsos, a busca chama o serviço uma vez após 300 ms desde a última edição e não antes; entrada vazia chama zero vezes; nova consulta aborta a anterior quando suportado e uma resposta tardia não altera sugestões; erro/empty não altera estado meteorológico selecionado.
- **Dependências:** T-13
- **Arquivos prováveis:** `src/hooks/useWeather.ts`
- **Requisitos:** RF1; AC1–AC5, AC32–AC33

### T-34 — Orquestrar seleção, forecast, retry e fallback — **Status: Iniciada**
- **Tipo:** Data
- **Descrição:** Implementar carregamento da cidade selecionada, persistência e tratamento dos resultados meteorológicos.
- **Critérios de aceite:** Selecionar cidade grava `lastCity` e chama forecast uma vez; respostas completas/parciais produzem success com completude correspondente; falha consulta cache e mantém o erro corrente junto ao fallback stale somente se elegível; 429 bloqueia retry até `retryAt`; resposta de cidade previamente selecionada não substitui a seleção atual.
- **Dependências:** T-14, T-15, T-16, T-33
- **Arquivos prováveis:** `src/hooks/useWeather.ts`
- **Requisitos:** RF5, RF8; AC15, AC19, AC22–AC25, AC30–AC31, AC34, AC52

### T-35 — Orquestrar atualização manual e automática — **Status: Concluída**
- **Tipo:** Data
- **Descrição:** Implementar refresh manual, temporizador, visibilidade e coalescência de chamadas para a mesma cidade.
- **Critérios de aceite:** Com relógio/timers falsos, próxima tentativa vence 15 minutos após o início da anterior; nenhuma chamada automática inicia enquanto `visibilityState` é hidden; ao voltar visible, uma chamada inicia imediatamente se o prazo venceu; refresh manual inicia uma chamada antes do prazo; refresh manual/timer durante chamada em curso não aumenta o número de chamadas para aquela cidade.
- **Dependências:** T-34
- **Arquivos prováveis:** `src/hooks/useWeather.ts`
- **Requisitos:** RF7; AC20–AC21, AC35–AC37

### T-36 — Testar orquestração de busca — **Status: Iniciada**
- **Tipo:** Test
- **Descrição:** Testar debounce, cancelamento e estados da busca com serviços simulados.
- **Critérios de aceite:** Testes com timers controlados verificam zero chamada antes de 300 ms e uma depois, zero chamadas para entrada vazia, abort da consulta anterior/resposta tardia ignorada e estado/cidade meteorológica inalterada após erro ou busca vazia.
- **Dependências:** T-33
- **Arquivos prováveis:** `tests/hooks/useWeatherSearch.test.ts`
- **Requisitos:** RF1; AC3–AC5, AC32

### T-37 — Testar seleção, erro e cache no hook — **Status: Iniciada**
- **Tipo:** Test
- **Descrição:** Testar carregamento meteorológico, persistência, retry e fallback no hook.
- **Critérios de aceite:** Mocks verificam uma gravação da cidade e uma chamada forecast na seleção; fixture parcial gera success parcial; falha gera erro; cache até três horas com referência válida é exibido stale e cache inválido/expirado é omitido; retry 429 permanece desabilitado antes de `retryAt` e habilita no prazo.
- **Dependências:** T-34
- **Arquivos prováveis:** `tests/hooks/useWeatherData.test.ts`
- **Requisitos:** RF5, RF8; AC15, AC19, AC22–AC25, AC30, AC34, AC52

### T-38 — Testar refresh e concorrência no hook — **Status: Iniciada**
- **Tipo:** Test
- **Descrição:** Validar temporizadores, visibilidade e chamadas concorrentes.
- **Critérios de aceite:** Com relógio e visibilidade simulados, testes afirmam zero chamada automática antes de 15 minutos e enquanto hidden, uma chamada ao retornar visible após vencimento, uma chamada por refresh manual e nenhum incremento de chamadas quando refresh concorre com request pendente.
- **Dependências:** T-35
- **Arquivos prováveis:** `tests/hooks/useWeatherRefresh.test.ts`
- **Requisitos:** RF7; AC20–AC21, AC35–AC37

### T-39 — Compor a tela principal e avisos do produto — **Status: Concluída**
- **Tipo:** UI
- **Descrição:** Completar a tela iniciada na fatia de busca, integrando clima atual, previsão, preferências e controles.
- **Critérios de aceite:** Selecionar cidade mostra clima atual e os dias disponíveis; cidade/unidade persistidas são restauradas; refresh manual invoca uma atualização e unidade não dispara forecast; texto informa que previsões podem mudar e que não há alertas de emergência; atribuição Open-Meteo está visível junto aos dados.
- **Dependências:** T-24–T-28, T-33–T-35, T-53
- **Arquivos prováveis:** `src/App.tsx`
- **Requisitos:** RF1–RF8; AC15–AC25, AC32–AC37, AC17–AC18

### T-53 — Integrar a primeira tela de busca — **Status: Iniciada**
- **Tipo:** UI
- **Descrição:** Compor bootstrap, hook de busca e componentes para entregar uma primeira experiência visível antes da integração meteorológica.
- **Critérios de aceite:** Ao abrir a aplicação, campo de busca está visível; uma consulta exibe sugestões com cidade/região/país; selecionar uma sugestão mostra a cidade escolhida sem exigir forecast; o fluxo usa `useWeather` e `CitySearch`, sem fixture hard-coded na aplicação.
- **Dependências:** T-01, T-02, T-24, T-33
- **Arquivos prováveis:** `src/App.tsx`
- **Requisitos:** RF1; AC1–AC5, AC32–AC33

## Entrega 6 — Integração e qualidade

### T-40 — Testar busca e escolha de cidade ponta a ponta — **Status: Iniciada**
- **Tipo:** Test
- **Descrição:** Cobrir busca, homônimos e seleção explícita com APIs interceptadas.
- **Critérios de aceite:** Com rotas interceptadas, Playwright confirma ordem exata/prefixo/parcial, cidade/região/país, nenhuma seleção automática em homônimos, zero request para consulta vazia, mensagem sem resultados e possibilidade de iniciar busca seguinte; todas as requests Open-Meteo são interceptadas.
- **Dependências:** T-18, T-29, T-36, T-53
- **Arquivos prováveis:** `tests/e2e/city-search.spec.ts`
- **Requisitos:** RF1; AC1–AC5, AC32–AC33

### T-41 — Testar clima, previsão e unidade ponta a ponta — **Status: Iniciada**
- **Tipo:** Test
- **Descrição:** Validar a apresentação completa com fixtures de forecast.
- **Critérios de aceite:** Fixture conhecida permite assert de temperatura, condição, unidades e datas; fixture parcial mostra somente campos/dias recebidos e sinal de incompleta; alternar °C/°F confere os valores arredondados esperados e não aumenta o contador de requests forecast.
- **Dependências:** T-19, T-30–T-31, T-39
- **Arquivos prováveis:** `tests/e2e/weather-display.spec.ts`
- **Requisitos:** RF2–RF4, RF9; AC6–AC14, AC26–AC31, AC53

### T-42 — Testar falhas e fallback ponta a ponta — **Status: Iniciada**
- **Tipo:** Test
- **Descrição:** Cobrir falha de rede, timeout, 429, retry e cache stale usando rotas interceptadas.
- **Critérios de aceite:** Playwright injeta falha de rede, timeout, cache elegível/inelegível e 429; confere mensagem e fallback stale quando elegível, ausência de cache quando inelegível, botão desabilitado até `Retry-After`/60 s e contador sem chamadas automáticas adicionais.
- **Dependências:** T-19, T-30, T-37, T-39
- **Arquivos prováveis:** `tests/e2e/weather-errors.spec.ts`
- **Requisitos:** RF8; AC22–AC25, AC34, AC52

### T-43 — Testar persistência e atualização ponta a ponta — **Status: Iniciada**
- **Tipo:** Test
- **Descrição:** Validar restauração de cidade/unidade e controles de atualização.
- **Critérios de aceite:** Após reload, cidade e unidade salvas aparecem; spy de rede conta uma consulta no refresh manual e zero consultas adicionais na troca de unidade; com relógio/visibilidade controlados, não ocorre refresh automático antes de 15 minutos ou enquanto hidden, ocorre ao voltar visible após vencer e não duplica request pendente.
- **Dependências:** T-20, T-38–T-39
- **Arquivos prováveis:** `tests/e2e/weather-preferences-refresh.spec.ts`
- **Requisitos:** RF4, RF5, RF7; AC14–AC21, AC35–AC37

### T-52 — Testar fluxo principal em desktop e mobile — **Status: Iniciada**
- **Tipo:** Test
- **Descrição:** Cobrir a jornada integrada de busca até a exibição do clima e da previsão em viewports desktop e mobile.
- **Critérios de aceite:** Com Geocoding e Forecast interceptados por fixtures, Playwright executa busca, seleção, clima atual e previsão de cinco dias; o fluxo passa em 1440, 375 e 320 CSS px; em cada viewport `document.documentElement.scrollWidth` não excede `clientWidth` e o campo de busca, resultado selecionado e valores meteorológicos permanecem visíveis.
- **Dependências:** T-39
- **Arquivos prováveis:** `tests/e2e/main-flow.spec.ts`
- **Requisitos:** RF1–RF3, RF9, NFR1; AC1, AC6, AC10, AC26–AC27, AC49

### T-44 — Validar responsividade e acessibilidade — **Status: Iniciada**
- **Tipo:** Test
- **Descrição:** Registrar verificações de viewport, teclado, leitores de tela e compatibilidade.
- **Critérios de aceite:** Nos viewports 320, 375, 768, 1024 e 1440 CSS px, busca, resultados, clima, previsão, loading e erro passam sem rolagem horizontal ou conteúdo cortado; avaliação registra conformidade WCAG 2.2 AA aplicável e operabilidade por teclado, VoiceOver/Safari no iOS e macOS, TalkBack/Chrome no Android e NVDA/Firefox no Windows; checklist registra versões de Chrome, Safari, Firefox e Edge testadas, além de smoke tests em iPhone e Android reais.
- **Limite deste workshop:** executar somente verificações automatizadas e fluxos de teclado viáveis; a avaliação manual com leitores de tela, dispositivos reais e a matriz completa NFR4/NFR7 não pode ser feita neste ambiente. Manter AC42 pendente e não declarar conformidade integral até a validação em QA apropriado.
- **Dependências:** T-40–T-43, T-52
- **Arquivos prováveis:** `tests/e2e/responsive.spec.ts`, `docs/qa/compatibility-checklist.md`
- **Requisitos:** NFR1, NFR4, NFR7; AC42, AC49

#### Refinamento incremental — performance/UX de baixo risco

- **Escopo:** expor `aria-busy` no conteúdo durante loading, preservar o foco condicional após busca/retry e restringir hover a botões habilitados. Memoizar a validação da previsão sem incluir a unidade nas dependências, mantendo atualização ao mudar dados, fuso ou horário de referência.
- **Verificação:** Testing Library cobre busy durante/depois da consulta, foco por clique/teclado/retry, ausência de foco inicial, preservação de interação durante a espera e invalidação da validação da previsão. Executar `pnpm lint`, `pnpm build` e `pnpm test`.

## Entrega 7 — Operação e validação de produto

### T-45 — Documentar controle de orçamento do piloto — **Status: Concluída**
- **Tipo:** Infra
- **Descrição:** Definir a contagem operacional de chamadas e o procedimento de pausa.
- **Critérios de aceite:** O procedimento define um contador/registro que inclui cada request de geocoding, forecast, atualização e tentativa; determina pausar a admissão de sessões ao totalizar 1.000 chamadas nas 30 sessões supervisionadas e proíbe iniciar requests após a pausa; confirma que analytics de uso não será ativado.
- **Dependências:** T-39
- **Arquivos prováveis:** `docs/operations/open-meteo-pilot.md`
- **Requisitos:** NFR8, NFR9; AC55

### T-46 — Documentar gates de publicação — **Status: Não iniciada**
- **Tipo:** Infra
- **Descrição:** Registrar verificações de segurança, privacidade, termos e capacidade do provedor antes de publicação.
- **Critérios de aceite:** Checklist contém campos de evidência/aprovação de revisão formal de segurança, privacidade/consentimento e termos/atribuição; não permite marcar publicação pública como aprovada sem confirmar projeção inferior a 10.000 chamadas/dia com proteção validada contra excedente ou registrar contratação de plano/licença compatível.
- **Dependências:** T-44, T-45
- **Arquivos prováveis:** `docs/operations/release-checklist.md`
- **Requisitos:** RF6, NFR8, NFR9; AC44–AC45, AC51, AC54

### T-47 — Definir protocolo de validação de usabilidade — **Status: Não iniciada**
- **Tipo:** Test
- **Descrição:** Resolver critérios de recrutamento e preparar protocolo da tarefa de produto.
- **Critérios de aceite:** Antes de recrutar, protocolo documenta os critérios de recrutamento aprovados, tarefa individual sem ajuda, início/fim da cronometragem e registro de acerto da cidade, temperatura e condição; aprovação responsável fica registrada; nenhuma sessão começa antes da aprovação.
- **Dependências:** T-39
- **Arquivos prováveis:** `docs/research/usability-protocol.md`
- **Requisitos:** AC46

### T-48 — Executar validação de usabilidade — **Status: Não iniciada**
- **Tipo:** Test
- **Descrição:** Medir a tarefa da AC46 com participantes conforme protocolo aprovado.
- **Critérios de aceite:** O relatório contém exatamente 30 sessões individuais sem ajuda, cada uma com tempo e acerto de cidade, temperatura e condição; calcula quantas completaram os três itens em até 30 segundos; declara meta atingida se e somente se o total for pelo menos 27.
- **Dependências:** T-47
- **Arquivos prováveis:** `docs/research/usability-results.md`
- **Requisitos:** AC46