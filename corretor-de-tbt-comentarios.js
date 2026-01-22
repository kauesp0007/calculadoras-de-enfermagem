const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

// ==========================================
// CONFIGURAÇÕES
// ==========================================

const rootDir = __dirname;

// Pastas a ignorar
const ignoredFolders = ['downloads', 'biblioteca', 'node_modules', '.git', '.vscode', '.next', 'build', 'dist'];

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

// O NOVO CODIGO OTIMIZADO (Lazy Load)
const NEW_SCRIPT_CONTENT = `
<script>
  document.addEventListener("DOMContentLoaded", function () {
    const commentsSection = document.getElementById("page-comments");

    // Configuração
    const SUPABASE_URL = "https://asjkftjfbkuuhilnqonx.supabase.co";
    const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzamtmdGpmYmt1dWhpbG5xb254Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwODMxNjQsImV4cCI6MjA4MjY1OTE2NH0.mly76L5r2zoasonwta8aNND2mWWrkAoXirAAs99mDYo";
    const CDN_URL = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";

    let supabaseLoaded = false;

    // Função principal que inicia tudo
    async function initComments() {
      if (supabaseLoaded) return;
      supabaseLoaded = true;

      // 1. Carrega a biblioteca Supabase dinamicamente
      if (!window.supabase) {
        const script = document.createElement("script");
        script.src = CDN_URL;
        script.onload = startLogic;
        document.body.appendChild(script);
      } else {
        startLogic();
      }
    }

    // Lógica original dos comentários (encapsulada)
    function startLogic() {
      if (!window.supabase || !window.supabase.createClient) return;

      const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      const page_path = window.location.pathname || "/";
      const lang = (document.documentElement.getAttribute("lang") || "pt-BR").toLowerCase();

      const statusEl = document.getElementById("comments-status");
      const listEl = document.getElementById("comments-list");
      const formEl = document.getElementById("comments-form");
      const textEl = document.getElementById("comment-text");
      const refreshBtn = document.getElementById("comment-refresh");
      const linesEl = document.getElementById("comment-lines");
      const charsEl = document.getElementById("comment-chars");
      const nameEl = document.getElementById("comment-name");
      const honeypotEl = document.getElementById("company");

      function setStatus(msg) { if(statusEl) statusEl.textContent = msg || ""; }
      function escapeHtml(s) { return String(s).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;"); }

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
          setStatus("Limite de 500 linhas atingido.");
          const limited = text.split("\\n").slice(0, 500).join("\\n");
          textEl.value = limited;
        } else {
          setStatus("");
        }
      }

      if (textEl) textEl.addEventListener("input", updateCounters);

      async function loadComments() {
        setStatus("Carregando comentários...");
        if (listEl) listEl.innerHTML = '<div style="opacity:0.6; font-size:0.9rem">Buscando dados...</div>';

        const { data, error } = await sb
          .from("page_comments")
          .select("name, comment, created_at")
          .eq("page_path", page_path)
          .eq("lang", lang)
          .eq("is_approved", true)
          .order("created_at", { ascending: false })
          .limit(50);

        if (error) { setStatus("Erro ao carregar."); return; }
        if (!data || data.length === 0) {
            setStatus("");
            if(listEl) listEl.innerHTML = '<div style="opacity:0.8; font-style:italic">Seja o primeiro a comentar!</div>';
            return;
        }

        setStatus("");
        const html = data.map(c => {
          const nm = c.name ? escapeHtml(c.name) : "Anônimo";
          const dt = c.created_at ? new Date(c.created_at).toLocaleString("pt-BR") : "";
          const tx = escapeHtml(c.comment).replaceAll("\\n", "<br>");
          return \`
            <div class="comment-item">
              <div class="comment-head">
                <span class="comment-name">\${nm}</span>
                <span class="comment-date">\${dt}</span>
              </div>
              <div class="comment-text">\${tx}</div>
            </div>\`;
        }).join("");
        if (listEl) listEl.innerHTML = html;
      }

      if (formEl) {
          formEl.addEventListener("submit", async (e) => {
              e.preventDefault();
              if (honeypotEl && honeypotEl.value) return;

              const name = (nameEl?.value || "").trim().slice(0, 80);
              const comment = (textEl?.value || "").trim();

              if (!comment) return setStatus("Escreva um comentário.");

              const last = Number(localStorage.getItem("last_comment_ts") || "0");
              const now = Date.now();
              if (now - last < 15000) return setStatus("Aguarde alguns segundos.");

              if (countLines(comment) > 500) return setStatus("Limite de linhas excedido.");

              setStatus("Enviando...");

              const { error } = await sb.from("page_comments").insert([{
                  page_path: page_path,
                  lang: lang,
                  name: name || null,
                  comment: comment,
                  is_approved: true
              }]);

              if (error) { setStatus("Erro ao enviar."); }
              else {
                  localStorage.setItem("last_comment_ts", String(now));
                  setStatus("Comentário enviado!");
                  textEl.value = "";
                  updateCounters();
                  loadComments();
              }
          });
      }

      if (refreshBtn) refreshBtn.addEventListener("click", loadComments);

      updateCounters();
      loadComments();
    }

    // 2. Intersection Observer: Só inicia quando o usuário rolar até perto dos comentários
    if (commentsSection) {
      const observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          initComments();
          observer.disconnect();
        }
      }, { rootMargin: "200px" });

      observer.observe(commentsSection);
    } else {
      setTimeout(initComments, 4000);
    }
  });
</script>
`;

