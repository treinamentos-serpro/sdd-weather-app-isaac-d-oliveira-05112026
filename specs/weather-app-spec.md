# Weather App — Especificação de Produto

## Overview

O Weather App é uma aplicação web responsiva, em pt-BR, para consultar o clima atual e a previsão diária de cinco dias de cidades ao redor do mundo. A primeira versão prioriza pessoas que consultam o clima para decisões da rotina diária, com foco em encontrar rapidamente a cidade correta e entender suas condições meteorológicas.

- **Plataforma:** navegadores em celulares e desktops.
- **Distribuição inicial:** protótipo controlado, sem publicação pública, enquanto as chamadas forem feitas diretamente do navegador.
- **Orçamento do piloto:** até 1.000 chamadas totais ao Open-Meteo nas 30 sessões supervisionadas; contar geocoding, previsão, atualizações e tentativas. Pausar o piloto ao atingir o orçamento. Esse controle é operacional, não uma cota técnica global.
- **Mercado de lançamento inicial:** Brasil. A cobertura geográfica desejada para busca e dados continua global, sujeita à disponibilidade do provedor.
- **Fonte inicial:** Open-Meteo, sem chave, para a primeira publicação como protótipo não comercial e sujeito aos termos aplicáveis. Qualquer uso comercial exige licença/plano e chave próprios.
- **Localização:** busca manual por cidade; não solicita geolocalização.
- **Idioma e convenções:** interface em pt-BR, datas localizadas, relógio de 24 horas, números no formato brasileiro e fuso local da cidade consultada.
- **Unidades:** Celsius por padrão; Fahrenheit como alternativa para temperatura. Vento em km/h e precipitação em mm.
- **Estado entre visitas:** somente a última cidade e a unidade escolhida são lembradas localmente no navegador. Não há conta nem persistência em servidor.
- **Meta de produto a validar:** em teste com 30 participantes representativos da persona prioritária, pelo menos 27 devem selecionar a cidade correta e informar corretamente a temperatura e a condição atual em até 30 segundos, sem ajuda (AC46). Critérios de recrutamento ainda precisam ser definidos.

Os valores de desempenho e disponibilidade abaixo são metas iniciais, não compromissos de serviço. A cobertura, a cadência dos modelos e a semântica do horário de referência do Open-Meteo ainda precisam ser validadas antes de fechar o tratamento de dados antigos.

## Functional Requirements

Cada requisito funcional referencia ao menos um critério de aceite na seção **Acceptance Criteria**.

| ID | Requisito |
| --- | --- |
| RF1 | A aplicação deve permitir buscar cidades por nome completo ou parcial e apresentar sugestões durante a digitação. Deve ordenar resultados por correspondência exata do nome da cidade, depois por prefixo e então por ocorrência parcial; resultados empatados mantêm a ordem recebida do provedor. Deve aceitar variantes comuns/localizadas quando suportadas pela fonte e identificar cada resultado por cidade, região/estado e país. Um resultado só pode ser selecionado se tiver nome e coordenadas válidas; deve selecionar automaticamente apenas uma correspondência única com contexto geográfico completo e, nos demais casos, exigir escolha explícita. Sem resultados, deve informar que a cidade não foi encontrada e solicitar nova consulta. Deve remover espaços no início e no fim da consulta; consultas vazias não devem ser enviadas. Acentos e pontuação válida em nomes de cidades devem ser preservados na busca. |
| RF2 | Para a cidade selecionada, a aplicação deve exibir temperatura, condição do tempo, sensação térmica, umidade, vento e precipitação. A condição deve ser apresentada em pt-BR; temperatura e sensação térmica usam a unidade selecionada, umidade usa %, vento usa km/h e precipitação usa mm. Todas as temperaturas são exibidas em graus inteiros, arredondando para o inteiro mais próximo e, em empate, afastando de zero; converter para a unidade selecionada antes de arredondar. Deve mostrar “Dados referentes a HH:mm” no fuso local da cidade, sem apresentar esse horário como observação de estação ou publicação do modelo. O horário de referência deve ser um instante não futuro e ter no máximo 60 minutos de idade no momento em que os dados são avaliados para exibição, para que sejam apresentados como atuais. A idade da execução do modelo deve ser apresentada separadamente somente quando houver metadado confiável; se ausente ou inválido, deve ser identificada como “Indisponível” e nunca inferida a partir do horário de referência. Se o horário de referência for futuro, inválido ou tiver mais de 60 minutos, a aplicação deve indicar que os dados estão desatualizados ou indisponíveis e oferecer nova tentativa; dados em cache podem ser exibidos somente conforme RF8. Se alguns campos estiverem ausentes, deve identificá-los como “Indisponível”, sem substituí-los por zero. |
| RF3 | A aplicação deve apresentar a previsão diária de cinco dias: o dia atual no fuso local da cidade e os quatro dias seguintes. Cada dia deve incluir condição do tempo e temperaturas mínima/máxima, formatadas conforme a precisão definida em RF2. Se a resposta estiver incompleta, deve mostrar os dias e valores disponíveis, identificar os campos ausentes como “Indisponível” e sinalizar que a previsão está incompleta, sem inventar dados. |
| RF4 | A aplicação deve permitir alternar entre Celsius e Fahrenheit para temperatura. Celsius é o padrão. A preferência deve ser mantida localmente entre visitas no mesmo navegador; vento permanece em km/h e precipitação em mm, independentemente da unidade escolhida ou do país. |
| RF5 | A aplicação deve lembrar localmente a última cidade consultada e restaurá-la ao retornar, sem conta, sincronização ou armazenamento em servidor. |
| RF6 | A aplicação deve informar de forma breve que previsões podem mudar e que não oferece alertas de emergência. Ao exibir dados do Open-Meteo, deve atribuir a fonte conforme a licença e os termos de uso aplicáveis. |
| RF7 | A aplicação deve buscar dados ao abrir ou selecionar uma cidade, atualizar automaticamente a cada 15 minutos enquanto a página estiver visível e oferecer atualização manual. O intervalo é contado desde o início da última tentativa de consulta. A atualização automática deve pausar quando a página estiver oculta; ao retornar à visibilidade, deve atualizar imediatamente se já tiverem transcorrido 15 minutos. Enquanto uma consulta estiver em andamento para a mesma cidade, não deve iniciar outra consulta; um acionamento manual nesse período é atendido pela consulta em andamento e não gera uma consulta adicional. |
| RF8 | Em falha de rede ou do provedor, a aplicação deve apresentar um erro compreensível e uma opção de nova tentativa. Se nenhuma resposta válida chegar em até cinco segundos do início da consulta, deve encerrar o carregamento e apresentar um erro de timeout com opção de nova tentativa. Em HTTP 429, não deve repetir automaticamente; deve respeitar `Retry-After` e, se ausente, aguardar 60 segundos antes de permitir nova tentativa manual. O cache local contém somente os dados meteorológicos necessários à tela (clima atual e previsão de cinco dias) e seus metadados de origem: cidade selecionada, fuso, timestamp de referência e instante de armazenamento (`storedAt`). Em qualquer falha, se houver cache armazenado há até três horas, inclusive, e com timestamp de referência válido, deve exibi-lo identificado como desatualizado e mostrar o horário meteorológico de origem. O limite de três horas é contado desde `storedAt`, não desde o timestamp meteorológico. Se não houver cache elegível, não deve exibir dados em cache. |
| RF9 | A aplicação deve apresentar datas e horários no fuso local da cidade, em pt-BR e com relógio de 24 horas; valores numéricos devem usar vírgula decimal e ponto de milhar. “Hoje” na previsão deve ser determinado pelo calendário local da cidade, não pelo fuso do dispositivo. |

