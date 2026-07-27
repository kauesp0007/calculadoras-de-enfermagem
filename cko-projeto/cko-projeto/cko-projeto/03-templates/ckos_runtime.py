#!/usr/bin/env python3
"""
CKOS Runtime Engine — implementação de referência do ckosRuntimeLayer (CKO Seringa v11).

Executa o pipeline declarado em `ckosRuntimeLayer.stages` sobre um documento CKO e um
contexto de paciente, aplicando guardrails de segurança e emitindo um executionTrace
auditável. É a "camada de execução" que transforma os engines estáticos do schema em
um sistema que processa uma consulta de ponta a ponta.

Fronteira de escopo (honesta, sem placeholders):
  - AVALIA a forma executável das regras (conditions/actions) em ruleRepositories e em
    clinicalKnowledge.clinicalRules.
  - NÃO interpreta `governedRule.logic` (string/DSL) — essa é a forma de governança;
    a forma executável é conditions/actions. Um parser de DSL é trabalho de v12.
  - As shaclShapes de knowledgeGraph.semanticWeb são declaradas, não aplicadas aqui.
  - Validação estrutural do documento usa jsonschema (opcional) quando disponível.

Uso:
    python3 ckos_runtime.py --schema seringa-cko-v11.schema.json \
                            --cko seringa-insulina-030.cko.json \
                            --patient '{"medication":"insulin","volumeMl":0.3,...}'
"""
from __future__ import annotations
import argparse
import datetime as _dt
import json
import uuid
from dataclasses import dataclass, field
from typing import Any


# --------------------------------------------------------------------------- #
# Utilidades
# --------------------------------------------------------------------------- #
def _now() -> str:
    return _dt.datetime.now(_dt.timezone.utc).isoformat()


def _get(ctx: dict, key: str) -> Any:
    """Leitura de campo do contexto, tolerante a subestruturas {value,unit}."""
    val = ctx.get(key)
    if isinstance(val, dict) and "value" in val:
        return val["value"]
    return val


# --------------------------------------------------------------------------- #
# Avaliador de condições / regras
# --------------------------------------------------------------------------- #
_OPS = {
    "equals":        lambda a, b: a == b,
    "notEquals":     lambda a, b: a != b,
    "greaterThan":   lambda a, b: a is not None and a > b,
    "lessThan":      lambda a, b: a is not None and a < b,
    "greaterOrEqual":lambda a, b: a is not None and a >= b,
    "lessOrEqual":   lambda a, b: a is not None and a <= b,
    "in":            lambda a, b: a in b if isinstance(b, (list, tuple, set)) else False,
    "notIn":         lambda a, b: a not in b if isinstance(b, (list, tuple, set)) else True,
    "exists":        lambda a, b: (a is not None) == bool(b),
}


def eval_condition(cond: dict, ctx: dict) -> bool:
    op = _OPS.get(cond["operator"])
    if op is None:
        raise ValueError(f"Operador desconhecido: {cond['operator']}")
    return bool(op(_get(ctx, cond["field"]), cond.get("value")))


def eval_rule(rule: dict, ctx: dict) -> bool:
    """Regra dispara se TODAS as condições forem verdadeiras (AND)."""
    conds = rule.get("conditions") or []
    if not conds:
        return False
    return all(eval_condition(c, ctx) for c in conds)


# --------------------------------------------------------------------------- #
# Trace de execução
# --------------------------------------------------------------------------- #
@dataclass
class ExecutionTrace:
    traceId: str = field(default_factory=lambda: f"trace-{uuid.uuid4()}")
    startedAt: str = field(default_factory=_now)
    completedAt: str | None = None
    stagesExecuted: list = field(default_factory=list)
    firedRules: list = field(default_factory=list)
    assertedFacts: list = field(default_factory=list)
    decisionPath: list = field(default_factory=list)
    finalRecommendation: dict | None = None
    warnings: list = field(default_factory=list)
    safetyBlocks: list = field(default_factory=list)
    confidence: float | None = None
    humanValidated: bool = False
    status: str = "pending"          # pending | approved | pending_human_validation | blocked | error
    reasoningTrace: list = field(default_factory=list)

    def to_dict(self) -> dict:
        d = self.__dict__.copy()
        return d


