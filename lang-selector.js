// A função de ajuste de espaço não depende do DOM completo, pode ficar fora.
(function ajustarEspacoIdioma() {
  function recalcular() {
    const header = document.getElementById('global-header-container');
    const wrapper = document.getElementById('language-dropdown-wrapper');
    if (header && wrapper) {
      const h = header.offsetHeight || 0;
      wrapper.style.marginTop = (h ? (h + 12) : 24) + 'px';
    }
  }
  window.addEventListener('load', recalcular);
  window.addEventListener('resize', recalcular);
})();

// --- FUNÇÃO PARA GERAR CAMINHO CORRETO DAS BANDEIRAS ---
function getFlagPath(fileName) {
  // Se você mantiver as bandeiras dentro da pasta /img/ na raiz
  return '/img/' + fileName;
}

// Lógica principal
document.addEventListener("DOMContentLoaded", function() {

  const button    = document.getElementById("langButton");
  const menu      = document.getElementById("langMenu");
  const langFlag  = document.getElementById("langFlag");
  const langText  = document.getElementById("langText");

  if (!button || !menu || !langFlag || !langText) return;

  // --- ABRIR/FECHAR MENU ---
  button.addEventListener("click", () => {
    menu.classList.toggle("hidden");
    button.setAttribute('aria-expanded', !menu.classList.contains('hidden'));
  });

  // FECHAR AO CLICAR FORA
  document.addEventListener("click", (e) => {
    if (!button.contains(e.target) && !menu.contains(e.target)) {
      menu.classList.add("hidden");
      button.setAttribute('aria-expanded', 'false');
    }
  });

  // --- TROCA DE IDIOMA ---
  menu.querySelectorAll("div[data-value]").forEach(item => {
    item.addEventListener("click", () => {
      const value = item.dataset.value;
      const flag  = item.dataset.flag;
      const text  = item.innerText.trim();

      // Atualiza a bandeira e o texto no botão
      langFlag.src = getFlagPath(flag);
      langText.textContent = text;
      menu.classList.add("hidden");
      button.setAttribute('aria-expanded', 'false');

      // Define o caminho base para o idioma
      let newPath = (value === 'pt') ? '/' : '/' + value + '/';

      // Mantém o nome do arquivo atual se não for index.html
      const pathParts = window.location.pathname.split('/');
      const fileName = pathParts[pathParts.length - 1];
      if (fileName && fileName !== 'index.html') newPath += fileName;

      window.location.href = newPath;
    });
  });

  // --- DETECÇÃO DO IDIOMA ATUAL (para mostrar bandeira correta) ---
  const path = window.location.pathname;
  let current = null;

  const langs = ["pt","en","es","de","it","fr","hi","zh","ar","ja","ru","ko","tr","nl","pl","sv","id","vi","uk"];
  for (let lang of langs) {
    if (path.startsWith("/" + lang + "/")) {
      current = document.querySelector('[data-value="'+lang+'"]');
      break;
    }
  }

  // Se não encontrou, assume Português
  if (!current) current = document.querySelector('[data-value="pt"]');

  // Atualiza bandeira e texto no botão
  if (current) {
    langFlag.src = getFlagPath(current.dataset.flag);
    langText.textContent = current.innerText.trim();
  }

});
