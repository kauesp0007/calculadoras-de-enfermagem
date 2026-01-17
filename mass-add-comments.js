/**
 * mass-add-comments.js
 * ------------------------------------------------------------
 * Insere em massa o bloco de comentários (Supabase) em arquivos .html
 * Regras:
 *  - Processa HTML na raiz + pastas de idiomas
 *  - NÃO altera pastas downloads/ e biblioteca/
 *  - NÃO altera HTML na raiz e nas pastas bloqueadas listadas
 *  - NÃO altera arquivos não-HTML (css/js/json etc.)
 *  - Insere:
 *     (1) Scripts (Supabase + comentários) logo abaixo do global-scripts.js
 *     (2) HTML do card de comentários antes de </body>
 *  - Evita duplicação (se já existir, pula)
 */

const fs = require("fs");
const path = require("path");

const REPO_ROOT = process.cwd();

// Pastas de idiomas (como você listou)
const LANG_DIRS = [
  "en", "es", "de", "it", "fr", "hi", "zh", "ar", "ja", "ru", "ko",
  "tr", "nl", "pl", "sv", "id", "vi", "uk"
];

// Pastas que NUNCA podem ser tocadas (em qualquer lugar)
const ALWAYS_SKIP_DIRS = new Set(["downloads", "biblioteca"]);

// Pastas (diretórios) que NÃO devem ter nenhum HTML alterado,
// tanto na raiz quanto dentro de cada idioma.
const BLOCKED_DIRS = new Set([
  "footer",
  "global-body-elements",
  "menu-global",
  "tecnologiaverde",
  "termos",
  "objetivos",
  "mapa-do-site",
  "politica",
  "missao",
  "nosso compromisso",
  "forum-enfermagem",
  "fale",
  "index"
]);

// Arquivos HTML específicos bloqueados (em qualquer lugar)
const BLOCKED_FILES = new Set([
  "downloads.html",
  "googlefc0a17cdd552164b.html",
  "index.html"
]);

// Também bloquear versões sem .html (caso existam sem extensão, mas você disse HTML)
// Mesmo assim, mantemos só .html no filtro principal.

function normSegments(p) {
  return p
    .split(path.sep)
    .filter(Boolean)
    .map(s => s.trim().toLowerCase());
}

function shouldSkipByPath(filePath) {
  const rel = path.relative(REPO_ROOT, filePath);
  const segs = normSegments(rel);

  // pular sempre as pastas downloads/ e biblioteca/ em qualquer profundidade
  if (segs.some(s => ALWAYS_SKIP_DIRS.has(s))) return true;

  // se estiver dentro de alguma pasta bloqueada (em qualquer profundidade)
  // EX: footer/, menu-global/, termos/, etc.
  if (segs.some(s => BLOCKED_DIRS.has(s))) return true;

  // arquivo bloqueado
  const base = path.basename(filePath).toLowerCase();
  if (BLOCKED_FILES.has(base)) return true;

  return false;
}

function isHtmlFile(filePath) {
  return filePath.toLowerCase().endsWith(".html");
}

