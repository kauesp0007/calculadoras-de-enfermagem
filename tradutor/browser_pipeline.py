"""
BROWSER_PIPELINE.PY - Pipeline completo via navegador
======================================================
1. Abre a pagina no Chromium headless
2. Extrai TODOS os textos visiveis do DOM
3. Traduz via APIs (DeepSeek/OpenAI com cache permanente)
4. Reinsere traducoes APENAS nos nós de texto (scripts intactos)
5. Aplica regras de localizacao (lang, canonical, hreflang, etc.)
"""

import os
import sys
import json
import time
import asyncio
from dotenv import load_dotenv

PASTA_TRADUTOR = os.path.dirname(os.path.abspath(__file__))
RAIZ_PROJETO = os.path.dirname(PASTA_TRADUTOR)

load_dotenv(os.path.join(RAIZ_PROJETO, ".env"))

sys.path.insert(0, PASTA_TRADUTOR)
from browser_extract import extrair_textos_visiveis
from browser_merge import reinserir_traducoes
from localize import localizar_html
from translate import carregar_cache_permanente, salvar_cache_permanente, verificar_cache, atualizar_cache
from translate import _chamar_api, NOME_IDIOMAS, TERMOS_PRESERVADOS


async def pipeline_browser(arquivo, idioma):
    """Pipeline completo via navegador para UM arquivo."""
    inicio = time.time()
    nome_idioma = NOME_IDIOMAS.get(idioma, idioma)
    
    print(f"\n{'='*60}")
    print(f"🌐 BROWSER PIPELINE: {arquivo} → {idioma}")
    print(f"{'='*60}")
    
    # 1. Extrair textos via navegador
    entrada = os.path.join(RAIZ_PROJETO, arquivo)
    print(f"  [1/4] Extraindo textos do DOM...")
    dados = await extrair_textos_visiveis(entrada, interagir=True)
    
    textos_unicos = []
    seen = set()
    for t in dados["textos"]:
        if t["texto"] not in seen:
            seen.add(t["texto"])
            textos_unicos.append(t["texto"])
    
    print(f"  📋 {len(textos_unicos)} textos únicos extraídos")
    
    # 2. Traduzir (com cache permanente)
    print(f"  [2/4] Traduzindo via APIs...")
    cache = carregar_cache_permanente()
    
    pendentes = []
    ja_traduzidos = {}
    for texto in textos_unicos:
        trad = verificar_cache(texto, idioma, cache)
        if trad:
            ja_traduzidos[texto] = trad
        else:
            pendentes.append(texto)
    
    print(f"  📋 {len(ja_traduzidos)} já no cache, {len(pendentes)} pendentes")
    
    if pendentes:
        # Processa TODOS os pendentes em lotes de 50
        TAMANHO_LOTE = 50
        total_lotes = (len(pendentes) + TAMANHO_LOTE - 1) // TAMANHO_LOTE
        
        for lote_idx in range(0, len(pendentes), TAMANHO_LOTE):
            lote = pendentes[lote_idx:lote_idx + TAMANHO_LOTE]
            dict_lote = {f"{i:04d}": t for i, t in enumerate(lote)}
            num_lote = lote_idx // TAMANHO_LOTE + 1
            
            print(f"  🚀 Lote {num_lote}/{total_lotes}: {len(dict_lote)} textos → DeepSeek...")
            traduzido = _chamar_api(dict_lote, idioma, "DeepSeek", nome_idioma)
            
            if not traduzido:
                print(f"  ⚠️ DeepSeek falhou, tentando OpenAI...")
                traduzido = _chamar_api(dict_lote, idioma, "OpenAI", nome_idioma)
            
            if traduzido:
                novos = 0
                for i, texto in enumerate(lote):
                    if i in traduzido and traduzido[i] != texto:
                        ja_traduzidos[texto] = traduzido[i]
                        atualizar_cache(texto, idioma, traduzido[i], cache)
                        novos += 1
                salvar_cache_permanente(cache)
                print(f"  💾 Lote {num_lote}: {novos} novas traduções")
            else:
                print(f"  ⚠️ Lote {num_lote} falhou completamente")
            
            # Pausa entre lotes
            if lote_idx + TAMANHO_LOTE < len(pendentes):
                time.sleep(3)
    
    # 3. Reinserir via DOM
    print(f"  [3/4] Reinserindo textos no DOM...")
    await reinserir_traducoes(arquivo, idioma, ja_traduzidos)
    
    # 4. Localizar
    print(f"  [4/4] Aplicando regras de localização...")
    saida = os.path.join(RAIZ_PROJETO, idioma, arquivo)
    if os.path.exists(saida):
        with open(saida, "r", encoding="utf-8") as f:
            html = f.read()
        html = localizar_html(html, idioma)
        with open(saida, "w", encoding="utf-8") as f:
            f.write(html)
        print(f"  ✅ Localização aplicada")
    
    tempo = time.time() - inicio
    print(f"\n✅ Pipeline concluído em {tempo:.1f}s → {idioma}/{arquivo}")


async def pipeline_todos_idiomas(arquivo, idiomas=None):
    """Traduz um arquivo para todos os idiomas via navegador."""
    if idiomas is None:
        idiomas = ["en","es","de","it","fr","hi","zh","ar","ja","ru",
                    "ko","tr","nl","pl","sv","id","vi","uk"]
    
    for i, idioma in enumerate(idiomas):
        print(f"\n[{i+1}/{len(idiomas)}]")
        await pipeline_browser(arquivo, idioma)
        if i < len(idiomas) - 1:
            print(f"  ⏳ Aguardando 3s...")
            await asyncio.sleep(3)


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("arquivo", help="Arquivo HTML a traduzir")
    parser.add_argument("idioma", nargs="?", help="Idioma alvo ou --todos")
    args = parser.parse_args()
    
    if args.idioma == "--todos":
        asyncio.run(pipeline_todos_idiomas(args.arquivo))
    elif args.idioma:
        asyncio.run(pipeline_browser(args.arquivo, args.idioma))
    else:
        print("Uso: python browser_pipeline.py waterlow.html en")
        print("     python browser_pipeline.py waterlow.html --todos")
