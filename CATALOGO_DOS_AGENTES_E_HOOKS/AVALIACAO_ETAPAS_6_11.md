# 🔎 Avaliação das ETAPAS 6–9 e 11 — FASE 2

**Regra:** AVALIAR antes de criar; não instalar servidor/extensão/dependência sem justificativa
comprovada e autorização. Cada item abaixo registra a decisão e o motivo.

---

## ETAPA 6 — Comunicação entre IAs (janelas diferentes) via MCP

**Avaliação:** NÃO criar MCP de comunicação agora.

- O VS Code/Copilot não oferece "chat compartilhado" nativo entre janelas/modelos.
- O mecanismo viável e de CUSTO ZERO é **artefato estruturado** (arquivo JSON de estado:
  tarefa + arquivos relevantes + diff + resultado + relatório + perguntas específicas).
- O fluxo de contra-prova já existe via subagentes (`Auditor do Ecossistema`,
  `Revisor Final`, auditores de conteúdo), acionados sob demanda.

**Ação:** manter o fluxo documentado no `CATALOGO_CENTRAL_DA_ARQUITETURA.md`.
Avaliar MCP de comunicação **somente** se surgir necessidade de troca síncrona real.

---

## ETAPA 7 — Integrações (Firebase / Supabase / Cloudflare / Google Cloud / GitHub)

**Avaliação:** NÃO criar MCPs/integrações agora; manter o que já funciona.

| Sistema | Estado real | Ação |
|---|---|---|
| Firebase | SDK no navegador (auth + Firestore), fase 5 | Manter; aplicar `firestore.rules` no Console |
| GitHub | Deploy via Actions (`deploy.yml`) | Manter; nunca commit/push automático |
| Supabase | 4 páginas via CDN | Manter como está |
| Cloudflare / Google Cloud | Sem uso ativo | Adiar — avaliar só sob necessidade |

**Princípio:** um MCP por capacidade, permissões mínimas (READ/WRITE/ADMIN/DEPLOY/DELETE).
Nunca expor segredos. Nenhuma instalação nova.

---

## ETAPA 8 — Agentes hospedados (Microsoft Foundry / Agent Builder / Spring Boot)

**Avaliação:** NÃO usar agora.

- O projeto é **estático** (GitHub Pages), sem backend.
- Foundry/Agent Builder/Spring Boot implicam infraestrutura, custo e API keys — complexidade
  desnecessária para o estágio atual.
- Reavaliar SOMENTE se o projeto ganhar backend real (ex.: gateway de pagamento premium).

---

## ETAPA 9 — Agente de conteúdo para mídias sociais

**Avaliação:** ADIAR.

- Não há sistema de mídia social nem demanda atual.
- Quando necessário, gerar a partir da base existente (página → conteúdo social),
  reutilizando biblioteca de conteúdo, imagens e dados estruturados — sem recorrer ao
  repositório inteiro.

---

## ETAPA 11 — Servidores MCP em sandbox

**Avaliação:** sem infraestrutura agora; regra documentada.

- As operações de risco já são contidas por: backup automático, hooks `deny`
  (comandos destrutivos/segredos) e a regra "não instalar sem autorização".
- Se um MCP experimental for criado no futuro, DEVE rodar em sandbox (TESTE/DESENVOLVIMENTO/
  HOMOLOGAÇÃO/PRODUÇÃO) e NUNCA com permissões equivalentes às de produção.

---

## ETAPA 12 — Alinhamento com login (fase 5) + premium + anúncios

**Avaliação:** CONCLUÍDA (compatibilidade arquitetural documentada; sem implementação agora).

- A arquitetura de agentes/hooks é compatível com autenticação, roles, permissões, premium,
  anúncios e assinatura — sem duplicar autenticação nem permissões.
- Ao final da integração futura do sistema de contas, substituir regras genéricas do
  Firestore por regras específicas por coleção.
- NÃO implementar funcionalidades premium não solicitadas.

---

**Resultado das avaliações:** nenhuma instalação de MCP/extensão/dependência nesta fase.
Todas as decisões registradas. Economia mantida: 0 chamadas de IA e 0 custo externo adicionados.
