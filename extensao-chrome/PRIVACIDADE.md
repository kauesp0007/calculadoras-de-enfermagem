# Privacidade — calculadora de gasometria arterial

Versão 0.3.1. Documento atualizado em 30/09/2026 para revisão antes da publicação.

## Dados clínicos

Os parâmetros digitados na calculadora são processados localmente dentro da extensão. pH, PaCO₂, HCO₃⁻, PaO₂, BE, SatO₂ e o resultado calculado **não são enviados ao site, ao Supabase, ao Asaas, ao Stripe ou a serviços de analytics**. A extensão não mantém histórico desses valores.

## Conta e assinatura

A versão 0.3.1 usa a conta já existente em **Calculadoras de Enfermagem** somente para confirmar se o usuário possui acesso Premium.

- O botão de login abre o domínio oficial `www.calculadorasdeenfermagem.com.br`.
- A credencial Firebase permanece no site e não é entregue nem armazenada pela extensão.
- O servidor gera um código aleatório de uso único, com curta validade, vinculado ao ID da extensão e a um desafio criptográfico PKCE (S256).
- A extensão envia esse código somente ao projeto Supabase das Calculadoras de Enfermagem para receber o estado `free` ou `premium` e, quando aplicável, a expiração do Premium.
- O código é consumido uma única vez e não contém os valores clínicos do formulário.
- O botão **Assinar Premium** abre a página de assinatura já existente. O processamento de pagamentos continua sujeito às políticas do provedor utilizado pelo site (Asaas ou Stripe).

## Permissões do Chrome

A extensão usa:

- `sidePanel`: abrir a calculadora no painel lateral nativo.
- `identity`: realizar o retorno seguro do login do site para a extensão.
- acesso de rede somente a `https://asjkftjfbkuuhilnqonx.supabase.co/*`, utilizado para a validação de acesso Premium.

A extensão não solicita `activeTab`, permissão `tabs` para leitura, `scripting` nem content-script. Ela não lê URL, texto, cabeçalhos, formulários ou conteúdo das páginas visitadas.

## Armazenamento

A extensão não armazena o token Firebase e não usa armazenamento persistente para dados clínicos. O código temporário de autenticação é descartável. No backend, a tabela de códigos temporários possui RLS habilitado e não tem política pública de leitura ou escrita.

**Limpar**, **X**, **Esc** e o fechamento do painel removem os valores do formulário da sessão atual. Alternar a altura do painel mantém os valores apenas enquanto a interface atual permanece aberta.

## Links externos

Os links do rodapé, referências e assinatura só abrem sites externos quando acionados pelo usuário. Os valores clínicos do formulário não são anexados a esses links.

Para a Chrome Web Store, esta política deve ser disponibilizada também em uma URL pública sob controle do responsável pela extensão, junto com um canal de contato.
