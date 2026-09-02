================================================================================
  MAPA DE PLANOS × CONTEÚDO — CALCULADORAS DE ENFERMAGEM
  Fonte canônica do que é pago e do que é gratuito.
  Atualizado: 02/09/2026
================================================================================

Este documento registra, de forma centralizada, quais conteúdos pertencem a
cada plano. É a referência usada por agentes/desenvolvedores ao criar novas
páginas. O registro técnico (que efetivamente bloqueia o acesso) fica em:

  js/access/content-policy.js  -> objeto RESTRICTED_CONTENT

-------------------------------------------------------------------------------
1. PLANOS
-------------------------------------------------------------------------------
| ID      | Nome    | Anúncios | Disponibilidade |
|---------|---------|----------|-----------------|
| free    | Gratuito| Sim      | Ativo           |
| junior  | Júnior  | Não      | Ativo           |
| pleno   | Pleno   | Não      | Ativo           |
| senior  | Sênior  | Não      | Ativo           |

Hierarquia: free < junior < pleno < senior (plano maior libera o menor).

-------------------------------------------------------------------------------
2. REGRAS DE ACESSO POR PLANO
-------------------------------------------------------------------------------
free (Gratuito):
  - Exibe anúncios.
  - NÃO acessa as escalas premium (braden, fugulin, morse, dimensionamento,
    perroca, capurro, balancohidrico, meem, moca).
  - NÃO acessa os simulados de enfermagem.
  - NÃO acessa os formulários em branco.
  - NÃO imprime nem gera PDF de escalas e calculadoras.

junior (Júnior):
  - Sem anúncios.
  - Acessa todas as escalas e calculadoras.
  - NÃO acessa simulados nem formulários em branco.

pleno (Pleno):
  - Sem anúncios.
  - Todas as escalas e calculadoras.
  - Todos os simulados.
  - NÃO acessa formulários em branco.

senior (Sênior):
  - Sem anúncios.
  - Acesso total (tudo do Pleno).
  - Formulários de escalas em branco para imprimir e preencher.
  - Escalas de folga e férias semiautomáticas em Excel.
  - Fugulin, Braden, Morse e Dimensionamento semiautomáticas em Excel.
  - Apostilas e mapa cirúrgico.
  - Aplicativos APK para assistência.

-------------------------------------------------------------------------------
3. CONTEÚDO RESTRITO (mapa canônico)
-------------------------------------------------------------------------------
Escalas premium (exigem plano "junior" ou superior):
  braden, fugulin, morse, dimensionamento, perroca, capurro, balancohidrico,
  meem, moca

Simulados (todos exigem plano "pleno" ou superior):
  simulado-de-enfermagem, simulado-de-enfermagem4, simulado-de-enfermagem2,
  simulado-de-enfermagem3, simulado-de-enfermagem-nucleo-de-seguranca-do-paciente,
  simulado-de-enfermagem-doencas-de-notificacao-compulsoria, simulado_vacinacao,
  simulado_pcr, simulado_bloco-operatorio, flashcards_quiz,
  simulado_ibam_bebedouro_enfermeiro_2024, simulado_ibam_guarulhos_enfermeiro_2024,
  simulado_ibam_guarulhos_enfermeiro_esf_2024, simulado_ibam_japaratuba_sergipe_enfermeiro_2014,
  simulado_lei_organica_do_sus_8080-90, simulado_codigo_de_etica_enfermagem

Formulários em branco (exigem plano "senior"):
  formularios-em-branco-de-escalas, fotmulario_escala_de_perroca,
  formulario_de_fugulin, formulario_meem, formulario_impresso_sbar,
  formulario_impresso_saep, formulario_bishop, formulario_bps,
  formulario_cam, formulario_capurro, formulario_escala_cincinnati,
  formulario_escala_curb65, formulario_morse

-------------------------------------------------------------------------------
4. ONDE FICA CADA COISA (implementação)
-------------------------------------------------------------------------------
- Planos (IDs, rótulos, hierarquia): js/auth/plan-service.js
- Verificação hierárquica de plano: js/auth/authorization.js (hasPlan)
- Benefícios por plano (labels pt-BR): js/access/benefit-engine.js
- Bloqueio de conteúdo (RESTRICTED_CONTENT): js/access/content-policy.js
- Sem anúncios (junior/pleno/senior): global-scripts.js (PREMIUM_AD_FREE_PLANS)
- Bloquear impressão/PDF no gratuito: global-scripts.js (applyPlanRestrictions)
- Regra para agentes (perguntar plano em página nova):
  .github/instructions/planos-de-acesso.instructions.md

================================================================================
