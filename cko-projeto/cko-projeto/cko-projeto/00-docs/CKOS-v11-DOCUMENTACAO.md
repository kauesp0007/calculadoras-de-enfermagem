# CKOS — CKO Seringa v11.0 (Consolidated + Runtime)

Documentação do projeto: schema consolidado, engine de referência e guia de operação.
Estado: **finalizado e validado** (meta-schema draft 2020-12 OK; instância de exemplo com 0 erros; pipeline executado de ponta a ponta nos dois caminhos — recomendação e bloqueio).

## Artefatos

| Arquivo | Papel |
|---|---|
| `seringa-cko-v11.schema.json` | Schema canônico consolidado (JSON Schema draft 2020-12). |
| `ckos_runtime.py` | Engine de referência que **executa** o `ckosRuntimeLayer`. |
| `seringa-insulina-030.cko.json` | Instância CKO real (seringa insulina U-100 0,3 mL), conforme ao schema. |
| `seringa-cko-v10.schema.json` | Versão anterior (não consolidada) — mantida apenas para linhagem. |

---

## 1. O que mudou: correção de sobreposição

O v10 tinha 105 propriedades de topo com redundância real. O v11 tem 96, sem perda de capacidade — cada bloco duplicado foi **fundido no bloco canônico**, não descartado.

| Antes (v10) | Depois (v11) | Ação |
|---|---|---|
| `graph`, `knowledgeLineageGraph`, `semanticWeb` | `knowledgeGraph` | Fundidos: `knowledgeGraph.nodes/edges`, `.lineage`, `.semanticWeb`. Um único grafo. |
| `scientificCitationEngine`, `evidenceConflictResolution` | `evidence` | `evidence.citations` e `evidence.conflictResolution`. Evidência tem um lar só. |
| `fieldProvenance` | `provenance` | Removido o duplicado; `provenance` (array) é a forma canônica. |
| `engine.inferenceEngine`, `engine.reasoningGraph` | `factInferenceEngine`, `explainability` | Removidos de dentro de `engine` — duplicavam blocos de topo. |
| `clinicalRuleRepository` (legado), `clinicalEngine` | `ruleRepositories` | Fonte única de regras. `clinicalEngine` era cópia de `clinicalKnowledge.clinicalRules`. |
| `explainableAI`, `explainabilityMetadata` | `explainability` | Um único bloco de explicabilidade. |

Além disso: `$defs` reutilizáveis (`condition`, `action`, `governedRule`) eliminam a repetição de shape de regra em quatro lugares. A regra em `ruleRepositories` agora é **governável e executável** ao mesmo tempo — carrega `logic` (string de governança) *e* `conditions`/`actions` (forma que o runtime avalia).

---

## 2. Migração v9/v10 → v11 (breaking changes)

1. **`knowledgeIdentity` é obrigatório** (desde v10). Adicione o bloco de identidade canônica do objeto (distinto de `identifiers`, que é do produto físico).
2. **Grafo:** mova `graph` → `knowledgeGraph.nodes/edges`; `knowledgeLineageGraph` → `knowledgeGraph.lineage`; `semanticWeb` → `knowledgeGraph.semanticWeb`.
3. **Evidência:** mova `scientificCitationEngine.citations` → `evidence.citations`; `evidenceConflictResolution.conflicts` → `evidence.conflictResolution`. Remova `fieldProvenance` (use `provenance`).
4. **Regras:** migre `clinicalRuleRepository.rules` e `clinicalEngine` → `ruleRepositories.clinicalRules` (adicionando `conditions`/`actions` executáveis).
5. **Inferência/explicabilidade:** remova `engine.inferenceEngine`/`engine.reasoningGraph`; renomeie `explainableAI` (+`explainabilityMetadata`) → `explainability`.

Registre a migração no próprio documento em `version.breakingChanges` e `version.migration`.

---

## 3. Arquitetura de runtime (o "sistema nervoso")

O `ckosRuntimeLayer` deixou de ser declaração e passou a ser **pipeline executável**. Uma consulta atravessa nove estágios; cada estágio aciona um engine e respeita guardrails.

```
ingest → factAssertion → ruleEvaluation → inference → decision
       → workflow → explanation → humanValidation → output
```

