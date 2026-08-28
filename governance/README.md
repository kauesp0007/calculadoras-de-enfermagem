# Governança de Conteúdo

Esta camada conecta o site ao runtime regulatório em `CKO-COREN-Projeto-Completo-v2` sem transformar a publicação atual em um bloqueio global.

## Estágios de adoção

1. `OBSERVE` (estado atual): detecta páginas candidatas a conteúdo de alto risco e reporta registros ausentes sem bloquear edição ou build.
2. Catalogar: adicionar cada página de alto risco a `registered_content`, com risco, fonte oficial, data de revisão e, quando aplicável, referência canônica.
3. Validar: revisar os alertas com o agente `Auditor de Governança Regulatória`.
4. `ENFORCE`: ativar apenas após catalogar o escopo priorizado; nesse modo, conteúdo de alto risco sem registro ou fonte oficial falha na validação.

## Verificação

```powershell
node scripts/validate-content-governance.js
```

O comando lê o runtime COREN, conta atos canônicos e snapshots adquiridos, identifica páginas candidatas e verifica o catálogo. Ele não baixa fontes, não altera conteúdo e não substitui a revisão humana.

## Limites

O hash da entrega comprova integridade do arquivo, não a verdade da fonte. Alegações normativas continuam exigindo fonte oficial adquirida, evidência e revisão editorial.