## Provider Contract

- **Geocoding:** usar `results[].name`, `admin1` e `country` para identificar o local; usar `latitude` e `longitude` para consultar a previsão. Um resultado sem nome ou coordenadas válidas não pode ser selecionado. Se faltar contexto geográfico para diferenciar resultados, exigir escolha explícita.
- **Clima atual:** usar `current.time` como horário de referência dos valores atuais e `timezone` como fuso IANA para apresentação local. Mapear `temperature_2m`, `apparent_temperature`, `relative_humidity_2m`, `precipitation`, `wind_speed_10m` e `weather_code` para os campos de RF2.
- **Previsão diária:** usar `daily.time`, `weather_code`, `temperature_2m_min` e `temperature_2m_max`; uma resposta completa contém cinco registros consecutivos no fuso da cidade.
- **Idade do modelo:** as respostas do endpoint de previsão inspecionadas em 2026-11-05 não continham metadado confiável de timestamp da execução do modelo. Para essa resposta, apresentar a idade do modelo como “Indisponível”; não usar `generationtime_ms` ou `current.time` como substituto.
- **Validação da amostra:** em consultas pontuais de 2026-11-05, geocoding retornou candidatos nas 34 localidades da amostra do discovery; previsão retornou os campos solicitados e cinco registros nas oito cidades globais testadas. Uma consulta de geocoding teve falha de rede transitória e foi confirmada em nova tentativa. Essa amostra não garante cobertura de outras localidades nem disponibilidade futura do provedor.

## User Stories

- **US1 — Consulta da rotina (RF1, RF2):** Como quem decide a rotina do dia, quero buscar minha cidade e consultar o clima atual para decidir o que vestir ou levar.
- **US2 — Cidade correta (RF1):** Como quem acompanha outra cidade, quero distinguir resultados com nomes iguais pelo contexto geográfico para consultar o local certo.
- **US3 — Planejamento de viagem (RF3, RF9):** Como quem planeja uma viagem, quero ver a previsão dos próximos cinco dias no fuso local da cidade para escolher datas e organizar atividades.
- **US4 — Unidade de temperatura (RF4):** Como quem decide a rotina do dia, quero alternar Celsius e Fahrenheit para interpretar a temperatura na unidade que prefiro.
- **US5 — Consulta recorrente (RF4, RF5):** Como quem acompanha outra cidade, quero que minha última cidade e unidade preferida sejam lembradas no navegador para retomar a consulta com menos etapas.
- **US6 — Falha ou dados antigos (RF8):** Como quem planeja uma viagem, quero identificar dados desatualizados ou indisponíveis e poder tentar novamente para avaliar se posso usar a previsão.
- **US7 — Limites e fonte (RF6):** Como quem acompanha outra cidade, quero ver a fonte meteorológica e saber que previsões podem mudar e que o app não oferece alertas de emergência para entender os limites das informações.
- **US8 — Atualização do clima (RF7):** Como quem decide a rotina do dia, quero atualizar os dados automaticamente enquanto consulto a cidade ou solicitar uma atualização manual para tomar decisões com informações recentes.

