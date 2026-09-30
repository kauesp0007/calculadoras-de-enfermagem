# Álbum de enfermagem — mural e autoria

Pedido: mural compacto com três fotos lado a lado no desktop, molduras inclinadas, hero reduzido, textos de interface PT em destaque e EN/ES pequenos, formulário em aba retrátil, anonimato, consentimento e edição/exclusão pelo autor.

Implementação limitada a album_enfermagem.html e seus novos assets; os módulos globais e acervo existente foram mantidos. Drawer ocupa um terço da largura útil no desktop, começa abaixo do cabeçalho e sua altura acompanha o início do footer. No celular usa painel adaptado e mural com duas colunas (uma nas telas muito estreitas). Descrições completas ficam acessíveis por expansão; comentários secundários em sanfona.

Novas fotos usam a sessão Firebase canônica. A Edge Function album-author verifica assinatura RS256, issuer e audience, e consulta a autoria privada antes de alterar/excluir. Nome/avatar vêm de account_profiles, com fallback aos claims; anonimizados não são enviados na resposta pública. UID e registro de consentimento ficam na tabela album_photo_owners sem acesso público. A RPC de inserção é restrita a service_role e salva foto e autoria atomicamente. Legados sem autoria não são reivindicados automaticamente.

## Validação

- node --check js/album-enfermagem.js: aprovado.
- scripts/test-album-author.cjs: contrato simulado aprovado para assinatura inválida, autoria falsa, consentimento obrigatório, nome do perfil canônico, anonimato, limpeza de upload após falha e editar/excluir somente pelo dono.
- HTML: parser sem erros, um H1, IDs únicos.
- CWV do HTML alterado: sem blur ou sombras pesadas, imagens com alt/decoding; prévia interativa não lazy por ser mostrada somente quando escolhida.
- Migration aplicada e album-author implantada; endpoint real rejeita token ausente/inválido com HTTP 401.
- Teste SQL com service_role e rollback: publicação+autoria+consentimento, edição, exclusão e cascade aprovados.
- Privilégios verificados: anon sem INSERT/UPDATE/DELETE em album_fotos, sem SELECT em owners, sem EXECUTE na RPC.
- Preservação verificada antes/depois: 7 fotos, 2 comentários, 9 curtidas. Hashes do conteúdo legado idênticos:
  fotos 619f180f72c1e1e31ac5c65d8d896b98; comentários 54a011535b817af10edc9099928256c3; curtidas bd25d3cf32900201454027bc22f5ccae.
- Advisor: tabela privada com RLS sem políticas públicas é intencional; sem novos avisos críticos.
- Revisão independente somente leitura realizada; achados de perfil, contador, recolhimento e corrida de sessão corrigidos.

Limites locais: checkout sparse impede auditoria global do ecossistema/governança; Tailwind/SW serão compilados no workflow completo de deploy, preservado sem alterações. Prévia local não pôde ser aberta no navegador remoto por bloqueio do URL local; revisão visual será feita na página pública após o deploy. Não houve teste com credenciais reais de assinante nem publicação de fotos de teste no acervo.

Os textos de navegação, campos, controles e estados do álbum são trilíngues. Textos enviados pela comunidade permanecem em seu idioma original, preservando seu conteúdo.
