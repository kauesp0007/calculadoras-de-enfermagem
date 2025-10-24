// Ajuste automático da distância abaixo do header global
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

const button    = document.getElementById("langButton");
const menu      = document.getElementById("langMenu");
const langFlag = document.getElementById("langFlag");
const langText = document.getElementById("langText");

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

// Troca de idioma
document.querySelectorAll("#langMenu div").forEach(item => {
  item.addEventListener("click", () => {
    const value = item.dataset.value;
    const flag  = item.dataset.flag;
    const text  = item.innerText.trim();

    langFlag.src = flag;
    langText.textContent = text;
    menu.classList.add("hidden");
    button.setAttribute('aria-expanded', 'false');

    switch (value) {
      case 'en': window.location.href = "/en/"; break;
      case 'es': window.location.href = "/es/"; break;
      case 'de': window.location.href = "/de/"; break;
      case 'it': window.location.href = "/it/"; break;
      case 'fr': window.location.href = "/fr/"; break;
      default:    window.location.href = "/";    // pt
    }
  });
});

// Detectar idioma atual pela URL
window.addEventListener("DOMContentLoaded", function() {
  const path = window.location.pathname;
  let current = document.querySelector('[data-value="pt"]');
  if (path.startsWith("/en/"))      current = document.querySelector('[data-value="en"]');
  else if (path.startsWith("/es/")) current = document.querySelector('[data-value="es"]');
  else if (path.startsWith("/de/")) current = document.querySelector('[data-value="de"]');
  else if (path.startsWith("/it/")) current = document.querySelector('[data-value="it"]');
  else if (path.startsWith("/fr/")) current = document.querySelector('[data-value="fr"]');

  if (current) {
    langFlag.src = current.dataset.flag;
    langText.textContent = current.innerText.trim();
  }
});