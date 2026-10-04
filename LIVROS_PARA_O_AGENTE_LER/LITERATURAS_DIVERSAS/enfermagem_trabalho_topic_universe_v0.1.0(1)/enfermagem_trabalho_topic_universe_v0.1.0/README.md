# Enfermagem do Trabalho Topic Universe v0.1.0

Fundação editorial para produzir conteúdo de **Enfermagem do Trabalho / Saúde Ocupacional** a partir de uma matriz de cobertura Técnico + Graduação + Pós-graduação, seguindo o princípio estrutural do pacote de Gotejamento.

## Princípio

**Objeto atômico é unidade de conhecimento; página é composição editorial completa.** A matriz curricular é instrumento de descoberta e cobertura, não o produto final.

## Estado desta versão

- 32 domínios;
- 140 módulos;
- 885 tópicos granulares candidatos à atomização;
- 1062 páginas candidatas por intenção editorial;
- 29 átomos iniciais com claims e fontes;
- 34 fontes de alta autoridade registradas;
- 18 entradas no registry normativo;
- 7 briefs editoriais piloto.

## Regra que diferencia esta base do piloto de Gotejamento

`topic_inventory.json` pode ser amplo e exploratório. `atomic_knowledge.json` só recebe afirmações promovidas com fonte identificada. Isto impede transformar títulos de pauta em “verdade canônica”.

## Estrutura

- `curriculum/` — seeds T/G/P e crosswalk de profundidade;
- `data/taxonomy.json` — domínios e módulos;
- `data/topic_inventory.*` — universo granular de tópicos;
- `data/atomic_knowledge.json` — átomos já suportados por fontes;
- `data/claim_registry.json` — claim → atom → fonte;
- `data/normative_registry.json` — normas, status e lifecycle;
- `data/sources.*` — fontes registradas;
- `data/content_manifest.*` — URLs/páginas candidatas;
- `content/briefs/` — pilotos de composição editorial;
- `schemas/` — contratos mínimos;
- `reports/` — cobertura e build;
- `src/GENERATOR_NOTES.md` — regras para a próxima onda.

## Lifecycle normativo

PPRA foi mantido como objeto histórico/legado. GRO/PGR ocupam a camada vigente. Objetos dinâmicos (eSocial, NRs, FAP etc.) precisam de `verified_on` e revisão antes da publicação final.

## Próxima onda

1. Atomizar por domínio e validar cada claim;
2. Expandir a bibliografia científica por tópico (PubMed/BVS/SciELO/WHO/ILO/NIOSH/IARC/Fundacentro);
3. Deduplicar intenções de página;
4. Priorizar clusters;
5. Gerar Markdown canônico;
6. Renderizar HTML/PDF/assets;
7. executar QA de evidência, acessibilidade, SEO, links e hashes.
