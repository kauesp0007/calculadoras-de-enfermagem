# Navegação do card de formulários EN/ES

Causa reproduzida: o guard global de impressão classificava o link do card como ação de impressão pelas palavras print/imprimir na descrição. A assinatura recebia returnUrl do index, demonstrando interceptação antes de abrir o catálogo. O catálogo raiz/EN/ES permanece Free para consulta, conforme regra viva do Supabase; PDFs e impressão continuam Premium.

Correção: links internos HTML sem atributo download são reconhecidos como navegação após os controles explícitos de impressão. A wrapper de window.print e os controles reais permanecem protegidos. Scripts do guard e dos índices EN/ES recebem versões de cache. Nenhuma política, entitlement, preço ou checkout foi alterado.

Validação: test-premium-print-navigation cobre primeiro e segundo cliques EN/ES/PT, ações explícitas, bloqueio explícito, links PDF/download, extensão falsa, Free bloqueado e Premium executado uma vez. Integrado no teste existente de auth/delivery; build e audit executados pelo pipeline canônico.

Checagem no navegador após primeiro deploy identificou que o SW substitui query v pela versão do próprio cache. A revisão explícita dos dois scripts usa rev, que a estratégia de fetch vigente preserva, evitando resposta anterior mesmo antes da ativação do novo SW. O SW não foi alterado.
