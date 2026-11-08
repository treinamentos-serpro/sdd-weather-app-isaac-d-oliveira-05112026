# Solução de referência — (Delivery)

A automação de deploy já está pronta no repositório.

## Como funciona

O workflow [`.github/workflows/pages.yml`](../../.github/workflows/pages.yml) aguarda a conclusão
do workflow `CI` para a branch `main` e só continua se o resultado for sucesso.
Ele faz checkout do `head_sha` do CI que o acionou, para publicar exatamente
aquele commit. Também aceita execução manual por `workflow_dispatch`.

1. **Build do app** com `VITE_BASE=/${{ github.event.repository.name }}/app/` —
   garante que os assets apontem para o subcaminho correto do Pages.
2. **Montagem do `_site`:**
   - `docs/*` → raiz (site do workshop), incluindo `.nojekyll`,
   - `dist/*` → `/app/` (app buildado),
   - `workshop/*` → `/workshop/` (markdown que o site renderiza).
   `.github/`, `src/` e `tests/` não são copiados para o artefato.
3. **Publicação** do `_site` via `actions/upload-pages-artifact` e
   `actions/deploy-pages`.

## O `base` configurável

Em [`vite.config.ts`](../../vite.config.ts):

```ts
base: process.env.VITE_BASE ?? '/',
```

- **Local/dev:** `base = '/'`.
- **Pages:** `base = '/<repo>/app/'` (injetado pelo workflow).

Sem isso, os assets seriam buscados na raiz do domínio e dariam 404.

## Validação local

```bash
export VITE_BASE=/sdd-weather-app-isaac-d-oliveira-05112026/app/
pnpm build
pnpm preview --host 127.0.0.1
```

Abra `http://127.0.0.1:4173/sdd-weather-app-isaac-d-oliveira-05112026/app/`.
Confirme que a página e os arquivos referenciados carregam sem 404. Esse preview
verifica o build do app; a montagem de `docs/`, `dist/` e `workshop/` em `_site`
é validada pelo próprio workflow.

## Configuração do repositório (uma vez)

- **Settings → Pages → Source: GitHub Actions.**
- Permissões já declaradas no workflow (`pages: write`, `id-token: write`).

## URLs finais

- Workshop: `https://<owner>.github.io/<repo>/`
- App: `https://<owner>.github.io/<repo>/app/`
- Markdown deste módulo: `https://<owner>.github.io/<repo>/workshop/module-11-delivery/README.md`

Ciclo SDD completo: **Brief → Spec → Plan → Tasks → Code → Test → Review →
Ship**. O deploy só ocorre após CI verde na `main` ou execução manual.
