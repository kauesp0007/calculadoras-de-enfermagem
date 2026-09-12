// scripts/replicar-forum-moderation.js
// Replica a moderação por admin (getAdminEmail + salvarEdicao/confirmarExclusao
// usando a Edge Function forum-moderation) para os 18 idiomas.

"use strict";
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const LANGS = ["en", "es", "de", "it", "fr", "hi", "zh", "ar", "ja", "ru", "ko", "tr", "nl", "pl", "sv", "id", "vi", "uk"];

const REPLACEMENTS = [
    // 1. getAdminEmail após canManagePost
    [
        "function canManagePost(post){\nif(isDev()) return true;\nif(!post) return false;\nvar isPremium = false;\nif(window.Authorization && window.Authorization.hasPlan){ isPremium = window.Authorization.hasPlan('junior'); }\nreturn isPremium && (post.author_key === getAuthorKey());\n}",
        "function canManagePost(post){\nif(isDev()) return true;\nif(!post) return false;\nvar isPremium = false;\nif(window.Authorization && window.Authorization.hasPlan){ isPremium = window.Authorization.hasPlan('junior'); }\nreturn isPremium && (post.author_key === getAuthorKey());\n}\nfunction getAdminEmail(){\ntry{ var u=(window.Auth&&window.Auth.currentUser)?window.Auth.currentUser():null; return u?String(u.email||'').toLowerCase():''; }catch(e){ return ''; }\n}"
    ],
    // 2. salvarEdicao com Edge Function para admin
    [
        "async function salvarEdicao(id){\nvar txt = document.getElementById('edit-txt').value.trim();\nif(!txt){ showToast('Escreva algo para salvar. · Write something to save.'); return; }\nif(!sb){ showToast('Não foi possível editar agora. · Could not edit right now.'); return; }\ncloseModal();\ntry{\nvar { error } = await sb.from('posts').update({ conteudo: txt }).eq('id', id);\nif(error) throw error;\nshowToast('Publicação atualizada. · Post updated.');\nPAGE=0; ALL_POSTS=[]; carregarPosts();\n}catch(err){ showToast('Não foi possível editar. · Could not edit.'); console.error('Editar:', err); }\n}",
        "async function salvarEdicao(id){\nvar txt = document.getElementById('edit-txt').value.trim();\nif(!txt){ showToast('Escreva algo para salvar. · Write something to save.'); return; }\nif(!sb){ showToast('Não foi possível editar agora. · Could not edit right now.'); return; }\ncloseModal();\ntry{\nif(isDev()){\nvar res = await sb.functions.invoke('forum-moderation', { body: { action:'update', post_id: Number(id), content: txt, adminEmail: getAdminEmail() } });\nif(res.error) throw new Error(res.error.message || res.error);\n} else {\nvar { error } = await sb.from('posts').update({ conteudo: txt }).eq('id', id);\nif(error) throw error;\n}\nshowToast('Publicação atualizada. · Post updated.');\nPAGE=0; ALL_POSTS=[]; carregarPosts();\n}catch(err){ showToast('Não foi possível editar. · Could not edit.'); console.error('Editar:', err); }\n}"
    ],
    // 3. confirmarExclusao com Edge Function para admin
    [
        "async function confirmarExclusao(id){\ncloseModal();\nif(!sb){ showToast('Não foi possível excluir agora. · Could not delete right now.'); return; }\ntry{\nvar { error } = await sb.from('posts').delete().eq('id', id);\nif(error) throw error;\nshowToast('Publicação excluída. · Post deleted.');\nPAGE=0; ALL_POSTS=[]; carregarPosts();\n}catch(err){ showToast('Não foi possível excluir. · Could not delete.'); console.error('Excluir:', err); }\n}",
        "async function confirmarExclusao(id){\ncloseModal();\nif(!sb){ showToast('Não foi possível excluir agora. · Could not delete right now.'); return; }\ntry{\nif(isDev()){\nvar res = await sb.functions.invoke('forum-moderation', { body: { action:'delete', post_id: Number(id), adminEmail: getAdminEmail() } });\nif(res.error) throw new Error(res.error.message || res.error);\n} else {\nvar { error } = await sb.from('posts').delete().eq('id', id);\nif(error) throw error;\n}\nshowToast('Publicação excluída. · Post deleted.');\nPAGE=0; ALL_POSTS=[]; carregarPosts();\n}catch(err){ showToast('Não foi possível excluir. · Could not delete.'); console.error('Excluir:', err); }\n}"
    ]
];

let okCount = 0, failCount = 0;
const failures = [];

for (const lang of LANGS) {
    const file = path.join(ROOT, lang, "forum-enfermagem.html");
    if (!fs.existsSync(file)) { failures.push(lang + "/forum-enfermagem.html (não existe)"); failCount++; continue; }
    let content = fs.readFileSync(file, "utf8");
    content = content.replace(/\r\n/g, "\n");
    let applied = 0;
    for (const [oldStr, newStr] of REPLACEMENTS) {
        if (content.includes(oldStr)) {
            content = content.split(oldStr).join(newStr);
            applied++;
        } else {
            failures.push(lang + "/forum-enfermagem.html: padrão não encontrado -> " + oldStr.slice(0, 50).replace(/\n/g, "\\n"));
        }
    }
    if (applied === REPLACEMENTS.length) {
        fs.writeFileSync(file, content.replace(/\n/g, "\r\n"), "utf8");
        okCount++;
        console.log("✓ " + lang + "/forum-enfermagem.html");
    } else {
        failCount++;
        console.log("✗ " + lang + "/forum-enfermagem.html (" + applied + "/" + REPLACEMENTS.length + ")");
    }
}

console.log("\nRESULTADO: " + okCount + " OK, " + failCount + " falhas.");
if (failures.length) {
    console.log("DETALHES:");
    failures.forEach((f) => console.log("  - " + f));
}
process.exit(failCount > 0 ? 1 : 0);
