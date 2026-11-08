# Desafio — Delivery (GitHub Pages)

Tempo estimado: **~30 min**

---

## Desafio 11.1 — Entender o `base` do Vite

No GitHub Pages, o app não roda na raiz do domínio, e sim em `/<repo>/app/`. Por
isso o build usa `VITE_BASE`.

**Sucesso:** você explica por que o `base` precisa mudar em produção e como o
workflow define `VITE_BASE`.

> Veja `Prompts` → **P11.1**.

---

## Desafio 11.2 — Validar o build de produção localmente

```bash
export VITE_BASE=/sdd-weather-app-isaac-d-oliveira-05112026/app/
pnpm build
pnpm preview --host 127.0.0.1
```

Abra `http://127.0.0.1:4173/sdd-weather-app-isaac-d-oliveira-05112026/app/`.

**Sucesso:** o app e os assets do build carregam sem erros de caminho. Esse
preview valida o app; o workflow valida a montagem completa do site.

> Veja `Prompts` → **P11.2**.

---

## Desafio 11.3 — Habilitar o GitHub Pages

No repositório: **Settings → Pages → Build and deployment → Source: GitHub
Actions**.

**Sucesso:** Pages configurado para deploy via Actions.

---

## Desafio 11.4 — Disparar o deploy

Faça merge do PR e aguarde o push na `main` concluir o workflow `CI`. Após
sucesso, o workflow
[`pages.yml`](../../.github/workflows/pages.yml) vai:

1. fazer checkout do commit da `main` que concluiu o `CI`,
2. buildar o app com `VITE_BASE=/<repo>/app/`,
3. montar `_site` com `docs/` na raiz, app em `/app/` e Markdown em `/workshop/`,
4. publicar no Pages.

O deploy também pode ser iniciado manualmente por `workflow_dispatch`.

**Sucesso:** o workflow conclui verde e gera a URL de deploy.

> Veja `Prompts` → **P11.3**.

---

## Desafio 11.5 — Verificar a publicação

Acesse:

- **Site do workshop:** `https://<user>.github.io/<repo>/`
- **App:** `https://<user>.github.io/<repo>/app/`
- **Módulos do workshop:** `https://<user>.github.io/<repo>/workshop/`

**Sucesso:** ambos carregam e o app funciona (busca, clima, unidade).

> Veja `Prompts` → **P11.4**.

---

## Checklist do módulo

- [ ] Entendi o papel do `VITE_BASE`
- [ ] Build de produção validado localmente
- [ ] Pages habilitado (Source: GitHub Actions)
- [ ] Deploy disparado e verde
- [ ] Site e app acessíveis na URL pública

🎉 **Parabéns!** Você percorreu o ciclo completo de SDD:
**Brief → Spec → Plan → Tasks → Code → Test → Review → Ship.**
