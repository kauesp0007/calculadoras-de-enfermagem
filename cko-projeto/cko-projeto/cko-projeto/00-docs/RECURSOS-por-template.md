# Recursos por Template

Os 13 tipos de recurso do pipeline SSG e o que cada template carrega. (Detalhe célula-a-célula fica na planilha *visão global* — ver INVENTARIO-website.md.)

## Tipos de recurso

Calculadora · Artigo · Quiz · Guia de bolso · Flashcards · Checklist · Caso clínico · Slides · Infográfico · Mapa mental · Simulado · Vídeo · Biblioteca.

## Obrigatórios em TODOS

breadcrumb · seletor de idioma · tema claro/escuro · data de atualização · dados estruturados (JSON-LD) · skip link · kill switch (`data-content-id`) · aviso clínico quando houver conteúdo clínico.

## Por recurso interativo (calculadora, quiz, flashcards, checklist, caso, simulado)

estados de progresso · autosave de entradas · anúncio em região viva · reportar erro.

## Por recurso imprimível (calculadora, artigo, guia, checklist, caso, slides, infográfico, mapa)

capa · **bloco de integridade** (versão, hash, data) · `break-inside: avoid` nos blocos atômicos · links externos com URL expandida.

## Matriz — features por template

| Feature | Calculadora/Escala | Biblioteca |
|---|:--:|:--:|
| Hero + breadcrumb | ✅ | ✅ |
| Abas | ✅ | ✅ |
| Resultado (`.resultado`, aria-live) | ✅ | — |
| Memória de cálculo | ✅ | — |
| NANDA/NIC/NOC | ✅ | ✅ |
| Faixas/interpretação | ✅ | — |
| Características específicas | — | ✅ (`exclusiveModules`) |
| Contraindicações/segurança | ✅ | ✅ |
| Favoritar | ✅ | ✅ |
| Compartilhar (share bar) | ✅ | ✅ |
| Imprimir / PDF | ✅ | ✅ |
| Copiar resultado | ✅ | — |
| Reportar erro | ✅ | ✅ |
| Toaster | ✅ | ✅ |
| TTS (leitura) | ✅ | opcional |
| Autosave | ✅ | — |
| Gate de rascunho | ✅ | ✅ |
| `@graph` (MedicalWebPage+Breadcrumb+reviewedBy) | ✅ | ✅ |
| Perfil de impressão | `a4_*` conforme tipo | `a4_portrait_document` |

## Perfis de impressão (`print_profile_id`)

`a4_portrait_document` · `a4_portrait_report` · `a4_landscape_slides` · `a6_pocket` · `a4_checklist` · `a4_sae`.
