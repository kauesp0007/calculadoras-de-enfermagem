# 🤖 Catálogo dos Agentes

**Projeto:** Calculadoras de Enfermagem  
**Local:** `.github/agents/*.agent.md`  
**Total:** 8 agentes (todos `user-invocable: true`)

## 📊 Resumo Geral

| # | Agente | Arquivo | Ferramentas | Edita? | Perfil |
|---|---|---|---|---|---|
| 1 | Auditor de Governança Regulatória | `auditor-governanca-regulatoria.agent.md` | read, search | ❌ | Auditoria |
| 2 | Auditor SEO | `auditor-seo.agent.md` | read, search, web | ❌ | Auditoria |
| 3 | Build do Site | `build.agent.md` | execute | ❌ | Execução |
| 4 | Descoberta de Conhecimento | `descoberta-conhecimento.agent.md` | read, search | ❌ | Pesquisa |
| 5 | Gerador de Imagens | `gerador-imagens.agent.md` | read, edit, search | ✅ | Criação |
| 6 | Nova Calculadora | `nova-calculadora.agent.md` | read, edit, search | ✅ | Criação |
| 7 | Testador no Navegador | `testador-browser.agent.md` | read, search, execute | ❌ | Validação |
| 8 | Tradutor de Página | `tradutor-pagina.agent.md` | read, edit, search | ✅ | Criação |

---

## 1. Auditor de Governança Regulatória

- **Arquivo:** `auditor-governanca-regulatoria.agent.md`
- **Ferramentas:** `read`, `search`
- **Natureza:** somente leitura (não edita, não executa, não commita)

**Competência**
Auditar a governança editorial de páginas, artigos e conteúdo regulatório, ético,
legal ou clínico. Classifica o conteúdo em **HIGH / MEDIUM / LOW** e verifica fonte
oficial, classificação de risco, evidência, data de revisão e elegibilidade editorial.

**Fontes de verdade**
`governance/content-governance.config.json`, `CKO-COREN-Projeto-Completo-v2/…`,
`AI_RULES.md`, `HTML_RULES.md`, `HTML_PAGE_TEMPLATE_RULES.md`.

**Quando inicia**
Quando é chamado explicitamente para auditar a confiabilidade de conteúdo normativo
ou para validar marcadores de governança (`data-references-section`, `data-governance-disclosure`,
`data-professional-review`).

**Diferenciação**
É o único agente focado em **confiabilidade regulatória/clínica**. Não avalia SEO nem
layout — avalia se a alegação tem fonte verificável e se a nota de transparência está
correta.

---

## 2. Auditor SEO

- **Arquivo:** `auditor-seo.agent.md`
- **Ferramentas:** `read`, `search`, `web`
- **Natureza:** somente leitura

**Competência**
Auditar SEO e desempenho: title, meta description, canonical, hreflang, Schema.org,
Open Graph, Twitter Card, Core Web Vitals, CLS, acessibilidade, largura de página e
hero card.

**Fontes de verdade**
`CATALOGO_SEO_METAS_HEAD/`, `CATALOGO_DA_ARQUITETURA_ESTRUTURAL/`, regras do projeto,
`.github/instructions/html.instructions.md`.

**Quando inicia**
Quando é chamado para auditar uma página antes de publicar ou para revisar o `<head>`,
canonical/hreflang e hero card.

**Diferenciação**
Auditor de **descoberta e conformidade técnica**. Complementa o Auditor de Governança:
um olha **como a página é encontrada** (SEO), o outro **se o conteúdo é confiável**
(governança). Ferramenta extra `web` permite consultar fontes externas.

---

## 3. Build do Site

- **Arquivo:** `build.agent.md`
- **Ferramentas:** `execute`
- **Natureza:** somente execução

**Competência**
Executar a compilação do site e confirmar o resultado:
1. `node node_modules/tailwindcss/lib/cli.js -i ./src/input.css -o ./public/output.css --minify`
2. `node gerar-sw.js`
3. Reportar sucesso/falha e o novo `CACHE_NAME`.

**Quando inicia**
Quando é necessário rodar o build (Tailwind + service worker) após alterar HTML/CSS/JS.

**Diferenciação**
É o agente mais **restrito**: não edita e **não lê arquivos de regras** (economiza
contexto). Só executa o build. É redundante ao hook `build-after-edit`, mas útil quando
o usuário quer rodar o build manualmente ou quando o hook não cobre o caso.