## Traceability Matrix

| User Story | Requisitos funcionais | Critérios de aceite | Requisitos não funcionais relevantes |
| --- | --- | --- | --- |
| US1 — Consulta da rotina | RF1, RF2 | AC1–AC3, AC5–AC9, AC29–AC30, AC32–AC33, AC47–AC48 | NFR1, NFR2, NFR3, NFR4, NFR5, NFR6, NFR7 |
| US2 — Cidade correta | RF1 | AC1–AC5, AC32–AC33 | NFR1, NFR4, NFR7 |
| US3 — Planejamento de viagem | RF3, RF9 | AC10, AC26–AC28, AC31 | NFR1, NFR2, NFR3, NFR4, NFR5, NFR7 |
| US4 — Unidade de temperatura | RF4 | AC11–AC14, AC53 | NFR1, NFR4, NFR7, NFR8 |
| US5 — Consulta recorrente | RF4, RF5 | AC11–AC16 | NFR1, NFR4, NFR7, NFR8 |
| US6 — Falha ou dados antigos | RF2, RF8 | AC9, AC22–AC25, AC30, AC34, AC52 | NFR1, NFR3, NFR4, NFR5, NFR6, NFR7, NFR9 |
| US7 — Limites e fonte | RF6 | AC17–AC18 | NFR4, NFR7, NFR9 |
| US8 — Atualização do clima | RF7 | AC19–AC21, AC35–AC37 | NFR1, NFR3, NFR4, NFR5, NFR7, NFR9 |

## Acceptance Criteria

Cada cenário usa os termos **Dado**, **Quando** e **Então** (Given/When/Then). Os cenários que dependem de cobertura ou semântica do provedor requerem os dados de teste definidos nas **Open Questions**.

### RF1 — Busca de cidades

- **AC1**
	- **Dado:** uma busca retorna resultados com nomes exatos, nomes iniciados pelo texto digitado e nomes que contêm esse texto parcialmente.
	- **Quando:** a pessoa digitar ou alterar um nome completo ou parcial e a busca retornar.
	- **Então:** a aplicação apresenta primeiro correspondências exatas, depois prefixos e depois correspondências parciais; preserva a ordem do provedor entre resultados da mesma categoria e mostra cidade, região/estado e país.

- **AC2**
	- **Dado:** uma variante localizada de um nome cadastrada entre as correspondências suportadas pelo provedor.
	- **Quando:** a pessoa pesquisar essa variante.
	- **Então:** a cidade correspondente aparece nos resultados.

- **AC3**
	- **Dado:** a busca retorna exatamente um resultado com nome, contexto geográfico completo e coordenadas válidas.
	- **Quando:** os resultados forem apresentados.
	- **Então:** essa cidade é selecionada sem exigir escolha adicional.

- **AC4**
	- **Dado:** a busca retorna duas ou mais correspondências ou um único resultado sem contexto geográfico completo.
	- **Quando:** os resultados forem apresentados.
	- **Então:** nenhuma cidade é selecionada automaticamente; os resultados disponíveis são mostrados para escolha explícita da pessoa.

- **AC5**
	- **Dado:** a busca não retorna correspondências.
	- **Quando:** a resposta da busca for apresentada.
	- **Então:** a aplicação informa que a cidade não foi encontrada e permite iniciar outra busca, sem exibir dados de outra cidade como resultado.

- **AC32**
	- **Dado:** o campo de busca está vazio ou contém somente espaços.
	- **Quando:** a pessoa tentar iniciar a busca.
	- **Então:** a aplicação não envia uma consulta ao serviço de geocoding e informa que é necessário digitar o nome de uma cidade.

- **AC33**
	- **Dado:** a consulta contém acentos ou pontuação válida em nomes de cidades, como hífen ou apóstrofo.
	- **Quando:** a pessoa iniciar a busca.
	- **Então:** a aplicação preserva esses caracteres na consulta e apresenta os resultados correspondentes retornados pelo provedor, sem removê-los ou substituí-los.

### RF2 — Clima atual

- **AC6**
	- **Dado:** a cidade selecionada possui todos os dados atuais solicitados.
	- **Quando:** a consulta termina com sucesso.
	- **Então:** a tela exibe condição em pt-BR, temperatura e sensação térmica na unidade selecionada, umidade em %, vento em km/h e precipitação em mm.

- **AC7**
	- **Dado:** a cidade possui um horário de referência para os dados atuais.
	- **Quando:** esses dados forem exibidos.
	- **Então:** a tela mostra “Dados referentes a HH:mm” convertido para o fuso local da cidade e não o descreve como observação de estação nem como horário de publicação ou atualização do modelo.

