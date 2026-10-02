# Decisões do desenvolvedor — protocolo operacional

Este arquivo governa **origem, precedência e auditoria das decisões administrativas**. Ele não descreve o método técnico de autenticação, gate, download ou impressão; essa fonte única é `SISTEMA_DE_LOGIN_DO_SITE/CATALOGO_CANONICO_SISTEMA_DE_CONTAS.md`. O estado agregado de rotas fica em `INVENTARIO_ROTAS_VIGENTES.md`.

O painel `/conta/desenvolvedor.html` é uma entrada administrativa autenticada. As decisões de Free/Premium, bloqueio global Free e disponibilidade Asaas/Stripe são dinâmicas. O manifesto é configuração inicial; documentos e conversas anteriores são históricos.

## Registro e comunicação

Cada mutação do painel já grava `developer_admin_audit_log`: responsável autenticado, ação, alvo, antes/depois e data. O registro foi estendido com metadata de origem gerada pelo servidor (`_decision`), sem depender de campos editáveis enviados pelo navegador. As decisões antigas continuam identificáveis pelo ator administrativo e pelas ações `set_route`, `queue_route_activation` e `set_setting`.

A política pública vigente é o ponto de comunicação legível por máquinas:

`https://asjkftjfbkuuhilnqonx.supabase.co/functions/v1/developer-admin?public=policy&path=fugulin.html`

O campo `route.decision` distingue a ordem do desenvolvedor (`origin=developer_panel`) da configuração inicial e da aplicação automática pelo deploy. Inclui identificação do registro, data, ação e plano solicitado. O estado aplicado continua em `route.premium_required` e `route.enforcement`. `settings_decisions` registra a origem dos três switches comerciais. A resposta pública não divulga e-mails, tokens, concessões manuais ou snapshots privados. O histórico detalhado é disponível somente ao administrador autenticado e mostrado no painel.

Ativar uma página pública pode gerar uma solicitação de publicação. Nessa fase o plano pedido é Premium, mas o acesso efetivo continua Free até a entrega protegida. `activate_route_after_deploy` é a execução da ordem original, não uma nova decisão independente. Não reenfileirar a mesma solicitação nem restaurar um plano histórico para satisfazer testes antigos.

## Procedimento obrigatório para IAs

1. Ler `CATALOGO_CANONICO_SISTEMA_DE_CONTAS.md`, `INVENTARIO_ROTAS_VIGENTES.md` e este protocolo.
2. Consultar a política atual para o caminho exato, inclusive prefixo do idioma. Examinar `decision` e configuração vigente, sem cache antigo.
3. Se a origem estiver ausente ou houver conflito, consultar `developer_admin_audit_log` e a fila pendente por ferramentas autorizadas. Exemplo read-only: `select action,target_key,before_state,after_state,created_at from developer_admin_audit_log where target_type='route' and target_key='fugulin.html' order by created_at desc limit 10;`.
4. Distinguir decisão solicitada, publicação pendente e estado aplicado. Preservar a escolha mais recente do desenvolvedor. Substituir apenas quando um pedido atual explícito abranger a rota e o plano desejado; esclarecer conflitos concretos antes de mutações.
5. Reconsultar antes de escrever. Não aplicar um snapshot antigo sobre alteração concorrente do painel. Não alterar regras durante auditorias read-only nem tentar fazer o banco coincidir com listas históricas.
6. Validar estado e registro após alteração autorizada, atualizar documentação e relatar os limites da verificação.

O registro permanece no banco; não envia mensagens por e-mail/Slack e não depende de uma IA estar ativa. Cada IA que atua no repositório deve consultar a fonte vigente. Referência: `AGENTS.md`.
