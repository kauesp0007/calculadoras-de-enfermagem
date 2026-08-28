# Rede de Conhecimento do Site (Knowledge)

Base de conhecimento estruturada do site Calculadoras de Enfermagem. É um **ÍNDICE +
RELACIONAMENTO** dos HTMLs da raiz — **NÃO é fonte primária da verdade**.

> Regra de ouro: a base prefere **"não saber"** a **inventar**. Relações semânticas não
> são verdade científica. Legislação e referências sempre exigem verificação na fonte oficial.

## Arquitetura

```
REPOSITÓRIO (HTMLs da raiz + relatorio_paginas.txt)
        ↓
INDEXADOR  (scripts/build-knowledge-index.js)
        ↓
BASE DE CONHECIMENTO  (/knowledge/*.json)
        ↓
DISCOVERY AGENT  (scripts/knowledge-discover.js + .github/agents/descoberta-conhecimento.agent.md)
        ↓
PLANEJAMENTO → CRIAÇÃO → AUDITORIA → CONTRA-AUDITORIA → REINDEXAÇÃO
```

## Arquivos gerados (`/knowledge/`)

| Arquivo | Conteúdo |
|---|---|
| `pages.json` | Metadados por página: `file`, `title`, `h1`, `h2`, `meta_description`, `keywords`, `tipo`, `links_out`, `images`, `references`, `legislation`, `didactic_components` |
| `relationships.json` | `relations` (tipo + confiança + evidência), `backlinks`, `orphans`, `in_count` |
| `images.json` | Inventário de imagens: `file`, `alt`, `category`, `pages`, `pages_count`, `duplicated` |
| `references.json` | Referências catalogadas (`verification_required` quando sem URL) |
| `legislation.json` | Legislações mencionadas e páginas que as usam |
| `scales.json` | Escalas catalogadas |
| `calculators.json` | Calculadoras catalogadas |
| `taxonomy.json` | Taxonomia derivada do conteúdo real |
| `aliases.json` | Siglas/sinônimos (curados + detectados entre parênteses) |
| `didactic-assets.json` | Componentes didáticos por página (quiz, tabela, fluxograma, timeline, cards, accordion, lightbox) |
| `.hashes.json` | Cache de hash (SHA-1) para atualização incremental |
| `reports/index-report.json` | Cobertura, órfãs, links quebrados, duplicações |

## Tipos de relação e confiança

| Tipo | Significado | Evidência típica | Confiança |
|---|---|---|---|
| `cross_reference` | link interno explícito | `internal_link` | high |
| `related_topic` | afinidade semântica (keywords/título) | `keyword_overlap` (+score) | medium/low |
| `legislation_relation` | legislação compartilhada | nome da norma | high |

## Comandos

```powershell
# Indexação completa (com backup dos JSONs em backups-temporarios/knowledge/)
node scripts/build-knowledge-index.js --full

# Indexação incremental (só arquivos alterados desde o último hash)
node scripts/build-knowledge-index.js

# Reindexar um único arquivo (usado pelo hook pós-edição)
node scripts/build-knowledge-index.js --file nome-da-pagina.html

# Descoberta de conhecimento (dossiê)
node scripts/knowledge-discover.js "Processo de Enfermagem"
node scripts/knowledge-discover.js "PCR" --pretty
```

## Hook

`PostToolUse` → `.github/hooks/knowledge-index.json` → `scripts/hooks/knowledge-index.ps1`:
reindexa incrementalmente quando um HTML **da raiz** (não em subpastas/idiomas, não proibido)
é criado/editado. Nunca toca `downloads/`, `biblioteca/`, `blog/`, `blog-templates/`,
`node_modules/`, `.git/`, idiomas nem os arquivos proibidos.

## Limitações (conhecidas, honestas)

- A extração de referências foca seções com `id="referencias"` ou
  `data-references-section="v1"` — páginas com `.refs` em `<div>` podem ficar sub-representadas.
- Classificação (`tipo`) é heurística pelo título/keywords; a taxonomia é derivada, não curada.
- Afinidade por keywords é apenas semântica — revisar sempre antes de usar.

## Testes

```powershell
node scripts/test-knowledge-index.js
```
