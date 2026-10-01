# Catálogo assistencial — consulta Free e ações Premium

Data: 01/10/2026. Escopo: somente a página raiz `formularios_de_escalas_assistenciais.html`, seu cliente, prévias e entrega de PDF pela função existente.

## Resultado da implementação

- Removido o card “Usuário Premium, fique à vontade!”; grade sobe e mantém 1/2/3 colunas.
- Preservados os 40 formulários e adicionados os 26 solicitados, total 66, usando os PDFs originais existentes.
- Prévia raster WebP com lazy/async; 66 imagens somam 1.455.868 bytes. PDFs não foram modificados.
- Visitante/Free consulta catálogo e menus; ações de formulário abrem diálogo de oferta Premium sem mudar a rota.
- Download/print usam `premium-content` com Firebase e entitlement canônicos. Regra Free da página não concede PDF. Não há fallback público em erro.
- Registry PDF é removido da resposta de consulta, também em fallback de idioma. ID inválido/URL externa/traversal/HTML no lugar de PDF falham fechados.
- Login usa returnUrl; token inválido/expirado retorna 401; falha JWKS permanece 500. UI trata timeout, restaura foco e informa falhas visualmente.

## Evidências

`node scripts/test-assistential-forms-catalog.mjs`: PASS em 66 cards/arquivos, denegação visitante/Free, assinatura expirada, concessão administrativa, JWT inválido/expirado, erro JWKS, índices inválidos, sanitização de alias, PDF inválido e igualdade byte a byte dos 66 PDFs Premium.

`node scripts/test-premium-auth-delivery-flow.js`, `node scripts/test-billing-final.js`, `git diff --check`: PASS. Tailwind 3.4.18 compilado (106.974 bytes); `gerar-sw.js` executado com sucesso (1.500 arquivos). Gerados são reconstruídos pelo workflow habitual.

Auditorias independentes de SEO, conformidade, performance, integridade e Revisor Final executadas. SEO preservado, schema válido, IDs únicos, foco/diálogo acessíveis, dimensões de imagem consistentes, sem overflow verificado em desktop1440/mobile390. Nenhum conteúdo clínico ou lógica de cálculo alterado.

Playwright: 15 cenários simulados aprovados, 66/66 prévias carregadas, Free download/print/oferta, anônimo sem chamada PDF, Premium download original, impressão blob/fallback, 401 refresh, 403, HTML200, rede, Auth/token pendentes e recuperação dos botões. PDF Aldrete baixado com SHA256 `20ee6d5f6cae9e62d92c019c6344bb43bbfb01c917922ca630fe3944b21ef78b`.

Limitações de teste: Auth/endpoint/componentes globais simulados no navegador; não houve sessão Firebase real nem cobrança. Visualizador PDF nativo/diálogo do sistema, menu/rodapé globais reais e CLS numérico: NOT_MEASURED. Menu não recebeu novo bloqueio ou alteração.

## Segurança e publicação

PDFs estáticos antigos continuam públicos por URL conhecida; a alteração controla download/print iniciados pelo catálogo, e não revoga arquivos já públicos. A prévia pode ser capturada. Não afirmar proteção absoluta dos PDFs estáticos.

Função `premium-content` v143 implantada antes da mudança da regra. A versão anterior v142 era idêntica ao código main antes desta alteração. Sequência: função → merge/deploy habitual dos assets e shell público → atualizar fonte privada completa e conferir assets → mudar somente regra raiz para Free → verificar resposta pública sanitizada e denegação do PDF. Estado inicial da regra: Premium/protected_content; `free_global_lockdown=false`. Resultado final: PR #123 integrado, commit `4a4002bf65313c132f4140aba9a7b318fad1554a`; [deploy 36856574642](https://github.com/kauesp0007/calculadoras-de-enfermagem/actions/runs/36856574642) success. Função implantada v143 conferida byte a byte com a fonte. Assets JS/WebP001/WebP066 e PDF Aldrete confirmados200 e SHA256 iguais aos arquivos locais. Catálogo privado atualizado e regra exata Free/catalog_only em uma transação com bloqueio otimista e audit log; source_sha `f7447732287528460e447484e616762b`. Política anterior e depois registradas em developer_admin_audit_log, actor `automation:github-pr-123`. Nenhuma outra regra alterada.

Os 26 HTMLs individuais continuam Premium; não foram liberados por esta mudança. APGAR/ASA/etc. usados com os nomes existentes informados pelo usuário; `waterlow.html` sem a barra de escape do texto original.


## Verificação publicada e limitações finais

- Endpoint público do catálogo: HTTP200, 66 cards, sem registro assistential-form-downloads, sem iframe e sem texto do card removido. Alias en do endpoint igualmente sanitizado.
- Download anônimo: HTTP401. Token inválido: HTTP401. HTMLs de Aldrete, Braden e Zarit: HTTP401 sem login, preservando a proteção individual.
- Inventário atualizado por SELECT: 347 regras (308 Premium, 39 Free), raiz 77 (74 Premium, 3 Free); 373 conteúdos privados, zero vazios, zero Premium sem conteúdo e 26 documentos sem regra própria permanecem Premium por padrão.
- CI da auditoria geral: falha exatamente nas duas exceções históricas de Fugulin/Dimensionamento, cujo teste exige Free apesar de switches Premium. Nenhuma falha nova observada. Não alterar esses switches para fazer o teste antigo passar.
- Navegador real sem mocks: shell200 e barra de acessibilidade observados; perfil Chromium comum redirecionado pelo anti-bot navigator.webdriver preexistente. Perfil Lighthouse permitido mantém URL, mas o proxy do ambiente causa timeout do endpoint perto do limite existente de 12 s; SDK Firebase e SW também afetados. O HTTP direto confirmou200/66 cards e CORS correto. Oferta por clique, todas imagens, menu/rodapé integrados e impressão do sistema no navegador remoto: NOT_MEASURED. Isso não é evidência de sessão real Premium. Os 15 cenários locais simulados passaram.
