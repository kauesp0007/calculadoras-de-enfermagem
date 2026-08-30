# 🔌 Catálogo dos MCP

**Total:** 0 (nenhum `.mcp.json` no repositório).

## Estado
- Não há servidores MCP configurados **no projeto**. Os MCPs visíveis no editor (Pylance, notebook, servidores GCP) são **externos ao repositório** e não fazem parte da arquitetura do site.
- **Imposto por hook:** a criação/edição de `mcp.json`/`.mcp.json` é **bloqueada (`deny`)** pelo hook `block-protected-files` — decisão "não criar MCP sem autorização explícita" agora é garantida por máquina.

## Avaliação (FASE 16 — princípio "um MCP por capacidade")
| Integração candidata | Necessidade atual | Recomendação |
|---|---|---|
| GitHub | Leitura de repo/issues/PR | Adiar — hooks locais + deploy já cobrem; criar só se o usuário pedir |
| Firebase | Auth/Firestore | Adiar — `js/firebase` já integra via SDK no navegador |
| Supabase | Pontual (4 páginas) | Adiar — uso atual é por CDN |
| Cloudflare / Google Cloud | Sem uso ativo | Adiar — avaliar só sob necessidade comprovada |

## Regras (FASE 16)
- Um MCP por capacidade, escopo limitado; permissões mínimas (READ / WRITE / ADMIN / DEPLOY / DELETE separadas).
- Nunca conceder ao modelo mais poder do que a tarefa exige.
- Não instalar servidor/extensão automaticamente.
