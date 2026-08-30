# 🪝 Catálogo dos Hooks

**Projeto:** Calculadoras de Enfermagem  
**Local:** `.github/hooks/*.json` + `scripts/hooks/*.ps1`  
**Total:** 12 hooks

## 📊 Resumo Geral

| # | Hook | Evento | Script | Timeout | Pode bloquear? |
|---|---|---|---|---|---|
| 1 | `auto-backup` | `PreToolUse` | `auto-backup.ps1` | 20s | Não (sempre `allow`) |
| 2 | `build-after-edit` | `PostToolUse` | `build-after-edit.ps1` | 120s | Não |
| 3 | `content-governance` | `PostToolUse` | `content-governance.ps1` | 30s | Não |
| 4 | `knowledge-index` | `PostToolUse` | `knowledge-index.ps1` | 120s | Não |
| 5 | `security-git` | `PreToolUse` | `security-git.ps1` | 15s | **Sim (`deny`/`ask`)** |
| 6 | `block-protected-files` | `PreToolUse` | `block-protected-files.ps1` | 15s | **Sim (`deny`/`ask`)** |
| 7 | `check-layout` | `PostToolUse` | `check-layout.ps1` | 30s | Não (só reporta) |
| 8 | `check-json` | `PostToolUse` | `check-json.ps1` | 30s | Não (só reporta) |
| 9 | `check-head` | `PostToolUse` | `check-head.ps1` | 30s | Não (só reporta) |
| 10 | `register-page` | `PostToolUse` | `register-page.ps1` | 20s | Não (só reporta) |
| 11 | `check-a11y` | `PostToolUse` | `check-a11y.ps1` | 30s | Não (só reporta) |
| 12 | `check-conformidade` | `PostToolUse` | `check-conformidade.ps1` | 20s | Não (só reporta) |

> **Hooks são determinísticos** — rodam localmente em PowerShell e **não consomem
> créditos de IA**. Eles "garantem" o que as instruções apenas "orientam".

---

## 1. auto-backup

- **Arquivo:** `auto-backup.json`
- **Evento:** `PreToolUse` (antes da ferramenta rodar)
- **Script:** `scripts/hooks/auto-backup.ps1`

**Gatilho (quando inicia)**
Dispara antes das ferramentas de edição: `create_file`, `replace_string_in_file`,
`multi_replace_string_in_file`, `edit_notebook_file`.

**O que faz**
1. Lê o JSON de entrada da ferramenta.
2. Coleta os caminhos dos arquivos que serão tocados (`filePath` ou `replacements[]`).
3. Se o arquivo existe, copia para `backups-temporarios/<subpasta>/<arquivo>.<YYYYMMDD-HHMMSS>.bak`.
4. Sempre responde `permissionDecision: allow` (nunca bloqueia a edição).

**Diferenciação**
É o hook **preventivo** que garante a regra "criar backup antes de editar" sem depender
da memória do agente.

---

## 2. build-after-edit

- **Arquivo:** `build-after-edit.json`
- **Evento:** `PostToolUse` (depois da ferramenta rodar)
- **Script:** `scripts/hooks/build-after-edit.ps1`

**Gatilho (quando inicia)**
Dispara após as ferramentas de edição, **apenas** quando o arquivo alterado tem extensão
`.html`, `.js` ou `.css`.

**O que faz**
1. Se algum arquivo tocado for `.html`/`.js` → roda `node gerar-sw.js` (renova o service worker).
2. Se for `.css` → recompila o Tailwind (`tailwindcss/lib/cli.js`) **e** roda `gerar-sw.js`.
3. Descarta a saída; nunca bloqueia.

**Diferenciação**
É o hook **de entrega**: garante o "build obrigatório" automaticamente após cada edição
que afeta o site. É a automação equivalente ao agente `Build do Site`, porém reativa.

---

## 3. content-governance

- **Arquivo:** `content-governance.json`
- **Evento:** `PostToolUse`
- **Script:** `scripts/hooks/content-governance.ps1`

**Gatilho (quando inicia)**
Dispara após ferramentas de edição (incluindo `apply_patch`) quando há arquivo `.html`
ou `.md` entre os tocados.

**O que faz**
1. Verifica se há arquivo editorial (`.html`/`.md`) na edição.
2. Executa `node scripts/validate-content-governance.js`.
3. O validador confere marcadores obrigatórios em HTMLs públicos novos:
   `data-references-section="v1"`, `data-governance-disclosure="v1"` e
   `data-professional-review="required"`.

**Diferenciação**
É o hook **de conformidade editorial**: fiscaliza a governança de conteúdo novo de forma
automatizada, complementando o agente `Auditor de Governança Regulatória` (que é análise
qualitativa).

---

## 4. knowledge-index

- **Arquivo:** `knowledge-index.json`
- **Evento:** `PostToolUse`
- **Script:** `scripts/hooks/knowledge-index.ps1`

