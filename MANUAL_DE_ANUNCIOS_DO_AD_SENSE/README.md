# Manual de Anúncios do AdSense

Catálogo completo do sistema de publicidade do site **Calculadoras de Enfermagem**.

**Corte de auditoria:** 03/10/2026
**Publisher AdSense:** `ca-pub-6472730056006847`
**Estratégia vigente:** SEM Auto Ads — somente anúncios manuais controlados.

## Índice

| Arquivo | Conteúdo |
|---|---|
| [`MANUAL_DE_ANUNCIOS.md`](./MANUAL_DE_ANUNCIOS.md) | **Manual principal** — instruções + mapa do tesouro: como os anúncios são configurados em `global-scripts.js`, as unidades, o fluxo de carregamento, as regras de bloqueio Premium e o consentimento. |
| [`CATALOGO_DE_BLOCOS_E_PAGINAS.md`](./CATALOGO_DE_BLOCOS_E_PAGINAS.md) | **Catálogo de blocos e páginas** — inventário das unidades (slots), distribuição por idioma, status de funcionamento e inconsistências encontradas. |
| [`MAPEAMENTO_DE_ZONAS_DE_ANUNCIOS.txt`](./MAPEAMENTO_DE_ZONAS_DE_ANUNCIOS.txt) | **Mapeamento de zonas úteis** (arquivo de texto) — zonas recomendadas e tipos de anúncio, pronto para criar unidades manuais no painel do AdSense. |
| `_scan_result.json` | Resultado bruto do scan (machine-readable) — por página, slot e formato. |
| `_scan_ads.js` | Script que gera o `_scan_result.json` (rodar novamente para atualizar o catálogo). |

## Como usar

1. Leia o **manual principal** para entender o funcionamento.
2. Consulte o **catálogo** para ver quais páginas têm anúncios e o status.
3. Use o **mapeamento de zonas** para criar novas unidades manuais no AdSense.
4. Para revalidar após mudanças, rode: `node MANUAL_DE_ANUNCIOS_DO_AD_SENSE/_scan_ads.js`.
