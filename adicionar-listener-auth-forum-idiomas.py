#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Adiciona o listener de auth (onAuthChange/onProfileChange -> renderFeed)
nos 18 idiomas do fórum, para re-renderizar os botões Editar/Excluir quando
o login é carregado."""

import os

RAIZ = os.path.dirname(os.path.abspath(__file__))
IDIOMAS = ["en", "es", "fr", "it", "de", "hi", "zh", "ja", "ar", "ru", "ko", "tr", "nl", "pl", "sv", "id", "vi", "uk"]

OLD = "applyLang();\ncarregarLikes();\ncarregarPosts();\n})();"
NEW = "applyLang();\ncarregarLikes();\ncarregarPosts();\ntry{ if(window.Auth && window.Auth.onAuthChange){ window.Auth.onAuthChange(function(){ renderFeed(); }); } if(window.Auth && window.Auth.onProfileChange){ window.Auth.onProfileChange(function(){ renderFeed(); }); } }catch(e){}\n})();"

modificados = []
nao_encontrados = []
for lang in IDIOMAS:
    caminho = os.path.join(RAIZ, lang, "forum-enfermagem.html")
    if not os.path.exists(caminho):
        print(f"[SKIP] {lang} (não existe)")
        continue
    with open(caminho, "r", encoding="utf-8") as f:
        content = f.read()
    original = content
    content = content.replace(OLD, NEW)
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
    print(f"Sem alteração: {nao_encontrados}")
