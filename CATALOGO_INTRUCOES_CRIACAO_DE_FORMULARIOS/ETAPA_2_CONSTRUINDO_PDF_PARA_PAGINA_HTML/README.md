# Etapa 2: imagem estática de alta qualidade e PDF Premium

O método vigente exibe a primeira página como WebP sem perda em 200 DPI para visitantes/Free e entrega o PDF original completo somente após autorização Premium. Largura máxima de exibição: 900 px, responsiva, sem distorção.

Leia [o manual atualizado](MANUAL_PAGINA_HTML_VISUALIZADOR_PDF_100.md). Ele substitui iframe público, download direto e prévia de 439 px. O nome histórico foi mantido para preservar links.

Ferramentas: Python 3, Pillow/WebP, Poppler (`pdfinfo`, `pdftoppm`), Node e GitHub Actions. PDF.js não integra o método atual. Autenticação: reutilizar exclusivamente o catálogo canônico de contas.

O template contém imagem e controles protegidos. O gerador escreve em staging com --output e recusa sobrescrever HTML existente. O validador rejeita exposição direta do PDF. Gerar/auditar prévias com `scripts/render-assistential-previews.py`; mapeamento e qualidade ficam em scripts/assistential-preview-map.json e scripts/assistential-preview-quality.json.
