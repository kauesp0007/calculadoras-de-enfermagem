# 🪝 Catálogo dos Hooks

**Projeto:** Calculadoras de Enfermagem  
**Local:** `.github/hooks/*.json` + `scripts/hooks/*.ps1`  
**Total:** 5 hooks

## 📊 Resumo Geral

| # | Hook | Evento | Script | Timeout | Pode bloquear? |
|---|---|---|---|---|---|
| 1 | `auto-backup` | `PreToolUse` | `auto-backup.ps1` | 20s | Não (sempre `allow`) |
| 2 | `build-after-edit` | `PostToolUse` | `build-after-edit.ps1` | 120s | Não |
| 3 | `content-governance` | `PostToolUse` | `check-content-governance.ps1` | 30s | Não |
| 4 | `knowledge-index` | `PostToolUse` | `knowledge-index.ps1` | 120s | Não |
| 5 | `security-git` | `PreToolUse` | `block-git.ps1` | 15s | **Sim (`deny`)** |

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
- **Script:** `scripts/hooks/check-content-governance.ps1`

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
- **Script:** `scripts/hooks/block-git.ps1`

**Gatilho (quando inicia)**
Dispara antes da ferramenta `run_in_terminal`.

**O que faz**
1. Lê o comando que será executado.
2. Se ele casar com a regex `\bgit\s+(commit|push)\b`, responde
   `permissionDecision: deny` com o motivo: "git commit/push é responsabilidade do usuário".
3. Caso contrário, não interfere.

**Diferenciação**
É o **único hook com poder de bloquear** (`deny`). Garante a regra rígida do
`AI_RULES.md` ("Nunca executar git commit ou git push") de forma impositiva.

---

## 🧭 Ordem de execução no ciclo de vida

| Momento | Hook ativo | Ação |
|---|---|---|
| Antes de editar | `auto-backup` | Cria backup |
| Antes de terminal | `security-git` | Bloqueia commit/push |
| Depois de editar HTML/JS | `build-after-edit` | Renova SW |
| Depois de editar CSS | `build-after-edit` | Recompila Tailwind + SW |
| Depois de editar HTML/MD | `content-governance` | Valida governança |
| Depois de editar HTML da raiz | `knowledge-index` | Reindexa `/knowledge/` |
