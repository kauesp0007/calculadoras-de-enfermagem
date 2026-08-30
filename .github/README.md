# Governança de IA — Calculadoras de Enfermagem

Estrutura de regras, padrões, agentes e automações que governa como as IAs atuam
neste repositório. Tudo fica na pasta `.github/` e é carregado automaticamente pelo
VS Code (Copilot) e ferramentas compatíveis.

## Fontes de verdade (prioridade)

1. `AI_RULES.md` (prioridade máxima) → `HTML_RULES.md` → `HTML_PAGE_TEMPLATE_RULES.md`.
2. Catálogos: `CATALOGO_DA_ARQUITETURA_ESTRUTURAL/`, `CATALOGO_DE_ESTRUTURA_FISICA/`,
   `CATALOGO_DE_IDENTIDADE_VISUAL/`, `CATALOGO_SEO_METAS_HEAD/`.
3. Modelos HTML de referência: `fugulin.html`, `mapa-do-site.html`, `perroca.html`,
   `dimensionamento.html`, `centro-cirurgico.html`, `guia_rapido_dispositivos.html`,
   `meem.html`, `integracoes_classificacao_wifi.html`.

## Estrutura de customização

| Camada | Local | Função |
|---|---|---|
| Instruções globais | `.github/copilot-instructions.md` | Regras sempre ativas + fontes de verdade + proibições |
| Instruções por arquivo | `.github/instructions/*.instructions.md` | `html`, `js`, `css`, `json` (via `applyTo`) |
| Agentes | `.github/agents/*.agent.md` | build, auditor-seo, auditor-performance, auditor-conformidade-tecnica, agente-alfandegario, revisor-integridade, verificador-hreflang, revisor-final, auditor-ecossistema, tradutor-pagina, nova-calculadora, testador-browser, gerador-imagens, descoberta-conhecimento, auditor-governanca-regulatoria |
| Skills | `.github/skills/<nome>/SKILL.md` | limpar-backups, auditar-acessibilidade, publicar-calculadora |
| Prompts | `.github/prompts/*.prompt.md` | `/auditar-seo`, `/traduzir-pagina`, `/testar-pagina`, `/gerar-sitemap`, `/comparar-edital` |
| Hooks | `.github/hooks/*.json` + `scripts/hooks/*.ps1` | Bloqueio de git/arquivos proibidos, backup, build, validação de layout/head/JSON/a11y, registro de página, conformidade |

## Hooks (garantia, não só orientação)

- `security-git.json` → bloqueia `git commit`/`git push`, comandos destrutivos e pede autorização para instalação de dependências.
- `auto-backup.json` → gera backup automático antes de editar, centralizado em `backups-temporarios/`.
- `build-after-edit.json` → roda `gerar-sw.js` após editar HTML/JS; tailwind + `gerar-sw` após CSS.
- `block-protected-files.json` → nega edição em `.git/`/`node_modules/`, regras canônicas, MCP, segredos e login/deploy; pede autorização para arquivos/pastas protegidos e catálogos.
- `check-layout.json` → reporta `container`/`max-w-*`/`mx-auto` e hero fora do padrão após editar HTML.
- `check-json.json` → valida sintaxe JSON após editar `.json` (reporta se inválido).
- `check-head.json` → reporta elementos essenciais faltando no `<head>` após editar HTML.
- `register-page.json` → lembra de registrar HTML novo da raiz em `relatorio_paginas.txt`.
- `check-a11y.json` → reporta lang/skip-link/h1/alt básicos após editar HTML.
- `check-conformidade.json` → reporta componente novo (agente/hook/skill/prompt) sem registro de conformidade.

## Regras rígidas

- NUNCA executar `git commit` ou `git push`.
- Backup automático antes de editar (centralizado em `backups-temporarios/`).
- Proibido alterar: pastas `downloads`, `biblioteca`, `blog`, `blog-templates`,
  `node_modules`, `.git`; arquivos `footer.html`, `menu-global.html`,
  `global-body-elements.html`, `downloads.html`, `_language_selector.html`,
  `googlefc0a17cdd552164b.html`.
- Largura das páginas: viewport total (só paddings laterais); NUNCA `container`,
  `max-w-5xl/6xl/7xl`, `mx-auto`.
- Hero card: 100% largura, alinhado à esquerda, gradiente azul institucional,
  Eyebrow → H1 → H2 (nunca inverter).
- Footer: raiz (pt) usa `fetch("/footer.html")` + `carregarTraducoes`; pastas de idioma
  usam `fetch("footer.html")` (relativo).
- Impressão/PDF: escalas/calculadoras → modelo `meem.html` (jsPDF + imprimir);
  textos/artigos → modelo `integracoes_classificacao_wifi.html` (só `btnImprimir`).

## Build obrigatório (ao alterar HTML/CSS/JS)

```
.\node_modules\.bin\tailwindcss -i ./src/input.css -o ./public/output.css --minify
node gerar-sw.js
```

## Avaliação contínua

Extensão **Chat Customizations Evaluations** (`ms-vscode.vscode-chat-customizations-evaluations`):
rode `Chat Customizations Evaluations: Analyze` ou `/analyze-prompt` nas regras.
