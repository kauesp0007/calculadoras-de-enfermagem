// A função de ajuste de espaço não depende do DOM completo, pode ficar fora.
(function ajustarEspacoIdioma() {
  function recalcular() {
    var header = document.getElementById('global-header-container');
    var wrapper = document.getElementById('language-dropdown-wrapper');
    if (header && wrapper) {
      var h = header.offsetHeight || 0;
      wrapper.style.marginTop = (h ? (h + 12) : 24) + 'px';
    }
  }
  window.addEventListener('load', recalcular);
  window.addEventListener('resize', recalcular);
})();

// A lógica principal DEVE ser executada SOMENTE após o HTML estar carregado.
document.addEventListener("DOMContentLoaded", function() {

    const button    = document.getElementById("langButton");
    const menu      = document.getElementById("langMenu");
    const langFlag  = document.getElementById("langFlag");
    const langText  = document.getElementById("langText");

    if (!button || !menu || !langFlag || !langText) {
        // Se algum elemento não existir, sai sem erros
        return;
    }

    // --- VARIÁVEL GLOBAL DE DETECÇÃO ---
    // Encontra o nome do arquivo atual (ex: zarit.html)
    // Se estiver na raiz, pathName é "/index.html", se estiver em /es/, é "/es/zarit.html"
    const pathName = window.location.pathname;
    // Extrai o nome do arquivo (ex: index.html ou zarit.html)
    const fileNameMatch = pathName.match(/[^/]*\.html$/i); 
    const currentFileName = fileNameMatch ? fileNameMatch[0] : '';
    
    // Abrir/fechar menu
    button.addEventListener("click", () => {
      menu.classList.toggle("hidden");
      button.setAttribute('aria-expanded', !menu.classList.contains('hidden'));
    });

    // Fechar ao clicar fora
    document.addEventListener("click", (e) => {
      if (!button.contains(e.target) && !menu.contains(e.target)) {
        menu.classList.add("hidden");
        button.setAttribute('aria-expanded', 'false');
      }
    });

    // --- LÓGICA DE REDIRECIONAMENTO CORRIGIDA (Troca de idioma) ---
    document.querySelectorAll("#langMenu div").forEach(item => {
        item.addEventListener("click", () => {
            const value = item.dataset.value;
            const flag  = item.dataset.flag;
            const text  = item.innerText.trim();

            langFlag.src = flag;
            langText.textContent = text;
            menu.classList.add("hidden");
            button.setAttribute('aria-expanded', 'false');

            let newPath = '';
            
            // 1. Determina o novo caminho base
            switch (value) {
                case 'en': newPath = "/en/"; break;
                case 'es': newPath = "/es/"; break;
                case 'de': newPath = "/de/"; break;
                case 'it': newPath = "/it/"; break;
                case 'fr': newPath = "/fr/"; break;
                case 'hi': newPath = "/hi/"; break;
                case 'zh': newPath = "/zh/"; break;
                case 'ar': newPath = "/ar/"; break;
                case 'ja': newPath = "/ja/"; break;
                case 'ru': newPath = "/ru/"; break;
                case 'ko': newPath = "/ko/"; break;
                case 'tr': newPath = "/tr/"; break;
                case 'nl': newPath = "/nl/"; break;
                case 'pl': newPath = "/pl/"; break;
                case 'sv': newPath = "/sv/"; break;
                case 'id': newPath = "/id/"; break;
                case 'vi': newPath = "/vi/"; break;
                case 'uk': newPath = "/uk/"; break;
                default:   newPath = "/";    // pt (raiz)
            }
            
            // 2. Anexa o nome do arquivo, a menos que seja a página inicial
            if (currentFileName && currentFileName !== 'index.html' && newPath !== '/') {
                // Para páginas como /es/zarit.html, anexa 'zarit.html'
                newPath += currentFileName;
            } else if (currentFileName && currentFileName !== 'index.html' && newPath === '/') {
                // Se a URL final é a raiz (PT), queremos ir para /zarit.html
                newPath += currentFileName;
            }
            
            // Se for 'index.html', a lógica de newPath = "/en/" já está correta.

            window.location.href = newPath;
        });
    });

    // --- DETECÇÃO DO IDIOMA ATUAL (Para mostrar a bandeira correta ao carregar) ---
    const langFlag = document.getElementById('langFlag');
const langText = document.getElementById('langText');

const path = window.location.pathname;
let current = null;

if (path.startsWith("/en/"))      current = document.querySelector('[data-value="en"]');
else if (path.startsWith("/es/")) current = document.querySelector('[data-value="es"]');
else if (path.startsWith("/de/")) current = document.querySelector('[data-value="de"]');
else if (path.startsWith("/it/")) current = document.querySelector('[data-value="it"]');
else if (path.startsWith("/fr/")) current = document.querySelector('[data-value="fr"]');
else if (path.startsWith("/hi/")) current = document.querySelector('[data-value="hi"]');
else if (path.startsWith("/zh/")) current = document.querySelector('[data-value="zh"]');
else if (path.startsWith("/ar/")) current = document.querySelector('[data-value="ar"]');
else if (path.startsWith("/ja/")) current = document.querySelector('[data-value="ja"]');
else if (path.startsWith("/ru/")) current = document.querySelector('[data-value="ru"]');
else if (path.startsWith("/ko/")) current = document.querySelector('[data-value="ko"]');
else if (path.startsWith("/tr/")) current = document.querySelector('[data-value="tr"]');
else if (path.startsWith("/nl/")) current = document.querySelector('[data-value="nl"]');
else if (path.startsWith("/pl/")) current = document.querySelector('[data-value="pl"]');
else if (path.startsWith("/sv/")) current = document.querySelector('[data-value="sv"]');
else if (path.startsWith("/id/")) current = document.querySelector('[data-value="id"]');
else if (path.startsWith("/vi/")) current = document.querySelector('[data-value="vi"]');
else if (path.startsWith("/uk/")) current = document.querySelector('[data-value="uk"]');

// Se current não for encontrado (raiz / PT), usa PT
if (!current) {
    current = document.querySelector('[data-value="pt"]');
}

// Atualiza bandeira e texto
if (current && langFlag && langText) {
    langFlag.src = current.dataset.flag;
    langText.textContent = current.innerText.trim();
}

});