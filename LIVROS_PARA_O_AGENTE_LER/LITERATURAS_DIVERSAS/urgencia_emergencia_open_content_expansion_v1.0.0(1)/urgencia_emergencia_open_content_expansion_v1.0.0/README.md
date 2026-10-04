# Urgencia e Emergencia - Open Content Expansion v1.0.0

Objetivo: adquirir o maximo de conteudo de enfermagem reutilizavel antes de qualquer estruturacao editorial, usando a colecao Open RN do NCBI Bookshelf.

## Escopo

10 livros nas edicoes mais recentes disponiveis no Open RN (2022-2025): Skills, Advanced Skills, Pharmacology, Fundamentals, Health Alterations, Management/Professional Concepts, Health Promotion, Mental Health/Community, Medical Terminology e Nursing Assistant.

A colecao Open RN declara licenca CC BY 4.0. Mesmo assim, itens incorporados de terceiros podem ter credito/licenca propria. Por isso imagens e assets, quando baixados com `--assets`, ficam em `assets_pending_review` e NAO sao liberados automaticamente para publicacao.

## Windows CMD

```bat
cd %USERPROFILE%\Downloads\urgencia_emergencia_open_content_expansion_v1.0.0
py -m pip install -r requirements.txt
py scripts\download_openrn_mass.py --manifest manifest\openrn_sources.json --out openrn_corpus --priority ALL
py scripts\validate_openrn_corpus.py --manifest manifest\openrn_sources.json --corpus openrn_corpus
py scripts\pack_openrn_corpus.py --corpus openrn_corpus --out openrn_corpus_downloaded
```

Para baixar tambem imagens hospedadas no NCBI para revisao posterior de direitos:

```bat
py scripts\download_openrn_mass.py --manifest manifest\openrn_sources.json --out openrn_corpus --priority ALL --assets
```

Nao publique automaticamente `assets_pending_review`.

## Saida por fonte

- `html/` snapshot de cada pagina/chapter
- `md/` texto em ordem documental
- `jsonl/` blocos estruturais sem sintese clinica
- `meta/source.json` URLs, hashes logicos, status e verificacao de licenca
- `assets_pending_review/` apenas se solicitado
- `meta/assets.csv` trilha de assets

O script nao cria fundamentos, claims ou paginas. Ele somente preserva o conteudo bruto para a etapa posterior.
