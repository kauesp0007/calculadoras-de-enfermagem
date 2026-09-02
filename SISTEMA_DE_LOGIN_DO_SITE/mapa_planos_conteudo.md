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
| senior  | Sênior  | Não      | Em breve (não configurado) |

Hierarquia: free < junior < pleno < senior (plano maior libera o menor).

-------------------------------------------------------------------------------
2. REGRAS DE ACESSO POR PLANO
-------------------------------------------------------------------------------
free (Gratuito):
  - Exibe anúncios.
  - NÃO acessa as escalas premium (fugulin, braden, morse, dimensionamento,
    perroca, gasometria).
  - NÃO acessa os simulados de enfermagem.
  - NÃO imprime nem gera PDF de escalas e calculadoras.

junior (Júnior):
  - Sem anúncios.
  - Acessa todas as escalas e calculadoras.
  - Acessa os 5 primeiros simulados (ordem do menu).

pleno (Pleno):
  - Sem anúncios.
  - Todas as escalas e calculadoras.
  - Todos os simulados.
  - Formulários de escalas em branco para imprimir e preencher.

senior (Sênior):
  - Sem anúncios.
  - Acesso total (tudo do Pleno).
  - Escalas de folga e férias semiautomáticas em Excel.
  - Fugulin, Braden, Morse e Dimensionamento semiautomáticas em Excel.
  - Apostilas e mapa cirúrgico.
  - Aplicativos APK para assistência.

-------------------------------------------------------------------------------
3. CONTEÚDO RESTRITO (mapa canônico)
-------------------------------------------------------------------------------
Escalas premium (exigem plano "junior" ou superior):
  fugulin, braden, morse, dimensionamento, perroca, gasometria

Simulados 1º ao 5º (exigem plano "junior" ou superior):
  1. simulado-de-enfermagem
  2. simulado-de-enfermagem4
  3. simulado-de-enfermagem2
  4. simulado-de-enfermagem3
  5. simulado-de-enfermagem-nucleo-de-seguranca-do-paciente

Simulados 6º em diante (exigem plano "pleno" ou superior):
  6. simulado-de-enfermagem-doencas-de-notificacao-compulsoria
  7. simulado_vacinacao
  8. simulado_pcr
  9. simulado_bloco-operatorio
  10. flashcards_quiz
  11. simulado_ibam_bebedouro_enfermeiro_2024
  12. simulado_ibam_guarulhos_enfermeiro_2024
  13. simulado_ibam_guarulhos_enfermeiro_esf_2024
  14. simulado_ibam_japaratuba_sergipe_enfermeiro_2014
  15. simulado_lei_organica_do_sus_8080-90
  16. simulado_codigo_de_etica_enfermagem

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
