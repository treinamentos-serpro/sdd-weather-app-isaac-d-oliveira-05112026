# Delivery (GitHub Pages)

## Objetivo

Entrar na fase de **Shipping**: publicar o app e o site do workshop no **GitHub
Pages** via GitHub Actions, fechando o ciclo SDD de ponta a ponta.

```text
Thinking → Planning → Decomposing → Building → Testing → Reviewing → Shipping
                                                                     ▲ você está aqui
```

---

## Por que isso importa

Software só gera valor quando chega ao usuário. Automatizar o deploy garante
entregas **repetíveis e seguras**. Aqui você publica de verdade — e entende como
o `base` do Vite muda em produção.

---

## Entrada

- CI concluído com sucesso para um commit na `main`
- Workflow [`.github/workflows/pages.yml`](../../.github/workflows/pages.yml)
- `vite.config.ts` com `base` configurável via `VITE_BASE`

## Saída

- GitHub Pages habilitado (Source: GitHub Actions)
- Site do workshop publicado na raiz
- App publicado em `/<repo>/app/`
- URL pública funcionando

## Fluxo de publicação

O push na `main` inicia o workflow `CI`. Após sua conclusão bem-sucedida, o
workflow de Pages faz checkout do mesmo commit, compila o app com
`VITE_BASE=/<repo>/app/` e monta o artefato com `docs/` na raiz, `dist/` em
`app/` e `workshop/` em `workshop/`. O arquivo `docs/.nojekyll` é mantido na
raiz publicada. O deploy também pode ser iniciado manualmente por
`workflow_dispatch`.

## Validação local

Use o nome do repositório no caminho-base do Vite:

```bash
export VITE_BASE=/sdd-weather-app-isaac-d-oliveira-05112026/app/
pnpm build
pnpm preview --host 127.0.0.1
```

Abra `http://127.0.0.1:4173/sdd-weather-app-isaac-d-oliveira-05112026/app/` e
confirme que a tela e os assets carregam. Esse preview valida o app; a montagem
completa do site é verificada no workflow de Pages.

## URLs publicadas

- Workshop: `https://<owner>.github.io/<repo>/`
- App: `https://<owner>.github.io/<repo>/app/`
- Markdown deste módulo: `https://<owner>.github.io/<repo>/workshop/module-11-delivery/README.md`
