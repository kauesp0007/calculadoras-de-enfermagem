# Instruções do Copilot — Calculadoras de Enfermagem

Regras essenciais para qualquer tarefa neste repositório. As regras completas e
prioritárias estão em `AI_RULES.md` (prioridade máxima), `HTML_RULES.md` e
`HTML_PAGE_TEMPLATE_RULES.md`. Nenhuma instrução abaixo sobrescreve esses arquivos.

## Como ler estas regras (3 tipos)

1. **REGRA IMPOSITIVA** — `DEVE` / `É OBRIGATÓRIO` / `É PROIBIDO` / `NÃO PODE`.
2. **REGRA DE BLOQUEIO** — se X não acontecer, Y **NÃO PODE** prosseguir.
3. **REGRA DE EXCEÇÃO CONTROLADA** — X é proibido por padrão; permitido **SOMENTE**
   se A+B+C forem comprovados e registrados.

**Ordem operacional:** REGRA → PRÉ-CONDIÇÃO OBRIGATÓRIA → EXECUÇÃO →
VALIDAÇÃO AUTOMÁTICA → AUDITORIA → PROVA → CONTRA-PROVA → APROVAÇÃO →
REGISTRO → CONCLUSÃO. **Uma alteração sem validação/registro NÃO PODE ser
classificada como concluída.**

## Fontes de verdade (padrões do projeto)

- Regras: `AI_RULES.md`, `HTML_RULES.md`, `HTML_PAGE_TEMPLATE_RULES.md`.
- Arquitetura: `CATALOGO_DA_ARQUITETURA_ESTRUTURAL/`.
- Estrutura física e dependências: `CATALOGO_DE_ESTRUTURA_FISICA/`.
- Identidade visual / Design System: `CATALOGO_DE_IDENTIDADE_VISUAL/`.
- SEO e metas do head: `CATALOGO_SEO_METAS_HEAD/`.
- Camada de IA (agentes, hooks, skills, prompts): `CATALOGO_DOS_AGENTES_E_HOOKS/`.
- Modelos HTML de referência: `fugulin.html`, `mapa-do-site.html`, `perroca.html`,
  `dimensionamento.html`, `centro-cirurgico.html`, `guia_rapido_dispositivos.html`,
  `meem.html`, `integracoes_classificacao_wifi.html`.
- Largura das páginas: ocupar toda a viewport mantendo apenas os paddings laterais;
  NUNCA usar `container`, `max-w-5xl/6xl/7xl` nem `mx-auto` no container principal.
- Hero card: largura 100%, altura compacta, alinhado à esquerda, gradiente azul
  institucional, glassmorphism discreto, hierarquia Eyebrow → H1 → H2 (nunca
  inverter). NUNCA aplicar `max-w-*`/`mx-auto` no hero.

## Proteção de arquivos e pastas (IMPOSITIVA + EXCEÇÃO CONTROLADA)

- É PROIBIDO (absoluto) editar: `.git/`, `node_modules/` e segredos (`.env`, chaves,
  credenciais). Bloqueado por hook `deny`, **sem exceção**.
- É PROIBIDO alterar, por padrão: pastas `downloads`, `biblioteca`, `blog`,
  `blog-templates`; arquivos `footer.html`,
  `global-body-elements.html`, `downloads.html`, `_language_selector.html`,
  `googlefc0a17cdd552164b.html`.
- EXCEÇÃO CONTROLADA: os itens acima, bem como regras canônicas (`AI_RULES.md`,
  `HTML_RULES.md`, `HTML_PAGE_TEMPLATE_RULES.md`, `copilot-instructions.md`),
  `mcp.json`/`.mcp.json`, login (`js/auth/`, `js/firebase/`), deploy/SW
  (`deploy.yml`, `gerar-sw.js`, `sw-template.js`, `firestore.rules`), catálogos,
  `governance/`, `knowledge/`, `scripts/hooks/`, `.github/hooks/`,
  `mapa-do-site.html` e `package.json` — **só podem ser
  alterados com autorização explícita do usuário** (o hook `block-protected-files`
  exige confirmação `ask`).

## Antes de alterar qualquer arquivo (BLOQUEIO)

1. É OBRIGATÓRIO ler `AI_RULES.md` e os arquivos de regras relacionados à tarefa.
2. É OBRIGATÓRIO criar backup em `backups-temporarios/` antes de editar.
   Sem backup, a edição NÃO PODE prosseguir (o hook `auto-backup` garante).

## Criação de novos componentes (agente, hook, skill, prompt, MCP, ferramenta)

POR PADRÃO: **REUTILIZAR** a arquitetura existente.

A criação de novos componentes NÃO É PROIBIDA, mas é uma **EXCEÇÃO CONTROLADA**.
CONDIÇÕES OBRIGATÓRIAS (nesta ordem — sem todas elas = **NÃO CONFORME**):

1. pesquisar agentes existentes;
2. pesquisar hooks existentes;
3. pesquisar ferramentas existentes;
4. pesquisar MCPs existentes;
5. verificar duplicação;
6. registrar a necessidade;
7. registrar a justificativa técnica;
8. registrar o impacto;
9. criar;
10. testar;
11. auditar;
12. catalogar (em `CATALOGO_DOS_AGENTES_E_HOOKS/` **e** em `registro-conformidade.json`).

