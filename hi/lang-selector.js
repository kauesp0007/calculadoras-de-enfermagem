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
    const langFlag = document.getElementById("langFlag");
    const langText = document.getElementById("langText");

    // Encerra a execução se os elementos não existirem (evita o erro 'null')
    if (!button || !menu) {
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
                case 'cn': newPath = "/cn/"; break;
                case 'ar': newPath = "/ar/"; break;
                case 'jp': newPath = "/jp/"; break;
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
    const path = window.location.pathname;
    let current = document.querySelector('[data-value="pt"]'); // Default Português

    if (path.startsWith("/en/"))      current = document.querySelector('[data-value="en"]');
    else if (path.startsWith("/es/")) current = document.querySelector('[data-value="es"]');
    else if (path.startsWith("/de/")) current = document.querySelector('[data-value="de"]');
    else if (path.startsWith("/it/")) current = document.querySelector('[data-value="it"]');
    else if (path.startsWith("/fr/")) current = document.querySelector('[data-value="fr"]');
    else if (path.startsWith("/hi/")) current = document.querySelector('[data-value="hi"]');
    else if (path.startsWith("/cn/")) current = document.querySelector('[data-value="cn"]');
    else if (path.startsWith("/ar/")) current = document.querySelector('[data-value="ar"]');
    else if (path.startsWith("/jp/")) current = document.querySelector('[data-value="jp"]');
    // Se for a raiz (/index.html ou /zarit.html), o default PT está correto

    if (current) {
      langFlag.src = current.dataset.flag;
      langText.textContent = current.innerText.trim();
    }
});