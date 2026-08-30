# 🐞 Catálogo de Erros (FASE 20)

**Fonte:** `/memories/repo/acervo-erros.json` (memória operacional) — **11 registros** (service worker cache, footer, JSON fora do array, impressão, skip-link, hero largura, etc.).

## Schema (FASE 20 — campos completos)
`id` · `data` · `hora` · `categoria` · `sistema` · `arquivo` · `agente` · `hook` · `modelo` · `tarefa` · `contexto` · `sintoma` · `mensagem` · `causa_raiz` · `causa_secundaria` · `impacto` · `arquivos_afetados` · `diagnostico` · `tentativas` · `solucao` · `teste` · `contraprova` · `resultado` · `prevencao` · `regra_criada` · `tags` · `severidade`.

## Estado
Schema atual é **parcial** (id, area, sintoma, causaRaiz, correcao, arquivos, tags). Evolução: expandir para o schema completo **sem** reescrever registros antigos (adicionar campos novos como opcionais).

## Uso
Consultar **ANTES** de depurar um problema novo. Registrar toda ocorrência corrigida.
