/*!
 * ckos-runtime.js — CKOS Runtime v12 (browser port)
 * Porta o motor de referência Python (ckos_runtime.py) para o navegador e adiciona
 * dois itens do roadmap v12:
 *   (1) Parser de CKO-DSL: interpreta `governedRule.logic` (string) para conditions/actions.
 *   (2) Modelo de confiança ponderado (weighted), além do conservador (min).
 *
 * Sem dependências. Roda ao lado de cko-calc.js / cko-interactive.js e em preview.html.
 * Uso:
 *   import { CKOSRuntime, parseDSL } from './ckos-runtime.js';
 *   const trace = new CKOSRuntime(cko).run(patientContext);
 * ou via global:  window.CKOS.run(cko, patientContext)
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.CKOS = api;
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // ----------------------------------------------------------------------- //
  // Operadores
  // ----------------------------------------------------------------------- //
  const OPS = {
    equals: (a, b) => a === b,
    notEquals: (a, b) => a !== b,
    greaterThan: (a, b) => a != null && a > b,
    lessThan: (a, b) => a != null && a < b,
    greaterOrEqual: (a, b) => a != null && a >= b,
    lessOrEqual: (a, b) => a != null && a <= b,
    in: (a, b) => Array.isArray(b) && b.includes(a),
    notIn: (a, b) => !(Array.isArray(b) && b.includes(a)),
    exists: (a, b) => (a != null) === !!b,
  };
  // Símbolos aceitos pela DSL → operador canônico
  const DSL_OPS = {
    '=': 'equals', '==': 'equals', '!=': 'notEquals', '<>': 'notEquals',
    '>': 'greaterThan', '<': 'lessThan', '>=': 'greaterOrEqual', '<=': 'lessOrEqual',
    'in': 'in', 'notin': 'notIn',
  };
  const ACTION_VERBS = { recommend: 'recommend', avoid: 'avoid', require: 'require', alert: 'alert', block: 'block' };

  // ----------------------------------------------------------------------- //
  // (1) Parser de CKO-DSL
  //   "IF medication = insulin AND volumeMl <= 0.3 THEN recommend seringa-x"
  //   Retorna { conditions:[{field,operator,value}], actions:[{type,target}] }
  // ----------------------------------------------------------------------- //
  function coerce(v) {
    if (v == null) return v;
    const t = v.trim();
    if (/^-?\d+(\.\d+)?$/.test(t)) return parseFloat(t);
    if (t === 'true') return true;
    if (t === 'false') return false;
    if (/^\[.*\]$/.test(t)) return t.slice(1, -1).split(',').map(s => coerce(s.trim()));
    return t.replace(/^["']|["']$/g, '');
  }

  function parseDSL(logic) {
    if (!logic || typeof logic !== 'string') return { conditions: [], actions: [] };
    const m = /^\s*IF\s+(.+?)\s+THEN\s+(.+?)\s*$/is.exec(logic);
    if (!m) return { conditions: [], actions: [], parseError: 'formato esperado: IF … THEN …' };

    const conditions = m[1].split(/\s+AND\s+/i).map(clause => {
      const cm = /^\s*(\S+)\s*(<=|>=|==|!=|<>|<|>|=|\bin\b|\bnotin\b)\s*(.+?)\s*$/i.exec(clause);
      if (!cm) return null;
      const operator = DSL_OPS[cm[2].toLowerCase()];
      return operator ? { field: cm[1], operator, value: coerce(cm[3]) } : null;
    }).filter(Boolean);

    const actions = m[2].split(/\s+AND\s+/i).map(clause => {
      const am = /^\s*(recommend|avoid|require|alert|block)\s+(.+?)\s*$/i.exec(clause);
      if (!am) return null;
      return { type: ACTION_VERBS[am[1].toLowerCase()], target: coerce(am[2]) };
    }).filter(Boolean);

    return { conditions, actions };
  }

  // Normaliza uma regra: usa conditions/actions se existirem; senão, faz parse do logic.
  function materialize(rule) {
    if ((rule.conditions && rule.conditions.length) || (rule.actions && rule.actions.length)) {
      return { conditions: rule.conditions || [], actions: rule.actions || [] };
    }
    return parseDSL(rule.logic);
  }

  // ----------------------------------------------------------------------- //
  // Avaliação
  // ----------------------------------------------------------------------- //
  const getField = (ctx, key) => {
    const v = ctx[key];
    return (v && typeof v === 'object' && 'value' in v) ? v.value : v;
  };
  const evalCondition = (c, ctx) => {
    const op = OPS[c.operator];
    if (!op) throw new Error('Operador desconhecido: ' + c.operator);
    return !!op(getField(ctx, c.field), c.value);
  };
  const evalRule = (conds, ctx) => conds.length > 0 && conds.every(c => evalCondition(c, ctx));

  // ----------------------------------------------------------------------- //
  // (2) Modelo de confiança
  // ----------------------------------------------------------------------- //
  function aggregateConfidence(supportRules, mode) {
    const confs = supportRules.map(r => (r.confidence != null ? r.confidence : 0.8));
    if (!confs.length) return 0;
    if (mode === 'min') return Math.min(...confs);
    // weighted: média ponderada por prioridade (prioridade menor = peso maior)
    let num = 0, den = 0;
    supportRules.forEach(r => {
      const w = 1 / Math.max(1, (r.priority != null ? r.priority : 100));
      const c = (r.confidence != null ? r.confidence : 0.8);
      num += c * w; den += w;
    });
    return den ? +(num / den).toFixed(3) : 0;
  }

  // ----------------------------------------------------------------------- //
  // Runtime
  // ----------------------------------------------------------------------- //
  class CKOSRuntime {
    constructor(cko, opts) {
      this.cko = cko || {};
      this.layer = this.cko.ckosRuntimeLayer || {};
      this.confidenceMode = (opts && opts.confidenceMode) || 'weighted';
      this.trace = {
        traceId: 'trace-' + Math.random().toString(36).slice(2),
        startedAt: new Date().toISOString(), completedAt: null,
        stagesExecuted: [], firedRules: [], assertedFacts: [], decisionPath: [],
        finalRecommendation: null, warnings: [], safetyBlocks: [],
        confidence: null, humanValidated: false, status: 'pending', reasoningTrace: [],
      };
    }

    _collectRules() {
      const repos = this.cko.ruleRepositories || {};
      const inline = (this.cko.clinicalKnowledge && this.cko.clinicalKnowledge.clinicalRules) || [];
      return [
        ['clinicalRules', (repos.clinicalRules || []).concat(inline)],
        ['safetyRules', repos.safetyRules || []],
        ['inventoryRules', repos.inventoryRules || []],
        ['educationRules', repos.educationRules || []],
      ];
    }

    _ingest(ctx) { this.trace.reasoningTrace.push({ stage: 'ingest', detail: Object.keys(ctx).length + ' campos de contexto.' }); }

    _factAssertion() {
      const a = (this.cko.factInferenceEngine && this.cko.factInferenceEngine.assertions) || [];
      a.forEach(x => this.trace.assertedFacts.push({ id: x.id, fact: x.fact, confidence: x.confidence != null ? x.confidence : 1 }));
      this.trace.reasoningTrace.push({ stage: 'factAssertion', detail: this.trace.assertedFacts.length + ' fatos assertidos.' });
    }

    _ruleEvaluation(ctx) {
      this._collectRules().forEach(([domain, rules]) => {
        rules.slice().sort((x, y) => (x.priority || 100) - (y.priority || 100)).forEach(r => {
          const { conditions, actions } = materialize(r);
          if (evalRule(conditions, ctx)) {
            const fired = {
              id: r.id || r.name || 'unnamed', domain: r.domain || domain,
              safetyCritical: !!r.safetyCritical, confidence: r.confidence != null ? r.confidence : 0.8,
              priority: r.priority != null ? r.priority : 100, actions,
            };
            this.trace.firedRules.push(fired);
            actions.forEach(act => {
              if ((act.type === 'avoid' || act.type === 'block') && fired.safetyCritical) {
                this.trace.safetyBlocks.push({ rule: fired.id, target: act.target, message: act.message || '' });
              }
            });
          }
        });
      });
      this.trace.reasoningTrace.push({ stage: 'ruleEvaluation', detail: this.trace.firedRules.length + ' regras dispararam; ' + this.trace.safetyBlocks.length + ' bloqueio(s).' });
    }

    _inference() {
      const known = new Set(this.trace.assertedFacts.map(f => f.id));
      const rules = (this.cko.factInferenceEngine && this.cko.factInferenceEngine.inferenceRules) || [];
      let changed = true;
      while (changed) {
        changed = false;
        rules.forEach(r => {
          const ant = r.if || [];
          if (ant.length && ant.every(x => known.has(x))) {
            (r.then || []).forEach(c => {
              if (!known.has(c)) { known.add(c); this.trace.assertedFacts.push({ id: c, fact: c, confidence: 0.9, inferred: true }); changed = true; }
            });
          }
        });
      }
      this.trace.reasoningTrace.push({ stage: 'inference', detail: this.trace.assertedFacts.filter(f => f.inferred).length + ' fato(s) inferido(s).' });
    }

    _decision(ctx) {
      const trees = (this.cko.decisionTreeRepository && this.cko.decisionTreeRepository.trees) || [];
      trees.forEach(tree => {
        const nodes = {}; (tree.nodes || []).forEach(n => nodes[n.id] = n);
        let cur = tree.rootNode;
        const guard = new Set();
        while (cur && nodes[cur] && !guard.has(cur)) {
          guard.add(cur);
          const node = nodes[cur];
          this.trace.decisionPath.push({ node: cur, question: node.question });
          if (node.type === 'terminal' || node.type === 'action') break;
          const ans = node.condition ? evalCondition(node.condition, ctx) : getField(ctx, node.field);
          cur = ans ? node.yes : node.no;
        }
      });
      const recs = this.trace.firedRules.flatMap(fr => fr.actions.filter(a => a.type === 'recommend' || a.type === 'require').map(a => ({ a, fr })));
      if (recs.length) {
        const support = this.trace.firedRules.filter(fr => fr.actions.some(a => a.type === 'recommend' || a.type === 'require'));
        this.trace.finalRecommendation = { recommendedDevice: recs[0].a.target, actionType: recs[0].a.type, supportingRules: support.map(fr => fr.id) };
        this._support = support;
      }
      this.trace.reasoningTrace.push({ stage: 'decision', detail: 'rec=' + JSON.stringify(this.trace.finalRecommendation) + '; caminho de ' + this.trace.decisionPath.length + ' nó(s).' });
    }

    _workflow() {
      const wfs = (this.cko.clinicalWorkflowEngine && this.cko.clinicalWorkflowEngine.workflows) || [];
      this.trace.reasoningTrace.push({ stage: 'workflow', detail: wfs.length + ' workflow(s).' });
    }

    _explanation() {
      const support = this._support || this.trace.firedRules;
      this.trace.confidence = aggregateConfidence(support, this.confidenceMode);
      this.trace.reasoningTrace.push({ stage: 'explanation', detail: 'confiança=' + this.trace.confidence + ' (modo ' + this.confidenceMode + ').' });
    }

    _humanValidation(stage) {
      const g = this.layer.globalGuardrails || {};
      const sg = (stage && stage.guardrails) || {};
      const reasons = []; let needsHuman = false;
      if (this.trace.safetyBlocks.length) { needsHuman = true; reasons.push('bloqueio de segurança'); }
      if (this.cko.patientSafety && this.cko.patientSafety.highRisk) {
        (g.mandatoryHumanValidationFor || []).forEach(t => {
          if (['high-risk', 'high-risk-medication', 'highRisk'].includes(t)) { needsHuman = true; reasons.push('alto risco'); }
        });
      }
      const minConf = sg.minConfidence != null ? sg.minConfidence : (g.minOverallConfidence || 0);
      if (this.trace.confidence != null && this.trace.confidence < minConf) { needsHuman = true; reasons.push('confiança ' + this.trace.confidence + ' < ' + minConf); }
      if (sg.requiresHumanValidation) { needsHuman = true; reasons.push('requiresHumanValidation'); }

      if (this.trace.safetyBlocks.length) this.trace.status = 'blocked';
      else if (needsHuman) this.trace.status = 'pending_human_validation';
      else { this.trace.status = 'approved'; this.trace.humanValidated = false; }
      this.trace.reasoningTrace.push({ stage: 'humanValidation', detail: 'status=' + this.trace.status + '; motivos=' + JSON.stringify(reasons.length ? reasons : ['nenhum']) });
    }

    _output() { this.trace.reasoningTrace.push({ stage: 'output', detail: 'trace finalizado.' }); }

    run(patientContext) {
      const ctx = patientContext || {};
      const H = {
        ingest: () => this._ingest(ctx), factAssertion: () => this._factAssertion(),
        ruleEvaluation: () => this._ruleEvaluation(ctx), inference: () => this._inference(),
        decision: () => this._decision(ctx), workflow: () => this._workflow(),
        explanation: () => this._explanation(), humanValidation: (st) => this._humanValidation(st),
        output: () => this._output(),
      };
      const stages = this.layer.stages || [];
      if (!stages.length) { this.trace.status = 'error'; this.trace.warnings.push('ckosRuntimeLayer.stages ausente.'); this.trace.completedAt = new Date().toISOString(); return this.trace; }
      try {
        for (const st of stages) {
          const h = H[st.stage];
          if (!h) { this.trace.warnings.push('sem handler: ' + st.stage); continue; }
          h(st); this.trace.stagesExecuted.push(st.stage);
          if (st.guardrails && st.guardrails.blockOnSafetyRule && this.trace.safetyBlocks.length) {
            this.trace.status = 'blocked'; this.trace.warnings.push('halt em ' + st.stage + ' por bloqueio de segurança.'); break;
          }
        }
      } catch (e) { this.trace.status = 'error'; this.trace.warnings.push('exceção: ' + e.message); }
      this.trace.completedAt = new Date().toISOString();
      return this.trace;
    }
  }

  return {
    CKOSRuntime, parseDSL, materialize, aggregateConfidence,
    run: (cko, ctx, opts) => new CKOSRuntime(cko, opts).run(ctx),
    version: '12.0.0',
  };
}));
