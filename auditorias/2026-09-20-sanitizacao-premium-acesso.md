# Auditoria e sanitização do acesso FREE / PREMIUM — 2026-09-20

## Objetivo

Eliminar resíduos de arquiteturas anteriores que pudessem transformar um assinante Premium válido em usuário Free ou redirecioná-lo indevidamente para `/conta/assinatura.html`.

A regra canônica passou a ser:

`FREE` → conteúdo gratuito apenas.

`PREMIUM` → conteúdo gratuito + conteúdo Premium.

O navegador não concede Premium. A entrega do conteúdo Premium depende do entitlement validado no backend.

## Fonte única do catálogo

Arquivo canônico:

`/premium-content-manifest.json`

Escopo:
- raiz;
- 18 idiomas;
- escalas/calculadoras Premium;
- formulários;
- simulados;
- biblioteca de provas;
- padrões de nomes para novos simulados/formulários dentro do escopo.

Não manteremos uma segunda lista de páginas Premium em `global-scripts.js`.

## Sanitização realizada

### 1. Global gate legado
Removido o catálogo de rotas Premium e a lógica de gate Premium do `global-scripts.js`.

O arquivo global não decide mais se uma página Premium deve ir para assinatura.

### 2. Bootstrap duplicado
Removida a segunda cadeia global de bootstrap Firebase/Auth que concorria com o fluxo de conteúdo protegido.

O `premium-content-loader.js` possui fallback próprio para inicialização da autenticação.

### 3. Marcador de rota
O próprio `premium-content-loader.js` marca:

`window.__IS_PREMIUM_ROUTE = true`

Assim, os guards antigos podem reconhecer uma rota protegida sem manter outro catálogo de páginas.

### 4. Guards legados
`js/access/access-router.js` e `js/auth/route-guard.js` continuam como camadas de compatibilidade para rotas que não são Premium, mas não podem decidir uma rota marcada pelo loader Premium.

### 5. Content policy
Removido o catálogo duplicado de páginas Premium de `js/access/content-policy.js`.

A política agora trata requisitos declarativos; a entrega do conteúdo protegido não depende desse catálogo.

### 6. Backend
A Edge Function `supabase/functions/premium-content/index.ts` continua sendo a autoridade de entrega:
1. valida Firebase ID token;
2. resolve `billing_identities`;
3. consulta `user_entitlements`;
4. exige `plan === "premium"`;
5. lê `premium_content_pages`;
6. entrega com `Cache-Control: private, no-store`.

### 7. Scripts de migração/shell
`scripts/shellify-premium-public-pages.mjs` e `scripts/migrate-premium-content.mjs` passaram a consumir o manifesto canônico.

O manifesto não é mais sobrescrito pelo inventário de migração.

### 8. Auditoria tripla
Criado:

`scripts/auditar-premium-triplo.mjs`

Camadas:
- catálogo/arquitetura;
- frontend/shells/guards;
- backend/entitlement.

A auditoria histórica `scripts/auditar-bloqueio-escalas.js` agora encaminha para essa auditoria canônica.

### 9. CI
Criado:

`.github/workflows/premium-access-audit.yml`

O GitHub passa a executar:
- checagem de sintaxe JavaScript;
- auditoria tripla Premium.

## Verificações realizadas nesta etapa

### Verificação estrutural do branch
- árvore GitHub consultada: 12.358 arquivos;
- candidatos Premium encontrados no escopo root + 18 idiomas: 272;
- manifesto canônico presente;
- 16 rotas Premium exatas presentes na raiz;
- marcador Premium presente no loader;
- catálogo Premium removido do global;
- bypass Premium presente nos dois guards;
- catálogo duplicado removido do content-policy;
- validação JWT presente no backend;
- validação de entitlement presente no backend;
- tabela privada `premium_content_pages` presente;
- auditoria tripla presente;
- workflow CI presente.

### Contra-prova de HTML
Foram inspecionados 20 representantes incluindo:
- escalas Premium;
- formulários;
- simulados;
- biblioteca de provas.

Todos apresentaram:
- `premium-content-loader.js`;
- `premium-content-placeholder`;
- ausência de redirecionamento direto para assinatura.

## O que ainda depende do CI/GitHub

A execução integral sobre todos os 272 candidatos e as checagens de sintaxe dos arquivos do branch ficam automatizadas no workflow criado.

A validação final de produção ainda exige o teste real com:
1. usuário Free;
2. assinante Premium válido;
3. usuário autenticado sem entitlement;
4. entitlement expirado;
5. falha/timeout de billing;
6. acesso direto por URL;
7. acesso por menu;
8. acesso nas 18 versões de idioma;
9. simulados e cronômetro;
10. formulários e PDFs associados.

## Regra de aceite

Nenhuma mudança deve ser considerada concluída se:

- Free conseguir receber conteúdo Premium;
- Premium válido for enviado para assinatura;
- Premium válido receber estado Free por race condition;
- uma tradução Premium causar 404 quando a versão canônica existe;
- o backend entregar conteúdo sem entitlement;
- um guard legado puder substituir a decisão do backend.


## Revalidação após correções do branch

- Sintaxe verificada em 9 arquivos críticos: **9/9 PASS**.
- Verificação estrutural do branch: **10/10 PASS**.
- Árvore do branch: **12.358 arquivos**.
- Candidatos Premium no escopo root + 18 idiomas: **272**.
- Contra-prova manual/estrutural de 20 páginas representativas: **20/20 PASS**.
- O workflow CI permanece responsável pela execução integral dos 272 candidatos antes da integração.

Nenhuma afirmação de teste de produção é feita neste relatório. A validação de produção depende do ambiente publicado e de contas Free/Premium reais.


## Validação final de backend — 2026-09-20

### Entitlement e entrega protegida
- Projeto Supabase em estado ACTIVE_HEALTHY.
- Edge Function `billing-access`: valida token Firebase por assinatura criptográfica (RS256), issuer e audience; consulta somente `billing_identities` + `user_entitlements`; não concede Premium no navegador.
- Edge Function `premium-content`: valida novamente o token Firebase e o entitlement antes de consultar `premium_content_pages`.
- Conteúdo protegido é entregue com `Cache-Control: private, no-store` e `Vary: Authorization`.
- `premium_content_pages`, `user_entitlements` e tabelas de billing estão com RLS habilitado e sem políticas públicas; tentativa de leitura como `anon` foi negada pelo PostgreSQL.
- Estado atual verificado: 1 entitlement Premium ativo associado a identidade Firebase e 1 assinatura Premium ativa correspondente; nenhum entitlement Premium expirado foi encontrado.

### Catálogo localizado
Durante a contra-prova foi encontrada uma lacuna de sincronização: as 18 versões localizadas de `balancohidrico.html` existiam no repositório, mas ainda não estavam cadastradas em `premium_content_pages`. As 18 cópias foram sincronizadas com seu `source_sha` correspondente.

Após a sincronização:
- `premium_content_pages`: 272 registros;
- 217 registros localizados;
- 55 registros de raiz;
- as 18 versões de `balancohidrico.html` estão presentes.

Isso elimina o risco de um assinante Premium acessar uma versão localizada e receber indevidamente o conteúdo da raiz por fallback por falta de registro no catálogo.

### Limitação da validação
A validação de endpoint com uma sessão real de navegador não foi executada nesta etapa porque não há navegador automatizado disponível neste ambiente. A validação foi feita por inspeção do código implantado, consultas ao banco, verificação de RLS/entitlement, comparação do catálogo e CI do repositório.
