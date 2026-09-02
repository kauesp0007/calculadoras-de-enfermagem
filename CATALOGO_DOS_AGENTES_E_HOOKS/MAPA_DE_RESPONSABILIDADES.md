# 🗺️ Mapa de Responsabilidades (FASE 2)

**Regra:** escolher sempre o **menor mecanismo** capaz de executar a tarefa com segurança.
Prioridade: 1. script determinístico → 2. hook → 3. validator → 4. index → 5. skill → 6. agente → 7. modelo principal → 8. múltiplas IAs.

| Tarefa | Quem executa | Por quê | Custo | Gatilho |
|---|---|---|---|---|
| Backup antes de editar | Hook `auto-backup` | Determinístico | 0 IA | PreToolUse (edição) |
| Bloquear `git commit/push` | Hook `security-git` | Determinístico (segurança) | 0 IA | PreToolUse (terminal) |
| Proteger arquivos/pastas | Hook `block-protected-files` | Determinístico (segurança) | 0 IA | PreToolUse (edição) |
| Build + service worker | Hook `build-after-edit` | Determinístico | 0 IA | PostToolUse (.html/.js/.css) |
| Auditoria CWV/performance (automática) | Hook `build-after-edit` → `cwv-gate.js` | Determinístico (auditar → corrigir → re-auditar → evidência) | 0 IA | PostToolUse (.html/.js/.css/imagem/fonte) |
| Build manual | Agente `Build do Site` | Execução sob demanda | IA (mínima) | pedido do usuário |
| Tailwind | Hook `build-after-edit` / `build.js` | Determinístico | 0 IA | CSS editado |
| Validação editorial (marcadores) | Hook `content-governance` | Determinístico | 0 IA | PostToolUse (.html/.md) |
| Governança regulatória (qualidade) | Agente `Auditor de Governança` | Julgamento | IA | conteúdo normativo |
| Indexação `/knowledge/` | Hook `knowledge-index` + `build-knowledge-index.js` | Determinístico | 0 IA | HTML da raiz editado |
| Descoberta de conhecimento | `knowledge-discover.js` (script) + Agente `Descoberta de Conhecimento` (síntese) | Determinístico + síntese | 0 IA (script) + IA (síntese) | antes de criar página |
| Criação de página (calculadora/escala) | Agente `Nova Calculadora` | Julgamento + criação | IA | pedido do usuário |
| Geração de imagens | Agente `Gerador de Imagens` | Julgamento + criação | IA | após estruturar conteúdo |
| Auditoria SEO | Agente `Auditor SEO` | Julgamento | IA | antes de publicar |
| Auditoria CWV/performance | Agente `Auditor de Performance` | Julgamento + script | IA | antes de publicar |
| Acessibilidade básica | Hook `check-a11y` | Determinístico | 0 IA | HTML editado |
| Acessibilidade completa | Skill `auditar-acessibilidade` | Julgamento | IA | antes de publicar |
| Teste no navegador | Agente `Testador no Navegador` | Validação visual | IA | após criar/editar |
| Tradução (18 idiomas) | Agente `Tradutor de Página` | Julgamento + criação | IA | pedido do usuário |
| Links quebrados | Agente `Revisor de Integridade` + `fix-broken-links.js` | Correção cirúrgica | IA (correção) | pedido/auditoria |
| Canonical/hreflang | Agente `Verificador de Hreflang` | Julgamento | IA | dúvida de cluster |
| Sitemap | `generate-sitemap.js` (deploy) + prompt `/gerar-sitemap` | Determinístico | 0 IA | deploy |
| Validação JSON | Hook `check-json` | Determinístico | 0 IA | .json editado |
| Layout/hero (largura) | Hook `check-layout` | Determinístico | 0 IA | .html editado |
| Ordem/head essencial | Hook `check-head` | Determinístico | 0 IA | .html editado |
| Registro em `relatorio_paginas.txt` | Hook `register-page` (reporta) + humano | Determinístico + confirmação | 0 IA | HTML novo na raiz |
| QA final (publicar?) | Agente `Revisor Final (QA Gate)` | Contra-prova | IA | fim do pipeline |
| Conformidade técnica (CWV + mobile + a11y) | Agente `Auditor de Conformidade Técnica` | Julgamento consolidado | IA | antes de publicar |
| Gate de processo (entrada/saída de etapa) | Agente `Agente Alfandegário` | Julgamento de pré-condições/evidências | IA | entre etapas do pipeline |
| Auditoria de consistência do ecossistema | `auditar-ecossistema.js` (script) | Determinístico | 0 IA | pedido/auditoria |
| Classificação de impacto + seleção de subagentes | `classificar-impacto.js` (script) | Determinístico | 0 IA | após editar (hook) ou sob demanda |
| Auditoria semântica do ecossistema | Agente `Auditor do Ecossistema` | Julgamento (interpreta o script) | IA | após rodar o script |
| Login/permissões/premium | `js/auth` + `js/firebase` (Firebase) | Código (não é IA) | 0 IA | runtime |
| Diagnóstico de erros | `acervo-erros.json` (memória) | Consulta (não é IA) | 0 IA | antes de depurar |
| Reuso de solução | `acervo-solucoes.json` (memória) | Consulta (não é IA) | 0 IA | antes de inventar |

**Observação de economia:** as tarefas determinísticas (backup, build, validação, índice, bloqueios) nunca consomem IA — só hooks/scripts.

## Classificação de tarefas (ETAPA 1 — auditoria de chamadas desnecessárias)

| Classe | Tarefas | Mecanismo |
|---|---|---|
| A — determinística | backup, build, validação (layout/head/json/a11y/governança), índice, bloqueios, consistência do ecossistema | script/hook (0 IA) |
| B — semideterminística | descoberta de conhecimento, correção de links quebrados | script + IA de interpretação |
| C — raciocínio | criação de página, tradução, geração de imagens | agente |
| D — especialista | governança regulatória, SEO, CWV, hreflang | agente especializado |
| E — auditoria | auditorias de conteúdo | auditor (leitura) |
| F — contra-prova | QA final, segunda opinião | agente independente |

**Achados da ETAPA 1:**
1. `Auditor do Ecossistema` fazia verificação mecânica com IA → **corrigido**: agora
   `auditar-ecossistema.js` faz a parte determinística (0 IA); o agente só interpreta.
2. `Descoberta de Conhecimento` tem script próprio → **reforçado**: o agente DEVE rodar
   `knowledge-discover.js` antes de qualquer leitura manual.
3. `Build do Site` é redundante com o hook `build-after-edit` → usar o agente SOMENTE
   como gatilho manual; no fluxo automático o hook já cobre.
4. Sobreposição CWV entre `Auditor SEO` e `Auditor de Performance` → delimitar:
   SEO = descoberta (title/meta/canonical/hreflang/Schema); Performance = CWV exclusivo.
5. Contra-prova com múltiplas IAs → SOMENTE conteúdo crítico, nunca em toda tarefa.
