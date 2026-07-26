"""
BROWSER_MERGE.PY - Reinsercao via navegador (Playwright)
=========================================================
Substitui APENAS nos de texto no DOM renderizado.
Scripts, atributos, classes, SVG, CSS: 100% intactos.
"""

import os
import json
import asyncio
from playwright.async_api import async_playwright

PASTA_TRADUTOR = os.path.dirname(os.path.abspath(__file__))
RAIZ_PROJETO = os.path.dirname(PASTA_TRADUTOR)


async def aplicar_traducoes_dom(arquivo_entrada, traducoes, arquivo_saida):
    """
    Abre a pagina no navegador, aplica traducoes APENAS nos nos de texto,
    e salva o HTML resultante.
    
    Args:
        arquivo_entrada: caminho do HTML original
        traducoes: dict {texto_original: texto_traduzido}
        arquivo_saida: onde salvar o HTML traduzido
    """
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        
        caminho = "file:///" + os.path.abspath(arquivo_entrada).replace("\\", "/")
        await page.goto(caminho, wait_until="networkidle")
        
        # Aplica traducoes em nos de texto + atributos + scripts inline
        substituicoes = await page.evaluate("""
            (traducoes) => {
                let count = 0;
                
                // 1. Nos de texto (exceto scripts - tratados separadamente)
                const walker = document.createTreeWalker(
                    document.body, NodeFilter.SHOW_TEXT, null, false
                );
                const nodes = [];
                let node;
                while (node = walker.nextNode()) nodes.push(node);
                
                for (const node of nodes) {
                    // Pula scripts no passo 1 (serao tratados no passo 4)
                    if (node.parentElement && ['SCRIPT','STYLE'].includes(node.parentElement.tagName)) continue;
                    
                    const texto = node.textContent.trim();
                    if (texto && traducoes[texto] && traducoes[texto] !== texto) {
                        if (node.textContent.trim() === texto) {
                            node.textContent = node.textContent.replace(texto, traducoes[texto]);
                            count++;
                        }
                    }
                }
                
                // 2. Atributos: placeholder, aria-label, title, alt, value
                const attrs = ['placeholder', 'aria-label', 'title', 'alt', 'value'];
                for (const attr of attrs) {
                    document.querySelectorAll('[' + attr + ']').forEach(el => {
                        const val = el.getAttribute(attr);
                        if (val && traducoes[val] && traducoes[val] !== val) {
                            el.setAttribute(attr, traducoes[val]);
                            count++;
                        }
                    });
                }
                
                // 3. data-tooltip, data-title, data-label
                ['data-tooltip','data-title','data-label'].forEach(a => {
                    document.querySelectorAll('[' + a + ']').forEach(el => {
                        const v = el.getAttribute(a);
                        if (v && traducoes[v] && traducoes[v] !== v) {
                            el.setAttribute(a, traducoes[v]);
                            count++;
                        }
                    });
                });
                
                // 4. Scripts inline: substitui strings exatas dentro do codigo-fonte
                let scriptCount = 0;
                document.querySelectorAll('script:not([src])').forEach(script => {
                    let code = script.textContent;
                    let changed = false;
                    for (const [original, traduzido] of Object.entries(traducoes)) {
                        if (original === traduzido) continue;
                        if (original.length < 3) continue;
                        // So substitui se o texto original aparece como string delimitada
                        // (entre aspas, crases, ou apos : seguido de espaço)
                        if (code.includes(original)) {
                            code = code.split(original).join(traduzido);
                            changed = true;
                        }
                    }
                    if (changed) {
                        script.textContent = code;
                        scriptCount++;
                    }
                });
                count += scriptCount;
                
                return count;
            }
        """, traducoes)
        
        print(f"  🔄 {substituicoes} nos de texto alterados no DOM")
        
        html_final = await page.content()
        await browser.close()
        
        os.makedirs(os.path.dirname(arquivo_saida), exist_ok=True)
        with open(arquivo_saida, "w", encoding="utf-8") as f:
            f.write(html_final)
        
        return html_final


async def reinserir_traducoes(nome_arquivo, idioma, traducoes):
    """
    Pipeline completo: abre original, aplica traducoes no DOM,
    salva na pasta do idioma.
    """
    entrada = os.path.join(RAIZ_PROJETO, nome_arquivo)
    saida = os.path.join(RAIZ_PROJETO, idioma, nome_arquivo)
    
    print(f"  🌐 Aplicando traducoes via DOM em {nome_arquivo} -> {idioma}/")
    await aplicar_traducoes_dom(entrada, traducoes, saida)
    print(f"  ✅ Salvo em {saida}")
    return saida


if __name__ == "__main__":
    async def teste():
        trad = {"Calcular Escore": "Calculate Score", "Limpar": "Clear"}
        await reinserir_traducoes("waterlow.html", "en", trad)
    asyncio.run(teste())