- **AC8**
	- **Dado:** um horário de referência válido que não é futuro e cuja idade é de até 60 minutos, inclusive exatamente 60 minutos.
	- **Quando:** a aplicação avaliar a atualidade no instante em que os dados serão exibidos.
	- **Então:** o dado é considerado dentro da meta de uma hora.

- **AC9**
	- **Dado:** um horário de referência válido com idade superior a 60 minutos.
	- **Quando:** a aplicação avaliar a atualidade no instante em que os dados serão exibidos.
	- **Então:** o dado não é apresentado como atual; a aplicação informa que os dados estão desatualizados ou indisponíveis e oferece nova tentativa. Dados em cache só podem ser exibidos conforme AC23 e AC24.

- **AC29**
	- **Dado:** uma resposta bem-sucedida com um ou mais campos do clima atual ausentes e um horário de referência válido dentro da meta de uma hora.
	- **Quando:** a aplicação apresentar o clima atual.
	- **Então:** exibe os valores disponíveis e mostra “Indisponível” em cada campo ausente, sem substituir ausências por zero.

- **AC30**
	- **Dado:** uma resposta do clima atual sem horário de referência, com horário inválido ou com horário futuro.
	- **Quando:** a aplicação avaliar a atualidade dos dados.
	- **Então:** não apresenta os dados como atuais, informa que a atualidade não pôde ser confirmada, oferece nova tentativa e aplica a regra de cache definida em AC23 e AC24.

- **AC47**
	- **Dado:** a fonte fornece horários válidos para a referência do valor e para a execução do modelo.
	- **Quando:** a aplicação apresenta o clima atual.
	- **Então:** mostra “Dados referentes a HH:mm” e a idade da execução do modelo como informações separadas, sem usar um horário para inferir o outro.

- **AC48**
	- **Dado:** a fonte não fornece um horário válido e confiável para a execução do modelo, mas o horário de referência do valor é válido e está dentro da meta de uma hora.
	- **Quando:** a aplicação apresenta o clima atual.
	- **Então:** exibe os dados do clima atual e mostra “Idade da execução do modelo: Indisponível”, sem calculá-la a partir do horário de referência do valor.

### RF3 — Previsão diária

- **AC10**
	- **Dado:** a resposta contém uma previsão completa para os cinco dias da cidade selecionada.
	- **Quando:** a previsão for exibida.
	- **Então:** são apresentados exatamente cinco dias consecutivos, começando pelo dia atual no fuso da cidade, e cada dia inclui condição do tempo e temperaturas mínima e máxima.

- **AC31**
	- **Dado:** a resposta da previsão contém menos de cinco dias ou tem campos meteorológicos ausentes em um ou mais dias.
	- **Quando:** a aplicação apresentar a previsão.
	- **Então:** mostra somente os dias e valores recebidos, identifica os campos ausentes como “Indisponível” e informa que a previsão está incompleta, sem criar dias ou valores.

### RF4 — Unidades

- **AC11**
	- **Dado:** não há preferência de unidade salva.
	- **Quando:** a aplicação exibir dados de temperatura.
	- **Então:** usa Celsius e identifica a unidade.

- **AC12**
	- **Dado:** um conjunto de dados com temperatura e sensação térmica de 0 °C e 20 °C.
	- **Quando:** a pessoa selecionar Fahrenheit.
	- **Então:** os valores correspondentes são exibidos como 32 °F e 68 °F, respectivamente, com as unidades identificadas.

- **AC13**
	- **Dado:** vento e precipitação estão sendo exibidos.
	- **Quando:** a pessoa alternar entre Celsius e Fahrenheit.
	- **Então:** vento continua em km/h e precipitação continua em mm, sem alteração de valor causada pela troca de unidade.

- **AC53**
	- **Dado:** a fonte retorna temperatura atual de 18 °C e sensação térmica de 19 °C.
	- **Quando:** a pessoa seleciona Fahrenheit.
	- **Então:** a aplicação converte antes de arredondar e exibe 64 °F e 66 °F, respectivamente, como graus inteiros.

- **AC14**
	- **Dado:** a pessoa selecionou Fahrenheit.
	- **Quando:** retornar à aplicação no mesmo navegador.
	- **Então:** Fahrenheit continua selecionado.

### RF5 — Última cidade

- **AC15**
	- **Dado:** a pessoa consultou uma cidade.
	- **Quando:** fechar e reabrir a aplicação no mesmo navegador.
	- **Então:** a última cidade consultada é restaurada sem solicitar autenticação.

- **AC16**
	- **Dado:** os dados locais da aplicação foram apagados.
	- **Quando:** a pessoa abrir a aplicação.
	- **Então:** nenhuma cidade anterior é restaurada e a aplicação continua utilizável.

### RF6 — Limitações e fonte

- **AC17**
	- **Dado:** a aplicação apresenta sua interface.
	- **Quando:** a pessoa consultar qualquer cidade.
	- **Então:** encontra uma mensagem informando que previsões podem mudar e que o app não oferece alertas de emergência.

- **AC18**
	- **Dado:** a aplicação exibe dados meteorológicos do Open-Meteo.
	- **Quando:** os dados forem apresentados.
	- **Então:** a atribuição ao Open-Meteo está visível na interface.

