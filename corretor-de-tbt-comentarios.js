const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

// ==========================================
// CONFIGURAÇÕES
// ==========================================

const rootDir = __dirname;

// Pastas onde os comentários devem ser EXCLUÍDOS TOTALMENTE
const langsToDelete = [
    'en', 'es', 'de', 'it', 'fr', 'hi', 'zh', 'ar',
    'ja', 'ru', 'ko', 'tr', 'nl', 'pl', 'sv', 'id', 'vi', 'uk'
];

// Pastas a ignorar (sistema)
const ignoredFolders = ['downloads', 'biblioteca', 'node_modules', '.git', '.vscode', '.next', 'build', 'dist', 'assets', 'img', 'css', 'js'];

// Arquivos a ignorar especificamente
const ignoredFiles = [
    'footer.html',
    'menu-global.html',
    'global-body-elements.html',
    'downloads.html',
    'menu-lateral.html',
    '_language_selector.html',
    'googlefc0a17cdd552164b.html'
];

// ==========================================
// NOVO BLOCO COMPACTO (HTML + CSS + JS)
// ==========================================
const COMPACT_COMMENTS_BLOCK = `
<!-- =========================
     COMENTÁRIOS COMPACTOS (SUPABASE)
     ========================= -->
<section id="page-comments" class="w-full mx-auto mt-8 mb-4 max-w-4xl" data-version="compact-v1">
  <style>
    /* Estilo Compacto Otimizado */
    #page-comments { font-family: 'Inter', system-ui, sans-serif; }
    #page-comments .comments-card {
      width: 100%;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      background: #ffffff;
      padding: 12px; /* Reduzido de 14px */
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }
    #page-comments .comments-header {
        margin-bottom: 10px;
        padding-bottom: 8px;
        border-bottom: 1px solid #f1f5f9;
    }
    #page-comments .comments-title {
      font-size: 1rem; /* Fonte menor */
      font-weight: 700;
      color: #1e293b;
      margin: 0;
      line-height: 1.2;
    }
    #page-comments .comments-subtitle {
      font-size: 0.8rem;
      color: #64748b;
      margin-top: 2px;
    }
    #page-comments label {
      font-size: 0.75rem;
      font-weight: 600;
      color: #475569;
      margin-bottom: 2px;
      display: block;
    }
    #page-comments input,
    #page-comments textarea {
      width: 100%;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 6px 8px; /* Padding reduzido */
      font-size: 0.85rem; /* Fonte compacta */
      background: #f8fafc;
      transition: border-color 0.2s, background 0.2s;
      display: block;
      box-sizing: border-box;
    }
    #page-comments input:focus, #page-comments textarea:focus {
        border-color: #3b82f6;
        background: #fff;
        outline: none;
    }
    #page-comments textarea {
      resize: none;
      min-height: 50px;
      overflow-y: hidden; /* Para auto-grow */
    }
    #page-comments .comments-actions {
      margin-top: 8px;
      display: flex;
      justify-content: flex-end;
      gap: 8px;
    }
    #page-comments .btn-compact {
      font-size: 0.75rem;
      padding: 6px 12px;
      border-radius: 6px;
      font-weight: 600;
      cursor: pointer;
      border: none;
      transition: background 0.2s;
    }
    #page-comments .btn-primary { background: #1a3e74; color: #fff; }
    #page-comments .btn-primary:hover { background: #122c54; }
    #page-comments .btn-secondary { background: #e2e8f0; color: #475569; }
    #page-comments .btn-secondary:hover { background: #cbd5e1; }

    #page-comments .comments-meta {
      display: flex; justify-content: space-between; font-size: 0.7rem; color: #94a3b8; margin-top: 4px;
    }

    /* Lista de Comentários */
    #page-comments .comment-item {
      border-bottom: 1px solid #f1f5f9;
      padding: 8px 0;
    }
    #page-comments .comment-item:last-child { border-bottom: none; }
    #page-comments .comment-head {
      display: flex; justify-content: space-between; align-items: baseline;
      font-size: 0.75rem;
      margin-bottom: 2px;
    }
    #page-comments .comment-name { font-weight: 700; color: #334155; }
    #page-comments .comment-date { color: #94a3b8; font-size: 0.7rem; }
    #page-comments .comment-text { font-size: 0.85rem; color: #475569; line-height: 1.4; }
    #page-comments #comments-status { font-size: 0.75rem; font-weight: 600; margin: 4px 0; }
  </style>

  <div class="comments-card">
    <div class="comments-header">
        <h2 class="comments-title">Comentários</h2>
        <p class="comments-subtitle">Dúvidas ou sugestões? Escreva abaixo.</p>
    </div>

    <div id="comments-status" aria-live="polite"></div>

    <form id="comments-form">
      <!-- Honeypot -->
      <div style="position:absolute;left:-9999px;top:auto;width:1px;height:1px;overflow:hidden;" aria-hidden="true">
        <input id="company" type="text" tabindex="-1" autocomplete="off">
      </div>

      <div class="mb-2">
         <input id="comment-name" type="text" maxlength="50" placeholder="Seu nome (opcional)" autocomplete="name" />
      </div>

      <div>
        <textarea id="comment-text" rows="2" maxlength="2000" placeholder="Escreva aqui..." required></textarea>
        <div class="comments-meta">
           <span id="comment-chars">0/2000</span>
        </div>
      </div>

      <div class="comments-actions">
        <button id="comment-refresh" type="button" class="btn-compact btn-secondary" title="Atualizar lista">↻</button>
        <button id="comment-submit" type="submit" class="btn-compact btn-primary">Publicar</button>
      </div>
    </form>

    <div id="comments-list" class="mt-2"></div>
  </div>

<script>
  document.addEventListener("DOMContentLoaded", function () {
    const commentsSection = document.getElementById("page-comments");
    const textarea = document.getElementById("comment-text");

    // Auto-grow do Textarea
    if(textarea){
        textarea.addEventListener("input", function() {
            this.style.height = "auto";
            this.style.height = (this.scrollHeight) + "px";
            // Contador
            const chars = this.value.length;
            const el = document.getElementById("comment-chars");
            if(el) el.textContent = chars + "/2000";
        });
    }

    // Configuração Supabase
    const SUPABASE_URL = "https://asjkftjfbkuuhilnqonx.supabase.co";
    const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzamtmdGpmYmt1dWhpbG5xb254Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwODMxNjQsImV4cCI6MjA4MjY1OTE2NH0.mly76L5r2zoasonwta8aNND2mWWrkAoXirAAs99mDYo";
    const CDN_URL = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";

    let supabaseLoaded = false;

    async function initComments() {
      if (supabaseLoaded) return;
      supabaseLoaded = true;
      if (!window.supabase) {
        const script = document.createElement("script");
        script.src = CDN_URL;
        script.onload = startLogic;
        document.body.appendChild(script);
      } else {
        startLogic();
      }
    }

    function startLogic() {
      if (!window.supabase || !window.supabase.createClient) return;
      const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      const page_path = window.location.pathname || "/";
      const lang = "pt-br"; // Fixo pois só ficará na raiz

      const statusEl = document.getElementById("comments-status");
      const listEl = document.getElementById("comments-list");
      const formEl = document.getElementById("comments-form");
      const nameEl = document.getElementById("comment-name");
      const refreshBtn = document.getElementById("comment-refresh");
      const honeypotEl = document.getElementById("company");

      function setStatus(msg) { if(statusEl) statusEl.textContent = msg || ""; }
      function escapeHtml(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }

      async function loadComments() {
        if (listEl) listEl.innerHTML = '<div style="opacity:0.6; font-size:0.75rem; text-align:center; padding:4px;">Carregando...</div>';
        const { data, error } = await sb.from("page_comments").select("name, comment, created_at").eq("page_path", page_path).eq("lang", lang).eq("is_approved", true).order("created_at", { ascending: false }).limit(20);

        if (error || !data || data.length === 0) {
            if(listEl) listEl.innerHTML = '<div style="opacity:0.6; font-size:0.75rem; text-align:center; padding:4px;">Sem comentários.</div>';
            return;
        }
        const html = data.map(c => {
          const nm = c.name ? escapeHtml(c.name) : "Anônimo";
          const dt = c.created_at ? new Date(c.created_at).toLocaleDateString("pt-BR") : "";
          const tx = escapeHtml(c.comment).replace(/\\n/g, "<br>");
          return \`<div class="comment-item"><div class="comment-head"><span class="comment-name">\${nm}</span><span class="comment-date">\${dt}</span></div><div class="comment-text">\${tx}</div></div>\`;
        }).join("");
        if (listEl) listEl.innerHTML = html;
      }

      if (formEl) {
          formEl.addEventListener("submit", async (e) => {
              e.preventDefault();
              if (honeypotEl && honeypotEl.value) return;
              const name = (nameEl?.value || "").trim().slice(0, 50);
              const comment = (textarea?.value || "").trim();
              if (!comment) return setStatus("Escreva algo.");

              const last = Number(localStorage.getItem("last_cmt_ts") || "0");
              if (Date.now() - last < 10000) return setStatus("Aguarde um pouco.");

              setStatus("Enviando...");
              const { error } = await sb.from("page_comments").insert([{ page_path: page_path, lang: lang, name: name || null, comment: comment, is_approved: true }]);

              if (error) { setStatus("Erro."); }
              else {
                  localStorage.setItem("last_cmt_ts", String(Date.now()));
                  setStatus("Enviado!");
                  textarea.value = "";
                  textarea.style.height = "auto";
                  loadComments();
              }
          });
      }
      if (refreshBtn) refreshBtn.addEventListener("click", loadComments);
      loadComments();
    }

    if (commentsSection) {
      const observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) { initComments(); observer.disconnect(); }
      }, { rootMargin: "100px" });
      observer.observe(commentsSection);
    } else { setTimeout(initComments, 4000); }
  });
</script>
</section>
`;

