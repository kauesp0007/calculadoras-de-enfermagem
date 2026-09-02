# AGENTS.md — Calculadoras de Enfermagem (instruções para o Codex)

Arquivo de instruções do **Codex** — equivalente ao `copilot-instructions.md` do Copilot.
Regras canônicas: `AI_RULES.md` (prioridade máxima), `HTML_RULES.md`,
`HTML_PAGE_TEMPLATE_RULES.md`. Nada aqui sobrescreve esses arquivos.

## Como ler estas regras (3 tipos)

1. **REGRA IMPOSITIVA** — `DEVE` / `É OBRIGATÓRIO` / `É PROIBIDO` / `NÃO PODE`.
2. **REGRA DE BLOQUEIO** — se X não acontecer, Y **NÃO PODE** prosseguir.
3. **REGRA DE EXCEÇÃO CONTROLADA** — X é proibido por padrão; permitido **SOMENTE**
   se A+B+C forem comprovados e registrados.

**Ordem operacional:** REGRA → PRÉ-CONDIÇÃO OBRIGATÓRIA → EXECUÇÃO →
VALIDAÇÃO → AUDITORIA → PROVA → CONTRA-PROVA → APROVAÇÃO → REGISTRO →
CONCLUSÃO. **Uma alteração sem validação/registro NÃO PODE ser classificada como concluída.**

## Fontes de verdade

- Regras: `AI_RULES.md`, `HTML_RULES.md`, `HTML_PAGE_TEMPLATE_RULES.md`.
- Arquitetura: `CATALOGO_DA_ARQUITETURA_ESTRUTURAL/`.
- Estrutura física e dependências: `CATALOGO_DE_ESTRUTURA_FISICA/`.
- Identidade visual / Design System: `CATALOGO_DE_IDENTIDADE_VISUAL/`.
- SEO e metas do head: `CATALOGO_SEO_METAS_HEAD/`.
- Camada de IA (agentes, hooks, catálogos): `CATALOGO_DOS_AGENTES_E_HOOKS/`.
- Orquestração (Prompt Core + adapters): `AI_ORCHESTRATION/PROMPT_CORE.md` (fonte única das
  regras de orquestração); adapter do Codex: `AI_ORCHESTRATION/ADAPTER_OPENAI.md`.
- Modelos HTML: `fugulin.html`, `mapa-do-site.html`, `perroca.html`, `dimensionamento.html`,
  `centro-cirurgico.html`, `guia_rapido_dispositivos.html`, `meem.html`,
  `integracoes_classificacao_wifi.html`.

## Largura e hero card (IMPOSITIVA)

- Páginas ocupam toda a viewport, mantendo apenas os paddings laterais.
- **NUNCA** usar `container`, `max-w-5xl/6xl/7xl` nem `mx-auto` no container principal.
- Hero card: width 100%, altura compacta, alinhado à esquerda, gradiente azul
  institucional, glassmorphism discreto, hierarquia Eyebrow → H1 → H2 (nunca
  inverter). **NUNCA** aplicar `max-w-*`/`mx-auto` no hero.

## Proteção de arquivos e pastas (IMPOSITIVA + EXCEÇÃO CONTROLADA)

- É PROIBIDO (absoluto) editar: `.git/`, `node_modules/` e segredos (`.env`, chaves,
  credenciais).
- É PROIBIDO alterar, por padrão: pastas `downloads`, `biblioteca`, `blog`,
  `blog-templates`; arquivos `footer.html`, `menu-global.html`,
  `global-body-elements.html`, `downloads.html`, `_language_selector.html`,
  `googlefc0a17cdd552164b.html`.
- EXCEÇÃO CONTROLADA (só com autorização explícita do usuário): regras canônicas
  (`AI_RULES.md`, `HTML_RULES.md`, `HTML_PAGE_TEMPLATE_RULES.md`, `copilot-instructions.md`),
  `mcp.json`/`.mcp.json`, login (`js/auth/`, `js/firebase/`), deploy/SW (`deploy.yml`,
  `gerar-sw.js`, `sw-template.js`, `firestore.rules`), catálogos, `governance/`,
  `knowledge/`, `scripts/hooks/`, `.github/hooks/`, `mapa-do-site.html`,
  `relatorio_paginas.txt` e `package.json`.
  - No Codex **não há** hook `block-protected-files`: esta proteção vale por instrução +
    `sandbox_mode` dos subagentes. Antes de tocar qualquer item acima, **pergunte ao usuário**.

## Comandos proibidos (impostos por `.codex/rules/security.rules`)

- `git commit` / `git push` (responsabilidade do usuário).
- Destrutivos: `git reset --hard`, `rm -r/-rf`, `Remove-Item -Recurse/-Force`,
  `del/rd /s`, `gsutil/gcloud storage rm`, `gcloud projects delete`.
- Instalação de dependências (`npm install`, `pip install`) exige autorização explícita.

Essas regras são aplicadas pelo engine de rules do Codex (`forbidden`/`prompt`).
Não tente contorná-las envolvendo o comando em `bash -c`/`sh -c`.

## Antes de alterar qualquer arquivo (BLOQUEIO)

1. É OBRIGATÓRIO ler `AI_RULES.md` e as regras relacionadas à tarefa.
2. É OBRIGATÓRIO criar backup em `backups-temporarios/` antes de editar
   (no Codex não há hook `auto-backup` — faça manualmente).

