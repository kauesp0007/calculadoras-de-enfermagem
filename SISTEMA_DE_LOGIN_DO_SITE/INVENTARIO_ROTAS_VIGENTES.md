# Inventário de rotas do sistema de contas — snapshot de 02/10/2026

Este arquivo é uma **fotografia operacional**, não a autoridade de autorização. A fonte viva é `public.developer_premium_route_rules` no Supabase e a decisão administrativa registrada conforme `PROTOCOLO_DECISOES_DO_DESENVOLVEDOR.md`. O método de autenticação, gate de ações, impressão/PDF e criação de páginas está exclusivamente em `CATALOGO_CANONICO_SISTEMA_DE_CONTAS.md`.

Uma IA NÃO deve restaurar, corrigir ou reclassificar uma rota com base apenas neste snapshot. Antes de qualquer mudança, consultar a regra exata e sua decisão atual.

## Estado agregado observado

| Escopo | Regras | Premium | Free |
|---|---:|---:|---:|
| raiz | 103 | 100 | 3 |
| ar | 12 | 9 | 3 |
| de | 12 | 10 | 2 |
| en | 87 | 84 | 3 |
| es | 91 | 89 | 2 |
| fr | 12 | 10 | 2 |
| hi | 12 | 10 | 2 |
| id | 12 | 10 | 2 |
| it | 12 | 10 | 2 |
| ja | 12 | 10 | 2 |
| ko | 12 | 10 | 2 |
| nl | 12 | 10 | 2 |
| pl | 12 | 10 | 2 |
| ru | 12 | 10 | 2 |
| sv | 12 | 10 | 2 |
| tr | 12 | 10 | 2 |
| uk | 12 | 10 | 2 |
| vi | 12 | 10 | 2 |
| zh | 12 | 10 | 2 |

**Total:** 473 regras; 432 Premium; 41 Free. Existem 473 registros não vazios em `premium_content_pages`. O enforcement observado é 432 `client_guard` e 41 `catalog_only`. Foram observadas 9 solicitações de ativação concluídas e nenhuma pendente. `free_global_lockdown=false`.

## Rotas explicitamente Free neste snapshot

As 41 rotas abaixo estavam `premium_required=false`, `enforcement=catalog_only` no momento da consulta.

**Raiz (3):** `braden.html`, `medicamentos.html`, `formularios_de_escalas_assistenciais.html`.

**Árabe (3):** `ar/balancohidrico.html`, `ar/braden.html`, `ar/fugulin.html`.

**Inglês (3):** `en/braden.html`, `en/fugulin.html`, `en/formularios_de_escalas_assistenciais.html`.

**Espanhol (2):** `es/fugulin.html`, `es/formularios_de_escalas_assistenciais.html`.

**Demais idiomas — duas rotas Free por pasta:** em `de`, `fr`, `hi`, `id`, `it`, `ja`, `ko`, `nl`, `pl`, `ru`, `sv`, `tr`, `uk`, `vi` e `zh`, as rotas Free observadas são `braden.html` e `fugulin.html`.

As outras 432 regras estavam Premium neste corte, mas **isso não autoriza uma IA a assumir que continuam Premium futuramente**. Consultar o banco por caminho exato antes de editar.

## Exceção funcional do catálogo assistencial

As três rotas abaixo são Free para consulta, mas o PDF original continua sendo uma ação Premium:

- `formularios_de_escalas_assistenciais.html`
- `en/formularios_de_escalas_assistenciais.html`
- `es/formularios_de_escalas_assistenciais.html`

A raiz possui registro privado com 66 formulários; EN e ES possuem 63 cada. O download passa por `premium-content?path=...&download=form-NNN` e exige entitlement Premium mesmo com a página em `catalog_only`. EN usa `/FORMULARIOS_DE_ESCALAS/EN/`; ES usa `/FORMULARIOS_DE_ESCALAS/ES/`.

## Como uma IA deve verificar uma rota

Antes de criar, modernizar ou alterar acesso, consultar no Supabase pelo caminho exato:

```sql
select path, premium_required, enforcement, source, updated_by, updated_at
from public.developer_premium_route_rules
where path = '<CAMINHO_EXATO>';
```

Depois verificar se existe fonte correspondente:

```sql
select path, source_sha, updated_at, length(content) as bytes
from public.premium_content_pages
where path = '<CAMINHO_EXATO>';
```

Se a rota não existir, não inventar classificação. Seguir o fluxo de criação/ativação descrito no catálogo canônico e, quando necessário, consultar o painel do desenvolvedor. Se houver decisão administrativa, ela prevalece sobre manifest, snapshot, PR ou conversa antiga.

## Atualização deste inventário

Atualizar este arquivo apenas com **estado dinâmico**: totais, exceções Free, mudanças relevantes de enforcement e rotas especiais. Não copiar para cá o método de gate, impressão, download ou autenticação — isso pertence ao catálogo canônico. Essa separação existe para impedir duplicidade e divergência entre documentos.
