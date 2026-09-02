# Matriz de Seleção de Subagentes

> **Fonte conceitual:** `AI_ORCHESTRATION/PROMPT_CORE.md` (regras de orquestração).
> **Implementação determinística:** `scripts/classificar-impacto.js` (fonte única da matriz).
> **Plano/execução:** `scripts/orquestrador.js` (MODEL_DRIVEN) consome a seleção e monta
> o plano (paralelismo + sequência + evidência). Este documento é a visão legível; o script
> é a fonte executável — não editar um sem o outro.

A regra central é: **não executar todos os agentes em todas as tarefas** — executar só os
especialistas necessários, sem omitir validação obrigatória.

## Classificação (A–F)

| Classe | Natureza | Mecanismo |
|---|---|---|
| A | determinística | script/hook (0 IA) |
| B | semideterminística | script + interpretação de IA |
| C | raciocínio | agente de criação/edição |
| D | especialista | agente especializado |
| E | auditoria | auditor (leitura) |
| F | contra-prova | QA gate independente |

## Matriz (tipo → seleção mínima)

| Tipo de alteração | Cat. | Subagentes necessários | Scripts | Validações | Contra-prova |
|---|---|---|---|---|---|
| `html` (página) | C | Performance, SEO, Conformidade Técnica, Testador, Build, Revisor Final | `cwv-gate.js` | check-layout, check-head, check-a11y, content-governance | ✅ |
| `global` (footer/menu/body) | D | Ecossistema, Integridade, Conformidade Técnica, Testador, Revisor Final | `fix-broken-links.js` | check-layout, check-head, check-a11y | ✅ |
| `css` | B | Performance, Conformidade Técnica, Testador, Build, Revisor Final | `cwv-gate.js` | check-layout, check-a11y | ✅ |
| `js` | B | Performance, Testador, Integridade, Build, Revisor Final | `cwv-gate.js` | — | ✅ |
| `script` | A | Ecossistema | `auditar-ecossistema.js` | — | ❌ |
| `imagem` | B | Performance, Integridade | `cwv-gate.js` | — | ❌ |
| `fonte` | A | Performance, Integridade | `cwv-gate.js` | — | ❌ |
| `clinico` (conteúdo clínico) | D | Descoberta de Conhecimento, Governança Regulatória, Conformidade Técnica, Testador, Revisor Final | — | content-governance | ✅ |
| `formula` (cálculo) | C | Testador, Revisor Final | — | — | ✅ |
| `traducao` | C | Tradutor, Hreflang/Canonical, Integridade, Revisor Final | — | check-head | ✅ |
| `config` (JSON) | A | Ecossistema, Conformidade Técnica | `auditar-ecossistema.js` | check-json | ❌ |
| `conhecimento` (/knowledge/) | A | Descoberta de Conhecimento | `build-knowledge-index.js` | — | ❌ |
| `governanca` | D | Governança Regulatória | `validate-content-governance.js` | content-governance | ✅ |
| `seguranca` | A | Ecossistema | — | security-git, block-protected-files | ❌ |
| `build` (deploy) | A | Build, Ecossistema | `gerar-sw.js` | — | ❌ |
| `documentacao` | A | Ecossistema | `auditar-ecossistema.js` | — | ❌ |

**Subagentes não necessários** = complemento dos 15 agentes (não listados na linha). O
classificador emite essa lista explicitamente (evidência de "por que não foi chamado").

## Integração de dependências

Quando um arquivo compartilhado (CSS/JS/imagem/fonte/componente global) é alterado, o
classificador + `scripts/cwv-gate.js` identificam as páginas dependentes e as incluem na
auditoria — não limitando a verificação ao arquivo diretamente modificado.

## Integração CWV / correção segura

Toda alteração relevante dispara `scripts/cwv-gate.js`:
detectar → auditar → classificar (PASS/WARNING/FAIL/NOT_MEASURED/ERROR) → corrigir seguro
(≤ 3 ciclos) → build → reauditar → evidência. Correção nunca toca lógica clínica, cálculos
ou conteúdo regulatório.
