# Calculadoras de Enfermagem — Canonical Content Model v0.2.0

Esta versão converte a fundação de **Enfermagem do Trabalho / Saúde do Trabalhador** para o metamodelo canônico solicitado:

```text
PLATFORM
├── TOOLS                         # classe paralela
│   ├── calculator
│   ├── scale
│   ├── score
│   └── other_tool
└── AREAS
    └── CLUSTERS
        └── CONTENT
            └── RELATED CONTENT   # relação tipada, não hierarquia duplicada
```

## Decisões canônicas

1. **TOOL != CONTENT.** Calculadora/escala/escore possuem identidade, versão, inputs/outputs e evidência próprias.
2. **AREA > CLUSTER > CONTENT** é a hierarquia de navegação.
3. Os antigos 32 domínios de Saúde do Trabalhador tornam-se **32 clusters** de uma área canônica.
4. Os 140 módulos curriculares permanecem como **coverage groups internos**, não como obrigação de navegação pública.
5. Os 885 tópicos permanecem integralmente cobertos e viram **885 CONTENT blueprints**, sem criar URL automaticamente.
6. Os 1.062 page candidates da v0.1 deixam de ser objetos canônicos separados: intenção/formato editorial passa a ser projeção do CONTENT.
7. Fonte-base do cluster/tópico é `candidate_source_ids`; somente fonte vinculada a **CLAIM validado** entra em `verified_source_ids`.
8. Rights/licença é gate obrigatório antes de publicação. O arquivo `rights_audit_sources.csv` foi criado para as 34 fontes desta área e está intencionalmente em estado PENDING.
9. `related_content` automático é sugestão determinística e não verdade canônica até revisão editorial.

## Contagens

- Áreas: 1
- Clusters: 32
- Coverage groups: 140
- Knowledge topics preservados: 885
- Content blueprints: 885
- Legacy page candidates recebidos: 1062
- Objetos-página derivados eliminados na camada canônica: 177
- Relações de conteúdo geradas: 4300
- Claims preservados: 29
- Átomos preservados: 29
- Fontes preservadas: 34
- Ferramentas inferidas automaticamente: **0** (deliberadamente)

## Próximo gate

A promoção de um CONTENT deve seguir:

`CONTENT -> CLAIM -> EVIDENCE -> SOURCE -> RIGHTS -> EDITORIAL REVIEW -> PUBLICATION`

Não promover conteúdo com `candidate_source_ids` herdados do cluster como se fossem referências específicas.
