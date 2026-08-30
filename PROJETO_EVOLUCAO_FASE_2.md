====================================================================
PROJETO: EVOLUÇÃO FASE 2 — OTIMIZAÇÃO DE CUSTOS, NOVAS CAPACIDADES,
COMUNICAÇÃO ENTRE IAS, INTEGRAÇÕES E QUALIDADE TOTAL
====================================================================

IA RESPONSÁVEL: DeepSeek V4 Pro
AMBIENTE: Visual Studio Code
REPOSITÓRIO: Calculadoras de Enfermagem

====================================================================
0. MISSÃO
====================================================================

Transformar a arquitetura atual de agentes e hooks (13 agentes + 12 hooks,
já catalogados em `CATALOGO_DOS_AGENTES_E_HOOKS/`) em um sistema AINDA MAIS
econômico, rápido, preciso, padronizado e auditável, e — **sem duplicar o que
já existe** — avaliar e, quando comprovadamente necessário, criar:

- auditoria de chamadas desnecessárias de IA;
- regras canônicas de arquitetura HTML (largura/altura/hero/cards/impressão por tipo);
- auditoria exclusiva de conformidade técnica (Core Web Vitals + responsividade + acessibilidade);
- bibliotecas de erros e de soluções comprovadas (evoluir as existentes);
- canal de comunicação entre IAs (janelas diferentes) via MCP;
- integrações com Firebase, Supabase, Cloudflare, Google Cloud e GitHub;
- agentes hospedados (Microsoft Foundry / Agent Builder / Spring Boot) — avaliar;
- agente de conteúdo para mídias sociais — avaliar;
- "agente alfandegário" (gate de entrada/saída que valida o que entra e sai de cada etapa);
- uso de servidores MCP em sandbox.

OBJETIVO FINAL: QUALIDADE + EXCELÊNCIA + RAPIDEZ + CUSTO IRRISÓRIO + PADRONIZAÇÃO +
ALINHAMENTO + ORDEM. Nenhuma chamada de IA sem necessidade comprovada.

====================================================================
1. REGRA ABSOLUTA: PRIMEIRO ENTENDER, DEPOIS ALTERAR
====================================================================

NÃO crie arquivos, agentes, hooks, MCPs ou integrações antes de:

1. Ler completamente `AI_RULES.md`, `HTML_RULES.md`, `HTML_PAGE_TEMPLATE_RULES.md`.
2. Ler `.github/copilot-instructions.md` (já reescrita no padrão de 3 tipos de regra).
3. Ler TODOS os catálogos em `CATALOGO_DOS_AGENTES_E_HOOKS/` (agentes, hooks, skills,
   prompts, instructions, MCP, templates, imagens, erros, soluções, auditorias,
   mapa de responsabilidades, catálogo central, registro-conformidade).
4. Comparar catálogo × arquivos reais (o catálogo pode estar desatualizado).
5. Produzir um INVENTÁRIO REAL antes de qualquer alteração.

REGRAS DE NÃO DUPLICAÇÃO (FASE 54 do projeto):

- ISTO JÁ EXISTE? → REUTILIZAR.
- EXISTE PARCIALMENTE? → ESTENDER.
- DOIS COMPONENTES COM A MESMA FUNÇÃO? → PROPOR UNIFICAÇÃO.
- FUNÇÃO DETERMINÍSTICA? → SCRIPT/HOOK (nunca IA).
- EXIGE JULGAMENTO? → AGENTE.
- EXIGE CONHECIMENTO? → SKILL/KNOWLEDGE.
- COMUNICAÇÃO ENTRE SISTEMAS? → AVALIAR MCP.
- SEGUNDA OPINIÃO? → OUTRO MODELO SÓ QUANDO NECESSÁRIO.
- NÃO HÁ NECESSIDADE? → NÃO CRIAR.

====================================================================
2. ESTADO ATUAL (preservar integralmente)
====================================================================

| Camada | Local | Qtd |
|---|---|---|
| Agentes | `.github/agents/*.agent.md` | 13 |
| Hooks | `.github/hooks/*.json` + `scripts/hooks/*.ps1` | 12 |
| Skills | `.github/skills/` | 3 |
| Prompts | `.github/prompts/` | 5 |
| Instructions | `.github/instructions/` | 4 |
| Workflows | `.github/workflows/` | 1 |
| MCPs | — | 0 |
| Registro de conformidade | `registro-conformidade.json` | 12 entradas |

