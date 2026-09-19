#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Substitui o padrão sb.functions.invoke('forum-moderation', ...) pelo
padrão fetch com token Firebase nos 18 idiomas do fórum (correção do
fluxo do admin)."""

import os

RAIZ = os.path.dirname(os.path.abspath(__file__))
IDIOMAS = ["en", "es", "fr", "it", "de", "hi", "zh", "ja", "ar", "ru", "ko", "tr", "nl", "pl", "sv", "id", "vi", "uk"]

OLD_UPDATE = "var res = await sb.functions.invoke('forum-moderation', { body: { action:'update', post_id: Number(id), content: txt, adminEmail: getAdminEmail() } });\nif(res.error) throw new Error(res.error.message || res.error);"

NEW_UPDATE = "var adminUser = (window.Auth && window.Auth.currentUser) ? window.Auth.currentUser() : null;\nif(!adminUser || !adminUser.getIdToken) throw new Error('admin_not_logged_in');\nvar adminToken = await adminUser.getIdToken();\nvar adminResponse = await fetch(SUPABASE_URL + '/functions/v1/forum-moderation', { method:'POST', headers:{ 'Authorization':'Bearer ' + adminToken, 'Content-Type':'application/json' }, body:JSON.stringify({ action:'update', post_id: Number(id), content: txt }) });\nvar adminData = await adminResponse.json().catch(function(){ return {}; });\nif(!adminResponse.ok) throw new Error(adminData.error || 'moderation_update_failed');"

OLD_DELETE = "var res = await sb.functions.invoke('forum-moderation', { body: { action:'delete', post_id: Number(id), adminEmail: getAdminEmail() } });\nif(res.error) throw new Error(res.error.message || res.error);"

NEW_DELETE = "var adminUser = (window.Auth && window.Auth.currentUser) ? window.Auth.currentUser() : null;\nif(!adminUser || !adminUser.getIdToken) throw new Error('admin_not_logged_in');\nvar adminToken = await adminUser.getIdToken();\nvar adminResponse = await fetch(SUPABASE_URL + '/functions/v1/forum-moderation', { method:'POST', headers:{ 'Authorization':'Bearer ' + adminToken, 'Content-Type':'application/json' }, body:JSON.stringify({ action:'delete', post_id: Number(id) }) });\nvar adminData = await adminResponse.json().catch(function(){ return {}; });\nif(!adminResponse.ok) throw new Error(adminData.error || 'moderation_delete_failed');"

modificados = []
nao_encontrados = []
for lang in IDIOMAS:
    caminho = os.path.join(RAIZ, lang, "forum-enfermagem.html")
    if not os.path.exists(caminho):
        print(f"[SKIP] {lang}/forum-enfermagem.html (não existe)")
        continue
    with open(caminho, "r", encoding="utf-8") as f:
        content = f.read()
    original = content
    content = content.replace(OLD_UPDATE, NEW_UPDATE)
    content = content.replace(OLD_DELETE, NEW_DELETE)
    if content != original:
        with open(caminho, "w", encoding="utf-8") as f:
            f.write(content)
        modificados.append(lang)
    else:
        nao_encontrados.append(lang)

print(f"Modificados: {len(modificados)}")
for m in modificados:
    print(f"  [OK] {m}")
if nao_encontrados:
    print(f"Sem alteração (padrão não encontrado): {len(nao_encontrados)}")
    for m in nao_encontrados:
        print(f"  [??] {m}")