## Subagentes (agentes customizados do Codex)

Definidos em `.codex/agents/*.toml` — equivalentes aos agentes do Copilot
(`.github/agents/*.agent.md`):

`alfandegario` · `auditor_conformidade_tecnica` · `auditor_ecossistema` ·
`auditor_governanca` · `auditor_performance` · `auditor_seo` · `build` ·
`descoberta_conhecimento` · `gerador_imagens` · `nova_calculadora` · `revisor_final` ·
`revisor_integridade` · `testador_browser` · `tradutor_pagina` · `verificador_hreflang`.

Acione subagentes para trabalho independente e paralelo (exploração, auditoria,
tradução, testes). Subagentes somente-leitura têm `sandbox_mode = "read-only"`.
Nunca aprove automaticamente um trabalho seu: a contra-prova deve ser feita por
outro subagente independente.

## Paridade Copilot × Codex (hooks)

| Copilot (`.github/hooks/`) | Codex |
|---|---|
| `security-git` | `.codex/rules/security.rules` (`forbidden`/`prompt`) — **direto** |
| `auto-backup` | instrução manual (backup antes de editar) |
| `block-protected-files` | instrução + `sandbox_mode` |
| `build-after-edit` | rodar build manualmente após editar |
| `check-layout`/`check-head`/`check-a11y`/`check-json`/`check-conformidade`/`register-page`/`content-governance`/`knowledge-index` | rodar os validadores determinísticos manualmente |

Os scripts determinísticos continuam válidos — rode-os manualmente no Codex:

- `node scripts/auditar-ecossistema.js` (consistência do ecossistema)
- `node scripts/auditar-cwv.js` (Core Web Vitals)
- `node scripts/fix-broken-links.js` (links quebrados)
- `node scripts/knowledge-discover.js` / `node scripts/build-knowledge-index.js` (base `/knowledge/`)
- `node scripts/validate-content-governance.js` (governança editorial)

## Impressão e PDF (regra absoluta)

- **Escalas e calculadoras**: modelo `fugulin.html` — `btnGerarPDF` (jsPDF via
  `jspdf.umd.min.js` + `jspdf-autotable`, usando `window.jspdf.jsPDF`) + `btnImprimir`
  (`imprimirLaudo()` em nova janela + `window.print()`).
- **Páginas educativas**: modelo `integracoes_classificacao_wifi.html` — somente
  `btnImprimir` capturando `.article-content` (ou `.guide`). NÃO usar jsPDF aqui.
- **Ao modernizar**: apagar configurações antigas e reescrever do zero.
- **Ao criar**: escrever já seguindo o modelo referenciado.

## Atualização e criação de páginas HTML

- **Sidebar à direita**: ao atualizar página que tenha sidebar, EXCLUIR a sidebar e
  transferir as Referências Bibliográficas para o final da página.
- **Head (ordem)**: charset/viewport → DNS/preconnect → title/metas → critical fonts
  (minificada, antes do CSS) → CSS → preload das fontes locais → canonical/hreflang →
  favicon → Schema.org (URLs da própria página) → styles → preload IconTopBar →
  anti-CLS placeholders → scripts (`global-scripts.js`, `lang-selector.js`) com `defer`.
- **SEO**: title ~60, description ~155-160; Open Graph (og:title/description/url/image/site_name),
  Twitter Card, favicon, theme-color.
- **Caminhos**: modulares e assets em caminho absoluto (`/...`), EXCETO o footer das
  páginas dos 18 idiomas, que usam `fetch("footer.html")` relativo.
- **Minificação** autorizada.
- **Página nova**: incluí-la em `relatorio_paginas.txt` (fonte canônica — o
  `mapa-do-site.html` é gerado dinamicamente; NUNCA editar manualmente) e PERGUNTAR ao
  desenvolvedor em qual caminho do `menu-global.html` incluir; depois incluir no menu
  global (desktop) e no off-canvas (mobile).
- **Menu por idioma**: cada pasta de idioma (`en/`, `es/`, ...) tem seu `menu-global.html`
  próprio (rótulos traduzidos, caminhos RELATIVOS, ex.: `pagina.html` sem `/`).

## Auditoria obrigatória (BLOQUEIO)

Toda alteração de HTML deve passar pelas validações determinísticas (scripts acima) e,
quando aplicável, pelos subagentes auditores (`auditor_seo`, `auditor_performance`,
`auditor_governanca`, `auditor_conformidade_tecnica`) + contra-prova (`revisor_final`).
**Alteração sem registro de validação válida NÃO PODE ser classificada como concluída.**

## Build obrigatório

Após alterar HTML/CSS/JS:

```
node node_modules/tailwindcss/lib/cli.js -i ./src/input.css -o ./public/output.css --minify
node gerar-sw.js
```

(Use o subagente `build`.)

## Idioma

Responder em pt-BR.

## Ambiente Base44

- O projeto é um site estático; a prévia serve os arquivos diretamente da raiz do repositório.
- Inicie com `docker compose -f docker-compose.base44.yml up -d` e verifique `http://localhost:3000/`.
- Não há migrações, banco de dados ou segredos externos obrigatórios para renderizar a página inicial.
- O serviço usa `python -m http.server`; alterações entram na próxima requisição, mas a prévia pode precisar de recarga completa.