let stats = {
    processed: 0,
    optimized: 0,
    deleted: 0,
    skipped: 0
};

// ==========================================
// LÓGICA
// ==========================================

function walkDir(currentPath) {
    const files = fs.readdirSync(currentPath);

    for (const file of files) {
        const fullPath = path.join(currentPath, file);
        let stat;
        try { stat = fs.statSync(fullPath); } catch (e) { continue; }

        if (stat.isDirectory()) {
            if (ignoredFolders.includes(file)) continue;
            walkDir(fullPath);
        } else {
            if (path.extname(file) === '.html') {
                if (shouldProcessFile(fullPath, file)) {
                    processHtmlFile(fullPath, file);
                }
            }
        }
    }
}

function shouldProcessFile(fullPath, fileName) {
    if (ignoredFiles.includes(fileName)) return false;
    return true;
}

function processHtmlFile(filePath, fileName) {
    stats.processed++;
    let content = fs.readFileSync(filePath, 'utf8');

    // Cheerio config
    const $ = cheerio.load(content, { decodeEntities: false, xmlMode: false });
    let fileChanged = false;

    // Detectar pasta raiz do arquivo relativo
    const relativePath = path.relative(rootDir, filePath);
    const firstFolder = relativePath.split(path.sep)[0];

    // Verifica se está em uma pasta que deve ser DELETADA
    const shouldDelete = langsToDelete.includes(firstFolder);

    if (shouldDelete) {
        // =========================================================
        // AÇÃO: REMOÇÃO TOTAL (Pastas de Idiomas)
        // =========================================================
        const commentsSection = $('#page-comments');
        if (commentsSection.length > 0) {
            commentsSection.remove();
            fileChanged = true;
        }

        // Remover scripts do Supabase
        $('script').each((i, el) => {
            const src = $(el).attr('src');
            const html = $(el).html();

            // Remove importação da lib
            if (src && src.includes('@supabase/supabase-js')) {
                $(el).remove();
                fileChanged = true;
            }
            // Remove script de lógica
            if (html && html.includes('supabase.createClient')) {
                $(el).remove();
                fileChanged = true;
            }
        });

        if (fileChanged) {
            stats.deleted++;
            // console.log(`🗑️ Removido de: ${relativePath}`);
        } else {
            stats.skipped++;
        }

    } else {
        // =========================================================
        // AÇÃO: OTIMIZAÇÃO E COMPACTAÇÃO (Raiz/Português)
        // =========================================================

        // 1. Remover script global antigo (TBT)
        $('script').each((i, el) => {
            const src = $(el).attr('src');
            if (src && src.includes('@supabase/supabase-js')) {
                $(el).remove();
                fileChanged = true;
            }
        });

        // 2. Localizar seção de comentários existente (qualquer versão)
        const commentsSection = $('#page-comments');
        const footerPlaceholder = $('#footer-placeholder');

        // Se existir seção de comentários E footer placeholder
        if (commentsSection.length > 0 && footerPlaceholder.length > 0) {

            // Substitui a seção inteira pelo NOVO BLOCO COMPACTO
            // Isso garante que o CSS, HTML e JS sejam atualizados de uma vez
            // (Evita ter que editar pedaços do HTML antigo)
            commentsSection.replaceWith(COMPACT_COMMENTS_BLOCK);

            // Re-seleciona a seção recém inserida (agora compacta)
            const newSection = $('#page-comments');

            // Move para antes do footer
            footerPlaceholder.before(newSection);

            fileChanged = true;
        }

        if (fileChanged) {
            stats.optimized++;
            // console.log(`✨ Compactado: ${relativePath}`);
        } else {
            stats.skipped++;
        }
    }

    if (fileChanged) {
        fs.writeFileSync(filePath, $.html(), 'utf8');
    }
}

// ==========================================
// EXECUÇÃO
// ==========================================

console.log("---------------------------------------------------------");
console.log("INICIANDO: LIMPEZA DE IDIOMAS + COMPACTAÇÃO NA RAIZ...");
console.log("---------------------------------------------------------");

try {
    walkDir(rootDir);
} catch (error) {
    console.error("Erro fatal na execução:", error);
}

console.log("\n---------------------------------------------------------");
console.log("RELATÓRIO FINAL");
console.log("---------------------------------------------------------");
console.log(`📂 HTMLs analisados:       ${stats.processed}`);
console.log(`🗑️  Arquivos LIMPOS (Idiomas): ${stats.deleted}`);
console.log(`✨ Arquivos OTIMIZADOS (Raiz): ${stats.optimized}`);
console.log(`⏭️  Sem alterações:         ${stats.skipped}`);
console.log("---------------------------------------------------------");