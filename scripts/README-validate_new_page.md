validate_new_page.js — Validação de páginas novas

Descrição

Script Node.js simples que verifica:
- Presença da barra de ações compactas (com os botões esperados) imediatamente após o H1
- Existência da seção de Referências Bibliográficas com indícios do formato esperado (links, "Disponível em:", classe text-sm, ou ano)

Local: scripts/validate_new_page.js

Uso

- Validar arquivos específicos:
  node scripts\validate_new_page.js integracoes_meu_arquivo.html

- Validar automaticamente todos os arquivos padrões (integracoes_*.html / guia_rapido_*.html) no diretório do repositório:
  node scripts\validate_new_page.js

Retorno

- Saída 0: todas as validações passaram
- Saída 1: ao menos um arquivo falhou na validação (detalhes impressos)
- Saída 2: nenhum arquivo para validar

Integração em CI

Adicionar um passo que execute o script e falhe em caso de saída != 0. Exemplo (GitHub Actions):

- name: Validar páginas novas
  run: node scripts/validate_new_page.js

Observações

- O script é heurístico: valida presença de labels e padrões simples (não valida ABNT estritamente). Se quiser validação mais rigorosa (parsing de citações ABNT), posso estender o script para reconhecer formatos ABNT precisos ou usar uma biblioteca.
- Para adaptar ao generador de páginas do agente, o script pode ser chamado automaticamente após geração para garantir conformidade antes de sinalizar que a página está pronta para revisão/commit.
