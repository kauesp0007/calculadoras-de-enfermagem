---
description: "Use when: criar ou editar arquivos JSON — bancos de dados (NANDA/NIC), bibliotecas, traduções, manifestos e dados de ferramentas. Validade JSON e preservação de schema."
applyTo: "**/*.json"
---
# Padrão de JSON — Calculadoras de Enfermagem

## Validade
- Manter sempre JSON válido; não quebrar arrays/objetos ao inserir novos blocos.
- Inserir novos itens DENTRO do array existente, separados por vírgula (evitar erro de `],`).
- Preservar chaves e estrutura existentes; não renomear campos usados em produção.

## Arquivos sensíveis (não alterar sem autorização)
- `banco_nanda*.json`, `banco_nic_*.json`, `biblioteca*.json`, `manifest.json`, `package.json`.
- Traduções em `locales/` e JSONs por idioma: manter o mesmo conjunto de chaves em todos os idiomas.

## Verificar após editar
- Validar sintaxe com `node -e "JSON.parse(require('fs').readFileSync('<arquivo>','utf8'))"` ou o
  script/consumidor que lê o JSON.