// -------------------- BLOCO A: HTML do card (antes de </body>) --------------------
const COMMENTS_SECTION_HTML = `
<!-- =========================
     COMENTÁRIOS DA PÁGINA
     (SUPABASE) - SEM MODERAÇÃO
     ========================= -->
<section id="page-comments" class="mt-10 mb-6">
  <!-- Estilo local do card (profissional, compacto, azul escuro) -->
  <style>
    #page-comments .comments-card {
      width: 100%;
      border: 1px solid rgba(15, 23, 42, 0.20);
      border-radius: 14px;
      background: #ffffff;
      box-shadow: 0 10px 28px rgba(2, 6, 23, 0.28);
      color: #0b2a4a;
      padding: 14px 16px;
    }
    #page-comments .comments-card * {
      color: #0b2a4a !important;
    }
    #page-comments .comments-title {
      font-family: Nunito, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
      font-weight: 800;
      font-size: 1.35rem;
      line-height: 1.15;
      margin: 0;
    }
    #page-comments .comments-subtitle {
      font-size: 0.92rem;
      margin-top: 6px;
      opacity: 0.95;
    }
    #page-comments label {
      font-size: 0.88rem;
      font-weight: 700;
      margin-bottom: 4px;
      display: block;
    }
    #page-comments input,
    #page-comments textarea {
      width: 100%;
      border: 1px solid rgba(15, 23, 42, 0.22);
      border-radius: 10px;
      padding: 9px 10px;
      font-size: 0.92rem;
      outline: none;
      background: #fff;
    }
    #page-comments textarea {
      resize: vertical;
      min-height: 130px;
    }
    #page-comments .comments-meta {
      display: flex;
      justify-content: space-between;
      gap: 10px;
      margin-top: 6px;
      font-size: 0.78rem;
      opacity: 0.9;
    }
    #page-comments .comments-actions {
      margin-top: 10px;
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }

    /* =========================
       BOTÕES – SEMI TRANSPARENTES
       TEXTO BRANCO
       ========================= */
    #page-comments .comments-actions .btn-primary,
    #page-comments .comments-actions .btn-secondary {
      font-size: 0.88rem;
      padding: 8px 12px;
      min-height: 38px;
      border-radius: 10px;

      background: rgba(11, 42, 74, 0.65);
      color: #ffffff !important;
      border: 1px solid rgba(11, 42, 74, 0.45);
      box-shadow: 0 6px 16px rgba(2, 6, 23, 0.25);
      backdrop-filter: blur(2px);
    }
    #page-comments .comments-actions .btn-primary:hover,
    #page-comments .comments-actions .btn-secondary:hover {
      background: rgba(11, 42, 74, 0.85);
    }
    #page-comments .comments-actions .btn-primary:active,
    #page-comments .comments-actions .btn-secondary:active {
      background: rgba(11, 42, 74, 0.95);
    }

    #page-comments .comments-divider {
      border-top: 1px solid rgba(15, 23, 42, 0.12);
      margin-top: 12px;
      padding-top: 10px;
    }
    #page-comments .comments-list-title {
      font-size: 0.95rem;
      font-weight: 800;
      margin: 0;
    }
    #page-comments .comment-item {
      border: 1px solid rgba(15, 23, 42, 0.14);
      border-radius: 12px;
      background: #f8fafc;
      padding: 10px 12px;
      box-shadow: 0 6px 18px rgba(2, 6, 23, 0.14);
    }
    #page-comments .comment-head {
      display: flex;
      justify-content: space-between;
      gap: 10px;
      flex-wrap: wrap;
      font-size: 0.82rem;
      opacity: 0.95;
    }
    #page-comments .comment-name {
      font-weight: 800;
      font-size: 0.92rem;
    }
    #page-comments .comment-date {
      font-size: 0.78rem;
      opacity: 0.85;
    }
    #page-comments .comment-text {
      margin-top: 6px;
      font-size: 0.92rem;
      line-height: 1.45;
    }
    #page-comments #comments-status {
      margin-top: 10px;
      font-size: 0.85rem;
      font-weight: 600;
    }
  </style>

  <div class="main-content-wrapper">
    <div class="comments-card">
      <h2 class="comments-title">Deixe seus comentários</h2>
      <p class="comments-subtitle">
        Compartilhe dúvidas, sugestões ou experiências relacionadas a esta página.
      </p>

      <div id="comments-status" aria-live="polite"></div>

      <form id="comments-form" class="mt-2">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label for="comment-name">Nome (opcional)</label>
            <input
              id="comment-name"
              type="text"
              maxlength="80"
              placeholder="Ex.: Maria"
              autocomplete="name"
            />
          </div>

          <!-- Honeypot anti-spam (não mexa) -->
          <div style="position:absolute;left:-9999px;top:auto;width:1px;height:1px;overflow:hidden;" aria-hidden="true">
            <label for="company">Company</label>
            <input id="company" type="text" tabindex="-1" autocomplete="off">
          </div>
        </div>

        <div class="mt-3">
          <label for="comment-text">Comentário (até 500 linhas)</label>
          <textarea
            id="comment-text"
            rows="7"
            maxlength="20000"
            placeholder="Escreva seu comentário..."
            required
          ></textarea>

          <div class="comments-meta">
            <span id="comment-lines">Linhas: 0/500</span>
            <span id="comment-chars">Caracteres: 0/20000</span>
          </div>
        </div>

        <div class="comments-actions">
          <button id="comment-submit" type="submit" class="btn-primary">
            Publicar comentário
          </button>
          <button id="comment-refresh" type="button" class="btn-secondary">
            Atualizar
          </button>
        </div>
      </form>

      <div class="comments-divider">
        <h3 class="comments-list-title">Comentários</h3>
        <div id="comments-list" class="mt-3 space-y-3"></div>
      </div>
    </div>
  </div>
</section>
`;

