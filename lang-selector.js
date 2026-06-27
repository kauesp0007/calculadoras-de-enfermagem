/**
 * lang-selector.js
 * Responsável por gerenciar o seletor de idiomas dinâmico.
 */

// A lógica principal SÓ é executada após o evento de injeção ser disparado pelo global-scripts.js
function langSelectorInit() {
  // Proteção: evita anexar handlers múltiplas vezes (causa toggle duplo)
  if (window._langSelectorInitialized) return;
  window._langSelectorInitialized = true;

  const button = document.getElementById("langButton");
  const menu = document.getElementById("langMenu");
  const langFlag = document.getElementById("langFlag");
  const langText = document.getElementById("langText");

  // Encerra a execução se os elementos não existirem
  if (!button || !menu) return;

  // --- VARIÁVEL GLOBAL DE DETECÇÃO ---
  const pathName = window.location.pathname;
  const fileNameMatch = pathName.match(/[^/]*.html$/i);
  const currentFileName = fileNameMatch ? fileNameMatch[0] : "";

  // Abrir/fechar menu
  button.addEventListener("click", () => {
    menu.classList.toggle("hidden");
    button.setAttribute("aria-expanded", !menu.classList.contains("hidden"));
  });

  // Fechar ao clicar fora
  document.addEventListener("click", (e) => {
    if (!button.contains(e.target) && !menu.contains(e.target)) {
      menu.classList.add("hidden");
      button.setAttribute("aria-expanded", "false");
    }
  });

  // --- LÓGICA DE REDIRECIONAMENTO ---
  document.querySelectorAll("#langMenu div").forEach((item) => {
    item.addEventListener("click", () => {
      const value = item.dataset.value;
      const flag = item.dataset.flag;
      const text = item.innerText.trim();

      langFlag.src = flag;
      langText.textContent = text;
      menu.classList.add("hidden");
      button.setAttribute("aria-expanded", "false");

      let newPath = "";

      switch (value) {
        case "en":
          newPath = "/en/";
          break;
        case "es":
          newPath = "/es/";
          break;
        case "de":
          newPath = "/de/";
          break;
        case "it":
          newPath = "/it/";
          break;
        case "fr":
          newPath = "/fr/";
          break;
        case "hi":
          newPath = "/hi/";
          break;
        case "zh":
          newPath = "/zh/";
          break;
        case "ar":
          newPath = "/ar/";
          break;
        case "ja":
          newPath = "/ja/";
          break;
        case "ru":
          newPath = "/ru/";
          break;
        case "ko":
          newPath = "/ko/";
          break;
        case "tr":
          newPath = "/tr/";
          break;
        case "nl":
          newPath = "/nl/";
          break;
        case "pl":
          newPath = "/pl/";
          break;
        case "sv":
          newPath = "/sv/";
          break;
        case "id":
          newPath = "/id/";
          break;
        case "vi":
          newPath = "/vi/";
          break;
        case "uk":
          newPath = "/uk/";
          break;
        default:
          newPath = "/";
      }

      if (
        currentFileName &&
        currentFileName !== "index.html" &&
        newPath !== "/"
      ) {
        newPath += currentFileName;
      } else if (
        currentFileName &&
        currentFileName !== "index.html" &&
        newPath === "/"
      ) {
        newPath += currentFileName;
      }

      window.location.href = newPath;
    });
  });

  // --- DETECÇÃO DO IDIOMA ATUAL ---
  const path = window.location.pathname;
  let current = document.querySelector('[data-value="pt"]');

  if (path.startsWith("/en/"))
    current = document.querySelector('[data-value="en"]');
  else if (path.startsWith("/es/"))
    current = document.querySelector('[data-value="es"]');
  else if (path.startsWith("/de/"))
    current = document.querySelector('[data-value="de"]');
  else if (path.startsWith("/it/"))
    current = document.querySelector('[data-value="it"]');
  else if (path.startsWith("/fr/"))
    current = document.querySelector('[data-value="fr"]');
  else if (path.startsWith("/hi/"))
    current = document.querySelector('[data-value="hi"]');
  else if (path.startsWith("/zh/"))
    current = document.querySelector('[data-value="zh"]');
  else if (path.startsWith("/ar/"))
    current = document.querySelector('[data-value="ar"]');
  else if (path.startsWith("/ja/"))
    current = document.querySelector('[data-value="ja"]');
  else if (path.startsWith("/ru/"))
    current = document.querySelector('[data-value="ru"]');
  else if (path.startsWith("/ko/"))
    current = document.querySelector('[data-value="ko"]');
  else if (path.startsWith("/tr/"))
    current = document.querySelector('[data-value="tr"]');
  else if (path.startsWith("/nl/"))
    current = document.querySelector('[data-value="nl"]');
  else if (path.startsWith("/pl/"))
    current = document.querySelector('[data-value="pl"]');
  else if (path.startsWith("/sv/"))
    current = document.querySelector('[data-value="sv"]');
  else if (path.startsWith("/id/"))
    current = document.querySelector('[data-value="id"]');
  else if (path.startsWith("/vi/"))
    current = document.querySelector('[data-value="vi"]');
  else if (path.startsWith("/uk/"))
    current = document.querySelector('[data-value="uk"]');

  if (current) {
    langFlag.src = current.dataset.flag;
    langText.textContent = current.innerText.trim();
  }
}

// Registra o listener normalmente
document.addEventListener("langSelectorLoaded", langSelectorInit);

// Se o HTML já estiver presente (por cache ou injeção prévia), inicializa imediatamente
if (
  document.getElementById("language-selector-placeholder") &&
  document.getElementById("language-selector-placeholder").children.length > 0
) {
  setTimeout(langSelectorInit, 0);
} else if (window._langSelectorInjected) {
  // flag colocada pelo global-scripts.js
  setTimeout(langSelectorInit, 0);
}