Hooks existentes (não recriar): auto-backup, security-git (comandos perigosos),
block-protected-files, build-after-edit, content-governance, knowledge-index,
check-layout (largura/hero/espaçamento), check-json, check-head, register-page,
check-a11y, check-conformidade.

Agentes existentes (não recriar): Auditor de Governança, Auditor SEO, Build do Site,
Descoberta de Conhecimento, Gerador de Imagens, Nova Calculadora, Testador no Navegador,
Tradutor de Página, Auditor de Performance (CWV), Revisor de Integridade,
Verificador de Hreflang/Canonical, Revisor Final (QA Gate), Auditor do Ecossistema.

====================================================================
3. PRINCÍPIO DE ECONOMIA DE CRÉDITOS
====================================================================

Prioridade de mecanismo (menor para maior custo):

1. SCRIPT DETERMINÍSTICO LOCAL;
2. HOOK;
3. VALIDATOR;
4. INDEX;
5. SKILL;
6. AGENTE ESPECIALIZADO;
7. MODELO PRINCIPAL;
8. MÚLTIPLAS IAS.

Se uma tarefa pode ser resolvida por código, hook ou índice, NÃO chame IA.
Se a informação já está indexada/catalogada, NÃO varra o repositório.
Se a solução já existe na biblioteca, NÃO pesquise externamente.
Nunca execute a mesma auditoria duas vezes; nunca chame duas IAs para a mesma coisa.

====================================================================
4. ORDEM SEQUENCIAL OBRIGATÓRIA (EXECUTAR NESTA ORDEM)
====================================================================

Cada ETAPA só é considerada concluída após: implementação → teste → auditoria →
contra-prova → registro. NÃO PULE ETAPAS. Ao final de cada etapa, atualizar os
catálogos e o `registro-conformidade.json`.

--------------------------------------------------------------------
ETAPA 1 — AUDITORIA DE CHAMADAS DESNECESSÁRIAS DE IA
--------------------------------------------------------------------
Objetivo: mapear onde a IA é chamada sem necessidade e organizar agentes/hooks
para eliminar o desperdício.

1. Auditar o fluxo atual (agentes × hooks × scripts) e identificar:
   - tarefa determinística sendo feita por agente (deveria ser hook/script);
   - auditoria executada em duplicidade;
   - leitura repetida de arquivos/contexto;
   - agente chamado quando um índice/catálogo já responde.
2. Classificar cada tarefa em: A determinística / B semideterminística /
   C raciocínio / D especialista / E auditoria / F contra-prova.
3. Propor e aplicar correções (converter IA → hook/script onde for seguro).
4. Registrar no catálogo de responsabilidades (`MAPA_DE_RESPONSABILIDADES.md`).

Regra: se a resposta para "um script resolveria?" for SIM, NÃO usar IA.

--------------------------------------------------------------------
ETAPA 2 — REGRAS CANÔNICAS DE ARQUITETURA HTML
--------------------------------------------------------------------
Objetivo: consolidar (sem duplicar) as regras estruturais básicas que hoje
existem de forma dispersa e causam erros constantes.

DEVE EXISTIR, no mínimo, regra clara e uma validação para:
- largura total da página (já: hook `check-layout` — estender se necessário);
- altura/estrutura compacta;
- hero card (Eyebrow → H1 → H2; gradiente; glassmorphism);
- cards (barra de ações, cards de conteúdo);
- BOTÃO DE IMPRESSÃO por tipo (já definido em `copilot-instructions.md`):
  * CALCULADORAS → modelo `fugulin.html` (jsPDF + `imprimirLaudo`);
  * ESCALAS → modelo `fugulin.html` (jsPDF + `imprimirLaudo`);
  * PÁGINAS DE TEXTO/ARTIGO → modelo `integracoes_classificacao_wifi.html` (só `btnImprimir`).
- espaçamento/densidade (regras 60/61 — já no hook `check-layout`).

