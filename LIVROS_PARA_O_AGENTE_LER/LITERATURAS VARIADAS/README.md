# Urgência e Emergência — Content Bank v1.0.0

## Objetivo
Este pacote contém o **máximo de conteúdo fonte-cêntrico atualmente reutilizável** a partir do corpus local e da auditoria de direitos. Ele **não organiza conteúdo em fundamentos, claims ou páginas**.

### Conteúdo incluído
- 20 fontes GREEN com texto integral extraído em ordem documental.
- 28,790 blocos reutilizáveis (3,610,254 caracteres).
- Cada fonte possui `raw_blocks/*.jsonl` e uma versão legível em `md/*.md`.
- `content_bank.sqlite` indexa somente o texto GREEN reutilizável.
- Fontes condicionais são mantidas separadas; quando a auditoria permite distribuição apenas do original, o arquivo original foi copiado sem alteração.
- ORANGE/RED permanecem como referências/metadados, sem republicação de texto protegido.

### O que deliberadamente NÃO foi feito
- Não houve síntese clínica.
- Não houve atom→claim.
- Não houve agrupamento em fundamentos.
- Não houve montagem das 170 páginas.
- Não houve paráfrase de fontes bloqueadas para contornar licença.

### Lacuna aberta importante
`SRC-NCBI` (Nursing Skills / Math Calculations) é CC BY 4.0, mas o download local existente ficou apenas como metadata. Ele está listado em `reports/open_reusable_content_still_to_acquire.csv`; deve ser adquirido integralmente antes da etapa de estruturação.

### Pastas
- `fulltext_reusable/md/` — texto legível, fonte por fonte.
- `fulltext_reusable/raw_blocks/` — extração sem síntese.
- `conditional_originals/` — apenas originais cuja redistribuição foi explicitamente aceita sob condições.
- `conditional_reference/` — fontes condicionais sem transformação automática.
- `reference_only/` — ORANGE/RED, metadados e regras de uso.
- `registry/` — inventário, rights audit e attribution.
- `reports/` — métricas e gaps.

A estrutura temática virá somente depois que o banco de conteúdo estiver considerado suficiente.
