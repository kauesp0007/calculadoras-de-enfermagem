# Privacidade — calculadora de gasometria arterial

Versão 0.1.0. Documento preparado em 30/09/2026 para revisão antes de publicar.

Os parâmetros digitados são processados localmente na página da extensão e ficam somente na memória do formulário. Esta versão não usa servidor, analytics, rastreamento, cookies ou armazenamento persistente para esses valores. Eles não são vendidos, compartilhados ou enviados ao site divulgado.

Ao clicar no ícone, a extensão verifica o endereço da aba para escolher entre card na página e janela separada. Quando há um anúncio Premium e cabeçalhos conhecidos, consulta suas dimensões para posicionamento. Não extrai texto, formulários ou dados clínicos da página visitada, nem registra seu endereço.

As permissões `activeTab` e `scripting` são usadas para inserir o card na aba atual após o clique do usuário. Não há permissão permanente para todos os sites nem scripts inseridos automaticamente durante a navegação.

A comunicação entre o formulário e o controlador do card usa apenas mensagens de prontidão/fechamento e um identificador temporário. Os valores digitados não fazem parte das mensagens.

**Limpar** esvazia o formulário e oculta o resultado. Fechar o card ou a janela remove seu contexto; não há histórico salvo pela extensão.

Os links do rodapé e das referências abrem sites externos somente quando clicados. Esses sites tratam a visita segundo suas próprias políticas. Os links não contêm os valores do formulário.

Para o cadastro da Chrome Web Store, o responsável deve disponibilizar esta política em uma URL pública sob seu controle e informar o canal de contato. Este arquivo ainda não foi publicado como página de política.
