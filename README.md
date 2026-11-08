<div align="center">

# SDD Weather App

### Treinamento hands-on de **Spec-Driven Development** com **GitHub Copilot**

**Brief → Spec → Plan → Tasks → Code → Test → Review → Ship**

</div>

---

Este repositório é um **laboratório de treinamento de 8 horas** que ensina a
construir software guiado por especificação (**Spec-Driven Development**) usando
o **GitHub Copilot** em todas as etapas. O projeto final é um **Weather App** em
React + TypeScript que consome a API Open-Meteo.

> ## Princípio central
> **NÃO COMECE PELO CÓDIGO.** Sempre: **Spec → Plan → Tasks → Code.**

---

## O workshop

Comece pelo **[Guia do Workshop](workshop/GUIDE.md)** e siga os módulos em ordem.

| # | Módulo | Fase | Duração |
| --- | --- | --- | --- |
| 01 | [Setup](workshop/module-01-setup/README.md) | Preparação | 30 min |
| 02 | [Understanding the Problem](workshop/module-02-discovery/README.md) | Discovery | 45 min |
| 03 | [Writing the Specification](workshop/module-03-spec/README.md) | Spec | 50 min |
| 04 | [Creating the Technical Plan](workshop/module-04-plan/README.md) | Plan | 45 min |
| 05 | [Breaking Down Tasks](workshop/module-05-tasks/README.md) | Tasks | 40 min |
| 06 | [Building the UI](workshop/module-06-ui/README.md) | Code | 60 min |
| 07 | [Integrating APIs](workshop/module-07-api/README.md) | Code | 60 min |
| 08 | [Testing](workshop/module-08-testing/README.md) | Test | 55 min |
| 09 | [Hardening](workshop/module-09-hardening/README.md) | Test | 50 min |
| 10 | [Pull Request Review](workshop/module-10-review/README.md) | Review | 45 min |
| 11 | [Delivery (GitHub Pages)](workshop/module-11-delivery/README.md) | Ship | 30 min |

Cada módulo tem **README.md**, **challenge.md**, **prompts.md** e
**solution.md**.

---

## Começando

### Pré-requisitos

- **Node.js**
- **pnpm** (único gerenciador de pacotes suportado — habilite com `corepack enable`)
- **GitHub Copilot** habilitado no VS Code
- Git e uma conta no GitHub (para PR e deploy)

> O repositório inclui um **DevContainer** com tudo pré-configurado. Abra em um
> Codespace ou em "Reopen in Container" e pule a instalação manual.

### Instalação

```bash
pnpm install
pnpm exec playwright install   # navegadores para os testes E2E
```

### Scripts

```bash
pnpm dev             # servidor de desenvolvimento (Vite)
pnpm build           # build de produção
pnpm preview         # serve o build localmente
pnpm lint            # Biome (lint)
pnpm format          # Biome (formatação)
pnpm check           # Biome (lint + formatação)
pnpm test            # testes unitários (Vitest)
pnpm test:coverage   # cobertura
pnpm test:e2e        # testes E2E (Playwright)
```

---

## Arquitetura do app

```text
src/
├── components/      # apresentação (um componente por arquivo)
│   └── states/      # loading, erro, vazio
├── hooks/           # orquestração (useWeather)
├── services/        # acesso a dados (Open-Meteo) isolado
├── lib/             # funções puras (conversão, formatação, códigos WMO)
├── types/           # contratos compartilhados
├── styles/          # Tailwind + estilos globais
├── App.tsx          # composição da tela
└── main.tsx         # bootstrap React
```

Decisões-chave:

- **Temperaturas em Celsius** internamente; conversão só na apresentação (o
  toggle °C/°F **não** faz nova requisição).
- **Rede isolada** em `services/` — componentes e hooks não conhecem URLs.
- Sempre tratar **loading**, **erro** e **vazio**.

### Estado da integração

O bootstrap usa os serviços reais do Open-Meteo; os testes E2E interceptam as
chamadas e validam os valores das fixtures, não os dados de demonstração.
O componente `App` mantém o mock padrão para testes e demonstrações isoladas.
Buscas ambíguas ou sem contexto completo são recusadas, sem escolher uma cidade
arbitrária. A seleção explícita de resultados ainda está pendente.

