---
description: "Use when: criar ou editar JavaScript do site — lógica de calculadoras, scripts de build, automações e utilitários. Padrões de código, reutilização e restrições do projeto."
applyTo: "**/*.js"
---
# Padrão de JavaScript — Calculadoras de Enfermagem

## Regras gerais
- Nunca executar `git commit` ou `git push` (responsabilidade do usuário).
- Não remover funcionalidades existentes sem autorização explícita.
- Reutilizar código existente; evitar duplicação; manter nomenclatura em pt-BR quando o padrão usar.

## Estrutura
- Preferir IIFE com `"use strict"` nos scripts inline das páginas.
- Funções descritivas; IDs de elementos consistentes com o HTML.
- Estado persistido em `localStorage` com chave prefixada pela ferramenta (ex.: `perroca_pacientes`).

## Reutilização
- `/global-scripts.js`, `/lang-selector.js` e `/ce-calculadora-padrao.js` já fornecem infra comum.
- Scripts de build (`build.js`, `build-*.js`, `gerar-sw.js`, `gerarCapasPDF.js`, etc.) NÃO devem ser
  alterados sem autorização explícita.

## Acessibilidade e desempenho
- Manter `aria`, `role`, `tabindex` e foco visível.
- Evitar bloqueio do main-thread; adiar ads/analytics até o pós-load.

## Após alterar HTML/CSS/JS do site
Rodar o build obrigatório (ver `AI_RULES.md` / `.github/copilot-instructions.md`).
