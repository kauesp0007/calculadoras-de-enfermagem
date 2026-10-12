/* Page Comments v2 — carregado sob demanda por /global-scripts.js */
(function (window, document) {
  "use strict";

  var ENDPOINT = "https://asjkftjfbkuuhilnqonx.supabase.co/functions/v1/page-comments";
  var TARGET_COUNT = 204;
  var ALLOWED_PAGES = new Set([
  "aldrete.html",
  "apache.html",
  "apgar.html",
  "asa.html",
  "ballard.html",
  "barthel.html",
  "berg.html",
  "bishop.html",
  "braden.html",
  "bps.html",
  "cam.html",
  "capurro.html",
  "cincinnati.html",
  "classificacao_wifi.html",
  "cornell.html",
  "cries.html",
  "curb-65.html",
  "gds.html",
  "downton.html",
  "escalanumerica.html",
  "elpo.html",
  "flacc.html",
  "fast.html",
  "four.html",
  "glasgow.html",
  "fugulin.html",
  "gosnell.html",
  "hamilton.html",
  "hendrich.html",
  "humpty.html",
  "johns.html",
  "jouvet.html",
  "katz.html",
  "lachs.html",
  "lanss.html",
  "lawton.html",
  "meem.html",
  "meows.html",
  "moca.html",
  "morse.html",
  "news.html",
  "nips.html",
  "nihss.html",
  "norton.html",
  "ofras.html",
  "painad.html",
  "pelod.html",
  "perroca.html",
  "pews.html",
  "prism.html",
  "qsofa.html",
  "ramsay.html",
  "rancholosamigos.html",
  "richmond.html",
  "saps.html",
  "silverman.html",
  "sistema_sinbad.html",
  "sofa.html",
  "tinetti.html",
  "zarit.html",
  "waterlow.html",
  "downes.html",
  "manchester.html",
  "calculo-de-ferias.html",
  "adicional-noturno.html",
  "calculo-hora-extra.html",
  "calculo-rescisao.html",
  "insulina.html",
  "balancohidrico.html",
  "dimensionamento.html",
  "exames_laboratoriais.html",
  "gasometria.html",
  "gotejamento.html",
  "gestacional.html",
  "imc.html",
  "medicamentos.html",
  "calculadoravacina.html",
  "notificacao-compulsoria.html",
  "sbar.html",
  "dimensionamento-cofen.html",
  "formularios-em-branco-de-escalas.html",
  "formulario_escala_de_perroca.html",
  "formulario_de_fugulin.html",
  "formulario_meem.html",
  "formulario_impresso_sbar.html",
  "formulario_impresso_saep.html",
  "formulario_bishop.html",
  "formulario_bps.html",
  "formulario_cam.html",
  "formulario_capurro.html",
  "formulario_escala_cincinnati.html",
  "formulario_escala_curb65.html",
  "formulario_morse.html",
  "formulario_escala_de_four.html",
  "formulario_escala_de_flacc.html",
  "formulario_escala_de_fast.html",
  "formulario_escala_de_elpo.html",
  "formulario_escala_de_downton.html",
  "formulario_escala_de_glasgow.html",
  "formulario_escala_de_gosnell.html",
  "formulario_escala_de_hamilton.html",
  "formulario_escala_de_hendrich.html",
  "formulario_escala_de_humpty.html",
  "formulario_escala_de_johns.html",
  "formulario_escala_de_jouvet.html",
  "formulario_escala_de_lachs.html",
  "formulario_escala_de_lanss.html",
  "formulario_escala_de_lawton.html",
  "formulario_escala_de_meows.html",
  "formulario_escala_de_news.html",
  "formulario_escala_de_nips.html",
  "formulario_escala_de_nihss.html",
  "formulario_escala_de_norton.html",
  "formulario_escala_de_ofras.html",
  "formulario_escala_de_painad.html",
  "checagem.html",
  "regrasmedicacoes.html",
  "vigilancia.html",
  "metasinternacionais.html",
  "sinan.html",
  "lista-de-doencas-de-notificacao-compulsoria.html",
  "genogramaeecomapa.html",
  "principios_sus.html",
  "rede_de_frios_pni.html",
  "guia_rapido_pnab.html",
  "participacao_popular_sus.html",
  "guia_fundamental_humanizasus.html",
  "legislacoes.html",
  "codigo_de_etica_enfermagem.html",
  "guia_fundamental_codigo_de_etica_enfermagem.html",
  "guia_fundamental_processo_de_enfermagem.html",
  "guia_rapido_lei5905-73_criacao_cofen_coren.html",
  "lei-organica-saude-8080-1990.html",
  "nanda.html",
  "diagnosticosnanda.html",
  "classificacao_intervencoes-enfermagem.html",
  "teorias-de-enfermagem.html",
  "terminologias-de-enfermagem.html",
  "elisabeth-marques-plataforma-completa.html",
  "nr1.html",
  "adequar-nr1.html",
  "copsoq.html",
  "copsoq-curta.html",
  "entenda_copsoq.html",
  "copsoq3.html",
  "5-hs-da-paradacardiorespiratoria.html",
  "5-ts-da-paradacardiorespiratoria.html",
  "time-de-resposta-rapida.html",
  "suporte-avancado-de-vida.html",
  "guia_rapido_desfibrilador.html",
  "integracoes_calculadora_de_gasometria.html",
  "instrumentais-cirurgicos.html",
  "equipamentoscc.html",
  "checklist-cirurgico-seguro.html",
  "formulario-saep-enfermagem.html",
  "rastreabilidade-cme.html",
  "centro-cirurgico.html",
  "integracoes_escala_de_fugulin.html",
  "integracoes_escala_de_perroca.html",
  "integracoes_classificacao_wifi.html",
  "biblioteca-carinho-de-emergencia.html",
  "escala_de_trabalho_enfermagem_12x36.html",
  "guia_rapido_dimensionamento_de_enfermagem.html",
  "guia_rapido_bundles.html",
  "exemplo_de_processo_de_enfermagem.html",
  "instrumento_de_coleta_de_dados.html",
  "formulario_avaliacao_da_cabeca_aos_pes.html",
  "guia_rapido_kanbam_na_enfermagem.html",
  "normas-regulamentadoras.html",
  "geradordir.html",
  "matriz-de-risco.html",
  "risktools.html",
  "guia_rapido_dispositivos.html",
  "tipos_de_seringas.html",
  "guia_rapido_seringa_insulina.html",
  "biblioteca-seringa.html",
  "biblioteca-cirurgica.html",
  "biblioteca-curativo.html",
  "integracoes_metodo_de_capurro.html",
  "hospital_amigo_da_crianca.html",
  "aleitamento_materno_exclusivo.html",
  "simulado-de-enfermagem.html",
  "simulado-de-enfermagem2.html",
  "simulado-de-enfermagem3.html",
  "simulado-de-enfermagem-nucleo-de-seguranca-do-paciente.html",
  "simulado-de-enfermagem-doencas-de-notificacao-compulsoria.html",
  "simulado_vacinacao.html",
  "simulado_pcr.html",
  "flashcards_quiz.html",
  "simulado_ibam_bebedouro_enfermeiro_2024.html",
  "simulado_ibam_guarulhos_enfermeiro_2024.html",
  "simulado_ibam_guarulhos_enfermeiro_esf_2024.html",
  "simulado_ibam_japaratuba_sergipe_enfermeiro_2014.html",
  "simulado_lei_organica_do_sus_8080-90.html",
  "simulado_participacao_da_comunidade.html",
  "simulado_humaniza_sus.html",
  "simulado_codigo_de_etica_enfermagem.html",
  "simulado_hospital_amigo_da_crianca.html",
  "simulado_aleitamento_materno.html",
  "biblioteca-provas.html",
  "blog-templates/index.template.html",
  "blog-templates/post.template.html",
  "item.template.html",
  "downloads.template.html"
]);
  var rawPath = "";
  try { rawPath = decodeURIComponent(window.location.pathname || ""); } catch (_) { rawPath = window.location.pathname || ""; }
  rawPath = rawPath.replace(/^\/+|\/+$/g, "");
  if (!ALLOWED_PAGES.has(rawPath)) return;

  var PAGE_PATH = "/" + rawPath;
  var LANG = String(document.documentElement.lang || "pt-BR").toLowerCase().replace("_", "-");
  var state = { mounted: false, loaded: false, rating: 0, anonymous: false, comments: [] };
  var card = null;
  var pendingPlacementTimer = 0;
  var ratingLabels = ["", "Péssimo", "Ruim", "Bom", "Ótimo"];

  function addStyles() {
    if (document.getElementById("ce-page-comments-style")) return;
    var style = document.createElement("style");
    style.id = "ce-page-comments-style";
    style.textContent =
      ".cepc-card{width:100%;box-sizing:border-box;margin:18px 0 20px;background:#eaf4ff;border:2px solid #334155;border-radius:14px;box-shadow:0 5px 0 rgba(30,41,59,.72),0 12px 24px rgba(15,23,42,.14);overflow:hidden;font-family:Inter,Arial,sans-serif;color:#1e293b}" +
      ".cepc-head{display:flex;align-items:center;justify-content:space-between;gap:10px;min-height:38px;padding:7px 12px;background:linear-gradient(135deg,#1A3E74 0%,#1E4D8C 60%,#163269 100%);color:#fff}" +
      ".cepc-title{margin:0;font-size:15px;line-height:1.2;font-weight:900;color:#fff}" +
      ".cepc-stars{display:flex;gap:3px;align-items:center;white-space:nowrap}" +
      ".cepc-star{appearance:none;border:0;background:transparent;color:#cbd5e1;font-size:23px;line-height:1;min-width:29px;min-height:29px;padding:1px;cursor:pointer;text-shadow:0 1px 1px rgba(0,0,0,.45)}" +
      ".cepc-star.is-on{color:#facc15}.cepc-star:focus-visible{outline:3px solid #facc15;outline-offset:2px;border-radius:5px}" +
      ".cepc-body{padding:9px 11px 10px}" +
      ".cepc-meta{display:grid;grid-template-columns:minmax(110px,.9fr) minmax(170px,1.25fr) minmax(125px,.75fr) auto auto;gap:7px;align-items:end}" +
      ".cepc-field{display:grid;gap:2px;min-width:0}.cepc-label{font-size:9px;line-height:1.1;font-weight:900;color:#334155;text-transform:uppercase;letter-spacing:.03em}" +
      ".cepc-input,.cepc-textarea,.cepc-btn{box-sizing:border-box;border:2px solid #475569;border-radius:7px;background:#fff;box-shadow:0 2px 0 rgba(30,41,59,.78)}" +
      ".cepc-input{width:100%;height:32px;padding:5px 7px;font-size:11px;font-weight:700;color:#1A3E74;outline:none}" +
      ".cepc-input[readonly]{color:#475569;background:#f8fafc}.cepc-input:disabled{opacity:.55;background:#e2e8f0}" +
      ".cepc-input:focus,.cepc-textarea:focus{border-color:#1A3E74;box-shadow:0 0 0 3px rgba(26,62,116,.18),0 2px 0 rgba(30,41,59,.78)}" +
      ".cepc-btn{height:32px;padding:5px 10px;font-size:11px;line-height:1;font-weight:900;color:#111827;cursor:pointer;white-space:nowrap}" +
      ".cepc-btn:hover{background:#f1f5f9}.cepc-btn:focus-visible{outline:3px solid #2563eb;outline-offset:2px}.cepc-btn[aria-pressed=true]{background:#fef3c7;border-color:#92400e}.cepc-btn:disabled{opacity:.55;cursor:wait}" +
      ".cepc-comment-field{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:7px;align-items:end;margin-top:7px}" +
      ".cepc-textarea{width:100%;height:48px;min-height:48px;max-height:82px;resize:vertical;padding:7px 9px;font-size:11px;font-weight:700;line-height:1.35;color:#1A3E74;outline:none}" +
      ".cepc-count{align-self:end;padding:0 2px 4px;font-size:9px;font-weight:800;color:#64748b;white-space:nowrap}" +
      ".cepc-status{min-height:15px;margin:5px 1px 0;font-size:10px;font-weight:800;color:#475569}.cepc-status.is-error{color:#b91c1c}.cepc-status.is-ok{color:#166534}" +
      ".cepc-list{display:grid;gap:6px;margin-top:7px}.cepc-item{border:1px solid #94a3b8;border-radius:8px;background:#fff;padding:7px 9px;box-shadow:0 2px 5px rgba(15,23,42,.08)}" +
      ".cepc-item-head{display:flex;flex-wrap:wrap;align-items:center;gap:6px;font-size:9px;font-weight:800;color:#64748b}.cepc-item-name{color:#1A3E74;font-size:10px;font-weight:900}.cepc-item-stars{color:#94a3b8;letter-spacing:1px}.cepc-item-stars .on{color:#eab308}" +
      ".cepc-item-text{margin:3px 0 0;font-size:11px;line-height:1.35;font-weight:600;color:#334155;overflow-wrap:anywhere}.cepc-empty{margin:2px 0 0;padding:6px 8px;border:1px dashed #94a3b8;border-radius:7px;background:rgba(255,255,255,.65);font-size:10px;font-weight:700;color:#64748b}" +
      "@media(max-width:850px){.cepc-meta{grid-template-columns:1fr 1fr}.cepc-meta .cepc-field:nth-child(3){grid-column:1/2}.cepc-btn{width:100%}.cepc-comment-field{grid-template-columns:1fr}.cepc-count{padding:0;text-align:right}}" +
      "@media(max-width:520px){.cepc-head{align-items:flex-start;flex-direction:column}.cepc-meta{grid-template-columns:repeat(2,minmax(0,1fr))}.cepc-meta .cepc-field:nth-child(3){grid-column:1/-1}.cepc-stars{align-self:flex-start}.cepc-star{font-size:22px}.cepc-card{margin-top:14px}}";
    (document.head || document.documentElement).appendChild(style);
  }

  function formatDate(value) {
    var d = value ? new Date(value) : new Date();
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
  }

  function make(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function updateStars(preview) {
    if (!card) return;
    var value = typeof preview === "number" ? preview : state.rating;
    card.querySelectorAll(".cepc-star").forEach(function (star) {
      var n = Number(star.dataset.rating || 0);
      star.classList.toggle("is-on", n <= value && value > 0);
      star.setAttribute("aria-pressed", state.rating === n ? "true" : "false");
    });
  }

  function setAnonymous(next) {
    state.anonymous = !!next;
    if (!card) return;
    var name = card.querySelector("[data-cepc-name]");
    var email = card.querySelector("[data-cepc-email]");
    var button = card.querySelector("[data-cepc-anonymous]");
    if (state.anonymous) {
      if (name) name.value = "";
      if (email) email.value = "";
    }
    if (name) name.disabled = state.anonymous;
    if (email) email.disabled = state.anonymous;
    if (button) {
      button.setAttribute("aria-pressed", state.anonymous ? "true" : "false");
      button.textContent = state.anonymous ? "Anônimo ativo" : "Comentar anônimo";
    }
  }

  function renderComments() {
    if (!card) return;
    var list = card.querySelector("[data-cepc-list]");
    if (!list) return;
    list.textContent = "";
    if (!state.comments.length) {
      list.appendChild(make("p", "cepc-empty", "Ainda não há comentários nesta página."));
      return;
    }
    state.comments.forEach(function (row) {
      var item = make("article", "cepc-item");
      var head = make("div", "cepc-item-head");
      head.appendChild(make("span", "cepc-item-name", row.is_anonymous ? "Anônimo" : (row.name || "Visitante")));
      head.appendChild(make("time", "", formatDate(row.created_at)));
      if (row.rating) {
        var stars = make("span", "cepc-item-stars");
        stars.setAttribute("aria-label", ratingLabels[row.rating] || "Avaliação");
        for (var i = 1; i <= 4; i++) {
          var s = make("span", i <= row.rating ? "on" : "", "★");
          s.setAttribute("aria-hidden", "true");
          stars.appendChild(s);
        }
        head.appendChild(stars);
        head.appendChild(make("span", "", ratingLabels[row.rating] || ""));
      }
      item.appendChild(head);
      item.appendChild(make("p", "cepc-item-text", row.comment || ""));
      list.appendChild(item);
    });
  }

  function setStatus(message, kind) {
    if (!card) return;
    var el = card.querySelector("[data-cepc-status]");
    if (!el) return;
    el.textContent = message || "";
    el.className = "cepc-status" + (kind ? " is-" + kind : "");
  }

  async function loadComments() {
    if (state.loaded) return;
    state.loaded = true;
    try {
      var url = ENDPOINT + "?page_path=" + encodeURIComponent(PAGE_PATH) + "&lang=" + encodeURIComponent(LANG);
      var res = await fetch(url, { method: "GET", cache: "no-store", headers: { Accept: "application/json" } });
      var data = await res.json().catch(function () { return {}; });
      if (!res.ok) throw new Error(data.error || ("http_" + res.status));
      state.comments = Array.isArray(data.comments) ? data.comments : [];
      renderComments();
    } catch (error) {
      state.loaded = false;
      console.warn("[PageComments] Falha ao carregar comentários:", error);
      setStatus("Não foi possível carregar os comentários agora.", "error");
    }
  }

  async function publish() {
    if (!card) return;
    var name = card.querySelector("[data-cepc-name]");
    var email = card.querySelector("[data-cepc-email]");
    var text = card.querySelector("[data-cepc-comment]");
    var button = card.querySelector("[data-cepc-publish]");
    var comment = String(text && text.value || "").trim();
    var emailValue = state.anonymous ? "" : String(email && email.value || "").trim();

    if (!comment) { setStatus("Digite um comentário antes de publicar.", "error"); if (text) text.focus(); return; }
    if (comment.length > 200) { setStatus("O comentário deve ter no máximo 200 caracteres.", "error"); return; }
    if (emailValue && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(emailValue)) { setStatus("Digite um e-mail válido ou deixe o campo vazio.", "error"); if (email) email.focus(); return; }

    if (button) button.disabled = true;
    setStatus("Publicando...");
    try {
      var res = await fetch(ENDPOINT, {
        method: "POST",
        cache: "no-store",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          page_path: PAGE_PATH,
          lang: LANG,
          name: state.anonymous ? null : String(name && name.value || "").trim(),
          email: emailValue || null,
          comment: comment,
          is_anonymous: state.anonymous,
          rating: state.rating || null
        })
      });
      var data = await res.json().catch(function () { return {}; });
      if (!res.ok || !data.comment) throw new Error(data.error || ("http_" + res.status));
      state.comments = [data.comment].concat(state.comments.filter(function (row) { return row.id !== data.comment.id; }));
      if (text) text.value = "";
      state.rating = 0;
      updateStars();
      updateCount();
      var date = card.querySelector("[data-cepc-date]");
      if (date) date.value = formatDate(data.comment.created_at);
      renderComments();
      setStatus("Comentário publicado.", "ok");
    } catch (error) {
      console.warn("[PageComments] Falha ao publicar:", error);
      setStatus("Não foi possível publicar agora. Tente novamente.", "error");
    } finally {
      if (button) button.disabled = false;
    }
  }

  function updateCount() {
    if (!card) return;
    var text = card.querySelector("[data-cepc-comment]");
    var count = card.querySelector("[data-cepc-count]");
    if (count) count.textContent = String((text && text.value || "").length) + "/200";
  }

  function buildCard() {
    addStyles();
    var section = make("section", "cepc-card");
    section.id = "page-comments-card";
    section.dataset.pageComments = "v2";
    section.setAttribute("aria-labelledby", "page-comments-title");

    var head = make("div", "cepc-head");
    var title = make("h2", "cepc-title", "Deixe seu comentário");
    title.id = "page-comments-title";
    head.appendChild(title);
    var stars = make("div", "cepc-stars");
    stars.setAttribute("role", "group");
    stars.setAttribute("aria-label", "Avalie esta página de uma a quatro estrelas");
    for (var i = 1; i <= 4; i++) {
      (function (rating) {
        var star = make("button", "cepc-star", "★");
        star.type = "button";
        star.dataset.rating = String(rating);
        star.title = ratingLabels[rating];
        star.setAttribute("aria-label", rating + " de 4 — " + ratingLabels[rating]);
        star.setAttribute("aria-pressed", "false");
        star.addEventListener("mouseenter", function () { updateStars(rating); });
        star.addEventListener("mouseleave", function () { updateStars(); });
        star.addEventListener("focus", function () { updateStars(rating); });
        star.addEventListener("blur", function () { updateStars(); });
        star.addEventListener("click", function () {
          state.rating = state.rating === rating ? 0 : rating;
          updateStars();
        });
        stars.appendChild(star);
      })(i);
    }
    head.appendChild(stars);
    section.appendChild(head);

    var body = make("div", "cepc-body");
    var meta = make("div", "cepc-meta");

    function field(labelText, input) {
      var wrap = make("label", "cepc-field");
      wrap.appendChild(make("span", "cepc-label", labelText));
      wrap.appendChild(input);
      return wrap;
    }
    var name = make("input", "cepc-input");
    name.type = "text"; name.maxLength = 80; name.autocomplete = "name"; name.placeholder = "Nome (opcional)"; name.dataset.cepcName = "";
    var email = make("input", "cepc-input");
    email.type = "email"; email.maxLength = 254; email.autocomplete = "email"; email.placeholder = "E-mail (opcional)"; email.dataset.cepcEmail = "";
    var date = make("input", "cepc-input");
    date.type = "text"; date.readOnly = true; date.value = formatDate(); date.dataset.cepcDate = "";

    meta.appendChild(field("Nome", name));
    meta.appendChild(field("E-mail opcional", email));
    meta.appendChild(field("Data/hora", date));

    var anon = make("button", "cepc-btn", "Comentar anônimo");
    anon.type = "button"; anon.dataset.cepcAnonymous = ""; anon.setAttribute("aria-pressed", "false");
    anon.addEventListener("click", function () { setAnonymous(!state.anonymous); });
    meta.appendChild(anon);

    var publishButton = make("button", "cepc-btn", "Publicar");
    publishButton.type = "button"; publishButton.dataset.cepcPublish = "";
    publishButton.addEventListener("click", publish);
    meta.appendChild(publishButton);
    body.appendChild(meta);

    var commentField = make("div", "cepc-comment-field");
    var commentWrap = make("label", "cepc-field");
    commentWrap.appendChild(make("span", "cepc-label", "Comentário"));
    var textarea = make("textarea", "cepc-textarea");
    textarea.maxLength = 200; textarea.rows = 2; textarea.placeholder = "Escreva aqui (até 200 caracteres)"; textarea.dataset.cepcComment = "";
    textarea.addEventListener("input", updateCount);
    commentWrap.appendChild(textarea);
    commentField.appendChild(commentWrap);
    var counter = make("span", "cepc-count", "0/200"); counter.dataset.cepcCount = "";
    commentField.appendChild(counter);
    body.appendChild(commentField);

    var status = make("p", "cepc-status"); status.dataset.cepcStatus = ""; status.setAttribute("role", "status"); status.setAttribute("aria-live", "polite");
    body.appendChild(status);
    var list = make("div", "cepc-list"); list.dataset.cepcList = ""; list.setAttribute("aria-live", "polite");
    body.appendChild(list);
    section.appendChild(body);
    return section;
  }

  function mainDirectChild(node, main) {
    if (!node || !main || !main.contains(node)) return null;
    var current = node;
    while (current && current.parentElement && current.parentElement !== main) current = current.parentElement;
    return current && current.parentElement === main ? current : null;
  }

  function insertBeforeAds() {
    var main = document.querySelector("main");
    var ad = document.getElementById("multiplex-ad-reserved") || document.querySelector("[data-multiplex-ad],ins.adsbygoogle[data-ad-format='autorelaxed']");
    var footer = document.getElementById("footer-placeholder") || document.querySelector("footer");
    if (main) {
      if (ad && main.contains(ad)) {
        var adBlock = mainDirectChild(ad, main);
        if (adBlock) { main.insertBefore(card, adBlock); return; }
      }
      main.appendChild(card);
      return;
    }
    var target = ad || footer;
    if (target && target.parentNode) target.parentNode.insertBefore(card, target);
    else if (document.body) document.body.appendChild(card);
  }

  function isVisible(el) {
    if (!el || !el.isConnected) return false;
    var style = window.getComputedStyle ? window.getComputedStyle(el) : null;
    if (style && (style.display === "none" || style.visibility === "hidden")) return false;
    return el.getClientRects().length > 0;
  }

  function findResultAnchor() {
    var selectors = [
      "#resultado","#resultadoCard","#resultado-card","#resultado-container","#resultadoContainer",
      "#result","#results","#result-card","#results-container","[data-result]","[data-resultado]",
      ".resultado-card",".resultado-container",".result-card",".results-card"
    ];
    var candidates = [];
    selectors.forEach(function (selector) {
      try { document.querySelectorAll(selector).forEach(function (el) { if (isVisible(el) && !candidates.includes(el)) candidates.push(el); }); } catch (_) {}
    });
    if (!candidates.length) {
      document.querySelectorAll("[id]").forEach(function (el) {
        var id = String(el.id || "").toLowerCase();
        if ((id.indexOf("resultado") !== -1 || /^result/.test(id)) && isVisible(el)) candidates.push(el);
      });
    }
    if (!candidates.length) return null;
    candidates.sort(function (a, b) {
      return (a.getBoundingClientRect().bottom + window.scrollY) - (b.getBoundingClientRect().bottom + window.scrollY);
    });
    return candidates[candidates.length - 1];
  }

  function placeAfterResult() {
    var main = document.querySelector("main");
    var result = findResultAnchor();
    if (main && result && main.contains(result)) {
      var block = mainDirectChild(result, main);
      if (block && block.nextSibling) main.insertBefore(card, block.nextSibling);
      else if (block) main.appendChild(card);
      else result.insertAdjacentElement("afterend", card);
      return true;
    }
    if (result) { result.insertAdjacentElement("afterend", card); return true; }
    return false;
  }

  function mount(preferResult) {
    if (!card) card = buildCard();
    if (preferResult && placeAfterResult()) {
      state.mounted = true;
    } else {
      insertBeforeAds();
      state.mounted = true;
    }
    if (!state.loaded) loadComments();
  }

  function scheduleResultMount() {
    window.clearTimeout(pendingPlacementTimer);
    var attempts = 0;
    function tryPlace() {
      attempts += 1;
      if (!card) card = buildCard();
      if (placeAfterResult()) {
        state.mounted = true;
        if (!state.loaded) loadComments();
        return;
      }
      if (attempts < 7) pendingPlacementTimer = window.setTimeout(tryPlace, 180);
      else mount(false);
    }
    pendingPlacementTimer = window.setTimeout(tryPlace, 80);
  }

  function findCalculateButtons() {
    return Array.prototype.filter.call(document.querySelectorAll("button,input[type='button'],input[type='submit'],a[role='button']"), function (el) {
      var haystack = [el.id, el.name, el.value, el.getAttribute("aria-label"), el.textContent].join(" ").toLowerCase();
      return /\bcalcular\b/.test(haystack) || /btncalcular/.test(haystack);
    });
  }

  function init() {
    // Conteúdo Premium é reidratado com document.write(). Se o card antigo
    // saiu do DOM, recomeçar sobre o documento final sem duplicar listeners.
    if (card && !card.isConnected) {
      card = null;
      state.mounted = false;
      state.loaded = false;
    }
    if (state.mounted) return;
    var calculateButtons = findCalculateButtons();
    if (calculateButtons.length) {
      calculateButtons.forEach(function (button) {
        if (button.dataset.pageCommentsBoundV2 === "true") return;
        button.dataset.pageCommentsBoundV2 = "true";
        button.addEventListener("click", scheduleResultMount, false);
      });
      // O comentário fica disponível antes do cálculo; após o resultado, é reposicionado.
      mount(true);
      return;
    }
    mount(false);
  }

  window.__INIT_PAGE_COMMENTS_V2 = init;
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();

  window.__PAGE_COMMENTS_V2 = { targetCount: TARGET_COUNT, pagePath: PAGE_PATH };
})(window, document);
