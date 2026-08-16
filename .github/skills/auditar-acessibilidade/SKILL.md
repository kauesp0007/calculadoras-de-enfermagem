---
name: auditar-acessibilidade
description: 'Auditar acessibilidade de uma página HTML (lang, skip-link, alt, headings, labels, aria). Use para revisar acessibilidade de páginas do site antes de publicar. Palavras-chave: acessibilidade, wcag, aria, alt, skip-link, headings, labels, auditoria.'
argument-hint: 'Caminho do arquivo HTML a auditar'
---

# Auditar Acessibilidade

## Quando usar
- Revisar acessibilidade de uma página HTML do site.
- Antes de publicar uma nova calculadora ou página.

## Procedimento
1. Execute o script apontando para o arquivo:
   `powershell -NoProfile -ExecutionPolicy Bypass -File .github/skills/auditar-acessibilidade/scripts/auditar-acessibilidade.ps1 -Path <arquivo.html>`
2. Revise o relatório (problemas + severidade).
3. Reporte ao usuário; NÃO corrija sem autorização.

## Critérios verificados
- `lang` no `<html>`.
- Skip-link presente.
- `alt` em todas as `<img>`.
- Um único `<h1>`.
- `label`/`aria-label` associados a inputs.

## Observações
- É uma checagem básica e heurística; não substitui ferramentas completas (axe, Lighthouse).
