# Auditoria Premium e limpeza controlada de PRs — 02/10/2026

Base examinada: `0a8e39e1683db0e612a452a523878df5bd560c56`. Revisões independentes realizadas por dois revisores somente leitura.

## Causa e mudança

Fugulin e Dimensionamento foram ativadas pelo painel em 30/09, com migração e shell publicados. A auditoria estática ainda exigia Free na raiz e usava regex do loader com escape excedente. O responsável confirmou que muda os planos pelo painel e pediu verificar essas escolhas primeiro.

Preservados os HTMLs públicos e conteúdo privado. Revertida, com compare-and-set e trilha compensatória, a alteração temporária de duas regras para Free feita ao interpretar o pedido inicial. Política pública confirmou Fugulin/Dimensionamento Premium e Braden Free. Nenhuma cobrança, assinatura, entitlement ou chave alterada.

Auditoria agora valida política pública por rota via `--live-policy`, sem segredos. Premium exige protected_content e shell íntegro; Free pode ser conteúdo público integral ou shell que o backend entrega sem autenticação. Política ausente/inválida/indisponível falha a execução online. Execução offline confirma apenas estrutura. Testes locais: auditoria de 327 HTMLs Premium e developer-admin aprovados; regressões revisadas independentemente. CI e publicação verificadas no PR de manutenção associado.

## Registro de origem solicitado pelo responsável

Reutilizado o histórico administrativo, com metadata de decisão server-derived em cada nova mutação. Política pública inclui ordem administrativa sanitizada por rota/configuração, recuperando também registros antigos. GET autenticado administrativo fornece últimas50 entradas, exibidas no painel. AGENTS e instruções do Copilot exigem consulta ao protocolo e origem antes de alterar regras. Testes cobrem filtragem de atores, legado, fila, estado aplicado e ausência de e-mails/JSON privado na resposta pública. Não houve envio de mensagens ou criação de assinatura/checkout. O histórico não garante que ferramentas externas que ignorem as instruções consultem a origem; o protocolo torna essa consulta explícita e verificável.

## Revisão dos 21 PRs

| PR | Decisão | Evidência |
|---|---|---|
| #14 | Preservar | Governança, dossiê e registro exclusivos ausentes main |
| #22 | Fechar sem merge | Planos/preço antigos superados pelo Free/Premium canônico |
| #51 | Fechar sem merge | Estado verifying já na assinatura vigente |
| #65–#72 | Fechar sem merge | Todos os commits preservados como ancestrais do head #73 |
| #73 | Preservar draft | I18n/RTL exclusivos; merge integral regressaria rotas localizadas e anúncios atuais |
| #74 | Fechar após validar correção | Intenção Free fixa superada pelas escolhas dinâmicas recentes do painel |
| #76 | Fechar sem merge | changed_files=0; incidente antigo de ferramentas |
| #81 | Fechar sem merge | Implementação de anúncios já vigente; catálogo canônico explicitamente substitui o plano antigo, sem ressuscitar regras obsoletas |
| #84 | Fechar sem merge | changed_files=0 |
| #90 | Fechar sem merge | Quatro rotas localizadas já implementadas na main com normalização posterior |
| #98 | Fechar sem merge | Layout/H1 posterior da home superou proposta antiga |
| #114 | Preservar | Funcionalidade evoluiu na main, mas documentos/testes exclusivos preservados no PR |
| #121 | Preservar draft | Programa Windows e workflow exclusivos |
| #127 | Preservar | Ícones e manifesto1.0.1 exclusivos |

Fechamentos mantêm branches e commits e registram motivo na descrição de cada PR. Não houve merge de PR antigo nem exclusão de branches. Cinco PRs originais permanecem para trabalho exclusivo após fechamento de #74: #14, #73, #114, #121, #127.
