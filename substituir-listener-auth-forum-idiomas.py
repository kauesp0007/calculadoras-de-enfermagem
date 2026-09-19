#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Substitui o listener de auth (que não funcionava) pelo mecanismo de
polling que aguarda o window.Auth ficar disponível, nos 18 idiomas."""

import os

RAIZ = os.path.dirname(os.path.abspath(__file__))
IDIOMAS = ["en", "es", "fr", "it", "de", "hi", "zh", "ja", "ar", "ru", "ko", "tr", "nl", "pl", "sv", "id", "vi", "uk"]

OLD = "try{ if(window.Auth && window.Auth.onAuthChange){ window.Auth.onAuthChange(function(){ renderFeed(); }); } if(window.Auth && window.Auth.onProfileChange){ window.Auth.onProfileChange(function(){ renderFeed(); }); } }catch(e){}"

NEW = "(function(){\nvar attempts = 0;\nfunction tryBind(){\nattempts++;\nif(window.Auth && window.Auth.onAuthChange){\ntry{ window.Auth.onAuthChange(function(){ renderFeed(); }); }catch(e){}\ntry{ window.Auth.onProfileChange(function(){ renderFeed(); }); }catch(e){}\nrenderFeed();\n} else if(attempts < 50){\nsetTimeout(tryBind, 200);\n}\n}\ntryBind();\n})();"

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
    print(f"Sem alteração (padrão não encontrado): {nao_encontrados}")
