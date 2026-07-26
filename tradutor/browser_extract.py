"""
BROWSER_EXTRACT.PY - Extracao via navegador headless (Playwright)
=================================================================
Substitui extract.py + merge.py para arquivos com JS inline pesado.
Usa Playwright para renderizar a pagina, extrair textos visiveis,
traduzi-los e reinseri-los no DOM real, preservando scripts intactos.
"""

import os
import json
import asyncio
from playwright.async_api import async_playwright

PASTA_TRADUTOR = os.path.dirname(os.path.abspath(__file__))
RAIZ_PROJETO = os.path.dirname(PASTA_TRADUTOR)

IDIOMAS = ["en","es","de","it","fr","hi","zh","ar","ja","ru","ko","tr","nl","pl","sv","id","vi","uk"]


async def extrair_textos_visiveis(url_ou_arquivo, interagir=False):
    """
    Abre a pagina no Chromium headless e extrai TODOS os textos visiveis.
    
    Retorna: {
        "textos": [{"seletor": str, "texto": str, "tipo": str}, ...],
        "html_final": str (HTML apos interacoes)
    }
    """
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        
        if url_ou_arquivo.startswith("http"):
            await page.goto(url_ou_arquivo, wait_until="networkidle")
        else:
            caminho = "file:///" + os.path.abspath(url_ou_arquivo).replace("\\", "/")
            await page.goto(caminho, wait_until="networkidle")
        
        if interagir:
            # Clica em botoes de calcular, preenche forms, etc.
            try:
                botoes = await page.query_selector_all("button")
                for btn in botoes:
                    texto = await btn.inner_text()
                    if any(p in texto.lower() for p in ["calcular", "avaliar", "gerar"]):
                        await btn.click()
                        await page.wait_for_timeout(500)
            except:
                pass
        
        # Extrai todos os textos visiveis do DOM + atributos
        textos = await page.evaluate("""
            () => {
                const resultados = [];
                const seen = new Set();
                
                function addTexto(texto, tipo, info) {
                    texto = texto.trim();
                    if (!texto || texto.length < 2) return;
                    if (/^[\\d\\s.,;:!?\\-+=*/<>()[\\]{}|&@#$%^~`]+$/.test(texto)) return;
                    const key = texto + '|' + tipo;
                    if (seen.has(key)) return;
                    seen.add(key);
                    resultados.push({texto, tipo, ...info});
                }
                
                // 1. Nos de texto via TreeWalker
                const walker = document.createTreeWalker(
                    document.body, NodeFilter.SHOW_TEXT, null, false
                );
                let node;
                while (node = walker.nextNode()) {
                    const parent = node.parentElement;
                    if (!parent) continue;
                    const tag = parent.tagName;
                    if (['SCRIPT','STYLE','SVG','PATH'].includes(tag)) continue;
                    addTexto(node.textContent, tag.toLowerCase(), {});
                }
                
                // 2. Atributos: placeholder, aria-label, title, value, alt
                const attrs = ['placeholder', 'aria-label', 'title', 'alt'];
                for (const attr of attrs) {
                    document.querySelectorAll('[' + attr + ']').forEach(el => {
                        const val = el.getAttribute(attr);
                        if (val) addTexto(val, attr, {attr, selector: el.tagName + (el.id ? '#'+el.id : '')});
                    });
                }
                
                // 3. Options de select
                document.querySelectorAll('select option').forEach(opt => {
                    if (opt.textContent) addTexto(opt.textContent, 'option', {});
                });
                
                // 4. Labels
                document.querySelectorAll('label').forEach(lbl => {
                    if (lbl.textContent) addTexto(lbl.textContent, 'label', {});
                });
                
                // 5. Texto de botoes
                document.querySelectorAll('button, input[type=submit], input[type=button]').forEach(btn => {
                    if (btn.value) addTexto(btn.value, 'button_value', {});
                });
                
                // 6. data-tooltip, data-title
                document.querySelectorAll('[data-tooltip], [data-title], [data-label]').forEach(el => {
                    ['data-tooltip','data-title','data-label'].forEach(a => {
                        const v = el.getAttribute(a);
                        if (v) addTexto(v, a, {});
                    });
                });
                
                return resultados;
            }
        """)
        
        html_final = await page.content()
        await browser.close()
        
        return {"textos": textos, "html_final": html_final}


def salvar_cache_extracao(nome_arquivo, dados):
    """Salva os textos extraidos em cache."""
    cache_dir = os.path.join(PASTA_TRADUTOR, "cache")
    os.makedirs(cache_dir, exist_ok=True)
    caminho = os.path.join(cache_dir, f"{nome_arquivo}.browser.json")
    with open(caminho, "w", encoding="utf-8") as f:
        json.dump(dados, f, ensure_ascii=False, indent=2)
    return caminho


async def extrair_e_salvar(nome_arquivo, interagir=False):
    """Pipeline completo de extracao via browser."""
    caminho_arquivo = os.path.join(RAIZ_PROJETO, nome_arquivo)
    print(f"  🌐 Abrindo {nome_arquivo} no Chromium headless...")
    
    dados = await extrair_textos_visiveis(caminho_arquivo, interagir=interagir)
    
    textos_unicos = []
    seen = set()
    for t in dados["textos"]:
        if t["texto"] not in seen:
            seen.add(t["texto"])
            textos_unicos.append(t)
    
    print(f"  📋 {len(textos_unicos)} textos unicos extraidos do DOM")
    
    # Salva cache
    cache = {
        "arquivo": nome_arquivo,
        "total": len(textos_unicos),
        "textos": [{"id": i, "texto": t["texto"], "tipo": t["tipo"]}
                   for i, t in enumerate(textos_unicos)]
    }
    salvar_cache_extracao(nome_arquivo, cache)
    
    return cache


if __name__ == "__main__":
    asyncio.run(extrair_e_salvar("waterlow.html", interagir=True))