// -------------------- BLOCO B: scripts (abaixo do global-scripts.js) --------------------
const COMMENTS_SCRIPTS_BLOCK = `
<!-- Supabase (cliente) -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2" defer></script>

<!-- Comentários da Página (Supabase) - SEM MODERAÇÃO -->
<script defer>
  document.addEventListener("DOMContentLoaded", function () {
    const SUPABASE_URL = "https://asjkftjfbkuuhilnqonx.supabase.co";
    const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzamtmdGpmYmt1dWhpbG5xb254Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwODMxNjQsImV4cCI6MjA4MjY1OTE2NH0.mly76L5r2zoasonwta8aNND2mWWrkAoXirAAs99mDYo";

    if (!window.supabase || !window.supabase.createClient) {
      console.error("Supabase JS não carregou.");
      return;
    }

    const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    const page_path = window.location.pathname || "/";
    const lang = (document.documentElement.getAttribute("lang") || "pt-BR").toLowerCase();

    const statusEl = document.getElementById("comments-status");
    const listEl = document.getElementById("comments-list");
    const formEl = document.getElementById("comments-form");
    const nameEl = document.getElementById("comment-name");
    const textEl = document.getElementById("comment-text");
    const linesEl = document.getElementById("comment-lines");
    const charsEl = document.getElementById("comment-chars");
    const refreshBtn = document.getElementById("comment-refresh");
    const honeypotEl = document.getElementById("company");

    function setStatus(msg) {
      if (!statusEl) return;
      statusEl.textContent = msg || "";
    }

    function escapeHtml(s) {
      return String(s)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
    }

    function countLines(value) {
      if (!value) return 0;
      return value.split("\\n").length;
    }

    function updateCounters() {
      const text = textEl?.value || "";
      const lines = countLines(text);
      const chars = text.length;

      if (linesEl) linesEl.textContent = "Linhas: " + lines + "/500";
      if (charsEl) charsEl.textContent = "Caracteres: " + chars + "/20000";

      if (lines > 500) {
        setStatus("Limite de 500 linhas atingido. Remova algumas quebras de linha para continuar.");
        const limited = text.split("\\n").slice(0, 500).join("\\n");
        textEl.value = limited;
      } else {
        setStatus("");
      }
    }

    if (textEl) textEl.addEventListener("input", updateCounters);

    async function loadComments() {
      setStatus("Carregando comentários...");
      if (listEl) listEl.innerHTML = "";

      const { data, error } = await sb
        .from("page_comments")
        .select("id, name, comment, created_at")
        .eq("page_path", page_path)
        .eq("lang", lang)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) {
        console.error(error);
        setStatus("Não foi possível carregar os comentários agora.");
        return;
      }

      if (!data || data.length === 0) {
        setStatus("Nenhum comentário ainda. Seja o primeiro.");
        return;
      }

      setStatus("");

      const html = data.map((c) => {
        const nm = c.name ? escapeHtml(c.name) : "Anônimo";
        const dt = c.created_at ? new Date(c.created_at).toLocaleString("pt-BR") : "";
        const tx = escapeHtml(c.comment).replaceAll("\\n", "<br>");
        return (
          '<div class="comment-item">' +
            '<div class="comment-head">' +
              '<span class="comment-name">' + nm + '</span>' +
              '<span class="comment-date">' + dt + '</span>' +
            "</div>" +
            '<div class="comment-text">' + tx + "</div>" +
          "</div>"
        );
      }).join("");

      if (listEl) listEl.innerHTML = html;
    }

    if (refreshBtn) refreshBtn.addEventListener("click", loadComments);

    async function submitComment(e) {
      e.preventDefault();

      if (honeypotEl && honeypotEl.value) return;

      const name = (nameEl?.value || "").trim().slice(0, 80);
      const comment = (textEl?.value || "").trim();

      if (!comment) {
        setStatus("Escreva um comentário antes de publicar.");
        return;
      }

      const last = Number(localStorage.getItem("last_comment_ts") || "0");
      const now = Date.now();
      if (now - last < 15000) {
        setStatus("Aguarde alguns segundos antes de enviar outro comentário.");
        return;
      }

      if (countLines(comment) > 500) {
        setStatus("Seu comentário ultrapassou 500 linhas.");
        return;
      }

      setStatus("Enviando...");

      const { error } = await sb.from("page_comments").insert([{
        page_path: page_path,
        lang: lang,
        name: name || null,
        comment: comment,
        is_approved: true
      }]);

      if (error) {
        console.error(error);
        setStatus("Não foi possível enviar. Tente novamente.");
        return;
      }

      localStorage.setItem("last_comment_ts", String(now));
      setStatus("Comentário publicado com sucesso.");
      if (textEl) textEl.value = "";
      updateCounters();
      loadComments();
    }

    if (formEl) formEl.addEventListener("submit", submitComment);

    updateCounters();
    loadComments();
  });
</script>
`;

// -------------------- Inserções --------------------