### RF7 — Atualização de dados

- **AC19**
	- **Dado:** uma cidade foi aberta ou selecionada.
	- **Quando:** a seleção for confirmada.
	- **Então:** a aplicação inicia uma consulta de dados para essa cidade.

- **AC20**
	- **Dado:** a página permanece visível com uma cidade selecionada e não há consulta em andamento para ela.
	- **Quando:** transcorrerem 15 minutos desde o início da última tentativa.
	- **Então:** a aplicação inicia uma nova consulta para essa cidade.

- **AC21**
	- **Dado:** há uma cidade selecionada e nenhuma consulta está em andamento para ela.
	- **Quando:** a pessoa acionar o controle de atualização manual.
	- **Então:** a aplicação inicia uma nova consulta sem aguardar o próximo intervalo automático.

### RF8 — Falhas e cache

- **AC22**
	- **Dado:** uma consulta falhou por erro de rede ou do provedor.
	- **Quando:** a falha for detectada.
	- **Então:** a aplicação apresenta uma mensagem de erro e uma ação de nova tentativa.

- **AC23**
	- **Dado:** uma consulta falhou e há cache armazenado há até três horas, inclusive, com timestamp meteorológico de origem válido.
	- **Quando:** a aplicação apresentar o estado da consulta.
	- **Então:** exibe os dados em cache identificados como desatualizados e mostra o timestamp meteorológico de origem; o TTL é calculado desde o instante de armazenamento.

- **AC24**
	- **Dado:** uma consulta falhou e não há cache elegível, o timestamp meteorológico de origem é inválido ou o cache foi armazenado há mais de três horas.
	- **Quando:** a aplicação apresentar o estado da consulta.
	- **Então:** não exibe dados em cache e oferece nova tentativa.

- **AC25**
	- **Dado:** a aplicação apresenta uma falha com ação de nova tentativa.
	- **Quando:** a pessoa acionar essa ação.
	- **Então:** uma nova consulta é iniciada.

- **AC52**
	- **Dado:** o provedor retorna HTTP 429 com ou sem o header `Retry-After`.
	- **Quando:** a aplicação processar a resposta.
	- **Então:** não repete a consulta automaticamente, mostra uma mensagem de limite temporário, aplica o cache elegível de AC23/AC24 e mantém a nova tentativa desabilitada até o prazo de `Retry-After` ou por 60 segundos se o header estiver ausente.

- **AC34**
	- **Dado:** uma consulta foi iniciada e nenhuma resposta válida foi recebida.
	- **Quando:** o prazo de cinco segundos desde o início da consulta terminar sem resposta válida.
	- **Então:** a aplicação encerra o carregamento, apresenta um erro de timeout e uma ação de nova tentativa, e aplica a regra de cache definida em AC23 e AC24.

- **AC35**
	- **Dado:** há uma cidade selecionada e a página está oculta.
	- **Quando:** transcorrer um intervalo de 15 minutos.
	- **Então:** a aplicação não inicia uma consulta automática enquanto a página permanecer oculta.

- **AC36**
	- **Dado:** há uma cidade selecionada, a página estava oculta, não há consulta em andamento e já transcorreram pelo menos 15 minutos desde o início da última tentativa.
	- **Quando:** a página voltar à visibilidade.
	- **Então:** a aplicação inicia imediatamente uma consulta para a cidade selecionada.

- **AC37**
	- **Dado:** há uma consulta em andamento para uma cidade.
	- **Quando:** vencer o intervalo automático ou a pessoa solicitar atualização manual para a mesma cidade.
	- **Então:** a aplicação não inicia uma segunda consulta concorrente; a consulta em andamento atende à atualização solicitada.

### NFR1 — Responsividade

- **AC49**
	- **Dado:** a aplicação está nas larguras de viewport de 320, 375, 768, 1024 e 1440 CSS pixels.
	- **Quando:** forem exibidas as telas de busca, resultados, clima atual, previsão, carregamento e erro.
	- **Então:** não há rolagem horizontal, conteúdo cortado nem controle inacessível por teclado em nenhuma largura testada.

### NFR2 — Performance de interface

- **AC40**
	- **Dado:** há menos de 500 carregamentos móveis elegíveis nos últimos 28 dias.
	- **Quando:** o LCP p75 for avaliado.
	- **Então:** o resultado é reportado como inconclusivo, sem declarar a meta aprovada ou reprovada.

- **AC41**
	- **Dado:** há pelo menos 500 carregamentos móveis elegíveis nos últimos 28 dias.
	- **Quando:** o LCP p75 for calculado.
	- **Então:** a meta é aprovada se o percentil 75 for de até 2,5 segundos; caso contrário, é reprovada.

### Validação de produto

- **AC46**
	- **Dado:** 30 participantes da persona prioritária recebem individualmente o nome de uma cidade-alvo e não recebem ajuda durante a tarefa.
	- **Quando:** o cronômetro iniciar ao revelar a cidade-alvo e parar quando o participante selecionar a cidade correta e informar corretamente a temperatura e a condição atual exibidas.
	- **Então:** a meta é atingida se pelo menos 27 participantes concluírem as três ações em até 30 segundos.

