/*!
 * Glossary Search (Autocomplete + Scroll)
 * - Builds an index from the existing .term-container/.term-title elements
 * - Shows suggestions while typing
 * - Click/Enter scrolls to the selected term and highlights it briefly
 *
 * Expected markup (already in your page):
 *   <div class="term-container">
 *     <p class="term-title">1- ABASIA</p>
 *     <p class="term-meaning">...</p>
 *   </div>
 */

(function () {
  "use strict";

  function normalizeText(str) {
    return (str || "")
      .toString()
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, ""); // remove accents
  }

  function slugify(str) {
    return normalizeText(str)
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  }

  function extractTermName(termTitleText) {
    // Examples:
    // "1- ABASIA" => "ABASIA"
    // "41- ALTERAÇÃO HEMODINÂMICA" => "ALTERAÇÃO HEMODINÂMICA"
    // If format changes, we still fallback gracefully.
    const t = (termTitleText || "").trim();
    const m = t.match(/^\s*\d+\s*-\s*(.+)\s*$/);
    return (m ? m[1] : t).trim();
  }

  function buildIndex() {
    const nodes = Array.from(document.querySelectorAll(".term-container .term-title"));
    const items = [];

    nodes.forEach((titleEl, i) => {
      const container = titleEl.closest(".term-container");
      if (!container) return;

      const rawTitle = titleEl.textContent || "";
      const termName = extractTermName(rawTitle);
      const key = normalizeText(termName);

      // Ensure each term container has a stable id so we can jump to it.
      // Prefer existing id if present.
      if (!container.id) {
        const base = "term-" + slugify(termName);
        let id = base;
        let n = 2;
        while (document.getElementById(id)) {
          id = base + "-" + n++;
        }
        container.id = id;
      }

      items.push({
        term: termName,
        key,
        id: container.id
      });
    });

    return items;
  }

  function createUIIfMissing() {
    // If you prefer to insert HTML manually, create a wrapper with id="glossary-search-root"
    // and this script will fill it. If it's not present, we create it below the H2 intro.
    let root = document.getElementById("glossary-search-root");
    if (root) return root;

    const h2 = document.querySelector("#main-content h2");
    if (!h2) return null;

    root = document.createElement("div");
    root.id = "glossary-search-root";
    // Left aligned, small/medium width, modern card.
    root.className = "glossary-search-wrap mt-6 flex justify-start";

    // Insert after the H2 block (inside the title area)
    // The H2 is inside a .text-center mb-8 wrapper in your file.
    const titleWrap = h2.closest(".text-center");
    if (titleWrap && titleWrap.parentNode) {
      titleWrap.parentNode.insertBefore(root, titleWrap.nextSibling);
    } else {
      h2.parentNode.insertBefore(root, h2.nextSibling);
    }

    return root;
  }

  function renderUI(root) {
    root.innerHTML = `
      <div class="glossary-search-card">
        <label for="termSearchInput" class="glossary-search-label">
          Pesquisar uma terminologia
        </label>

        <div class="glossary-search-field">
          <i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
          <input
            id="termSearchInput"
            type="search"
            inputmode="search"
            autocomplete="off"
            spellcheck="false"
            placeholder="Ex: anemia, curativo, trombose..."
            aria-label="Pesquisar terminologias de enfermagem"
            aria-autocomplete="list"
            aria-controls="termSearchResults"
            aria-expanded="false"
          />
          <button id="termSearchClear" type="button" class="glossary-search-clear" aria-label="Limpar pesquisa">
            <span aria-hidden="true">×</span>
          </button>
        </div>

        <div id="termSearchResults" class="glossary-search-results" role="listbox" aria-label="Sugestões de terminologias"></div>

        <p class="glossary-search-hint">
          Comece a digitar e clique na palavra para ir direto ao termo.
        </p>
      </div>
    `;

    return {
      input: root.querySelector("#termSearchInput"),
      results: root.querySelector("#termSearchResults"),
      clearBtn: root.querySelector("#termSearchClear")
    };
  }

  function ensureStyles() {
    if (document.getElementById("glossary-search-styles")) return;

    const style = document.createElement("style");
    style.id = "glossary-search-styles";
    style.textContent = `
      /* ===== Glossary Search (scoped) ===== */
      .glossary-search-wrap { width: 100%; }

      .glossary-search-card{
        width: 100%;
        max-width: 520px;
        background: rgba(255,255,255,0.9);
        border: 1px solid rgba(229,231,235,1);
        border-radius: 16px;
        box-shadow: 0 10px 18px -10px rgba(0,0,0,0.12);
        padding: 14px 14px 10px;
        text-align: left;
        position: relative;
      }

      .glossary-search-label{
        display:block;
        font-weight: 800;
        color: #1e3a8a;
        margin-bottom: 8px;
        font-size: 0.95rem;
        letter-spacing: 0.2px;
      }

      .glossary-search-field{
        display:flex;
        align-items:center;
        gap: 10px;
        border: 1px solid rgba(209,213,219,1);
        border-radius: 14px;
        padding: 10px 12px;
        background: white;
      }

      .glossary-search-field i{
        color:#6b7280;
        font-size: 0.95rem;
      }

      #termSearchInput{
        width: 100%;
        border: none;
        outline: none;
        font-size: 1rem;
        color: #111827;
        background: transparent;
      }

      #termSearchInput::placeholder{ color:#9ca3af; }

      .glossary-search-clear{
        border: none;
        background: transparent;
        cursor: pointer;
        width: 28px;
        height: 28px;
        border-radius: 999px;
        display:flex;
        align-items:center;
        justify-content:center;
        color:#6b7280;
        font-size: 20px;
        line-height: 1;
      }
      .glossary-search-clear:hover{ background: rgba(243,244,246,1); }

      .glossary-search-results{
        margin-top: 8px;
        border: 1px solid rgba(229,231,235,1);
        border-radius: 14px;
        overflow: auto;
        max-height: 260px;
        display:none;
        background:white;
      }

      .glossary-search-results.is-open{ display:block; }

      .glossary-search-item{
        padding: 10px 12px;
        cursor: pointer;
        display:flex;
        justify-content:space-between;
        gap: 12px;
        align-items:center;
      }

      .glossary-search-item:hover,
      .glossary-search-item.is-active{
        background: rgba(30,58,138,0.08);
      }

      .glossary-search-term{
        font-weight: 800;
        color:#111827;
        font-size: 0.95rem;
      }

      .glossary-search-go{
        color:#1e3a8a;
        font-weight: 800;
        font-size: 0.85rem;
        opacity: 0.9;
      }

      .glossary-search-hint{
        margin-top: 8px;
        color:#6b7280;
        font-size: 0.82rem;
      }

      /* Highlight target term briefly */
      .term-container.glossary-hit{
        outline: 3px solid rgba(59,130,246,0.35);
        border-radius: 14px;
        padding: 10px 12px;
        background: rgba(59,130,246,0.06);
        transition: outline 0.25s ease, background 0.25s ease;
      }

      @media (max-width: 640px){
        .glossary-search-card{ max-width: 100%; }
      }
    `;
    document.head.appendChild(style);
  }

  function attachBehavior(index, ui) {
    const { input, results, clearBtn } = ui;

    // Limit suggestions for performance and UX
    const MAX = 14;

    let activeIndex = -1;
    let currentList = [];

    function closeList() {
      results.classList.remove("is-open");
      results.innerHTML = "";
      input.setAttribute("aria-expanded", "false");
      activeIndex = -1;
      currentList = [];
    }

    function openList() {
      results.classList.add("is-open");
      input.setAttribute("aria-expanded", "true");
    }

    function setActive(idx) {
      activeIndex = idx;
      const children = Array.from(results.querySelectorAll(".glossary-search-item"));
      children.forEach((el, i) => {
        if (i === idx) el.classList.add("is-active");
        else el.classList.remove("is-active");
      });
      if (children[idx]) children[idx].scrollIntoView({ block: "nearest" });
    }

    function scrollToTerm(item) {
      const el = document.getElementById(item.id);
      if (!el) return;

      // Smooth scroll with offset handled by scroll-margin-top on letter-section;
      // for term, we do a small manual offset to avoid header overlap.
      const headerOffset = 110; // adjust if needed
      const rect = el.getBoundingClientRect();
      const top = rect.top + window.pageYOffset - headerOffset;

      window.scrollTo({ top, behavior: "smooth" });

      // Highlight for a moment
      el.classList.add("glossary-hit");
      window.setTimeout(() => el.classList.remove("glossary-hit"), 1600);

      closeList();
    }

    function renderList(list) {
      results.innerHTML = list
        .map(
          (it, i) => `
            <div
              class="glossary-search-item"
              role="option"
              aria-selected="${i === activeIndex ? "true" : "false"}"
              data-id="${it.id}"
              data-term="${it.term.replace(/"/g, "&quot;")}"
            >
              <span class="glossary-search-term">${it.term}</span>
              <span class="glossary-search-go">Ir</span>
            </div>
          `
        )
        .join("");

      if (list.length) openList();
      else closeList();
    }

    function search(q) {
      const nq = normalizeText(q);
      if (!nq || nq.length < 1) {
        closeList();
        return;
      }

      // Starts-with first, then contains
      const starts = [];
      const contains = [];
      for (const it of index) {
        if (!it.key) continue;
        if (it.key.startsWith(nq)) starts.push(it);
        else if (it.key.includes(nq)) contains.push(it);
        if (starts.length >= MAX) break;
      }

      let merged = starts;
      if (merged.length < MAX) merged = merged.concat(contains.slice(0, MAX - merged.length));

      currentList = merged;
      activeIndex = merged.length ? 0 : -1;
      renderList(merged);
      if (activeIndex >= 0) setActive(activeIndex);
    }

    // Events
    input.addEventListener("input", () => search(input.value));

    input.addEventListener("keydown", (e) => {
      if (!results.classList.contains("is-open")) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        const next = Math.min(activeIndex + 1, currentList.length - 1);
        setActive(next);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        const prev = Math.max(activeIndex - 1, 0);
        setActive(prev);
      } else if (e.key === "Enter") {
        e.preventDefault();
        const item = currentList[activeIndex];
        if (item) scrollToTerm(item);
      } else if (e.key === "Escape") {
        e.preventDefault();
        closeList();
      }
    });

    results.addEventListener("click", (e) => {
      const row = e.target.closest(".glossary-search-item");
      if (!row) return;
      const id = row.getAttribute("data-id");
      const term = row.getAttribute("data-term") || "";
      scrollToTerm({ id, term });
    });

    clearBtn.addEventListener("click", () => {
      input.value = "";
      input.focus();
      closeList();
    });

    document.addEventListener("click", (e) => {
      if (e.target.closest("#glossary-search-root")) return;
      closeList();
    });

    // Convenience: Ctrl+K focuses the search (optional)
    document.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        input.focus();
      }
    });
  }

  function init() {
    ensureStyles();

    const root = createUIIfMissing();
    if (!root) return;

    const index = buildIndex();
    if (!index.length) return;

    const ui = renderUI(root);
    attachBehavior(index, ui);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