function alreadyHasCommentsSection(html) {
  return /id\s*=\s*["']page-comments["']/i.test(html);
}

function alreadyHasSupabaseScript(html) {
  return /supabase-js@2/i.test(html);
}

function insertCommentsBeforeBodyClose(html) {
  if (alreadyHasCommentsSection(html)) return { changed: false, html };

  const bodyCloseMatch = html.match(/<\/body\s*>/i);
  if (!bodyCloseMatch) return { changed: false, html };

  // Insere imediatamente antes de </body>
  const out = html.replace(/<\/body\s*>/i, COMMENTS_SECTION_HTML + "\n</body>");
  return { changed: out !== html, html: out };
}

function insertScriptsAfterGlobalScripts(html) {
  if (alreadyHasSupabaseScript(html)) return { changed: false, html };

  // Acha o script do global-scripts.js (com atributos variados)
  const re = /<script\b[^>]*\bsrc\s*=\s*["'][^"']*global-scripts\.js[^"']*["'][^>]*>\s*<\/script>/i;
  const m = html.match(re);
  if (!m) return { changed: false, html };

  const tag = m[0];
  const injected = tag + "\n" + COMMENTS_SCRIPTS_BLOCK.trim() + "\n";
  const out = html.replace(re, injected);
  return { changed: out !== html, html: out };
}

// -------------------- Caminhamento --------------------

function walkDir(dirPath, fileList = []) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const ent of entries) {
    const full = path.join(dirPath, ent.name);

    if (ent.isDirectory()) {
      const nameLower = ent.name.toLowerCase();

      // Nunca entra em downloads/ e biblioteca/
      if (ALWAYS_SKIP_DIRS.has(nameLower)) continue;

      // Não entra nas pastas bloqueadas
      if (BLOCKED_DIRS.has(nameLower)) continue;

      walkDir(full, fileList);
      continue;
    }

    if (ent.isFile()) {
      if (!isHtmlFile(full)) continue;
      if (shouldSkipByPath(full)) continue;
      fileList.push(full);
    }
  }
  return fileList;
}

function getTargets() {
  const targets = [];

  // 1) HTML na raiz (somente arquivos .html na raiz, exceto bloqueados)
  const rootEntries = fs.readdirSync(REPO_ROOT, { withFileTypes: true });
  for (const ent of rootEntries) {
    if (!ent.isFile()) continue;
    const full = path.join(REPO_ROOT, ent.name);
    if (!isHtmlFile(full)) continue;
    if (shouldSkipByPath(full)) continue;

    // bloquear explicitamente os HTML da raiz com nomes da lista (alguns você listou sem .html)
    const base = ent.name.toLowerCase();
    const baseNoExt = base.replace(/\.html$/i, "");
    if (BLOCKED_DIRS.has(baseNoExt)) continue; // ex: index.html / termos.html etc. se existirem
    if (BLOCKED_FILES.has(base)) continue;

    targets.push(full);
  }

  // 2) HTML dentro das pastas de idiomas (recursivo)
  for (const lang of LANG_DIRS) {
    const langPath = path.join(REPO_ROOT, lang);
    if (!fs.existsSync(langPath) || !fs.statSync(langPath).isDirectory()) continue;
    const found = walkDir(langPath, []);
    targets.push(...found);
  }

  return targets;
}

// -------------------- Execução --------------------

function processFile(filePath) {
  const original = fs.readFileSync(filePath, "utf8");

  // Inserir scripts abaixo do global-scripts.js
  const r1 = insertScriptsAfterGlobalScripts(original);

  // Inserir HTML antes do </body>
  const r2 = insertCommentsBeforeBodyClose(r1.html);

  const changed = r1.changed || r2.changed;
  if (!changed) return { changed: false };

  fs.writeFileSync(filePath, r2.html, "utf8");
  return { changed: true };
}

function main() {
  const targets = getTargets();
  let changedCount = 0;
  let skippedCount = 0;
  const changedFiles = [];

  for (const f of targets) {
    try {
      const res = processFile(f);
      if (res.changed) {
        changedCount++;
        changedFiles.push(path.relative(REPO_ROOT, f));
      } else {
        skippedCount++;
      }
    } catch (err) {
      console.error("Erro em:", f);
      console.error(err);
    }
  }

  console.log("==============================================");
  console.log("Finalizado.");
  console.log("Arquivos analisados:", targets.length);
  console.log("Arquivos modificados:", changedCount);
  console.log("Arquivos sem alteração (já tinham / sem ponto de inserção):", skippedCount);
  console.log("==============================================");

  // Log dos alterados (para você conferir no Git)
  if (changedFiles.length) {
    console.log("Lista de arquivos modificados:");
    for (const rel of changedFiles) console.log("-", rel);
  }
}

main();