AÇÃO: garantir que TODA página nova/modificada seja validada pelos hooks
existentes. NÃO criar novo padrão visual se já existe padrão canônico.

--------------------------------------------------------------------
ETAPA 3 — AUDITORIA EXCLUSIVA DE CONFORMIDADE TÉCNICA (CWV + MOBILE + A11Y)
--------------------------------------------------------------------
Objetivo: garantir 100% de conformidade em páginas novas ou modificadas.

Antes de criar: verificar o que já existe (`Auditor de Performance`, `Auditor SEO`,
skill `auditar-acessibilidade`, `Testador no Navegador`, hooks `check-a11y`,
`check-layout`, `check-head`).

Se a cobertura estiver dispersa e incompleta, CRIAR um agente consolidado
`Auditor de Conformidade Técnica` (somente leitura) que verifica de forma
exclusiva e completa:
- Core Web Vitals (LCP, INP, CLS), fontes, preload, lazy loading;
- responsividade 100% (desktop/tablet/mobile, retrato/paisagem, overflow);
- acessibilidade (lang, skip-link, alt, headings, labels, ARIA, contraste, foco).

JUSTIFICAR a criação no `registro-conformidade.json` (por que o conjunto existente
não era suficiente). NÃO duplicar: se os existentes cobrirem, apenas documentar
o fluxo consolidado.

--------------------------------------------------------------------
ETAPA 4 — BIBLIOTECA DE ERROS, BUGS E CONFLITOS (evoluir)
--------------------------------------------------------------------
Objetivo: biblioteca consultiva que evita que a IA procure externamente solução
para problema já catalogado.

EVOLUIR `/memories/repo/acervo-erros.json` (ou criar paralelo no repositório) para
o schema completo:
ID · data · hora · categoria · sistema · arquivo · agente/hook envolvido ·
sintoma · mensagem de erro · causa raiz · causa secundária · impacto ·
arquivos afetados · diagnóstico · tentativas · solução final · teste ·
contra-prova · resultado · prevenção futura · regra criada · tags · severidade.

USO OBRIGATÓRIO: consultar ANTES de investigar qualquer problema novo.

--------------------------------------------------------------------
ETAPA 5 — BIBLIOTECA DE SOLUÇÕES COMPROVADAS (evoluir)
--------------------------------------------------------------------
Objetivo: manual JSON de tarefas que funcionaram perfeitamente e são INTOCÁVEIS.

EVOLUIR `/memories/repo/acervo-solucoes.json` para o schema completo:
tarefa · problema · solução · arquivos · comandos · ordem · dependências ·
resultado · testes · contra-prova · data · versão · observações · riscos ·
"quando NÃO utilizar" · procedimento exato.

Classificar cada solução como PROCEDIMENTO_COMPROVADO. Não modificar uma solução
comprovada sem razão técnica documentada. Consultar ANTES de inventar solução nova.

--------------------------------------------------------------------
ETAPA 6 — COMUNICAÇÃO ENTRE IAS (janelas diferentes) VIA MCP
--------------------------------------------------------------------
Objetivo: abrir um canal de comunicação, ACIONADO SOMENTE PELO USUÁRIO, para que
IAs em janelas diferentes se auxiliem (ex.: uma audita o trabalho da outra).

REGRAS:
1. AVALIAR os mecanismos reais disponíveis no VS Code (MCP, arquivos de estado,
   artefatos JSON, relatórios, protocolos estruturados). NÃO presumir que existe
   "chat compartilhado" nativo.
2. Usar arquivos/artefatos estruturados como canal (tarefa + arquivos + diff +
   resultado + relatório + perguntas específicas). NUNCA enviar o repositório inteiro.
3. O canal DEVE funcionar mesmo com apenas UMA IA disponível.
4. Comunicação é finita: IA A produz → IA B audita → A corrige → B contra-prova →
   fim. Nunca loop infinito.
5. NÃO instalar servidor/extensão sem justificativa e sem autorização.

--------------------------------------------------------------------
ETAPA 7 — INTEGRAÇÕES (FIREBASE / SUPABASE / CLOUDFLARE / GOOGLE CLOUD / GITHUB)
--------------------------------------------------------------------
Objetivo: agentes colaborativos que auxiliem, escrevam, ativem e desativem funções
de acordo com o tipo de evento — porém SEM quebrar o que existe.

