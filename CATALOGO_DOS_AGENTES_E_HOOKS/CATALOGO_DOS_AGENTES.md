# 🤖 Catálogo dos Agentes

**Projeto:** Calculadoras de Enfermagem  
**Local:** `.github/agents/*.agent.md`  
**Total:** 15 agentes (todos `user-invocable: true`)

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
| 9 | Auditor de Performance (CWV) | `auditor-performance.agent.md` | read, search, execute | ❌ | Auditoria |
| 10 | Revisor de Integridade | `revisor-integridade.agent.md` | read, edit, search, execute | ✅ | Correção |
| 11 | Verificador de Hreflang/Canonical | `verificador-hreflang.agent.md` | read, search | ❌ | Auditoria |
| 12 | Revisor Final (QA Gate) | `revisor-final.agent.md` | read, search | ❌ | Auditoria (contra-prova) |
| 13 | Auditor do Ecossistema | `auditor-ecossistema.agent.md` | read, search | ❌ | Auditoria |
| 14 | Auditor de Conformidade Técnica | `auditor-conformidade-tecnica.agent.md` | read, search, execute | ❌ | Auditoria |
| 15 | Agente Alfandegário | `agente-alfandegario.agent.md` | read, search | ❌ | Gate (processo) |

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

## 9. Auditor de Performance (Core Web Vitals)

- **Arquivo:** `auditor-performance.agent.md`
- **Ferramentas:** `read`, `search`, `execute`
- **Natureza:** somente leitura (não edita)

**Competência**
Auditar Core Web Vitals e performance: LCP, INP, CLS, fontes (preload, `font-display`),
imagens (`loading="lazy"`, `decoding="async"`, `alt`, WebP) e render-blocking.
Roda `scripts/auditar-cwv.js` (gera `relatorios/auditoria-cwv.csv`).

**Quando inicia**
Quando é chamado para auditar a performance de uma página antes de publicar ou para
investigar problemas de CLS/LCP/INP.

**Diferenciação**
É a especialização de CWV/performance que antes ficava diluída no `Auditor SEO`.
O `Auditor SEO` olha **descoberta** (title, canonical, hreflang, Schema); este olha
**velocidade e estabilidade visual** (CWV). Só leitura, como os demais auditores.

---

## 10. Revisor de Integridade (Links Quebrados)

- **Arquivo:** `revisor-integridade.agent.md`
- **Ferramentas:** `read`, `edit`, `search`, `execute`

**Competência**
Localizar e corrigir referências quebradas (links internos e imagens) de forma cirúrgica,
apontando para o destino correto **somente quando ele existe**. Usa
`scripts/fix-broken-links.js` (backup em `backups-temporarios/links-quebrados/`) e o
`CATALOGO_DE_ESTRUTURA_FISICA/MAPA_DE_DEPENDENCIAS.md` (357 referências quebradas).

**Quando inicia**
Quando há links quebrados para corrigir ou quando se pede auditoria de integridade.

**Diferenciação**
É o agente **de correção de integridade**. Complementa o `Auditor de Performance`
(que reporta) e os hooks (que validam): é o único agente que **corrige** links
quebrados respeitando os arquivos/pastas proibidos.

---

## 11. Verificador de Hreflang/Canonical

- **Arquivo:** `verificador-hreflang.agent.md`
- **Ferramentas:** `read`, `search`
- **Natureza:** somente leitura

**Competência**
Auditar clusters hreflang e canonical das páginas multilingues (18 idiomas + x-default):
idiomas ausentes, canônico apontando para outra língua, falta de reciprocidade e
x-default ausente.

**Quando inicia**
Quando há dúvida sobre a consistência de um cluster hreflang/canonical.

**Diferenciação**
É a especialização de hreflang/canonical do `Auditor SEO` (que cobre o head completo).
Olha apenas a **consistência entre idiomas** de um mesmo cluster.

---

## 12. Revisor Final (QA Gate)

