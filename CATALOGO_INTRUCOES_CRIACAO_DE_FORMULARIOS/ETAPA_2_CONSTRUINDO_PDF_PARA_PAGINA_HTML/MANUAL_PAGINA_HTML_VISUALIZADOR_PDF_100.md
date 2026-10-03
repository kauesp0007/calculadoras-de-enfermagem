# Manual vigente: PDF original, imagem de qualidade e página HTML protegida

Atualizado em 03/10/2026. Este documento substitui o método antigo de iframe público com download direto e a prévia de 439 px. O nome do arquivo foi preservado para não quebrar os links do catálogo. Autenticação e entitlement têm uma única fonte: `SISTEMA_DE_LOGIN_DO_SITE/CATALOGO_CANONICO_SISTEMA_DE_CONTAS.md`.

## Resultado obrigatório

- Visitantes e Free consultam uma imagem estática, grande e nítida do formulário.
- O PDF original é entregue somente depois de autorização Premium no servidor.
- Português usa os PDFs da raiz; inglês usa EN; espanhol usa ES. Não copiar a tradução de um idioma para outro.
- A imagem é renderizada diretamente do PDF original em 200 DPI, preservando a proporção e os textos. WebP sem perda mantém exatamente os pixels renderizados.
- A4 normalmente resulta em 1653/1654 × 2339 px. A diferença de um pixel depende das dimensões reais da página; não esticar para corrigir isso.
- Exibição na página dedicada: largura máxima 900 CSS px, largura 100% do espaço disponível em telas menores, altura automática, centralizada. Não ampliar acima da resolução da fonte.
- Os cards do catálogo continuam compactos; usam a mesma imagem de alta resolução em tamanho menor.
- A prévia mostra a primeira página. O PDF original completo é mantido. Documentos com várias páginas são registrados em `pdf_pages` e exigem revisão editorial antes de prometer visualização integral.

## Programas e agentes

| Componente | Função |
|---|---|
| Poppler: `pdfinfo` e `pdftoppm` | Inspecionar página e renderizar o PDF em PNG a 200 DPI; não utiliza IA. |
| Python 3 e Pillow com suporte WebP | Converter PNG para WebP lossless; comparar pixels; calcular dimensões e hashes. |
| `scripts/render-assistential-previews.py` | Executor determinístico do lote PT/EN/ES e auditoria de qualidade. |
| Node.js e GitHub Actions | Executar testes, build, persistência segura e deploy. |
| `premium-content` / `form-pdf-preview.mjs` | Entregar HTML demonstrativo com imagem e metadados controlados. |
| `js/access/protected-form-pdf.js` | Usar Firebase/Auth canônico, pedir PDF autorizado e exibir blob no Premium. |
| Agente executor: Codex, DeepSeek ou Copilot | Ler regras, conferir mapeamento, executar conversão e atualizar fontes. Não gerar a imagem por IA. |
| Auditor independente, como `auditar_pdf` | Conferir tamanho, proporção, texto, idioma, autorização e contra-prova. |
| Agente/build ou job `deploy` | Tailwind, testes, SW gerado e publicação. Não decidir políticas comerciais. |

PDF.js não é necessário no método vigente e não foi instalado nesta correção. É uma alternativa de renderização PDF em canvas; esconder seus controles não protege um original já enviado ao navegador. Não adicionar PDF.js nem voltar ao iframe público para resolver a nitidez. O Premium usa o visualizador do navegador com blob autorizado; Free recebe imagem.

## Preparação no Desktop Windows

1. Antes de editar: `git pull --rebase`. Trabalhar em branch para mudanças grandes. Não usar force push.
2. Ler `AGENTS.md`, `AI_RULES.md`, `HTML_RULES.md`, `HTML_PAGE_TEMPLATE_RULES.md`, o catálogo canônico de contas e o protocolo de decisões do desenvolvedor.
3. Python 3, Pillow com WebP e Poppler precisam estar instalados. Colocar `pdfinfo` e `pdftoppm` no PATH. Confirmar `python --version`, `pdfinfo -v` e `pdftoppm -v`.
4. Na raiz `C:\calculadoras-de-enfermagem`, executar os comandos abaixo. A pasta deste manual é `CATALOGO_INTRUCOES_CRIACAO_DE_FORMULARIOS\ETAPA_2_CONSTRUINDO_PDF_PARA_PAGINA_HTML`.

```powershell
python scripts/render-assistential-previews.py --workers 4
python scripts/render-assistential-previews.py --audit
node scripts/test-protected-form-pdf.mjs
```

O CI instala Poppler/Pillow apenas se ausentes, usando pacotes Ubuntu. O Desktop precisa preparar seu próprio PATH; não assumir que o ambiente local é idêntico ao runner.

## Fontes, mapeamento e destino

`scripts/assistential-preview-map.json` contém id, caminho PDF, catálogo e idioma. Foi reconciliado com os três registros privados vigentes: 66 PT, 63 EN, 63 ES. IDs pertencem a cada catálogo: não assumir que o mesmo número significa a mesma escala em dois idiomas.

