# Auditoria — AdSense x Premium Júnior/Lifetime — 2026-09-14

## Escopo
Validar a regra canônica de anúncios sem modificar `global-scripts.js`:
- visitante: AdSense permitido;
- free autenticado: AdSense permitido;
- Júnior válido: AdSense bloqueado;
- lifetime: AdSense bloqueado;
- autenticação/perfil ainda não resolvido: fail-closed;
- `/conta/`: AdSense bloqueado.

## Achados
1. `global-scripts.js` permanece com blob SHA `60fcd6f37ae15826d3ecf96c0f545dc7cda2e21c`, igual à versão restaurada antes da correção do incidente.
2. `js/access/premium-banner-manager.js` implementa bloqueio fail-closed e não carrega AdSense sem estado de autenticação/perfil resolvido.
3. `js/auth/auth-core.js` instala gate visual enquanto autenticação/perfil está pendente e mantém anúncios retidos em falha de leitura do perfil.
4. `js/auth/authorization.js` considera `lifetime=true` e Júnior não expirado como premium efetivo.
5. Foi encontrada uma lacuna fora da arquitetura central em `concurso_publico/index.html`, com carregador próprio de AdSense baseado em cache local e sem tratamento completo de `lifetime`/resolução Firebase.
6. Foi criado `js/access/premium-ads-guard.js` na branch para fornecer uma camada defensiva específica, sem alterar `global-scripts.js`.

## Estado da validação
- Auditoria estática: EM ANDAMENTO.
- Contra-auditoria pós-correção: pendente.
- Teste real de navegador/produção: não executado neste ambiente.

## Regra de release
Nenhum merge para `main` até que a auditoria estática e a contra-prova estejam positivas e o diff confirme que `global-scripts.js` não foi alterado.
