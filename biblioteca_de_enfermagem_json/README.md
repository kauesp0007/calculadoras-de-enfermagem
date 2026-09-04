# Biblioteca Digital Estruturada de Conhecimento em Saúde

Sistema autônomo, local, incremental, auditável e rastreável de catalogação e produção de
conhecimento em saúde (prioridade: enfermagem).

## Estrutura (spec §8)

```
biblioteca_de_enfermagem_json/
├── schemas/          ← JSON Schemas (draft-07) — FASE 2 ✅
├── catalogo/         ← itens de conhecimento (FASE 6)
├── autores/          ← entidades de autores (FASE 6)
├── instituicoes/     ← entidades de instituições (FASE 6)
├── assuntos/         ← vocabulário de assuntos (FASE 6)
├── especialidades/   ← taxonomia de especialidades (FASE 6)
├── profissoes/       ← taxonomia de profissões (FASE 6)
├── fontes/           ← fontes externas consultadas (FASE 10)
├── referencias/      ← referências Vancouver (FASE 6)
├── indices/          ← índices persistentes (FASE 7)
├── evidencias/       ← evidências científicas (FASE 9)
├── auditorias/       ← registros de auditoria (FASE 10)
├── estatisticas/     ← estatísticas internas (FASE 14)
└── manifest.json     ← manifesto da biblioteca (contadores)
```

## Fluxo (spec §64)

```
FONTES (LIVROS_PARA_O_AGENTE_LER/)
  → CONHECIMENTO ESTRUTURADO (biblioteca_de_enfermagem_json/)
    → SÍNTESES / DOCUMENTOS (biblioteca_de_enfermagem/*.docx)
      → SITE (futuro, via camada de comunicação — FASE 15)
```

## Status das fases (spec §77)

- FASE 1 — Auditoria da arquitetura ✅
- FASE 2 — Definição dos schemas ✅ (`schemas/`)
- FASE 3 — Sistema de ingestão ✅ (`ingestao.py`)
- FASE 4 — Hash e deduplicação ✅ (`hash_manager.py`)
- FASE 5 — Extração de texto ✅ (`extracao.py`, PyMuPDF)
- FASE 6 — Catalogação ✅ (`catalogacao.py`)
- FASE 7 — Indexação ✅ (`indexacao.py`)
- FASE 8 — Memória persistente ✅ (`estado.py`)
- FASE 9 — Análise semântica ✅ (`analise.py`, DeepSeek + cache por hash)
- FASE 10 — Auditoria bibliográfica ✅ (`auditoria.py`)
- FASE 11 — Geração DOCX ✅ (`gerador_docx.py`, python-docx)
- FASE 12 — Revisão ✅ (`revisao.py`)
- FASE 13 — Logs ✅ (`logger.py`)
- FASE 14 — Dashboard/relatórios ✅ (`relatorio.py`)
- FASE 15 — Camada de comunicação ✅ (`api.py`)

## Como rodar o pipeline

```powershell
$PY = "C:/Users/kaues/AppData/Local/Python/pythoncore-3.14-64/python.exe"
& $PY -m automacoes.biblioteca_saude.ingestao
& $PY -m automacoes.biblioteca_saude.hash_manager
& $PY -m automacoes.biblioteca_saude.extracao
& $PY -m automacoes.biblioteca_saude.catalogacao
& $PY -m automacoes.biblioteca_saude.indexacao
& $PY -m automacoes.biblioteca_saude.estado
& $PY -m automacoes.biblioteca_saude.analise
& $PY -m automacoes.biblioteca_saude.auditoria
& $PY -m automacoes.biblioteca_saude.gerador_docx
& $PY -m automacoes.biblioteca_saude.revisao
& $PY -m automacoes.biblioteca_saude.relatorio
```

Todas as fases aceitam `--dry-run` (spec §42).

## Reuso (não duplicar)

- `automacoes/catalogador/` — pipeline Python (hash SHA-256, SQLite, cache, DeepSeek, OCR).
- `knowledge/` — base de conhecimento do site + `build-knowledge-index.js`.
- `scripts/extract-docx.js` (mammoth) — leitura de DOCX.
- `AI_ORCHESTRATION/` + `scripts/orquestrador.js` — orquestração/classificação.