**Gatilho (quando inicia)**
Dispara após ferramentas de edição, **somente** para arquivos `.html` que estão **diretamente
na raiz** (não em subpastas/idiomas) e que não estejam na lista de proibidos
(`footer.html`, `menu-global.html`, `global-body-elements.html`, `downloads.html`,
`menu-lateral.html`, `_language_selector.html`, `googlefc0a17cdd552164b.html`).

**O que faz**
Para cada HTML elegível editado, roda:
`node scripts/build-knowledge-index.js --file <arquivo>` (reindexação incremental).

**Diferenciação**
É o hook **de índice**: mantém a base `/knowledge/` sempre atualizada para o agente
`Descoberta de Conhecimento`.

---

## 5. security-git

- **Arquivo:** `security-git.json`
- **Evento:** `PreToolUse`
- **Script:** `scripts/hooks/security-git.ps1`

**Gatilho (quando inicia)**
Dispara antes da ferramenta `run_in_terminal`.

**O que faz**
1. Lê o comando que será executado.
2. `deny` para: `git commit/push`, `git reset --hard`, `rm -r/-rf`,
   `Remove-Item -Recurse/-Force`, `del/rd /s`, `gsutil/gcloud storage rm`,
   `gcloud projects delete`.
3. `ask` (autorização explícita) para instalação de dependências:
   `npm install/i/add/uninstall/ci` e `pip install`.
4. Caso contrário, não interfere.

**Diferenciação**
É o hook **de comandos perigosos** (`deny`/`ask`): impõe as regras de segurança
(§29, §54) — nada destrutivo nem instalação de dependência sem autorização.

---

## 6. block-protected-files

- **Arquivo:** `block-protected-files.json`
- **Evento:** `PreToolUse` (antes da ferramenta rodar)
- **Script:** `scripts/hooks/block-protected-files.ps1`

**Gatilho (quando inicia)**
Dispara antes das ferramentas de edição: `create_file`, `replace_string_in_file`,
`multi_replace_string_in_file`, `edit_notebook_file`.

**O que faz**
1. Lê os caminhos dos arquivos que serão tocados.
2. Bloqueia (`deny`) edição em: `.git/`, `node_modules/`, regras canônicas
   (`AI_RULES.md`, `HTML_RULES.md`, `HTML_PAGE_TEMPLATE_RULES.md`,
   `copilot-instructions.md`), MCP (`mcp.json`/`.mcp.json`), segredos
   (`.env`, `.pem`, `.key`, `.p12`, `credentials.json`, `serviceAccount.json`),
   login/deploy/SW (`js/auth/`, `js/firebase/`, `SISTEMA_DE_LOGIN_DO_SITE/`,
   `deploy.yml`, `gerar-sw.js`, `sw-template.js`, `firestore.rules`).
3. Exige autorização (`ask`) para: `footer.html`, `menu-global.html`,
   `global-body-elements.html`, `downloads.html`, `menu-lateral.html`,
   `_language_selector.html`, `googlefc0a17cdd552164b.html`, `mapa-do-site.html`,
   `relatorio_paginas.txt`, `package.json`, `package-lock.json`; e as pastas
   `downloads/`, `biblioteca/`, `blog/`, `blog-templates/`, catálogos
   (`CATALOGO_*`), `governance/`, `knowledge/`, `scripts/hooks/`, `.github/hooks/`.
4. Caso contrário, responde `allow`.

**Diferenciação**
Garante de forma impositiva as regras rígidas "proibido alterar (sem autorização
explícita)" e "componentes críticos (NÍVEL 1)" — antes dependiam da memória do agente.

---

## 7. check-layout

- **Arquivo:** `check-layout.json`
- **Evento:** `PostToolUse` (depois da ferramenta rodar)
- **Script:** `scripts/hooks/check-layout.ps1`

**Gatilho (quando inicia)**
Dispara após ferramentas de edição, **apenas** para arquivos `.html`.

**O que faz**
1. Remove blocos `<script>` (evita falso positivo do template de impressão) e
   escaneia o HTML editado.
2. Reporta (nunca bloqueia) violações das regras canônicas de largura:
   `class="container"`, classes `max-w-*`, `mx-auto`, e `.hero { ... }` com
   `max-width` ou `margin: auto`.

**Diferenciação**
É o hook **de layout**: transforma a regra "NUNCA usar `container`/`max-w-*`/`mx-auto`
e hero com largura 100%" em verificação determinística após cada edição de HTML.

---

## 8. check-json

- **Arquivo:** `check-json.json`
- **Evento:** `PostToolUse` (depois da ferramenta rodar)
- **Script:** `scripts/hooks/check-json.ps1`

**Gatilho (quando inicia)**
Dispara após ferramentas de edição, **apenas** para arquivos `.json`.

**O que faz**
1. Lê o conteúdo do `.json` editado.
2. Valida a sintaxe com `ConvertFrom-Json`.
3. Se inválido, reporta (nunca bloqueia) o nome do arquivo e a mensagem de erro.

**Diferenciação**
É o hook **de validade de dados**: detecta na hora o erro da categoria "JSON inválido"
(ex.: bloco inserido fora do array, vírgula faltando) — um dos erros mais recorrentes
já catalogados.