- PT: `FORMULARIOS_DE_ESCALAS/<original>.pdf` → `img/formularios-previas/form-NNN.webp`.
- EN: `FORMULARIOS_DE_ESCALAS/EN/<original>.pdf` → `img/formularios-previas/en/form-NNN.webp`.
- ES: `FORMULARIOS_DE_ESCALAS/ES/<original>.pdf` → `img/formularios-previas/es/form-NNN.webp`.

Ao criar novo formulário: registrar PDF/ID no catálogo privado, atualizar o mapa e os totais esperados do renderizador/testes; confirmar com o desenvolvedor a política Free/Premium e inclusão no menu. Não escolher ID arbitrário nem inferir política de uma lista histórica.

## Processo automático de imagem

1. Validar idioma, ID único, caminho dentro da pasta de PDFs e assinatura `%PDF-`.
2. Inspecionar o PDF com `pdfinfo`; registrar quantidade de páginas.
3. Renderizar a primeira página com `pdftoppm -r 200 -f 1 -l 1 -singlefile -png`.
4. Abrir o PNG sem redimensionar, converter RGB e salvar WebP com `lossless=True, method=6`.
5. Reabrir o WebP e comparar os pixels com o PNG. Qualquer diferença bloqueia a geração.
6. Verificar dimensões, formato, hash da fonte e hash do resultado. Publicar o arquivo atomicamente.
7. Registrar `scripts/assistential-preview-quality.json`: DPI, dimensões, bytes, páginas, SHA-256 e versão do gerador.
8. Reutilizar imagem somente quando fonte, versão, dimensões, formato e hash correspondem ao manifesto. Alterar VERSION e a versão da URL ao mudar o algoritmo.

Não redimensionar as imagens antigas de 439 px, usar upscale por IA ou compressão com perda para texto clínico. Não alterar conteúdo clínico durante a conversão. Um PDF que já contém uma imagem borrada não recupera detalhes; corrigir a fonte numa tarefa editorial separada.

## Página HTML e proteção

Preservar head/SEO, módulos globais, acessibilidade, anúncios segundo plano, referências e idioma. Usar o template desta pasta como staging, nunca sobrescrever página publicada automaticamente. O gerador exige diretório `--output`, mapeamento e manifesto de qualidade.

A visualização usa `.protected-pdf-viewer`, imagem versionada `?v=200dpi-v1`, dimensões reais e metadados `data-protected-pdf-id` / `data-protected-pdf-catalog`. Os botões usam `data-protected-pdf-action="download"` ou `"print"`. Carregar `/js/access/protected-form-pdf.js?v=1`. O atributo hidden precisa de display:none para a imagem sair quando o iframe Premium abrir.

Nunca colocar src/href do original `/FORMULARIOS_DE_ESCALAS/...pdf` num HTML público, nem atributos download diretos ou window.open para essa URL. Fontes legadas privadas podem ser transformadas pela Edge, mas novas páginas já devem seguir o template protegido. Não enviar service_role ao cliente.

O servidor valida a identidade Firebase e entitlement antes de ler o bucket privado. Logout/troca de conta revoga os blobs. A imagem pública pode ser salva/capturada; esta proteção restringe a entrega do PDF original, não screenshots. Fontes no GitHub público e cópias anteriores permanecem acessíveis fora do site.

## Ordem de deploy e cache

O workflow renderiza/audita as imagens antes dos testes de catálogo, sincronização e retirada dos PDFs públicos. Depois dos testes, persiste imagens/manifesto com commit normal e fetch/rebase seguro. Auto Git Sync, DEPLOY_LOCK, marcadores de pausa e a fila de deploys são preservados.

O upload privado dos originais é verificado antes de excluir as fontes do artifact público. O SW é gerado em seguida; nunca versionar sw.js. Relatórios em relatorios não são commitados. Publicar as imagens antes de ativar o novo limite de 900 px na Edge. URLs versionadas impedem reutilizar a antiga prévia de baixa resolução do cache.

## Validação e contra-prova

- Auditoria automática das 192 fontes/resultados, 200 DPI, lossless e hashes.
- Conferência visual em 900 px: texto, linhas, símbolos, idioma, bordas e proporção. Revisar fontes problemáticas sem adulterá-las.
- Confirmar que Free recebe imagem e downloads originais retornam 401/403 sem autorização.
- Confirmar que Premium abre o blob e usa o PDF original completo; validar com conta de teste quando disponível, sem criar entitlement fictício.
- Verificar PT/EN/ES no site após deploy e registrar evidência no PR.
- Atualizar o catálogo canônico somente quando o método mudar. Não criar uma segunda descrição de Auth neste manual.

O cliente `/js/access/assistential-preview-quality.js?v=1` consulta o manifesto público sem cache, aplica as dimensões reais de cada imagem e usa o hash WebP na URL. Isso evita a prévia antiga após alterar o PDF, sem alterar Auth ou entitlement. A auditoria é repetida depois do fetch/rebase; se a fonte mudou durante o deploy, bloquear a publicação e deixar a próxima execução regenerar.