REGRAS:
1. NÃO duplicar o sistema de autenticação (Firebase já existe, fase 5).
2. NÃO criar segundo sistema de permissões.
3. Um canal por capacidade (um MCP por capacidade; escopo limitado; permissões
   READ/WRITE/ADMIN/DEPLOY/DELETE separadas).
4. GitHub: consulta de repo/issues/PR/branches/diffs quando autorizado; NUNCA
   `git commit`/`git push` automático (proteção mantida).
5. Firestore: ao final da integração, substituir regras genéricas por regras
   específicas por coleção.
6. NUNCA expor senhas, tokens, chaves privadas, credenciais, API keys.
7. AVALIAR antes de criar; cada integração com responsabilidade, autenticação,
   segurança, auditoria, documentação e controle de custo.

--------------------------------------------------------------------
ETAPA 8 — AGENTES HOSPEDADOS (MICROSOFT FOUNDRY / AGENT BUILDER / SPRING BOOT)
--------------------------------------------------------------------
Objetivo: AVALIAR conceitualmente — não migrar, não reescrever.

Para cada tecnologia, produzir análise: finalidade · benefício · custo · risco ·
dependência · privacidade · segurança · consumo de tokens · necessidade de API key ·
infraestrutura · compatibilidade · manutenção · "onde seria útil" × "onde seria desnecessária".

NÃO adicionar tecnologia só por ser nova. NÃO criar complexidade sem necessidade.

--------------------------------------------------------------------
ETAPA 9 — AGENTE DE CONTEÚDO PARA MÍDIAS SOCIAIS
--------------------------------------------------------------------
Objetivo: AVALIAR a necessidade.

Antes de criar: verificar se existe sistema equivalente. O agente DEVE reutilizar
biblioteca de conteúdo, imagens, bibliografia, páginas e dados estruturados.
Gerar conteúdo a partir da base existente (página → conteúdo social) SEM recorrer
novamente a todo o repositório. Não duplicar conteúdo.

--------------------------------------------------------------------
ETAPA 10 — AGENTE ALFANDEGÁRIO (GATE DE ENTRADA/SAÍDA)
--------------------------------------------------------------------
Objetivo: um gate que valida o que ENTRA e o que SAI de cada etapa do pipeline.

Competência: verificar entradas (contexto mínimo, pré-condições cumpridas, regras
lidas, conformidade registrada) e saídas (resultado completo, validado, catalogado)
antes de passar para a próxima etapa. Somente leitura; reporta "APROVADO / REPROVADO
com pendências". Complementa o `Revisor Final (QA Gate)` — não duplica: o Revisor
Final julga a página; o Alfandegário julga o PROCESSO (etapas e evidências).

--------------------------------------------------------------------
ETAPA 11 — SERVIDORES MCP EM SANDBOX
--------------------------------------------------------------------
Objetivo: isolar operações de maior risco.

REGRAS:
1. Operações arriscadas (scripts novos, migrações, regras Firebase, deploy, MCPs
   experimentais) DEVEM ser testadas em ambiente isolado quando possível.
2. Diferenciar TESTE / DESENVOLVIMENTO / HOMOLOGAÇÃO / PRODUÇÃO.
3. Componente experimental NUNCA recebe permissões equivalentes às de produção.

--------------------------------------------------------------------
ETAPA 12 — ALINHAMENTO COM LOGIN (FASE 5) + PREMIUM + ANÚNCIOS
--------------------------------------------------------------------
Objetivo: garantir compatibilidade arquitetural (NÃO implementar premium agora).

1. A arquitetura de agentes/hooks DEVE ser compatível com autenticação, usuários,
   roles, permissões, admin, premium, moderador, usuário comum, planos, conteúdo
   gratuito/premium, anúncios, assinatura, futuro gateway de pagamento.
2. NÃO quebrar o sistema de contas existente (fase 5). NÃO duplicar autenticação
   nem permissões.
3. Ao final da integração futura, substituir regras genéricas do Firestore por
   regras específicas por coleção.

