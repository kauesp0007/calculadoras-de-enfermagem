# 🖼️ Catálogo de Imagens (FASE 6)

**Fonte atual:** `/knowledge/images.json` (auto-gerado) — inventário de imagens por página (file, alt, category, pages, pages_count, duplicated).

## Campos ideais por imagem (FASE 6)
nome · caminho · extensão · dimensões · formato · tamanho · ALT · significado · assunto · páginas onde aparece · categorias · sinônimos · possíveis usos · tipo (banner/conteúdo/ícone/ilustração) · versão original · WebP · SVG · lightbox · reutilizável · restrições · fonte/licença.

## Regras
- Antes de gerar nova imagem, consultar `images.json`; **reutilizar** se já existir equivalente.
- Não duplicar imagens; não gerar nova imagem desnecessariamente (o agente `Gerador de Imagens` orquestra, reutilizando `watch-images.js` e otimizadores).

## Estado
`images.json` cobre hoje: file, alt, category, pages, duplicated. **Lacuna:** dimensões, tamanho de arquivo, licença e reutilização ainda não são extraídos automaticamente (pendente — não crítico, pois a criação é orquestrada pelo agente que consulta o catálogo antes).