### NFR3 — Resposta percebida

- **AC38**
	- **Dado:** uma consulta foi iniciada e uma resposta válida chega em até cinco segundos, inclusive exatamente no limite.
	- **Quando:** a resposta for recebida.
	- **Então:** a aplicação exibe os dados e encerra o estado de carregamento em até cinco segundos desde o início da consulta.

### NFR5 — Disponibilidade

- **AC39**
	- **Dado:** um período mensal de apuração com verificações sintéticas externas programadas a cada minuto.
	- **Quando:** a disponibilidade da interface for calculada, excluindo somente verificações em janelas de manutenção anunciadas com pelo menos sete dias de antecedência.
	- **Então:** uma verificação conta como disponível se a interface carregar e o campo de busca aceitar texto; verificações não executadas contam como indisponíveis. Calcular disponibilidade como verificações disponíveis divididas pelas verificações programadas menos as verificações excluídas de manutenção, multiplicado por 100; a meta é pelo menos 99,5%. Falhas do Open-Meteo não tornam essa verificação indisponível.

### NFR4 — Acessibilidade

- **AC42**
	- **Dado:** os fluxos de busca, seleção de cidade, consulta do clima, previsão, erro e nova tentativa.
	- **Quando:** forem testados por teclado e manualmente com VoiceOver/Safari no iOS, TalkBack/Chrome no Android, NVDA/Firefox no Windows e VoiceOver/Safari no macOS.
	- **Então:** todos os controles e informações desses fluxos são encontrados e operáveis, e todos os critérios WCAG 2.2 nível AA aplicáveis passam na avaliação.
	- **Detalhamento de UX:** o conteúdo consultado expõe `aria-busy` durante loading. Após busca ou nova tentativa, o foco vai para o conteúdo atualizado somente se a pessoa não tiver movido o foco para outro controle durante a espera; a montagem inicial não move o foco. Controles desabilitados não apresentam o estado visual de hover ativo.

### NFR8 — Privacidade

- **AC43**
	- **Dado:** uma métrica agregada real de performance ou disponibilidade é registrada após aprovação de privacidade.
	- **Quando:** o registro for criado.
	- **Então:** não contém cidade pesquisada, unidade escolhida nem identificador pessoal.

- **AC50**
	- **Dado:** um registro de métrica agregada real está armazenado.
	- **Quando:** completar 90 dias desde a coleta.
	- **Então:** o registro é removido e deixa de estar disponível para consulta.

- **AC44**
	- **Dado:** uma versão candidata à publicação.
	- **Quando:** a revisão formal do baseline corporativo de segurança for concluída.
	- **Então:** a aprovação e as evidências exigidas estão registradas antes da publicação; pendências bloqueadoras impedem o lançamento.

- **AC54**
	- **Dado:** uma versão candidata à publicação pública usando o plano gratuito do Open-Meteo.
	- **Quando:** Produto/Jurídico revisar o uso planejado e os termos aplicáveis.
	- **Então:** a confirmação documentada de que o uso é não comercial e de que as obrigações de atribuição são atendidas está registrada; sem essa confirmação, a publicação é bloqueada.

- **AC45**
	- **Dado:** métricas agregadas reais serão ativadas em um mercado de lançamento.
	- **Quando:** a coleta for configurada para esse mercado.
	- **Então:** a aprovação de privacidade e a regra de consentimento aplicável estão registradas; a coleta permanece desativada se qualquer uma estiver pendente.

- **AC51**
	- **Dado:** uma versão candidata à publicação pública usa chamadas diretas ao Open-Meteo.
	- **Quando:** o gate de operação do provedor for avaliado.
	- **Então:** a publicação é bloqueada até que a projeção de chamadas fique abaixo do limite de 10.000 por dia e exista proteção validada contra excedê-lo, ou até que plano/licença compatível tenha sido contratado.

- **AC55**
	- **Dado:** o protótipo controlado está em execução e o contador de chamadas inclui geocoding, previsão, atualizações e tentativas.
	- **Quando:** o total atingir 1.000 chamadas.
	- **Então:** novas sessões são pausadas e nenhuma nova chamada é iniciada até revisão do orçamento.

### RF9 — Datas, horários e números

- **AC26**
	- **Dado:** o fuso da cidade está em uma data diferente do fuso do dispositivo.
	- **Quando:** a previsão for exibida.
	- **Então:** o primeiro dia corresponde à data atual da cidade e os quatro seguintes são datas locais consecutivas.

- **AC27**
	- **Dado:** a interface exibe datas e horários de uma cidade.
	- **Quando:** esses valores forem apresentados.
	- **Então:** usam a localização pt-BR, o fuso da cidade e relógio de 24 horas.

- **AC28**
	- **Dado:** a interface exibe valores numéricos.
	- **Quando:** esses valores tiverem parte decimal ou magnitude igual ou superior a mil.
	- **Então:** usam vírgula como separador decimal e ponto como separador de milhar.

## Non-Functional Requirements

