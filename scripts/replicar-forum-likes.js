// scripts/replicar-forum-likes.js
// Replica as mudanças de curtidas/permissões do forum-enfermagem.html (raiz)
// para os 18 arquivos de idioma. As substituições são idênticas porque o
// código JS/CSS é o mesmo em todos os arquivos (só o I18N muda).

"use strict";
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const LANGS = ["en", "es", "de", "it", "fr", "hi", "zh", "ar", "ja", "ru", "ko", "tr", "nl", "pl", "sv", "id", "vi", "uk"];

// Pares [old, new] na ordem em que foram aplicados no raiz.
const REPLACEMENTS = [
    // 1. CSS do coração (após .pact)
    [
        ".pact{display:inline-flex;align-items:center;gap:5px;font-size:11.5px;font-weight:700;color:var(--slate-500);background:none;border:none;cursor:pointer;padding:4px 8px;border-radius:8px}",
        ".pact{display:inline-flex;align-items:center;gap:5px;font-size:11.5px;font-weight:700;color:var(--slate-500);background:none;border:none;cursor:pointer;padding:4px 8px;border-radius:8px}\n.pact.like-btn{transition:transform .15s}\n.pact.like-btn:hover{transform:scale(1.12);color:var(--slate-600)}\n.pact.like-btn.liked{color:#e11d48}\n.pact.like-btn .like-count{font-weight:800;margin-left:2px}\n.pact.like-btn.liked .like-count{color:#e11d48}\n.likers{margin-top:2px;font-size:11px;color:var(--slate-500);line-height:1.4}"
    ],
    // 2. initSb com header x-author-key
    [
        "function initSb(){\nif(window.supabase){ sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY); }\n}",
        "function initSb(){\nif(window.supabase){ sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { global: { headers: { 'x-author-key': getAuthorKey() } } }); }\n}"
    ],
    // 3. funções de curtidas + canManagePost (após isDev)
    [
        "function isDev(){\ntry{ if(localStorage.getItem('admin_mode')==='true') return true; }catch(e){}\nif(window.Authorization && window.Authorization.hasRole && window.Authorization.hasRole('administrator')) return true;\nreturn false;\n}",
        "function isDev(){\ntry{ if(localStorage.getItem('admin_mode')==='true') return true; }catch(e){}\nif(window.Authorization && window.Authorization.hasRole && window.Authorization.hasRole('administrator')) return true;\nreturn false;\n}\n\n/* ===== CURTIDAS (CORAÇÃO) ===== */\nvar ALL_LIKES = {}; // post_id -> array de {id, author_key, author_name}\nvar MY_LIKED = {};  // post_id -> id do like do visitante\nfunction likeCountOf(postId){ return (ALL_LIKES[postId] || []).length; }\nfunction isLiked(postId){ return !!MY_LIKED[postId]; }\nasync function carregarLikes(){\nif(!sb){ renderFeed(); return; }\ntry{\nvar { data, error } = await sb.from('post_likes').select('*');\nif(error) throw error;\nALL_LIKES = {}; MY_LIKED = {};\nvar myKey = getAuthorKey();\n(data || []).forEach(function(l){\nif(!ALL_LIKES[l.post_id]) ALL_LIKES[l.post_id] = [];\nALL_LIKES[l.post_id].push(l);\nif(l.author_key === myKey) MY_LIKED[l.post_id] = l.id;\n});\n}catch(err){ console.error('Fórum: falha ao carregar curtidas', err); }\nrenderFeed();\n}\nasync function toggleLike(id){\nif(!sb){ showToast('Não foi possível curtir agora. · Could not like right now.'); return; }\nif(isLiked(id)){\nvar likeId = MY_LIKED[id];\ntry{\nvar { error } = await sb.from('post_likes').delete().eq('id', likeId);\nif(error) throw error;\ndelete MY_LIKED[id];\nALL_LIKES[id] = (ALL_LIKES[id] || []).filter(function(l){ return l.id !== likeId; });\n}catch(err){ showToast('Não foi possível desfazer a curtida. · Could not unlike.'); console.error('Unlike:', err); }\n} else {\ntry{\nvar nomeEl = document.getElementById('f-nome');\nvar { error } = await sb.from('post_likes').insert([{ post_id: id, author_key: getAuthorKey(), author_name: (nomeEl && nomeEl.value.trim()) || null }]);\nif(error) throw error;\nawait carregarLikes();\n}catch(err){ showToast('Não foi possível curtir. · Could not like.'); console.error('Like:', err); }\n}\nrenderFeed();\n}\nfunction canManagePost(post){\nif(isDev()) return true;\nif(!post) return false;\nvar isPremium = false;\nif(window.Authorization && window.Authorization.hasPlan){ isPremium = window.Authorization.hasPlan('junior'); }\nreturn isPremium && (post.author_key === getAuthorKey());\n}"
    ],
    // 4. chamada final carregarLikes
    [
        "applyLang();\ncarregarPosts();",
        "applyLang();\ncarregarLikes();\ncarregarPosts();"
    ],
    // 5. canManage -> canManagePost + likeBtn + likersHtml
    [
        "var canManage = true;",
        "var canManage = canManagePost(post);\nvar likeCount = likeCountOf(post.id);\nvar liked = isLiked(post.id);\nvar likeBtn = '<button class=\"pact like-btn'+(liked?' liked':'')+'\" data-a=\"like\" data-id=\"'+post.id+'\" aria-pressed=\"'+(liked?'true':'false')+'\"><svg viewBox=\"0 0 512 512\" fill=\"'+(liked?'currentColor':'none')+'\" stroke=\"currentColor\" stroke-width=\"'+(liked?'0':'34')+'\" aria-hidden=\"true\"><path d=\"M47.6 300.4L228.3 469.1c7.5 7 17.4 10.9 27.7 10.9s20.2-3.9 27.7-10.9L464.4 300.4c30.4-28.3 47.6-68 47.6-109.5v-5.8c0-69.9-50.5-129.5-119.4-141C347 36.5 300.6 51.4 268 84L256 96 244 84c-32.6-32.6-79-47.5-124.6-39.9C50.5 55.6 0 115.2 0 185.1v5.8c0 41.5 17.2 81.2 47.6 109.5z\"/></svg><span class=\"like-count\">'+(likeCount>0?likeCount:'')+'</span></button>';\nvar likersHtml = '';\nif(post.author_key && post.author_key === getAuthorKey()){\nvar likers = (ALL_LIKES[post.id] || []).map(function(l){ return escapeHtml(l.author_name || 'Profissional'); });\nif(likers.length){ likersHtml = '<div class=\"likers\">'+likers.length+' coração(ões) — curtido por: '+likers.join(', ')+'</div>'; }\n}"
    ],
    // 6. corpo + imgHtml + likersHtml
    [
        "corpo + imgHtml +",
        "corpo + imgHtml + likersHtml +"
    ],
    // 7. actions + likeBtn
    [
        "'<div class=\"actions\">' +",
        "'<div class=\"actions\">' + likeBtn +"
    ],
    // 8. handler like
    [
        "if(a==='reply'){ abrirResposta(id); }",
        "if(a==='reply'){ abrirResposta(id); }\nelse if(a==='like'){ toggleLike(id); }"
    ]
];

