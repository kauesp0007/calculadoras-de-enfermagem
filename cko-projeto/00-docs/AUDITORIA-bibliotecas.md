# Auditoria das Bibliotecas CKO

Auditoria dos 11 objetos enviados. **22 correções** aplicadas; versões limpas em `02-bibliotecas/`. Zero contaminação de idioma residual.

## 1. Correções aplicadas por objeto

| Objeto | Categoria | Correções |
|---|---|---|
| `curativos` | Materiais e Dispositivos | renomeada chave contraindicaciones→contraindications; corrigido: '载体'→'carreador' |
| `cateteres` | Materiais e Dispositivos | renomeada chave contraindicaciones→contraindications |
| `agulhas` | Materiais e Dispositivos | renomeada chave contraindicaciones→contraindications; corrigido: 'косметические'→'aplicações estéticas' |
| `feridas` | Avaliação Clínica | renomeada chave contraindicaciones→contraindications |
| `cirurgicos` | Materiais e Dispositivos | renomeada chave contraindicaciones→contraindications |
| `sondas` | Materiais e Dispositivos | renomeada chave contraindicaciones→contraindications; corrigido: '某些'→'algumas'; corrigido: '预计'→'prevista'; corrigido: 'trafequal'→'traqueal' |
| `luvas` | Materiais e Dispositivos | — |
| `ostomias` | Materiais e Dispositivos | renomeada chave contraindicaciones→contraindications |
| `drenos` | Materiais e Dispositivos | renomeada chave contraindicaciones→contraindications; corrigido: 'soudain'→'súbito'; corrigido: 'Collections'→'coleções' |
| `respiratorios` | Materiais e Dispositivos | renomeada chave contraindicaciones→contraindications; corrigido: 'Hydratar'→'Hidratar'; corrigido: 'Associação de secreções'→'Acúmulo de secreções'; corrigido: ' mascaraComReservatorio'→'mascaraComReservatorio'; corrigido: ' sons pulmonares'→'sons pulmonares' |
| `antissepticos` | Produtos para Saúde | renomeada chave contraindicaciones→contraindications; corrigido: 'piel'→'pele' |

## 2. Classes de problema encontradas

1. **Chave inconsistente (`contraindicaciones` → `contraindications`)** — presente em 10 dos 11 objetos (só `luvas` já vinha correto). Padronizada para o termo canônico do schema.
2. **Contaminação de idioma (tradução automática)** — caracteres CJK/cirílicos embutidos em valores pt-BR:
   - `curativos`: `载体` → `carreador`
   - `agulhas`: `косметические` → `aplicações estéticas`
   - `sondas`: `某些` → `algumas`; `预计` → `prevista`; `trafequal` → `traqueal`
   - `drenos`: `soudain` → `súbito`; `Collections` → `coleções`
   - `respiratorios`: `Hydratar` → `Hidratar`; chaves com espaço à esquerda corrigidas
   - `antissepticos`: `piel` → `pele`
3. **Divergência de categoria** — `feridas` é `Avaliação Clínica` (catálogo vazio, não é dispositivo) e `antissepticos` é `Produtos para Saúde`. Não é erro; o schema passou a aceitar as três categorias explicitamente.
4. **Esquema distinto do CKO v11** — estes objetos usam um envelope próprio (comum entre si) + `exclusiveModules`/`characteristics`. Formalizei em `biblioteca-cko-v1.schema.json` (ver ESTRUTURA-biblioteca.md).

## 3. Validação

Os 11 objetos normalizados validam contra `01-schema/biblioteca-cko-v1.schema.json` com **zero erros**.

## 4. Recomendação

Reprocessar a origem que gerou estes JSONs: a contaminação CJK/cirílica e os typos multi-idioma sugerem uma etapa de tradução automática sem revisão. Um lint de idioma (bloquear qualquer caractere fora de Latin-1 + pt-BR) no pipeline evitaria a reincidência.