Passar lint, build e testes não certifica toda a spec. Ainda faltam sugestões e
ordenação de busca, seleção explícita, persistência de cidade/unidade, apresentação
e avaliação da atualidade dos dados e idade do modelo, atualização manual/automática,
cache e bloqueio de retry por `Retry-After`. Critérios de LCP em campo,
disponibilidade mensal, pesquisa com participantes, leitores de tela reais e gates
corporativos/jurídicos/privacidade precisam de evidências externas antes do aceite.

#### Conferência dos critérios de aceite

Status da implementação atual, sem equiparar aprovação das suítes ao aceite total:

| Status | Critérios | Evidência ou lacuna |
| --- | --- | --- |
| Cobertos por testes locais | AC3, AC5, AC6, AC11, AC12, AC13, AC17, AC18, AC19, AC22, AC25, AC28, AC29, AC31, AC33, AC53 | Services, componentes e fluxo integrado com respostas interceptadas; seleção automática apenas para cidade única com contexto completo, unidades, métricas, erros e previsão parcial. |
| Parcialmente cobertos | AC2, AC10, AC24, AC26, AC27, AC32, AC34, AC37, AC38, AC42, AC49 | Falta validar variantes reais do provedor; datas dependem da resposta sem validação completa da janela; cache não implementado; entrada vazia não explica a exigência; timeout/concorrência não cobrem cache e atualização; acessibilidade manual e todos os estados em todos os viewports ainda não certificados. |
| Não atendidos | AC1, AC4, AC7, AC8, AC9, AC14, AC15, AC16, AC20, AC21, AC23, AC30, AC35, AC36, AC47, AC48, AC52 | Faltam sugestões/ordenação/seleção explícita, horários e atualidade, preferências/restauração, atualização manual/automática por visibilidade, cache e cooldown de retry. AC16 precisa ser validado junto à restauração, ainda ausente. |
| Dependem de evidências externas | AC39, AC40, AC41, AC43, AC44, AC45, AC46, AC50, AC51, AC54, AC55 | Medição mensal/28 dias, aprovação de privacidade e retenção de métricas, baseline corporativo, pesquisa com 30 participantes, gates do provedor/jurídico e operação do orçamento do piloto. Sem dados de LCP, o resultado é inconclusivo; não há coleta de métricas ativada. |

Os 55 critérios estão classificados acima. A publicação e o aceite completo
continuam bloqueados até implementar as lacunas e reunir as evidências exigidas.

Validação local em 07/11/2026:

| Comando | Resultado |
| --- | --- |
| `pnpm lint` | Passou |
| `pnpm build` | Passou (TypeScript + Vite) |
| `pnpm test` | Passou: 173 testes, 15 arquivos |
| `pnpm test:e2e` | Passou: 18 testes em Chromium e WebKit com emulação mobile; busca, unidade, vazio, loading, erro/retry e busca/previsão sem overflow em 320/375/768/1024/1440 px |

Esses testes mobile são emulação, não substituem testes em aparelhos reais.

---

## Stack

- **TypeScript** (strict) · **React** · **Vite**
- **Tailwind CSS** (tema dark glassmorphism)
- **Vitest** + **Testing Library** (unit) · **Playwright** (E2E)
- **Biome** (lint + formatação)
- **pnpm** (gerenciador de pacotes)
- **Open-Meteo** (geocoding + forecast, sem API key)

---

## Copilot no fluxo SDD

A pasta `.github/` traz a inteligência do laboratório:

- **`agents/`** — personas especializadas: Spec, Plan, Task, Code, Test, Review.
- **`prompts/`** — prompts de produção para cada etapa.
- **`instructions/`** — convenções (React, Tailwind, Testing) aplicadas
  automaticamente.
- **`workflows/`** — CI (lint/build/test/e2e), deploy no Pages e validações que
  **impõem a ordem Spec → Plan → Tasks**.

Veja [AGENTS.md](AGENTS.md) para a descrição de cada agente.

---

## Idioma

- Narrativa, comentários e documentação: **pt-BR**.
- Identificadores de código, nomes de arquivos e termos técnicos: **en-US**.

---

<div align="center">

Construído com ❤️ para capacitar times em **Spec-Driven Development** usando o poder do GitHub Copilot.

</div>