let okCount = 0, failCount = 0;
const failures = [];

for (const lang of LANGS) {
    const file = path.join(ROOT, lang, "forum-enfermagem.html");
    if (!fs.existsSync(file)) { failures.push(lang + "/forum-enfermagem.html (não existe)"); failCount++; continue; }
    let content = fs.readFileSync(file, "utf8");
    // Normaliza line endings para LF (os padrões usam \n).
    content = content.replace(/\r\n/g, "\n");
    let applied = 0;
    for (const [oldStr, newStr] of REPLACEMENTS) {
        if (content.includes(oldStr)) {
            content = content.split(oldStr).join(newStr);
            applied++;
        } else {
            failures.push(lang + "/forum-enfermagem.html: padrão não encontrado -> " + oldStr.slice(0, 40).replace(/\n/g, "\\n"));
        }
    }
    if (applied === REPLACEMENTS.length) {
        // Restaura CRLF (padrão do projeto) ao gravar.
        fs.writeFileSync(file, content.replace(/\n/g, "\r\n"), "utf8");
        console.log("✗ " + lang + "/forum-enfermagem.html (" + applied + "/" + REPLACEMENTS.length + " — NÃO gravado)");
    }
}

console.log("\nRESULTADO: " + okCount + " OK, " + failCount + " falhas.");
if (failures.length) {
    console.log("DETALHES:");
    failures.forEach((f) => console.log("  - " + f));
}
process.exit(failCount > 0 ? 1 : 0);
