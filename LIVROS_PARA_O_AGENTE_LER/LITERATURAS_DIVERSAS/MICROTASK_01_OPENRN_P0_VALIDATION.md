# Microtarefa 1 — Validação Open RN P0

Status: **PASS WITH FAIL-CLOSED PACKAGE CHECK**

## Escopo
Validação do bloco Open RN da aquisição P0 da Unified Corpus Foundation.

## Resultados
- 10/10 Bookshelf IDs do manifest correspondem a títulos oficiais Open RN no NCBI Bookshelf.
- 10/10 títulos foram confirmados como **CC BY 4.0** nas páginas oficiais dos títulos.
- O mecanismo oficial de localização dos pacotes continua sendo o NLM LitArch `file_list.csv`, que informa caminho `.tar.gz` + accession/Bookshelf ID.
- A execução `run_p0.py --mode safe` agora baixa **somente prioridade P0**; P1/P2 exigem execução posterior deliberada.
- O downloader agora faz extração segura de TAR, bloqueando path traversal.
- Após download, o pacote só recebe `rights_gate=DEFAULT_ACTIVE` se houver evidência de CC BY 4.0 nos arquivos extraídos; caso contrário permanece bloqueado para revisão.
- Assets/figuras de terceiros continuam sujeitos a revisão item a item mesmo quando o livro é CC BY 4.0.

## Livros
P0: Nursing Skills 2e; Nursing Advanced Skills; Nursing Pharmacology 2e; Nursing Fundamentals 2e; Health Alterations.

P1: Nursing Management and Professional Concepts 2e; Nursing Health Promotion; Nursing: Mental Health and Community Concepts 2e.

P2: Medical Terminology 2e; Nursing Assistant.

## Limitação desta validação
O ambiente desta sessão não executa o download externo do `file_list.csv`; portanto a presença dos 10 accessions no snapshot corrente do LitArch será checada automaticamente no computador local no momento da execução. A documentação oficial do NLM confirma que esse CSV é o índice autoritativo para localizar os pacotes Open Access.
