# Reidratação do menu, idiomas e fórum em páginas Premium — 02/10/2026

Diagnóstico confirmado no navegador em es/formulario_escala_de_asa.html: hero com z-index 99999 e container do menu com 2000. O reparo existente cobria apenas EN e usava IDs diferentes na consulta/criação do estilo. O seletor observava a raiz antiga destruída pelo document.write, dependendo do fallback de 12 segundos.

Correção: reparo localizado para raiz e 18 idiomas; z-index do hero com prioridade !important; ID consistente; inicialização global do seletor por raiz atual, fetch de markup reutilizado, observer no Document e montagem explícita após o chrome. Eventos do seletor não se duplicam. Conteúdo Supabase, decisões comerciais e gates de autorização preservados.

Validação antes da publicação: node --check nos scripts; teste de entrega Premium existente; teste comportamental com Node VM em 19 rotas e simulação de substituição do DOM, chamada concorrente e resposta obsoleta. Revisão independente somente leitura aprovou o diff. O teste de reidratação integra scripts/test-premium-auth-delivery-flow.js, já executado no deploy.

Build de Tailwind, Service Worker, auditoria Premium e publicação são executados pelo pipeline canônico do GitHub Pages. A confirmação de publicação depende da conclusão do workflow e da inspeção posterior no site.
