// top-translation-bar.js

// === FUNÇÕES DE SUPORTE PARA TRADUÇÃO ===

// Função para definir o cookie de tradução do Google
function setGTranslateCookie(lang) {
    const expires = new Date();
    expires.setTime(expires.getTime() + (365 * 24 * 60 * 60 * 1000)); // Expira em 1 ano
    document.cookie = `googtrans=/pt/${lang}; expires=${expires.toUTCString()}; path=/`;
    document.cookie = `googtrans_next=/pt/${lang}; expires=${expires.toUTCString()}; path=/`;
}

// Função de inicialização do Google Translate Element - DEVE SER GLOBAL
// Esta função é chamada automaticamente pelo script do Google Translate
function googleTranslateElementInit() {
    new google.translate.TranslateElement({
        pageLanguage: 'pt', // Idioma original da sua página (Português)
        includedLanguages: 'en,es', // Idiomas para os quais você deseja oferecer tradução
        layout: google.translate.TranslateElement.InlineLayout.SIMPLE,
        autoDisplay: false // Muito Importante: Não exibir o widget padrão do Google
    }, 'google_translate_element'); // O ID da div onde o widget seria normalmente anexado (está oculta)
}

// Carrega o script do Google Translate Element dinamicamente
(function() {
    var ga = document.createElement('script');
    ga.type = 'text/javascript';
    ga.async = true;
    ga.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    var s = document.getElementsByTagName('script')[0];
    s.parentNode.insertBefore(ga, s);
})();

// === LÓGICA DA BARRA DE TRADUÇÃO ===

document.addEventListener('DOMContentLoaded', function() {
    const translateButton = document.getElementById('translateButton');
    const languageDropdown = document.getElementById('languageDropdown');
    const topTranslationBar = document.getElementById('topTranslationBar'); // A nova barra

    if (translateButton && languageDropdown) {
        // Alterna a visibilidade do dropdown ao clicar no botão "Traduzir"
        translateButton.addEventListener('click', function(event) {
            event.stopPropagation(); // Evita que o clique feche o dropdown imediatamente
            languageDropdown.classList.toggle('show');
        });

        // Adiciona event listeners para os links de idioma
        languageDropdown.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', function(event) {
                event.preventDefault(); // Previne o comportamento padrão do link
                const lang = this.dataset.lang; // Obtém o código do idioma do atributo data-lang

                if (lang) {
                    setGTranslateCookie(lang); // Define o cookie com o idioma escolhido
                    window.location.reload(); // Recarrega a página para aplicar a tradução
                }

                // Fecha o dropdown após a seleção
                languageDropdown.classList.remove('show');
            });
        });

        // Fecha o dropdown quando clica fora dele
        document.addEventListener('click', function(event) {
            if (!topTranslationBar.contains(event.target)) {
                languageDropdown.classList.remove('show');
            }
        });
    }

    // Ajusta o padding do body para que o conteúdo não fique escondido sob a barra fixa
    // Isso deve ser feito APENAS se a barra principal (topbar111) também não estiver fazendo isso.
    // Se a topbar111 já tiver um padding-top no body, você precisará ajustar o cálculo.
    // Considerando que a topbar111 está fixa, vamos somar as alturas.
    const topbar111Height = 64; // Altura da sua topbar principal (h-16 = 64px)
    const translationBarHeight = 40; // Altura da nova barra de tradução
    const totalHeaderHeight = topbar111Height + translationBarHeight;

    // Adiciona uma classe ao body que você pode usar para definir o padding-top
    // ou definir o estilo inline diretamente.
    document.body.style.paddingTop = `${totalHeaderHeight}px`;

    // Ajusta a posição da topbar111 (se ela também for fixa) para ficar abaixo da nova barra
    const mainHeader = document.querySelector('header.fixed'); // Seleciona sua topbar111
    if (mainHeader) {
        mainHeader.style.top = `${translationBarHeight}px`; // Move a topbar111 para baixo
    }

});