---

## 4. Descoberta de Conhecimento

- **Arquivo:** `descoberta-conhecimento.agent.md`
- **Ferramentas:** `read`, `search`
- **Natureza:** somente leitura

**Competência**
Consultar a base `/knowledge/` e produzir um **dossiê de descoberta**
(`CONTENT DISCOVERY DOSSIER`) com páginas, escalas, calculadoras, legislação,
referências, imagens e componentes didáticos relacionados a um tema.

**Quando inicia**
Antes de criar, atualizar ou reformular uma página HTML, para descobrir conteúdo
existente relacionado e evitar duplicação.

**Diferenciação**
É o agente de **pesquisa prévia**. Não escreve HTML. Seu dossiê alimenta o agente
`Nova Calculadora` com links internos, backlinks e referências sugeridas.

---

## 5. Gerador de Imagens

- **Arquivo:** `gerador-imagens.agent.md`
- **Ferramentas:** `read`, `edit`, `search`

**Competência**
Planejar, gerar e validar as **três imagens de conteúdo** de uma página nova:
um banner horizontal e duas imagens médias (direita/esquerda), em WebP, com ALT,
figcaption e lightbox.

**Quando inicia**
Depois que o conteúdo da página foi estruturado (acionado pelo `Nova Calculadora`),
para produzir o plano visual e as imagens finais em `/img/`.

**Diferenciação**
É o único agente que **orquestra geração de imagens**. Não modifica páginas existentes
nem cria watchers/conversores; reutiliza `watch-images.js` e os otimizadores existentes.

---

## 6. Nova Calculadora

- **Arquivo:** `nova-calculadora.agent.md`
- **Ferramentas:** `read`, `edit`, `search`

**Competência**
Criar novas páginas de calculadora/escala seguindo o padrão do projeto: `<main>`
com largura total, hero card (Eyebrow → H1 → H2), ordem do `<head>`, Schema.org,
formulários, cálculo, hero de resultado, referências e impressão/PDF.

**Quando inicia**
Quando o usuário pede uma nova calculadora, escala ou ferramenta de enfermagem.

**Diferenciação**
É o agente **principal de criação**. Consome o dossiê do `Descoberta de Conhecimento`
e delega a parte visual ao `Gerador de Imagens`.

---

## 7. Testador no Navegador

- **Arquivo:** `testador-browser.agent.md`
- **Ferramentas:** `read`, `search`, `execute`
- **Natureza:** validação (não edita)

**Competência**
Abrir a página no navegador e validar: renderização, largura total, hero card,
responsividade (desktop/mobile), ausência de CLS, funcionamento da ferramenta
(Calcular/Limpar), footer e erros de console.

**Quando inicia**
Após a criação/edição de uma página, para validar antes de publicar.

**Diferenciação**
É o agente de **validação visual e funcional**. Se encontrar erro, **reporta** e
sugere correção, mas **não aplica**.

---

## 8. Tradutor de Página

- **Arquivo:** `tradutor-pagina.agent.md`
- **Ferramentas:** `read`, `edit`, `search`

**Competência**
Traduzir uma página para os 18 idiomas do site, preservando estrutura, IDs, classes e
JavaScript. Atualiza canonical/hreflang (cluster completo com x-default), metadados e
footer relativo da pasta de idioma.

**Quando inicia**
Quando o usuário pede tradução de uma página existente para os idiomas do site.

**Diferenciação**
É o agente de **internacionalização**. Traduz apenas conteúdo visível e metadados;
nunca traduz variáveis, IDs, classes, URLs ou código JS/JSON.

---

## 🧭 Tabela de Diferenciação Rápida

| Agente | Pergunta que responde | Saída típica |
|---|---|---|
| Auditor de Governança | O conteúdo é confiável/regulatório? | Relatório de severidade e ação |
| Auditor SEO | A página é encontrável e performática? | Relatório de problemas e correções |
| Build do Site | O build passou? | Sucesso/falha + `CACHE_NAME` |
| Descoberta de Conhecimento | O que já existe sobre o tema? | Dossiê JSON |
| Gerador de Imagens | As 3 imagens estão prontas? | Plano visual + WebPs + contrato de inserção |
| Nova Calculadora | A página nova está completa? | Arquivo HTML completo |
| Testador no Navegador | A página funciona no navegador? | Relatório de testes |
| Tradutor de Página | A página está traduzida nos idiomas? | Arquivos na pasta do idioma |
