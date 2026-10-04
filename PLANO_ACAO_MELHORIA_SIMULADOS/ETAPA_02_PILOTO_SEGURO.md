# Etapa 02 — Piloto seguro do motor compartilhado

Data: 04/10/2026
Branch: `chatgpt/simulados-etapa-02-piloto-20261004`
Piloto: `simulado-de-enfermagem.html`

## Objetivo

Migrar um único simulado real para o motor P0 sem alterar enunciados, alternativas, gabaritos ou referências. O `premium-content-loader.js` e a política dinâmica continuam sendo as autoridades de acesso.

## Estado reconsultado

No início da etapa, a rota estava com `premium_required=true`, `enforcement=client_guard` e `source=premium_content_pages`. O documento privado tinha 49.404 bytes e `source_sha=3c04cdf4b4025ccf2bbbd7609683481276cf835c`.

## Backup e rollback

Foi criado o histórico privado `private.premium_content_page_versions`, fora da superfície pública da Data API. A tabela possui RLS e não concede acesso a `public`, `anon` ou `authenticated`.

O snapshot anterior ao piloto foi salvo como versão 1, com o conteúdo integral mantido somente no banco. O conteúdo privado não é copiado para o repositório.

A estrutura foi registrada em `supabase/migrations/20261004152600_premium_content_page_versions.sql`.

## Motor 1.0.1-p0

Antes do piloto, o motor recebeu impressão compatível com a funcionalidade anterior. Com `print=true`, o resultado oferece impressão contendo resumo, questões, resposta do usuário, gabarito, comentário disponível e referência. A chamada usa `window.print()` e permanece submetida ao guard canônico.

O evento `simulator_print_click` não envia PII nem texto de respostas.

## Contrato do piloto

A transformação privada deve preservar integralmente `questionsData`, trocar somente a interface/runtime legado pelo mount de `CESimulator`, carregar os assets compartilhados e usar `contentVersion` explícito.

O root do motor deve usar `data-premium-action="block"` para que as ações do simulado continuem passando pelo gate canônico. O motor não recebe lógica de Firebase, Supabase, checkout ou classificação de plano.

## GO / NO-GO

GO exige CI verde, assets publicados, backup íntegro, 50 questões, 50 gabaritos e 50 referências preservados, mount único do motor, política da rota inalterada e impressão protegida.

Qualquer alteração clínica, falha do motor, regressão de acesso, erro de entrega ou mudança concorrente de política interrompe o piloto e exige restauração do snapshot anterior antes de escalar.

## Ordem operacional

1. Publicar e validar o motor `1.0.1-p0`.
2. Reconsultar política e hash do piloto.
3. Transformar o documento privado condicionando a escrita à versão esperada.
4. Validar estrutura, contagens e entrega.
5. Observar logs.
6. Manter o piloto isolado antes de migrar outro simulado.

Nenhuma questão clínica será reescrita nesta etapa.