let stats = {
    processed: 0,
    altered: 0,
    skipped: 0,
    errors: 0
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
                    processHtmlFile(fullPath);
                }
            }
        }
    }
}

function shouldProcessFile(fullPath, fileName) {
    if (ignoredFiles.includes(fileName)) return false;
    return true;
}

function processHtmlFile(filePath) {
    stats.processed++;
    let content = fs.readFileSync(filePath, 'utf8');

    // Cheerio com decodeEntities: false para não estragar acentos e caracteres especiais
    const $ = cheerio.load(content, { decodeEntities: false, xmlMode: false });
    let fileChanged = false;

    // ---------------------------------------------------------
    // 1. Remove o script de importação global do Supabase (TBT)
    // ---------------------------------------------------------
    $('script').each((i, el) => {
        const src = $(el).attr('src');
        if (src && src.includes('@supabase/supabase-js')) {
            $(el).remove();
            fileChanged = true;
        }
    });

    // ---------------------------------------------------------
    // 2. Substitui o script de lógica antigo pelo novo Lazy Load
    // ---------------------------------------------------------
    $('script').each((i, el) => {
        const scriptContent = $(el).html();
        if (scriptContent &&
            scriptContent.includes('supabase.createClient') &&
            scriptContent.includes('asjkftjfbkuuhilnqonx.supabase.co') &&
            !scriptContent.includes('IntersectionObserver')) { // Garante que não substitui se já foi otimizado

            $(el).replaceWith(NEW_SCRIPT_CONTENT);
            fileChanged = true;
        }
    });

    // ---------------------------------------------------------
    // 3. Realoca o Bloco de Comentários para antes do Footer
    // ---------------------------------------------------------
    const commentsSection = $('#page-comments');
    const footerPlaceholder = $('#footer-placeholder');

    // Só prossegue se ambos existirem na página
    if (commentsSection.length > 0 && footerPlaceholder.length > 0) {
        // Verifica se a seção de comentários JÁ ESTÁ imediatamente antes do footer
        const prevElement = footerPlaceholder.prev();
        const isAlreadyCorrect = prevElement.length > 0 && prevElement.attr('id') === 'page-comments';

        if (!isAlreadyCorrect) {
            // Move a seção de comentários para antes do placeholder do rodapé
            footerPlaceholder.before(commentsSection);
            fileChanged = true;
        }
    }

    if (fileChanged) {
        fs.writeFileSync(filePath, $.html(), 'utf8');
        stats.altered++;
        console.log(`✅ Otimizado & Realocado: ${path.relative(rootDir, filePath)}`);
    } else {
        stats.skipped++;
    }
}

// ==========================================
// EXECUÇÃO
// ==========================================

console.log("---------------------------------------------------------");
console.log("INICIANDO CORREÇÃO TBT + REALOCAÇÃO DE LAYOUT...");
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
console.log(`⚡ Arquivos alterados:     ${stats.altered}`);
console.log(`⏭️  Arquivos já ok:         ${stats.skipped}`);
console.log("---------------------------------------------------------");