| Estágio | Engine acionado | O que faz |
|---|---|---|
| `ingest` | `patientContextModel` | Carrega e normaliza o contexto do paciente. |
| `factAssertion` | `factInferenceEngine` | Assere os fatos-base com sua confiança. |
| `ruleEvaluation` | `ruleRepositories` | Avalia `conditions/actions`; regras de segurança que disparam viram bloqueios. |
| `inference` | `factInferenceEngine` | Encadeamento progressivo (forward chaining) sobre os fatos. |
| `decision` | `decisionTreeRepository` | Percorre a árvore e consolida a recomendação. |
| `workflow` | `clinicalWorkflowEngine` | Associa o workflow clínico aplicável. |
| `explanation` | `explainability` | Calcula confiança e monta o rastro de raciocínio. |
| `humanValidation` | guardrails | Aplica os portões de segurança (ver abaixo). |
| `output` | — | Emite o `executionTrace`. |

### Guardrails e human-in-the-loop

O engine é conservador por desenho — **em dúvida, não emite recomendação autônoma**:

- **Bloqueio de segurança (never-event):** uma `safetyRule` com `safetyCritical: true` e ação `avoid`/`block` que dispara → `status: blocked`, pipeline interrompido em `ruleEvaluation` (`blockOnSafetyRule`). Nenhuma recomendação sai.
- **Alto risco:** se `patientSafety.highRisk` e o token estiver em `globalGuardrails.mandatoryHumanValidationFor` → `status: pending_human_validation`.
- **Confiança baixa:** se a confiança agregada < `minConfidence` do estágio (ou `minOverallConfidence` global) → validação humana.
- **Exigência explícita:** `guardrails.requiresHumanValidation` no estágio força o portão.

Só quando nenhum portão dispara o `status` é `approved` (e ainda assim `humanValidated: false` — aprovação automática, sem humano no laço).

### Modelo de confiança e explicabilidade

Confiança agregada = **mínimo** da confiança das regras que sustentam a recomendação (abordagem conservadora e explicável; sem caixa-preta). O `reasoningTrace` registra, por estágio, o que aconteceu — ligável a `explainability` e a `auditTrail`.

---

## 4. Como executar

```bash
pip install jsonschema      # opcional, habilita validação estrutural

# Caminho limpo → recomenda, mas exige validação humana (insulina = alto risco)
python3 ckos_runtime.py \
  --schema seringa-cko-v11.schema.json \
  --cko seringa-insulina-030.cko.json \
  --patient '{"medication":"insulin","volumeMl":0.3,"population":"pediatric"}'
# → status: pending_human_validation | rec: seringa-insulina-u100-03ml | conf: 0.95

# Never-event → bloqueio, sem recomendação
python3 ckos_runtime.py --cko seringa-insulina-030.cko.json \
  --patient '{"medication":"insulin","volumeMl":0.3,"syringeType":"common"}'
# → status: blocked (RULE-SYR-SAFE-001)
```

Integração programática:

```python
from ckos_runtime import CKOSRuntime
import json
cko = json.load(open("seringa-insulina-030.cko.json"))
trace = CKOSRuntime(cko).run({"medication": "insulin", "volumeMl": 0.3})
print(trace.status, trace.finalRecommendation, trace.confidence)
```

---

## 5. Perfis de conformidade

`conformanceProfile` permite validação incremental sem exigir todos os blocos: `core` → `clinical` → `runtime` → `full`. Um documento declara `implementedBlocks` e `declaredButNotImplemented`, evitando que a riqueza do schema mascare o que de fato está implementado.

---

## 6. Fronteira de escopo (honesta)

O engine **executa** de verdade: avaliação de regras (`conditions/actions`), forward chaining de fatos, travessia de árvore, guardrails e trace. **Ainda não executa**, por decisão consciente:

- **`governedRule.logic` (string/DSL)** — é a forma de governança; a execução usa `conditions/actions`. Parser de DSL fica para v12.
- **`knowledgeGraph.semanticWeb.shaclShapes`** — declaradas, não aplicadas em runtime (exigiria um validador SHACL).
- **Confiança probabilística** — hoje é o mínimo das regras de suporte; um modelo bayesiano/ponderado é evolução futura.

---

## 7. Roadmap v12

1. **Parser de CKO-DSL** para `governedRule.logic`, unificando a forma humana e a executável.
2. **Port `ckos-runtime.js`** (vanilla JS) para rodar no navegador junto de `cko-calc.js`/`cko-interactive.js` e no `preview.html`.
3. **Validação SHACL** ligada em runtime a partir de `knowledgeGraph.semanticWeb`.
4. **Modelo de confiança ponderado** com propagação por evidência.
5. **CI de conformidade:** o próprio `ckos_runtime.py --schema` como gate de build no pipeline SSG.

O v11 fecha o ciclo declaração → execução. A v12 é sobre expressividade (DSL) e alcance (navegador + CI), não sobre mais campos.
