# 🔍 Catálogo de Auditorias (FASE 9–10)

**Princípio (FASE 10):** não concentrar tudo em um agente; separar especialistas, mas reutilizar o que já existe.

| Auditoria | Mecanismo | Natureza |
|---|---|---|
| SEO (title/meta/canonical/hreflang/Schema/OG) | Agente `Auditor SEO` | IA (leitura) |
| Core Web Vitals / CLS / LCP / INP | Agente `Auditor de Performance` + `scripts/auditar-cwv.js` | IA + script |
| Governança / legislação / regulamentação | Agente `Auditor de Governança Regulatória` | IA (leitura) |
| Acessibilidade (qualitativa) | Skill `auditar-acessibilidade` | IA (skill) |
| Acessibilidade (básica) | Hook `check-a11y` | determinístico |
| Links quebrados / integridade | Agente `Revisor de Integridade` + `fix-broken-links.js` | IA + script |
| Canonical / hreflang (clusters) | Agente `Verificador de Hreflang/Canonical` | IA (leitura) |
| Largura / hero / layout | Hook `check-layout` | determinístico |
| Ordem / elementos do `<head>` | Hook `check-head` | determinístico |
| JSON válido | Hook `check-json` | determinístico |
| Governança editorial (marcadores) | Hook `content-governance` + `validate-content-governance.js` | determinístico |
| Teste visual/funcional | Agente `Testador no Navegador` | IA |
| QA final (veredito) | Agente `Revisor Final (QA Gate)` | IA (contra-prova) |
| Ecossistema (duplicações/órfãos/loops) | Agente `Auditor do Ecossistema` | IA (leitura) |
| Conformidade técnica (CWV + responsividade + acessibilidade) | Agente `Auditor de Conformidade Técnica` | IA (consolidado) |

## Fluxo de prova e contra-prova (FASE 11–12)
```
Criador → validadores determinísticos (hooks check-*) → auditores especializados
→ relatório → CONTRAPROVA (QA Gate) → APROVADO/REPROVADO
```
Para legislação: **fonte primária** obrigatória; diferenciar texto legal × interpretação × comentário; nunca inventar artigos/incisos/datas/revogações; em dúvida, marcar `NECESSITA DE VERIFICAÇÃO`.