- **NFR1 — Responsividade:** suportar viewports de 320 px a 1440 px. Validar as larguras de 320, 375, 768, 1024 e 1440 CSS pixels nos fluxos e estados definidos em AC49, sem rolagem horizontal, conteúdo cortado ou controles inacessíveis por teclado.
- **NFR2 — Performance de interface:** meta inicial de LCP de até 2,5 s no percentil 75 em dispositivos móveis, avaliada em janela móvel de 28 dias com pelo menos 500 carregamentos elegíveis em viewports de 320 a 767 CSS pixels. Abaixo desse limiar, reportar resultado inconclusivo. Testes de laboratório em Android intermediário/4G antes do lançamento são diagnósticos e não substituem a avaliação real. Coletar métricas agregadas mínimas após aprovação de privacidade, sem registrar cidade pesquisada ou unidade escolhida. Medir a renderização separadamente da resposta do provedor.
- **NFR3 — Resposta percebida:** em até 5 s do início de uma consulta, apresentar dados válidos se a resposta chegar dentro do prazo; caso contrário, encerrar o carregamento com timeout e opção de nova tentativa. A latência do provedor deve ser acompanhada separadamente; o limite é para o estado visível ao usuário, não uma garantia de resposta do serviço externo.
- **NFR4 — Acessibilidade:** atender WCAG 2.2 nível AA. Verificar com ferramentas automatizadas, avaliação manual por teclado e leitores de tela nas combinações VoiceOver/Safari no iOS, TalkBack/Chrome no Android, NVDA/Firefox no Windows e VoiceOver/Safari no macOS.
- **NFR5 — Disponibilidade:** meta inicial de 99,5% ao mês para a interface do aplicativo acessível e operável, independentemente do Open-Meteo. A medição primária usa uma verificação sintética externa por minuto; uma verificação passa quando a interface carrega e o campo de busca aceita texto. Excluir do denominador somente verificações durante manutenção programada anunciada com pelo menos sete dias de antecedência; falhas não planejadas contam como indisponibilidade. Métricas agregadas de sessões reais complementam a medição sintética, condicionadas à aprovação de privacidade. Acompanhar separadamente os resultados do geocoding, do clima atual com timestamp válido e da previsão completa de cinco dias, sem identificadores de cidade ou pessoa. Não definir metas numéricas para esses indicadores na primeira versão; revisar a linha de base após 30 dias de dados.
- **NFR6 — Atualidade:** a meta para o horário de referência do clima atual é de no máximo uma hora em relação à consulta. A interface deve mostrar esse horário no fuso local, sem afirmar que representa observação meteorológica ou idade da execução do modelo. A idade da execução deve ser exibida separadamente quando houver metadado confiável; se ausente ou inválido, deve ser apresentada como indisponível, sem inferência. A semântica dos campos temporais fornecidos pelo provedor ainda precisa ser validada.
- **NFR7 — Compatibilidade:** alvo de teste nas duas versões principais mais recentes de Chrome, Safari, Firefox e Edge, incluindo Safari no iOS e Chrome no Android. Considerar iOS, Android, Windows, macOS e Ubuntu, na versão atual e nas duas versões principais anteriores suportadas pelo fornecedor. Emular a matriz e realizar smoke tests em pelo menos um iPhone e um Android reais; validar desktop nos navegadores dos sistemas da matriz. A QA seleciona os modelos físicos em cada ciclo e registra modelos, versões de sistema e navegadores testados.
- **NFR8 — Segurança e privacidade:** seguir o baseline corporativo de segurança aplicável a web apps e concluir revisão formal, com aprovação e evidências registradas, antes da publicação; pendências bloqueadoras impedem o lançamento. Não fazer analytics de uso. Para o lançamento inicial no Brasil, métricas agregadas mínimas de performance e disponibilidade de sessões reais só podem ser ativadas após revisão de privacidade considerando a LGPD e configuração do consentimento aplicável. Em novos mercados, manter a coleta desativada até a revisão local e aprovação do consentimento. Não registrar cidade pesquisada ou unidade escolhida e reter métricas por no máximo 90 dias.
- **NFR9 — Operação do provedor:** a versão inicial é um protótipo não comercial, controlado e não público, com chamadas diretas ao Open-Meteo; registrar e acompanhar o volume. O piloto tem orçamento operacional de 1.000 chamadas totais para 30 sessões supervisionadas e deve ser pausado ao atingir esse limite (AC55). Antes de qualquer publicação pública no plano gratuito, exigir a confirmação documentada de Produto/Jurídico sobre o enquadramento não comercial e a atribuição (AC54). O plano gratuito tem limite documentado de 10.000 chamadas por dia e não oferece garantia de disponibilidade. Bloquear publicação pública até estimar o volume agregado de busca, atualizações e novas tentativas, validar proteção contra exceder o limite ou contratar plano/licença compatível. Qualquer uso comercial exige licença/plano e chave próprios.

## Edge Cases

