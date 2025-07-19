// topbar111.js

// === NOVAS FUNÇÕES PARA TRADUÇÃO (ADICIONADAS AQUI) ===

// Função para definir o cookie de tradução do Google
function setGTranslateCookie(lang) {
    const expires = new Date();
    expires.setTime(expires.getTime() + (365 * 24 * 60 * 60 * 1000)); // Expira em 1 ano
    // Define o cookie googtrans para indicar o idioma de origem e destino
    document.cookie = `googtrans=/pt/${lang}; expires=${expires.toUTCString()}; path=/`;
    // googtrans_next é usado por algumas versões/comportamentos do widget para garantir a persistência
    document.cookie = `googtrans_next=/pt/${lang}; expires=${expires.toUTCString()}; path=/`;
}

// Função de inicialização do Google Translate Element - DEVE SER GLOBAL
function googleTranslateElementInit() {
    new google.translate.TranslateElement({
        pageLanguage: 'pt', // Idioma original da sua página (Português)
        includedLanguages: 'en,es', // Idiomas para os quais você deseja oferecer tradução
        layout: google.translate.TranslateElement.InlineLayout.SIMPLE, // Layout simples do widget (será ocultado)
        autoDisplay: false // Muito Importante: Não exibir o widget padrão do Google
    }, 'google_translate_element'); // O ID da div onde o widget seria normalmente anexado (está oculta)
}

// Carrega o script do Google Translate Element dinamicamente - DEVE SER EXECUTADO GLOBALMENTE
(function() {
    var ga = document.createElement('script');
    ga.type = 'text/javascript';
    ga.async = true; // Carregamento assíncrono para não bloquear a renderização da página
    ga.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit'; // cb=googleTranslateElementInit garante que a função de inicialização seja chamada
    var s = document.getElementsByTagName('script')[0]; // Encontra o primeiro script existente na página
    s.parentNode.insertBefore(ga, s); // Insere o script do Google Translate antes dele
})();

// === FIM DAS NOVAS FUNÇÕES PARA TRADUÇÃO ===


[cite_start]// Espera o DOM estar pronto [cite: 1]
document.addEventListener('DOMContentLoaded', () => {
  [cite_start]// 1) Carrega o HTML da topbar [cite: 1]
  fetch('topbar111.html')
    .then(res => {
      if (!res.ok) throw new Error(`Falha ao carregar topbar111.html: ${res.status}`);
      return res.text();
    })
    .then(html => {
      const header = document.createElement('header');
      header.innerHTML = html;
      document.body.prepend(header);

      [cite_start]// 2) Inicializa o comportamento dos menus [cite: 1]
      initTopbarMenus();
    })
    .catch(err => {
      console.error(err);
    });
});

[cite_start]// Função que adiciona os listeners aos botões e ao document [cite: 3]
function initTopbarMenus() {
  const menuToggle = document.getElementById('menuToggle');
  const mainNav = document.getElementById('mainNav');

  [cite_start]// Ao clicar em um botão com data-menu-target, alterna seu dropdown [cite: 3]
  document.querySelectorAll('[data-menu-target]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      const menuId = btn.getAttribute('data-menu-target');
      [cite_start]// Fecha todos [cite: 3]
      document.querySelectorAll('.dropdown-menu').forEach(m => m.classList.remove('show'));
      [cite_start]// Abre o selecionado [cite: 3]
      const toOpen = document.getElementById(menuId);
      if (toOpen) toOpen.classList.toggle('show');
    });
  });

  // === NOVA LÓGICA PARA O MENU HAMBÚRGUER (MOBILE) E REDIMENSIONAMENTO ===
  // (Baseado na sua lógica topbar.html, mas integrada ao initTopbarMenus)

    // Lógica para o menu hambúrguer (mobile)
    if (menuToggle && mainNav) {
        menuToggle.addEventListener('click', function() {
            mainNav.classList.toggle('hidden');
            mainNav.classList.toggle('flex');
            mainNav.classList.toggle('flex-col');

            // Fecha todos os dropdowns quando o menu principal é aberto/fechado
            document.querySelectorAll('.dropdown-menu').forEach(menu => {
                menu.classList.remove('show');
            });
        });

        // Fecha o menu hambúrguer quando um link é clicado (útil para navegação)
        mainNav.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', function() {
                // Verifica se está em modo mobile (largura menor que o breakpoint 'md')
                if (window.innerWidth < 768) {
                    mainNav.classList.add('hidden');
                    mainNav.classList.remove('flex');
                    mainNav.classList.remove('flex-col');
                }
            });
        });

        // Garante que o menu esteja no estado correto ao redimensionar a janela
        window.addEventListener('resize', function() {
            if (window.innerWidth >= 768) { // Se for desktop (md breakpoint ou maior)
                mainNav.classList.remove('hidden'); // Garante que o menu esteja visível
                mainNav.classList.add('flex');
                mainNav.classList.add('flex-row'); // Garante que os itens estejam em linha
                mainNav.classList.remove('flex-col'); // Remove empilhamento vertical
                // Fecha quaisquer dropdowns abertos ao transicionar para desktop
                document.querySelectorAll('.dropdown-menu').forEach(menu => {
                    menu.classList.remove('show');
                });
            } else { // Se for mobile
                // Nada a fazer aqui, pois o estado inicial 'hidden' é desejado no mobile por padrão.
            }
        });
    }


  [cite_start]// Fecha dropdowns ao clicar fora da nav [cite: 4]
  document.addEventListener('click', e => {
    // Verifica se o clique não foi dentro de um dropdown e nem em um botão de dropdown
    [cite_start]if (!e.target.closest('nav') && !e.target.matches('[data-menu-target]')) { // [cite: 4]
      document.querySelectorAll('.dropdown-menu').forEach(m => m.classList.remove('show')); [cite_start]// [cite: 4]
    }
  });

    // === NOVO: Adiciona event listeners para os links de tradução personalizados ===
    const translateLinks = document.querySelectorAll('#menuTranslate a');
    translateLinks.forEach(link => {
        link.addEventListener('click', function(event) {
            event.preventDefault(); // Previne o comportamento padrão do link (navegação)
            const lang = this.dataset.lang; // Obtém o código do idioma do atributo data-lang

            if (lang) {
                setGTranslateCookie(lang); // Define o cookie com o idioma escolhido
                window.location.reload(); // Recarrega a página para aplicar a tradução do Google
            }

            // Opcional: Fechar o dropdown de tradução após a seleção (se necessário)
            // Note: o `document.addEventListener('click')` já pode estar fechando.
            const menuTranslate = document.getElementById('menuTranslate');
            if (menuTranslate) {
                menuTranslate.classList.remove('show');
            }
        });
    });
    // === FIM DA NOVA LÓGICA DE TRADUÇÃO ===

[cite_start]} // [cite: 5]
