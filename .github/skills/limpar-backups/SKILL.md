---
name: limpar-backups
description: 'Excluir backups temporários (backups-temporarios/) quando ficarem pesados. Use quando o usuário quiser liberar espaço, após confirmar commit+push. Palavras-chave: limpar backups, excluir backups, liberar espaço, backups-temporarios, apagar bak, backup pesado.'
argument-hint: 'Pasta de backups a limpar (padrão: backups-temporarios)'
---

# Limpar Backups

## Quando usar
- O usuário pediu para excluir os backups temporários.
- A pasta `backups-temporarios/` ficou grande/pesada.
- IMPORTANTE: só limpar após o usuário confirmar que o commit+push foi feito.

## Procedimento
1. Mostre o resumo do que será excluído (sem excluir):
   `powershell -NoProfile -ExecutionPolicy Bypass -File .github/skills/limpar-backups/scripts/limpar-backups.ps1 -WhatIf`
2. Confirme com o usuário antes de excluir (a menos que ele já tenha pedido explicitamente).
3. Exclua:
   `powershell -NoProfile -ExecutionPolicy Bypass -File .github/skills/limpar-backups/scripts/limpar-backups.ps1 -Force`
4. Confirme a limpeza e o espaço liberado.

## Observações
- NUNCA excluir outras pastas (`downloads`, `biblioteca`, `blog`, `node_modules`, `.git`,
  `automacoes/backups_*`).
- O script remove SOMENTE o conteúdo de `backups-temporarios/`.