- **Arquivo:** `revisor-final.agent.md`
- **Ferramentas:** `read`, `search`
- **Natureza:** somente leitura (contra-prova)

**Competência**
Consolidar as auditorias (SEO, Performance, Governança, Acessibilidade, Testador) e
emitir o veredito PUBLICAR / PUBLICAR COM RESSALVAS / NÃO PUBLICAR.

**Quando inicia**
No fim do pipeline, antes de publicar uma página nova ou modificada.

**Diferenciação**
É o **gate de contra-prova**: não cria nem edita; decide se a página está pronta.
Nunca aprova um trabalho próprio — exige independência do autor.

---

## 13. Auditor do Ecossistema

- **Arquivo:** `auditor-ecossistema.agent.md`
- **Ferramentas:** `read`, `search`
- **Natureza:** somente leitura

**Competência**
Auditar o próprio ecossistema de IA: agentes/hooks duplicados, responsabilidades
sobrepostas, órfãos, loops, permissões excessivas, scripts obsoletos e catálogos
desatualizados (item sem arquivo / arquivo sem catalogar).

**Quando inicia**
Quando se quer auditar a saúde estrutural da camada de automação.

**Diferenciação**
É o auditor **do ecossistema** (meta-auditoria): não audita páginas, audita os próprios
agentes, hooks, skills, prompts e catálogos. Complementa os demais auditores de conteúdo.

---

## 14. Auditor de Conformidade Técnica

- **Arquivo:** `auditor-conformidade-tecnica.agent.md`
- **Ferramentas:** `read`, `search`, `execute`
- **Natureza:** somente leitura

**Competência**
Auditar de forma exclusiva e consolidada a conformidade técnica de páginas novas ou
modificadas: Core Web Vitals (LCP/INP/CLS), responsividade 100% mobile e acessibilidade.
Roda `scripts/auditar-cwv.js` e usa o resultado dos hooks `check-layout`/`check-head`/`check-a11y`.

**Quando inicia**
Antes de publicar uma página nova ou modificada, como gate único de conformidade técnica.

**Diferenciação**
É o **gate único** que consolida CWV + responsividade + acessibilidade (as peças estavam
dispersas entre `Auditor de Performance`, `Auditor SEO`, skill `auditar-acessibilidade` e
`Testador no Navegador`). Os demais continuam para análise profunda de cada área.

---

## 15. Agente Alfandegário (Gate de Entrada/Saída)

- **Arquivo:** `agente-alfandegario.agent.md`
- **Ferramentas:** `read`, `search`
- **Natureza:** somente leitura (gate de processo)

**Competência**
Validar o que ENTRA e o que SAI de cada etapa do pipeline: pré-condições cumpridas,
contexto mínimo, regras lidas, validações automáticas, catalogação e evidência de
conformidade. Emite APROVADO / REPROVADO COM PENDÊNCIAS.

**Quando inicia**
Entre etapas do pipeline, como controle de fronteira antes de avançar.

**Diferenciação**
Julga o **processo** (etapas e evidências), não o conteúdo. Complementa o
`Revisor Final (QA Gate)` — que julga a página.

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
| Auditor de Performance | A página está rápida e sem CLS? | Relatório CWV por página |
| Revisor de Integridade | Há links/imagens quebrados? | Correções cirúrgicas + pendências |
| Verificador de Hreflang | O cluster multilingue está consistente? | Relatório por cluster |
| Revisor Final (QA Gate) | A página pode ser publicada? | Veredito PUBLICAR/NÃO PUBLICAR |
| Auditor do Ecossistema | O ecossistema tem duplicações/órfãos? | Relatório de divergências |
| Auditor de Conformidade Técnica | A página está 100% conforme (CWV/mobile/a11y)? | Relatório consolidado + CONFORME/NÃO CONFORME |
| Agente Alfandegário | A etapa cumpriu pré-condições e deixou evidência? | APROVADO / REPROVADO COM PENDÊNCIAS |
