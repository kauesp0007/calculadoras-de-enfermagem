# Anamnese e exame físico — 0.2.0

## Fontes e fidelidade

- Brasileiro: arquivo enviado `instrumento_de_coleta_de_dados.html`, correspondente a https://www.calculadorasdeenfermagem.com.br/instrumento_de_coleta_de_dados.html. Seis seções, 67 campos de texto, 131 caixas. Referência declarada pelo modelo: Barros, Alba Lucia Bottura Leite de (org.), *Anamnese e Exame Físico*, 3. ed., Artmed, 2016.
- Americano: conteúdo completo da página `formulario_avaliacao_da_cabeca_aos_pes.html` no catálogo Premium do proprietário, consultado em 01/10/2026. Source SHA `cd5f480797823e875ac5db5900861f5925c1aee9`, atualizado em 20/09/2026. Dez seções, 39 textos, 126 caixas. Referências declaradas pelo modelo: Jarvis, Bates/Bickley e Potter.

Os rótulos brasileiro/americano identificam as escolhas solicitadas pelo proprietário. Não certificam validade nacional universal nem inventam autoria/universidade além das referências expressas nos arquivos.

O gerador `tools/extract-forms.py` preserva a ordem, texto, unidades, continuação dos campos e tabela Glasgow das fontes; carrega só o contêiner do formulário. Remove scripts, handlers, anúncios e dependências externas. Chaves `f001...` são estáveis na versão 1.0.0 de cada template. Os controles visuais e os placeholders de impressão são gerados dos mesmos campos, sem recriar uma lista parcial de perguntas. Não se presume normalidade dos achados.

## Armazenamento

`clinical_records`: paciente, método, versão do formulário, tipo de registro, data/hora, profissional/COREN, valores JSON tipados, snapshot, revisão e timestamps. `clinical_drafts`: chave composta paciente+método, conteúdo com base/revisão e timestamp. Tabelas vivem no mesmo SQLite protegido por AES-256-GCM e chave DPAPI. `user_version=3` adiciona tabelas/índice; avaliação Fugulin existente não muda.

Salvar usa a transação/persistência atômica existente. O backend valida IDs, método/versionamento, chaves dos campos, booleanos, tamanho máximo de 4.000 caracteres por campo e 300.000 caracteres por ficha, datas/horas, profissional e população adulta quando nascimento foi informado. O cadastro novo pode ser criado sem Fugulin. Registro datado e rascunho são conceitos distintos na UI.

A retificação verifica paciente, método e revisão atual. Guarda a versão anterior no audit; preserva snapshot e não muda cadastro atual. Identificação do corpo/rodapé é vinculada no backend. Exclusão tem confirmação e audit; excluir paciente remove suas fichas/rascunhos operacionais. Conteúdo anterior permanece no audit, como documentado na política da aplicação.

## Rascunhos e concorrência

Debounce de 650 ms, fila serializada, snapshot imutável de cada chamada e geração do editor. Trocar paciente/método ou sair da tela aguarda a gravação. Rascunhos de métodos diferentes coexistem. Abrir outra ficha do mesmo método que substituiria um rascunho exige confirmação. Ao restaurar outro banco, a fila clínica é pausada/cancelada/aguardada antes da troca; cancelamento reativa editor, sucesso limpa contexto. Campos de metadados são reabilitados ao abrir um formulário.

## Impressão/PDF

`src/services/anamnesis-report.js` compõe HTML estático do template local revisado, com valores escapados e caixas marcadas com X, seguindo a função de impressão da fonte brasileira. A ficha inclui identificação, método, tipo, data/hora, enfermeiro/COREN, revisão e linha de assinatura. Não contém inputs nem scripts. Textos longos recebem layout com fluxo de página. PDF usa Chromium `printToPDF` e impressora usa o diálogo nativo sobre o mesmo documento dedicado. Essa adaptação evita pop-ups e respeita o sandbox do aplicativo.

PDFs/prints são o conteúdo atualmente preenchido; para vincular definitivamente ao histórico, salvar primeiro. Nenhum PDF/CSV exportado é criptografado. Documento não é assinado digitalmente nem constitui prontuário certificado.

## Backup e compatibilidade

Backup atual inclui fichas/rascunhos. Restaurar valida esquema, versão, chaves/JSON, referências a pacientes e bases/revisões, snapshots e dados clínicos antes da substituição; cria cópia protegida do banco anterior. Backups v2/0.1.0 migram criando tabelas vazias e preservando a Fugulin. Bancos de versões futuras são recusados pelo novo executável. Não fazer downgrade ao executável 0.1.0 depois da migração.

## Validação

Testes de unidade: contagem integral dos controles, todos os booleanos/textos, persistência/reabertura, isolamento dos métodos/pacientes, revisão/audit/snapshot, backup adulterado, migração antiga, exclusão e rollback de disco.

Fluxo UI: cadastro independente, marcação/escrita, alternância/retomada, ficha no histórico, retificação, reabertura, PDF de ambos modelos e texto longo com marcadores início/fim, responsividade 1440/960/560. Fluxo Windows adicional usa IPC real, DPAPI, Electron/ASAR e instalador NSIS. Todos os dados usados são fictícios.
