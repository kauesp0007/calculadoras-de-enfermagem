(function () {
  "use strict";

  function announce(title, detail) {
    var message = [title, detail].filter(Boolean).join(" — ");
    var region = document.getElementById("statusMessage");
    if (region) {
      region.textContent = "";
      window.setTimeout(function () {
        region.textContent = message;
      }, 20);
    }

    var previous = document.querySelector(".cko-toast");
    if (previous) previous.remove();
    var toast = document.createElement("div");
    toast.className = "cko-toast";
    toast.setAttribute("role", "status");
    toast.textContent = message;
    document.body.appendChild(toast);
    window.setTimeout(function () {
      toast.classList.add("is-visible");
    }, 10);
    window.setTimeout(function () {
      toast.classList.remove("is-visible");
      window.setTimeout(function () {
        toast.remove();
      }, 180);
    }, 3200);
  }

  function contentId() {
    return document.documentElement.getAttribute("data-content-id") || location.pathname;
  }

  function readFavorites() {
    try {
      var parsed = JSON.parse(localStorage.getItem("cko-favorites") || "[]");
      return Array.isArray(parsed) ? parsed.filter(function (item) { return typeof item === "string"; }) : [];
    } catch (_) {
      return [];
    }
  }

  function writeFavorites(items) {
    try {
      localStorage.setItem("cko-favorites", JSON.stringify(items));
      return true;
    } catch (_) {
      announce("Favoritos indisponíveis", "O navegador bloqueou o armazenamento local.");
      return false;
    }
  }

  function updateFavoriteButton(button, active) {
    button.setAttribute("aria-pressed", String(active));
    var icon = button.querySelector("[aria-hidden]");
    if (icon) icon.textContent = active ? "★" : "☆";
  }

  function toggleFavorite(button) {
    var id = contentId();
    var favorites = readFavorites();
    var index = favorites.indexOf(id);
    var active;
    if (index >= 0) {
      favorites.splice(index, 1);
      active = false;
    } else {
      favorites.push(id);
      active = true;
    }
    if (writeFavorites(favorites)) {
      updateFavoriteButton(button, active);
      announce(active ? "Adicionado aos favoritos" : "Removido dos favoritos");
    }
  }

  function sharePage() {
    var payload = { title: document.title, text: document.title, url: location.href };
    if (navigator.share) {
      navigator.share(payload).then(function () {
        announce("Página compartilhada");
      }).catch(function (error) {
        if (error && error.name !== "AbortError") copyAddress();
      });
      return;
    }
    copyAddress();
  }

  function copyAddress() {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(location.href).then(function () {
        announce("Endereço copiado");
      }).catch(showAddress);
    } else {
      showAddress();
    }
  }

  function showAddress() {
    window.prompt("Copie o endereço desta página:", location.href);
  }

  function activateTab(button, focus) {
    var tabList = button.closest('[role="tablist"]');
    if (!tabList) return;
    var tabId = button.getAttribute("data-tab");
    var card = tabList.closest(".cko-card");
    if (!tabId || !card) return;

    tabList.querySelectorAll('[role="tab"]').forEach(function (tab) {
      var selected = tab === button;
      tab.classList.toggle("active", selected);
      tab.setAttribute("aria-selected", String(selected));
      tab.setAttribute("tabindex", selected ? "0" : "-1");
    });
    card.querySelectorAll('[role="tabpanel"]').forEach(function (panel) {
      var selected = panel.id === "tab-" + tabId;
      panel.classList.toggle("active", selected);
      panel.hidden = !selected;
    });
    if (focus) button.focus();
    announce("Seção aberta", button.textContent.trim());
  }

  function handleTabKeyboard(event) {
    var keys = ["ArrowLeft", "ArrowRight", "Home", "End"];
    if (keys.indexOf(event.key) < 0) return;
    var tabs = Array.from(event.currentTarget.querySelectorAll('[role="tab"]'));
    if (!tabs.length) return;
    var current = tabs.indexOf(document.activeElement);
    var next = current;
    if (event.key === "ArrowRight") next = (current + 1) % tabs.length;
    if (event.key === "ArrowLeft") next = (current - 1 + tabs.length) % tabs.length;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = tabs.length - 1;
    event.preventDefault();
    activateTab(tabs[next], true);
  }

  function initializeTabs() {
    document.querySelectorAll('[role="tablist"]').forEach(function (tabList) {
      tabList.addEventListener("keydown", handleTabKeyboard);
      tabList.querySelectorAll('[role="tab"]').forEach(function (button) {
        button.addEventListener("click", function () {
          activateTab(button, false);
        });
      });
    });
  }

  function initializeActions() {
    document.querySelectorAll("[data-action]").forEach(function (button) {
      var action = button.getAttribute("data-action");
      if (action === "favorite") {
        updateFavoriteButton(button, readFavorites().indexOf(contentId()) >= 0);
        button.addEventListener("click", function () { toggleFavorite(button); });
      } else if (action === "share") {
        button.addEventListener("click", sharePage);
      } else if (action === "print") {
        button.addEventListener("click", function () { window.print(); });
      } else if (action === "report") {
        button.addEventListener("click", function () {
          announce("Canal de reporte não configurado", "Registre a correção durante a revisão clínica do objeto JSON.");
        });
      }
    });
  }

  function initialize() {
    initializeTabs();
    initializeActions();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize, { once: true });
  } else {
    initialize();
  }
})();
