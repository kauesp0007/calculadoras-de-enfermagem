# Gotejamento Topic Universe v0.7.0

Pacote consolidado do universo editorial da Calculadora de Gotejamento.

## Conteúdo entregue
- 30 páginas HTML completas e interligadas;
- 30 arquivos-fonte Markdown, um por tema;
- 30 PDFs editoriais A4 com capa, logotipo, fotografia gerada como marca-d'água, ficha editorial, sumário, paginação, referências e contracapa;
- QR Code e redes sociais na contracapa;
- base atômica (`data/atomic_knowledge.json`);
- fontes internacionais (`data/sources.json`);
- manifests JSON/CSV e hashes SHA-256;
- imagem original gerada e versão tratada para capa em `static/pdf-publication/`.

## Estrutura
- `content/pages/*.md` - conteúdo editorial revisável;
- `pages/*.html` - páginas web;
- `pages/pdf/gotejamento/*.pdf` - publicações A4;
- `src/premium_pdf_html/*.html` - fonte editorial dos PDFs;
- `data/` - knowledge/evidence/manifest;
- `static/` - CSS/JS e ativos.

## Princípio editorial
Objeto atômico é a unidade de conhecimento; página é composição completa. As páginas não são fragmentos: cada URL reúne múltiplos objetos, exemplos, verificações, segurança e referências em torno de uma intenção central.

## Imagem de capa
A fotografia de infusão usada como marca-d'água foi gerada especificamente para este projeto. Não depende de banco de imagem externo.

## Base internacional
INS · WHO · NMC · NICE · ISO · ISMP · PubMed/NCBI
