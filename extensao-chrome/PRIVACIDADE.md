# Privacidade — calculadora de gasometria arterial

Versão 0.2.0. Documento atualizado em 30/09/2026 para revisão antes da publicação.

Os parâmetros digitados são processados localmente na página da extensão e ficam somente na memória do formulário. Esta versão não usa servidor, analytics, rastreamento, cookies ou armazenamento persistente desses valores. Eles não são vendidos, compartilhados ou enviados ao site divulgado.

A extensão abre no painel lateral nativo do Chrome. Usa somente a permissão `sidePanel`, para configurar a abertura pelo ícone, consultar o lado do painel e fechá-lo. Consulta o identificador da própria janela do navegador para direcionar o fechamento e limpar somente o contexto correspondente. Não lê endereços, texto, cabeçalhos, formulários ou dados das páginas visitadas; não injeta scripts nessas páginas.

A mensagem interna de fechamento contém o tipo da ação e o identificador da janela do navegador. Os parâmetros clínicos não fazem parte das mensagens. As fontes e os ícones usados pela interface estão no próprio pacote.

**Limpar** esvazia o formulário e oculta o resultado. O botão **X**, **Esc** e o fechamento nativo limpam o formulário. Não há histórico salvo pela extensão. Trocar entre altura completa e compacta mantém os valores somente no contexto atual.

Os links do rodapé e das referências abrem sites externos somente quando clicados. Esses sites tratam a visita segundo suas próprias políticas. Os links não contêm os valores do formulário.

Para o cadastro na Chrome Web Store, o responsável deve disponibilizar esta política em uma URL pública sob seu controle e informar seu canal de contato. Este arquivo ainda não foi publicado como página de política.
