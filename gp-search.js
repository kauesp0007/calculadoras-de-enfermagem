(function(){
  "use strict";

  var CAT_ICONS = {
    "Calculadora": { cor:"#1E407C", svg:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 7h6m-6 4h6m-6 4h4M5 21h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z" stroke-linecap="round" stroke-linejoin="round"/></svg>' },
    "Guia Rapido": { cor:"#F59E0B", svg:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2zM22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" stroke-linecap="round" stroke-linejoin="round"/></svg>' },
    "Biblioteca": { cor:"#10B981", svg:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 016.5 17H20M4 19.5A2.5 2.5 0 006.5 22H20V2H6.5A2.5 2.5 0 004 4.5v15z" stroke-linecap="round" stroke-linejoin="round"/></svg>' },
    "Ferramenta": { cor:"#0EA5E9", svg:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" stroke-linecap="round" stroke-linejoin="round"/></svg>' },
    "Conteudo": { cor:"#8B5CF6", svg:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M4 12h16M4 18h10" stroke-linecap="round" stroke-linejoin="round"/></svg>' },
    "default": { cor:"#64748B", svg:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 8v4l3 2" stroke-linecap="round" stroke-linejoin="round"/></svg>' }
  };

  function getCatIcon(cat){
    return CAT_ICONS[cat] || CAT_ICONS["default"];
  }

  var searchIndex = null;
  var indexLoaded = false;
  var input, dropdown, clearBtn, overlay;

  function loadIndex(cb){
    if(indexLoaded){ cb(); return; }
    fetch("/search-index.json").then(function(r){ return r.json(); }).then(function(data){
      searchIndex = data || [];
      indexLoaded = true;
      cb();
    }).catch(function(){
      searchIndex = [];
      indexLoaded = true;
      cb();
    });
  }

  function normalize(s){
    return (s||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
  }

  function search(query){
    var q = normalize(query).trim();
    if(q.length < 2) return [];
    var results = [];
    for(var i=0; i<searchIndex.length; i++){
      var item = searchIndex[i];
      var title = normalize(item.titulo);
      var desc = normalize(item.descricao);
      var cat = normalize(item.categoria);
      var kw = (item.palavras_chave||[]).map(normalize).join(" ");
      var score = 0;
      if(title.includes(q)) score += 10;
      if(kw.includes(q)) score += 5;
      if(desc.includes(q)) score += 3;
      if(cat.includes(q)) score += 2;
      if(score > 0){
        results.push({ item: item, score: score });
      }
    }
    results.sort(function(a,b){ return b.score - a.score; });
    return results.slice(0, 8).map(function(r){ return r.item; });
  }

  function renderResults(query){
    var results = search(query);
    if(results.length === 0){
      dropdown.innerHTML = '<div class="gp-empty"><p>Nenhum protocolo encontrado para <b>"' + escapeHtml(query) + '"</b></p><small>Tente buscar por categoria (ex: dor, queda, pressao) ou nome da escala.</small></div>';
      dropdown.style.display = "block";
      return;
    }
    var html = results.map(function(item, idx){
      var ic = getCatIcon(item.categoria);
      return '<div class="gp-result" data-idx="' + idx + '" data-url="' + item.url + '">' +
        '<div class="gp-result-ic" style="background:' + ic.cor + '">' + ic.svg + '</div>' +
        '<div class="gp-result-info">' +
          '<p class="gp-result-title">' + escapeHtml(item.titulo) + '</p>' +
          '<p class="gp-result-desc">' + escapeHtml(item.descricao) + '</p>' +
        '</div>' +
        '<span class="gp-result-cat">' + escapeHtml(item.categoria) + '</span>' +
      '</div>';
    }).join("");
    dropdown.innerHTML = html;
    dropdown.style.display = "block";

    var items = dropdown.querySelectorAll(".gp-result");
    items.forEach(function(el){
      el.addEventListener("click", function(){
        var url = this.getAttribute("data-url");
        var idx = parseInt(this.getAttribute("data-idx"));
        openModal(results[idx]);
      });
    });
  }

  function escapeHtml(s){
    return (s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  }

  function openModal(item){
    if(!item) return;
    if(!overlay){
      overlay = document.createElement("div");
      overlay.className = "gp-modal-overlay";
      overlay.innerHTML =
        '<div class="gp-modal">' +
          '<div class="gp-modal-head">' +
            '<span class="gp-modal-cat">' + escapeHtml(item.categoria) + '</span>' +
            '<h3 class="gp-modal-title">' + escapeHtml(item.titulo) + '</h3>' +
            '<button class="gp-modal-close" type="button" aria-label="Fechar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12" stroke-linecap="round"/></svg></button>' +
          '</div>' +
          '<div class="gp-modal-body">' +
            '<p class="gp-modal-desc">' + escapeHtml(item.descricao) + '</p>' +
            '<div class="gp-modal-actions">' +
              '<a class="gp-btn-primary" href="' + item.url + '"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round"/></svg>Acessar</a>' +
              '<button class="gp-btn-secondary" type="button" id="gp-modal-cancel">Fechar</button>' +
            '</div>' +
          '</div>' +
        '</div>';
      document.body.appendChild(overlay);
      overlay.addEventListener("click", function(e){
        if(e.target === overlay || e.target.closest(".gp-modal-close") || e.target.id === "gp-modal-cancel"){
          closeModal();
        }
      });
    } else {
      overlay.querySelector(".gp-modal-cat").textContent = item.categoria;
      overlay.querySelector(".gp-modal-title").textContent = item.titulo;
      overlay.querySelector(".gp-modal-desc").textContent = item.descricao;
      overlay.querySelector(".gp-btn-primary").href = item.url;
    }
    document.body.style.overflow = "hidden";
    overlay.classList.add("open");
    closeDropdown();
  }

  function closeModal(){
    if(!overlay) return;
    overlay.classList.remove("open");
    document.body.style.overflow = "";
  }

  function closeDropdown(){
    dropdown.style.display = "none";
  }

  window.initGPSearch = function(){
    input = document.getElementById("gp-search-input");
    dropdown = document.getElementById("gp-search-dropdown");
    clearBtn = document.getElementById("gp-search-clear");
    if(!input || !dropdown) return;

    var debounceTimer;
    input.addEventListener("focus", function(){
      loadIndex(function(){
        if(input.value.trim().length >= 2) renderResults(input.value);
      });
    });

    input.addEventListener("input", function(){
      var val = this.value;
      clearBtn.style.display = val.length > 0 ? "grid" : "none";
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(function(){
        if(val.trim().length >= 2){
          loadIndex(function(){ renderResults(val); });
        } else {
          closeDropdown();
        }
      }, 150);
    });

    clearBtn.addEventListener("click", function(){
      input.value = "";
      clearBtn.style.display = "none";
      closeDropdown();
      input.focus();
    });

    document.addEventListener("click", function(e){
      if(!e.target.closest(".gp-search-wrap")) closeDropdown();
    });

    document.addEventListener("keydown", function(e){
      if(e.key === "Escape"){
        if(overlay && overlay.classList.contains("open")){
          closeModal();
        } else if(dropdown.style.display === "block"){
          closeDropdown();
          input.blur();
        }
      }
    });
  };

})();