- Busca com nome parcial, variante localizada, acentos ou grafia alternativa não suportada pela fonte.
- Vários locais com o mesmo nome, resultados sem região/estado ou país, e busca sem resultados.
- Entrada vazia, somente espaços ou consulta alterada enquanto sugestões anteriores ainda estão visíveis.
- Falha de rede, timeout, indisponibilidade, resposta incompleta ou limite de requisições do provedor.
- Seleção de cidade sem clima atual, sem previsão de cinco dias ou sem algum dos campos meteorológicos esperados.
- Horário de referência ausente, inválido ou com mais de uma hora em relação à consulta; execução do modelo mais antiga que a referência apresentada.
- Consulta próxima à meia-noite local, mudanças de fuso/data e dispositivo em fuso diferente da cidade.
- Cache com idade inferior ou igual a três horas, cache com idade superior a três horas ou horário do cache desconhecido.
- Preferência local ausente, inválida ou removida; última cidade salva que já não retorna resultados.
- Valores negativos, precipitação nula, umidade ou temperatura ausentes, e conversão de temperatura que possa causar arredondamento.
- Página oculta durante o intervalo de atualização e retorno à visibilidade; nova tentativa solicitada enquanto outra consulta está em andamento.
- Tela compacta, ampliação de texto, navegação por teclado e tecnologia assistiva durante busca, carregamento, erro e exibição dos resultados.

## Assumptions

- O acesso a novos dados requer conexão à internet. Não haverá modo offline completo; cache é somente fallback em falha e por até três horas.
- A primeira publicação está definida como protótipo não comercial; Produto/Jurídico deve confirmar antes da publicação que o uso planejado se enquadra nos termos do Open-Meteo.
- A cobertura geográfica desejada é global, mas disponibilidade e qualidade dos dados variam e não estão garantidas para todos os locais.
- Sugestões e variantes de busca dependem dos campos e capacidades efetivamente disponibilizados pelo provedor.
- Personas, meta de 90% em até 30 segundos e demais metas de experiência são hipóteses para validação com usuários, não garantias de resultado.
- A interface fica em pt-BR mesmo quando a cidade consultada está em outro país; as unidades de vento e precipitação continuam fixas em km/h e mm.
- A última cidade e a unidade são armazenadas somente no navegador e não são sincronizadas entre dispositivos.
- Uma chamada frequente à API não implica que o modelo meteorológico tenha sido atualizado com a mesma frequência.

## Risks

| Risco | Impacto | Mitigação |
| --- | --- | --- |
| Indisponibilidade, latência ou limite de uso do provedor | Consultas podem falhar ou demorar; o plano gratuito não oferece garantia de uptime. | Exibir falha e nova tentativa; monitorar provedor e consulta completa separadamente; validar volume e limites antes da publicação. |
| Dados desatualizados, cobertura ou precisão insuficientes | Pode haver resultados incompletos ou decisões baseadas em informação inadequada. | Validar cidades representativas globalmente, campos, fusos, cobertura e cadência; identificar o horário de referência e sinalizar dados em cache. |
| Confusão entre horário de referência e atualização do modelo | A pessoa pode interpretar dados interpolados ou antigos como observações atuais. | Usar rótulo neutro; não afirmar observação ou publicação do modelo; validar semântica e definir tratamento para valores fora da meta. |
| Cidade homônima ou seleção incorreta | A tela pode apresentar clima de outro local. | Mostrar cidade, região/estado e país; exigir escolha quando houver múltiplas correspondências. |
| Uso fora da licença gratuita ou além dos limites | Risco de bloqueio, custo, violação de termos ou indisponibilidade. | Confirmar caráter não comercial, atribuição e volume; exigir licença/plano e chave próprios antes de qualquer uso comercial. |
| Datas, conversões ou fusos incorretos | Reduz confiança e pode mostrar previsão para o dia errado. | Validar conversões e formatos; testar virada de dia e fusos distintos do dispositivo e da cidade. |
| Interface inacessível ou incompatível | Pessoas podem não conseguir consultar o produto em dispositivos ou tecnologias assistivas. | Validar WCAG 2.2 AA, matriz de navegadores e viewports, emulação e aparelhos móveis reais. |
| Persistência local ou telemetria incompatível com requisitos de privacidade | Pode haver coleta ou retenção inadequada. | Limitar dados a cidade/unidade no navegador; não registrar buscas; aprovar telemetria agregada e retenção em revisão de privacidade antes de ativá-la. |
| Previsão confundida com alerta de emergência | A pessoa pode acreditar que será avisada de condições severas. | Exibir a limitação de forma breve e não oferecer alertas ou notificações nesta versão. |

## Out of Scope

- Aplicativos nativos, PWA e experiência offline completa.
- Autenticação, contas, sincronização entre dispositivos ou persistência em servidor.
- Geolocalização automática.
- Favoritos e histórico de cidades consultadas.
- Previsões horárias.
- Alertas de tempo severo, notificações ou qualquer serviço de emergência.
- Analytics de uso, incluindo registro da cidade pesquisada ou unidade selecionada.
- Uso comercial da API gratuita do Open-Meteo. Uma versão comercial depende de licença/plano e chave próprios.
- Garantia de cobertura global, precisão meteorológica ou disponibilidade do provedor.

## Open Questions

1. Quais critérios de recrutamento e protocolo de teste serão usados para selecionar 30 participantes representativos da persona prioritária e medir a tarefa da AC46?
2. Quais metas numéricas serão adotadas para os indicadores separados de geocoding, clima atual e previsão após a revisão da linha de base de 30 dias?