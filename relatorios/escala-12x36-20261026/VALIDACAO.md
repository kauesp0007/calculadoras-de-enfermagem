# Escala 12x36 — tabelas iniciais e tutorial

Pedido: mostrar tabelas de equipes vazias abaixo do card 3, preenchimento por cadastro e tutorial contextual com Próximo/Fechar; publicar página existente da raiz.

## Implementação

- Renderizador existente chamado ao iniciar. Removido retorno antecipado que escondia as quatro tabelas sem colaboradores. Cada equipe selecionada exibe calendário do mês, estado vazio e totais zerados.
- Preservados filtros por turno/paridade, cadastro, remoção, folgas, afastamentos e cálculos. Configurações do card 1 continuam atualizando cabeçalhos/calendário; cadastro é confirmado em ADICIONAR.
- Ano inválido não destrói a última prévia válida; textos livres são escapados antes da interpolação; fechamento tbody/tfoot corrigido.
- Tutorial local em JS separado, nove passos, Próximo/Anterior/Fechar/Concluir, Escape, reabertura, destaque do alvo, posição limitada à viewport e abaixo do cabeçalho. Primeiro acesso abre; fechamento fica lembrado no navegador. Não bloqueia formulário, não registra colaboradores e não dispara exportações.
- Camada abaixo dos overlays de consentimento/menu e excluída da impressão. Sem novas dependências ou fontes.

## Validação pré-publicação

- Backup local em backups-temporarios/escala-12x36-20261026, não incluído na entrega.
- Leitura dos padrões canônicos, descoberta, planejamento do orquestrador e auditoria independente executados. Índice knowledge indisponível no snapshot, sem inferir ausência de conteúdo relacionado.
- Política pública consultada pelo caminho exato: premium_required=false/enforcement=none; nenhuma classificação de acesso alterada.
- `node scripts/test-escala-12x36.cjs`: PASS, 10 verificações do aplicativo e 8 do tutorial. Usa Node VM com fixture DOM isolada, sem terceiros; não é teste de navegador. Cobre prévia vazia, fevereiro bissexto, ano incompleto, seleção de equipes, distribuição de quatro colaboradores, folgas/afastamentos, escape, remoção total, ciclo manual das células, nove passos/retorno, limites móveis, fechar/Escape/reabrir e persistência do fechamento.
- Sintaxe do JS externo e de todos os scripts inline: PASS.
- `node scripts/cwv-gate.js --dry-run --files escala_de_trabalho_enfermagem_12x36.html js/escala-12x36-tutorial.js`: PASS, uma página. Não é medição de CWV em campo.
- Contra-prova: head/metas/cálculos/print/PDF preservados; novos IDs sem duplicação; sem bloqueador estático. Veredito PUBLICAR_COM_RESSALVAS, condicionado à conclusão do CI/deploy e confirmação da versão no site.
- Build Tailwind local indisponível no snapshot (dependência ausente; nada instalado). Geração/sintaxe de SW verificadas isoladamente, mas SW parcial não será publicado. Build completo ocorre no CI existente.

## Limites

A edição manual de células já é transitória no DOM e é refeita ao adicionar/remover colaboradores ou alterar configurações; esse comportamento preexistente não foi ampliado para digitação no card 2. Testes autenticados de exportação PDF/impressão não foram executados; suas implementações/guards permanecem intactos. Medição visual em celular e CWV de campo não são equivalentes aos testes de posição com fixture DOM.

CI, deploy e conferência da versão publicada serão informados ao encerrar a tarefa.