--------------------------------------------------------------------
ETAPA 13 — CATALOGAÇÃO COMPLETA (FASE 1 + FASE 2)
--------------------------------------------------------------------
Objetivo: catalogar TODO o sistema que faz as coisas acontecerem.

Manter atualizados: CATALOGO_DOS_AGENTES, CATALOGO_DOS_HOOKS, CATALOGO_DAS_SKILLS,
CATALOGO_DOS_PROMPTS, CATALOGO_DAS_INSTRUCTIONS, CATALOGO_DOS_MCP,
CATALOGO_DA_BASE_DE_CONHECIMENTO, CATALOGO_DE_ERROS, CATALOGO_DE_SOLUCOES,
CATALOGO_DE_TEMPLATES, CATALOGO_DE_IMAGENS, CATALOGO_DE_AUDITORIAS,
MAPA_DE_RESPONSABILIDADES, CATALOGO_CENTRAL_DA_ARQUITETURA e
registro-conformidade.json.

Consistência (FASE 50): detectar arquivo sem catalogar e item catalogado sem arquivo.

--------------------------------------------------------------------
ETAPA 14 — PROVA E CONTRA-PROVA
--------------------------------------------------------------------
Objetivo: validar a funcionalidade do sistema quando pronto.

1. PROVA: testar cada componente (teste unitário, integração, fluxo, regressão,
   segurança, custo). Registrar resultado.
2. CONTRA-PROVA: um agente INDEPENDENTE (ex.: `Auditor do Ecossistema` ou uma
   segunda IA) verifica se a prova está correta — procurando falhas que a primeira
   não encontrou. NÃO repetir o mesmo prompt; buscar erros, omissões, contradições,
   regressões, violações de regras.
3. Teste de regressão obrigatório: os 13 agentes e 12 hooks existentes continuam
   funcionando (criação de HTML, SEO, tradução, imagens, bibliotecas, blog,
   calculadoras, escalas, login).

--------------------------------------------------------------------
ETAPA 15 — AUDITORIA FINAL + RELATÓRIO
--------------------------------------------------------------------
Ao final, produzir relatório respondendo:
1. Todos os componentes estão catalogados?
2. Existem duplicações, conflitos, loops, órfãos?
3. Existem chamadas desnecessárias de IA?
4. Processos que deveriam ser script/hook?
5. As bibliotecas de erros e soluções estão completas?
6. A comunicação entre IAs funciona quando solicitada?
7. O sistema de login foi preservado? A arquitetura está pronta para premium/anúncios?
8. A segurança foi preservada? Os padrões canônicos continuam funcionando?
9. Estimativa qualitativa de economia de créditos.
10. Recomendação final.

====================================================================
5. REGRA DE EVIDÊNCIA DE CONFORMIDADE
====================================================================

Toda criação de novo componente (agente/hook/MCP/ferramenta) SÓ é aprovada se:
1. pesquisou componentes existentes; 2. verificou duplicação;
3. registrou necessidade; 4. registrou justificativa técnica; 5. registrou impacto;
6. criou; 7. testou; 8. auditou; 9. catalogou em `registro-conformidade.json`.

SEM essas etapas = NÃO CONFORME (hook `check-conformidade` reporta).
Uma alteração sem validação/registro NÃO PODE ser classificada como concluída.

====================================================================
6. REGRA FINAL
====================================================================

NÃO PRESUMIR. NÃO INVENTAR. NÃO DUPLICAR. NÃO DESTRUIR.
NÃO ALTERAR COMPONENTE CRÍTICO SEM AUDITORIA.
NÃO GASTAR CRÉDITOS DE IA DESNECESSARIAMENTE.
CRIAR SOMENTE QUANDO NECESSÁRIO — MAS CRIAR SEM HESITAÇÃO QUANDO A NECESSIDADE
FOR COMPROVADA, COM JUSTIFICATIVA, TESTE, AUDITORIA E REGISTRO.

Nenhuma alteração é concluída sem PROVA, CONTRA-PROVA e AUDITORIA compatíveis
com o risco. Nenhum commit/push automático. Segredos nunca expostos.

====================================================================
FIM DA INSTRUÇÃO
====================================================================