# --------------------------------------------------------------------------- #
# Runtime
# --------------------------------------------------------------------------- #
class CKOSRuntime:
    def __init__(self, cko: dict):
        self.cko = cko
        self.layer = cko.get("ckosRuntimeLayer", {})
        self.trace = ExecutionTrace()

    # ---- validação estrutural opcional ---------------------------------- #
    @staticmethod
    def validate(cko: dict, schema: dict) -> list[str]:
        try:
            from jsonschema import Draft202012Validator
        except ImportError:
            return ["jsonschema não instalado — validação estrutural pulada."]
        v = Draft202012Validator(schema)
        return [f"{list(e.path)}: {e.message}" for e in v.iter_errors(cko)]

    # ---- handlers de estágio -------------------------------------------- #
    def _stage_ingest(self, ctx: dict, stage: dict):
        self.trace.reasoningTrace.append({"stage": "ingest", "detail": f"{len(ctx)} campos de contexto carregados."})

    def _stage_fact_assertion(self, ctx: dict, stage: dict):
        for a in self.cko.get("factInferenceEngine", {}).get("assertions", []):
            self.trace.assertedFacts.append({"id": a["id"], "fact": a["fact"], "confidence": a.get("confidence", 1.0)})
        self.trace.reasoningTrace.append(
            {"stage": "factAssertion", "detail": f"{len(self.trace.assertedFacts)} fatos assertidos da base."})

    def _stage_rule_evaluation(self, ctx: dict, stage: dict):
        repos = self.cko.get("ruleRepositories", {})
        # também avalia regras inline de clinicalKnowledge
        inline = self.cko.get("clinicalKnowledge", {}).get("clinicalRules", [])
        buckets = [("clinicalRules", repos.get("clinicalRules", []) + inline),
                   ("safetyRules", repos.get("safetyRules", [])),
                   ("inventoryRules", repos.get("inventoryRules", [])),
                   ("educationRules", repos.get("educationRules", []))]
        for domain, rules in buckets:
            for r in sorted(rules, key=lambda x: x.get("priority", 100)):
                if eval_rule(r, ctx):
                    fired = {"id": r.get("id", r.get("name", "unnamed")),
                             "domain": r.get("domain", domain),
                             "safetyCritical": bool(r.get("safetyCritical", False)),
                             "confidence": r.get("confidence", 0.8),
                             "actions": r.get("actions", [])}
                    self.trace.firedRules.append(fired)
                    for act in r.get("actions", []):
                        if act["type"] in ("avoid", "block") and fired["safetyCritical"]:
                            self.trace.safetyBlocks.append({"rule": fired["id"], "target": act["target"],
                                                            "message": act.get("message", "")})
        self.trace.reasoningTrace.append(
            {"stage": "ruleEvaluation",
             "detail": f"{len(self.trace.firedRules)} regras dispararam; {len(self.trace.safetyBlocks)} bloqueios de segurança."})

    def _stage_inference(self, ctx: dict, stage: dict):
        known = {f["id"] for f in self.trace.assertedFacts}
        changed = True
        rules = self.cko.get("factInferenceEngine", {}).get("inferenceRules", [])
        while changed:  # forward chaining simples
            changed = False
            for r in rules:
                antecedents = set(r.get("if", []))
                if antecedents and antecedents <= known:
                    for c in r.get("then", []):
                        if c not in known:
                            known.add(c)
                            self.trace.assertedFacts.append({"id": c, "fact": c, "confidence": 0.9, "inferred": True})
                            changed = True
        self.trace.reasoningTrace.append(
            {"stage": "inference", "detail": f"{len([f for f in self.trace.assertedFacts if f.get('inferred')])} fatos inferidos."})

    def _stage_decision(self, ctx: dict, stage: dict):
        # 1) árvore de decisão, se houver
        for tree in self.cko.get("decisionTreeRepository", {}).get("trees", []):
            nodes = {n["id"]: n for n in tree.get("nodes", [])}
            cur = tree.get("rootNode")
            while cur and cur in nodes:
                node = nodes[cur]
                self.trace.decisionPath.append({"node": cur, "question": node.get("question")})
                if node.get("type") in ("terminal", "action"):
                    break
                answer = eval_condition(node["condition"], ctx) if "condition" in node else _get(ctx, node.get("field", ""))
                cur = node.get("yes") if answer else node.get("no")
        # 2) recomendação a partir de regras de ação 'recommend'/'require'
        recs = [a for fr in self.trace.firedRules for a in fr["actions"] if a["type"] in ("recommend", "require")]
        if recs:
            self.trace.finalRecommendation = {"recommendedDevice": recs[0]["target"],
                                              "actionType": recs[0]["type"],
                                              "supportingRules": [fr["id"] for fr in self.trace.firedRules
                                                                  if any(a in recs for a in fr["actions"])]}
        self.trace.reasoningTrace.append(
            {"stage": "decision",
             "detail": f"decisão={self.trace.finalRecommendation}; caminho de {len(self.trace.decisionPath)} nós."})

    def _stage_workflow(self, ctx: dict, stage: dict):
        wfs = self.cko.get("clinicalWorkflowEngine", {}).get("workflows", [])
        self.trace.reasoningTrace.append({"stage": "workflow", "detail": f"{len(wfs)} workflow(s) associado(s)."})

    def _stage_explanation(self, ctx: dict, stage: dict):
        # confiança = menor confiança entre as regras que sustentam a recomendação
        supporting = self.trace.finalRecommendation.get("supportingRules", []) if self.trace.finalRecommendation else []
        confs = [fr["confidence"] for fr in self.trace.firedRules if fr["id"] in supporting] or \
                [fr["confidence"] for fr in self.trace.firedRules] or [0.0]
        self.trace.confidence = round(min(confs), 3)
        self.trace.reasoningTrace.append(
            {"stage": "explanation",
             "detail": f"confiança agregada={self.trace.confidence} (mínimo das regras de suporte)."})

    def _stage_human_validation(self, ctx: dict, stage: dict):
        g = self.layer.get("globalGuardrails", {})
        sg = stage.get("guardrails", {})
        needs_human = False
        reasons = []
        # 1) bloqueio de segurança nunca passa sem humano
        if self.trace.safetyBlocks:
            needs_human = True
            reasons.append("bloqueio de safetyRule crítico")
        # 2) alto risco declarado no objeto
        if self.cko.get("patientSafety", {}).get("highRisk"):
            for token in g.get("mandatoryHumanValidationFor", []):
                if token in ("high-risk", "high-risk-medication", "highRisk"):
                    needs_human = True
                    reasons.append("medicamento/dispositivo de alto risco")
        # 3) confiança abaixo do mínimo
        min_conf = sg.get("minConfidence", g.get("minOverallConfidence", 0.0))
        if self.trace.confidence is not None and self.trace.confidence < min_conf:
            needs_human = True
            reasons.append(f"confiança {self.trace.confidence} < mínimo {min_conf}")
        # 4) exigência explícita no estágio
        if sg.get("requiresHumanValidation"):
            needs_human = True
            reasons.append("requiresHumanValidation no estágio")

        if self.trace.safetyBlocks and any(sb for sb in self.trace.safetyBlocks):
            # never-event / bloqueio: não emite recomendação sem revisão
            self.trace.status = "blocked"
        elif needs_human:
            self.trace.status = "pending_human_validation"
        else:
            self.trace.status = "approved"
            self.trace.humanValidated = False  # aprovação automática permitida; sem humano ainda
        self.trace.reasoningTrace.append(
            {"stage": "humanValidation", "detail": f"status={self.trace.status}; motivos={reasons or ['nenhum']}"})

    def _stage_output(self, ctx: dict, stage: dict):
        self.trace.reasoningTrace.append({"stage": "output", "detail": "trace finalizado."})

    _HANDLERS = {
        "ingest": _stage_ingest,
        "factAssertion": _stage_fact_assertion,
        "ruleEvaluation": _stage_rule_evaluation,
        "inference": _stage_inference,
        "decision": _stage_decision,
        "workflow": _stage_workflow,
        "explanation": _stage_explanation,
        "humanValidation": _stage_human_validation,
        "output": _stage_output,
    }

    # ---- execução -------------------------------------------------------- #
    def run(self, patient_context: dict) -> ExecutionTrace:
        stages = self.layer.get("stages", [])
        if not stages:
            self.trace.status = "error"
            self.trace.warnings.append("ckosRuntimeLayer.stages ausente.")
            self.trace.completedAt = _now()
            return self.trace
        try:
            for st in stages:
                handler = self._HANDLERS.get(st["stage"])
                if handler is None:
                    self.trace.warnings.append(f"Estágio sem handler: {st['stage']}")
                    continue
                handler(self, patient_context, st)
                self.trace.stagesExecuted.append(st["stage"])
                # onFailure=halt em bloqueio de segurança
                if st.get("guardrails", {}).get("blockOnSafetyRule") and self.trace.safetyBlocks:
                    self.trace.status = "blocked"
                    self.trace.warnings.append(f"halt em {st['stage']} por bloqueio de segurança.")
                    break
        except Exception as exc:  # runtime robusto: erro não deve emitir recomendação insegura
            self.trace.status = "error"
            self.trace.warnings.append(f"Exceção em runtime: {exc}")
        self.trace.completedAt = _now()
        return self.trace


# --------------------------------------------------------------------------- #
# CLI
# --------------------------------------------------------------------------- #
def main():
    ap = argparse.ArgumentParser(description="Executa o pipeline CKOS sobre um documento CKO.")
    ap.add_argument("--schema")
    ap.add_argument("--cko", required=True)
    ap.add_argument("--patient", help="JSON inline do contexto do paciente.")
    ap.add_argument("--patient-file")
    args = ap.parse_args()

    cko = json.load(open(args.cko, encoding="utf-8"))
    if args.patient_file:
        patient = json.load(open(args.patient_file, encoding="utf-8"))
    elif args.patient:
        patient = json.loads(args.patient)
    else:
        patient = {}

    if args.schema:
        schema = json.load(open(args.schema, encoding="utf-8"))
        errs = CKOSRuntime.validate(cko, schema)
        print("== Validação estrutural ==")
        print("OK" if not errs else "\n".join(errs[:20]))
        print()

    trace = CKOSRuntime(cko).run(patient)
    print("== Execution Trace ==")
    print(json.dumps(trace.to_dict(), ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