---

## 9. check-head

- **Arquivo:** `check-head.json`
- **Evento:** `PostToolUse` (depois da ferramenta rodar)
- **Script:** `scripts/hooks/check-head.ps1`

**Gatilho (quando inicia)**
Dispara após ferramentas de edição, **apenas** para arquivos `.html` (ignora `.min.html`).

**O que faz**
1. Extrai a região `<head>...</head>`.
2. Verifica a presença dos elementos essenciais: `charset`, `viewport`, `title`,
   `meta description`, `canonical`, `og:title`, `twitter:card`, `theme-color` e `favicon`.
3. Reporta (nunca bloqueia) os elementos ausentes.

**Diferenciação**
É o hook **de head**: transforma a regra "conferir se não falta nenhum elemento do head"
em verificação determinística após cada edição de HTML. Complementa o `check-layout`
(largura/hero) e o `content-governance` (marcadores editoriais).

---

## 10. register-page

- **Arquivo:** `register-page.json`
- **Evento:** `PostToolUse` (depois da ferramenta rodar)
- **Script:** `scripts/hooks/register-page.ps1`

**Gatilho (quando inicia)**
Dispara após `create_file`, **apenas** para `.html` criados **diretamente na raiz**
(não em subpastas/idiomas), ignorando `.min.html` e os arquivos proibidos.

**O que faz**
1. Verifica se o arquivo novo já tem entrada em `relatorio_paginas.txt`
   (linha iniciando com `<arquivo> =`).
2. Se não tiver, reporta (nunca bloqueia) lembrando de registrar a página —
   `relatorio_paginas.txt` é a fonte canônica do `mapa-do-site.html`.

**Diferenciação**
É o hook **de registro**: transforma a regra "incluir página nova em
`relatorio_paginas.txt`" em verificação automática. O registro em si continua manual
(com confirmação do desenvolvedor), pois envolve título/URL e posição no menu.

---

## 11. check-a11y

- **Arquivo:** `check-a11y.json`
- **Evento:** `PostToolUse` (depois da ferramenta rodar)
- **Script:** `scripts/hooks/check-a11y.ps1`

**Gatilho (quando inicia)**
Dispara após ferramentas de edição, **apenas** para arquivos `.html` (ignora `.min.html`).

**O que faz**
1. Remove blocos `<script>`/`<style>` (evita falso positivo do template de impressão).
2. Checa deterministicamente: atributo `lang` no `<html>`, presença de `skip-link`,
   exatamente 1 `<h1>`, e `alt` em todas as imagens (ignora `src=""` e `id="lightboxImg"`).
3. Reporta (nunca bloqueia) os problemas básicos encontrados.

**Diferenciação**
É o hook **de acessibilidade básica**: cobre checagens determinísticas; a skill
`auditar-acessibilidade` continua sendo a auditoria qualitativa completa.

---

## 12. check-conformidade

- **Arquivo:** `check-conformidade.json`
- **Evento:** `PostToolUse` (depois da ferramenta rodar)
- **Script:** `scripts/hooks/check-conformidade.ps1`

**Gatilho (quando inicia)**
Dispara após `create_file`, **apenas** para componentes novos: `.agent.md`, `.json` de hook,
`.ps1` de hook, `SKILL.md`, `.prompt.md` e `mcp.json`/`.mcp.json`.

**O que faz**
1. Verifica se o componente novo tem entrada em `registro-conformidade.json`
   (necessidade, justificativa, verificação de duplicação, teste, catálogo).
2. Se não tiver, reporta (nunca bloqueia) o componente como **NÃO CONFORME**.

**Diferenciação**
É o hook **de conformidade**: transforma a regra "criação de componente sem verificação/
justificativa/catalogação = NÃO CONFORME" em evidência verificável por máquina.

---

## 🧭 Ordem de execução no ciclo de vida

| Momento | Hook ativo | Ação |
|---|---|---|
| Antes de editar | `auto-backup` | Cria backup |
| Antes de editar | `block-protected-files` | Bloqueia `.git`/`node_modules`; `ask` p/ protegidos |
| Antes de terminal | `security-git` | Bloqueia commit/push |
| Depois de editar HTML/JS | `build-after-edit` | Renova SW |
| Depois de editar CSS | `build-after-edit` | Recompila Tailwind + SW |
| Depois de editar HTML/MD | `content-governance` | Valida governança |
| Depois de editar HTML da raiz | `knowledge-index` | Reindexa `/knowledge/` |
| Depois de editar HTML | `check-layout` | Reporta violações de largura/hero |
| Depois de editar JSON | `check-json` | Valida sintaxe JSON |
| Depois de editar HTML | `check-head` | Reporta elementos faltando no `<head>` |
| Depois de criar HTML na raiz | `register-page` | Lembra de registrar em `relatorio_paginas.txt` |
| Depois de editar HTML | `check-a11y` | Reporta lang/skip-link/h1/alt básicos |
| Depois de criar componente | `check-conformidade` | Reporta componente sem registro de conformidade |