BLOQUEIO: sem as etapas 1–8 e 12, a criação é **NÃO CONFORME**. A evidência de
conformidade é o registro em `CATALOGO_DOS_AGENTES_E_HOOKS/registro-conformidade.json`
(validado pelo hook `check-conformidade`).

## Regras rígidas (IMPOSITIVAS)

- É PROIBIDO executar `git commit` ou `git push` (responsabilidade do usuário).
- É PROIBIDO executar comandos destrutivos: `git reset --hard`, `rm -r/-rf`,
  `Remove-Item -Recurse/-Force`, `del/rd /s`, `gsutil/gcloud storage rm`,
  `gcloud projects delete`.
- Instalação de dependências (`npm install`, `pip install`) exige autorização
  explícita do usuário.
- É PROIBIDO remover funcionalidades existentes sem autorização explícita.
- DEVE preservar SEO, acessibilidade, responsividade, modularização e desempenho.
- DEVE reutilizar código existente; evitar duplicação; manter o padrão do projeto.

## Impressão e PDF (regra absoluta — seguir sempre, sem precisar de aviso)

- **Escalas e calculadoras**: usar o modelo de `fugulin.html` — botão `btnGerarPDF`
  (jsPDF via `jspdf.umd.min.js` + `jspdf-autotable`, usando `window.jspdf.jsPDF`) e
  botão `btnImprimir` (`imprimirLaudo()` com HTML standalone em nova janela + `window.print()`).
- **Páginas educativas de textos e artigos**: usar o modelo de
  `integracoes_classificacao_wifi.html` — somente `btnImprimir` com `imprimirLaudo()`
  que captura `.article-content` (ou container equivalente, ex.: `.guide`) e gera HTML
  standalone + `window.print()`. NÃO usar jsPDF/`btnGerarPDF` nesse tipo de página.
- **Ao modernizar uma página**: apagar as configurações antigas de impressão/PDF
  (funções, botões e styles) e reescrever do zero seguindo o modelo correto.
- **Ao criar página nova**: escrever o código de impressão/PDF já seguindo o modelo referenciado.

## Atualização e criação de páginas HTML (seguir sempre)

- **Sidebar à direita**: ao atualizar uma página (versão nova) que tenha sidebar, EXCLUIR a
  sidebar e transferir as Referências Bibliográficas dela para o final da página.
- **Head (ordem padrão)**: verificar a sequência hierárquica — charset/viewport → DNS/preconnect →
  title/metas → critical fonts (minificada, antes do CSS) → CSS → preload das fontes locais →
  canonical/hreflang → favicon → Schema.org (URLs referenciando a própria página) → styles →
  preload IconTopBar → anti-CLS placeholders → scripts (global-scripts.js, lang-selector.js) com
  `defer` antes do fechamento do `</head>`. Faltou algum? Adicionar no local correto.
- **SEO/metadados**: respeitar limites de caracteres (title ~60, description ~155-160); garantir
  Open Graph (og:title/description/url/image/site_name), Twitter Card, favicon, theme-color.
- **Caminhos**: todos os modulares e assets em caminho absoluto (`/...`), EXCETO o footer das
  páginas dos 18 idiomas, que usam `fetch("footer.html")` relativo (bloco de footer próprio da pasta).
- **Minificação**: autorizado minificar o HTML quando possível, para não gerar arquivos com
  centenas/milhares de linhas.
- **Página nova**: incluí-la em `relatorio_paginas.txt` (fonte canônica — o `mapa-do-site.html`
  é gerado dinamicamente a partir dele; NUNCA editar o mapa manualmente) e PERGUNTAR ao
  desenvolvedor em qual caminho do `menu-global.html` incluir a nova página; depois incluir
  no menu global (desktop) e no menu off-canvas (mobile).
- **Menu por idioma**: cada pasta de idioma (`en/`, `es/`, ...) tem o seu próprio
  `menu-global.html`. Ao criar/registrar página nova, o submenu deve ser adicionado ao
  `menu-global.html` da raiz (pt-BR, caminhos absolutos `/...`) E ao `menu-global.html` de
  cada um dos 18 idiomas (rótulos traduzidos, caminhos RELATIVOS, ex.: `pagina.html` sem `/`).

## Auditoria obrigatória de páginas (BLOQUEIO)

TODA alteração de HTML DEVE passar pelas validações automáticas (hooks `check-layout`,
`check-head`, `check-a11y`, `content-governance`) e, quando aplicável, por auditoria
(`Auditor SEO`, `Auditor de Performance`, `Auditor de Governança`) e contra-prova
(`Revisor Final`). **Uma alteração sem registro de validação válida NÃO PODE ser
classificada como concluída.**

## Build obrigatório (ao alterar HTML/CSS/JS do site)

Ao final de cada alteração que afeta o site, rodar:

```
.\node_modules\.bin\tailwindcss -i ./src/input.css -o ./public/output.css --minify
node gerar-sw.js
```

O `gerar-sw.js` gera um novo `CACHE_NAME` (com timestamp) a cada execução, e o
`sw.js` serve o HTML atualizado (network-first).

## Idioma

Responder em pt-BR.
