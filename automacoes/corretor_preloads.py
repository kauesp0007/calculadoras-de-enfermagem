import os
import glob
import re

BASE_DIR = os.getcwd()

# Regras de exclusão rigorosas baseadas nas restrições do projeto
PASTAS_EXCLUIDAS = ['downloads', 'biblioteca', 'blog', 'blog-templates', 'locales', 'fonts']
FICHEIROS_EXCLUIDOS = [
    'footer.html', 'menu-global.html', 'global-body-elements.html', 
    'downloads.html', 'menu-lateral.html', '_language_selector.html', 
    'googlefc0a17cdd552164b.html'
]

def deve_ignorar_ficheiro(filepath):
    """Verifica se o ficheiro está nas listas de exclusão de pastas ou nomes."""
    nome_ficheiro = os.path.basename(filepath)
    if nome_ficheiro in FICHEIROS_EXCLUIDOS:
        return True
        
    partes_caminho = filepath.replace('\\', '/').split('/')
    for pasta in PASTAS_EXCLUIDAS:
        if pasta in partes_caminho:
            return True
            
    return False

def otimizar_preloads(conteudo_html):
    """
    Remove preloads incorretos e gera novos preloads DINAMICAMENTE
    baseados estritamente nas fontes que a página exige no idioma atual.
    """
    # 1. Encontra o bloco de CSS de fontes críticas do arquivo
    match_style = re.search(r'<style id="critical-fonts">(.*?)</style>', conteudo_html, flags=re.DOTALL | re.IGNORECASE)
    
    if not match_style:
        return conteudo_html # Se a página não tem fontes declaradas, não faz nada
        
    style_content = match_style.group(1)
    
    # 2. Extrai todas as URLs de fontes (woff2, woff, ttf) declaradas DENTRO deste arquivo exato
    font_urls = re.findall(r"url\(['\"]?(.*?\.(?:woff2|woff|ttf))['\"]?\)", style_content, re.IGNORECASE)
    
    # Remove duplicatas mantendo a ordem original
    font_urls = list(dict.fromkeys(font_urls))
    
    if not font_urls:
        return conteudo_html
        
    # 3. Constrói o bloco de preloads DINÂMICO exato para aquele idioma
    preloads_html = "<!-- 7. Fontes Locais (Preloads Criticos Dinamicos) -->\n"
    for url in font_urls:
        # Não forçamos preload de FontAwesome para focar o LCP na fonte de texto
        if 'fa-' in url.lower() or 'fontawesome' in url.lower() or 'dyslexic' in url.lower():
            continue
        preloads_html += f'    <link rel="preload" href="{url}" as="font" type="font/woff2" crossorigin />\n'
        
    preloads_html += '    <style id="critical-fonts">'
    
    # 4. Remove todos os preloads de fontes antigos de qualquer tipo
    # Utilizando Regex com lookahead para ignorar a ordem dos atributos na tag <link>
    novo_html = re.sub(r'<link(?=[^>]*rel=["\']preload["\'])(?=[^>]*as=["\']font["\'])[^>]*>\s*', '', conteudo_html, flags=re.IGNORECASE)
    
    # 5. Injeta o novo bloco perfeitamente moldado para a página acima do <style>
    novo_html = novo_html.replace('<style id="critical-fonts">', preloads_html)
    
    return novo_html

def main():
    print("⚙️ A iniciar o corretor de Preloads de Fontes (Versão Inteligente e Multilíngue)...")
    padrao = os.path.join(BASE_DIR, '**', '*.html')
    arquivos = glob.glob(padrao, recursive=True)

    alterados = 0
    ignorados = 0

    for filepath in arquivos:
        if 'node_modules' in filepath or '.git' in filepath: 
            continue
            
        if deve_ignorar_ficheiro(filepath):
            ignorados += 1
            continue
            
        with open(filepath, 'r', encoding='utf-8') as f:
            conteudo_original = f.read()
            
        conteudo_limpo = otimizar_preloads(conteudo_original)
        
        if conteudo_original != conteudo_limpo:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(conteudo_limpo)
            alterados += 1
        else:
            ignorados += 1

    print("\n" + "="*50)
    print("🎯 RELATÓRIO DE CORREÇÃO: PRELOAD DINÂMICO")
    print("="*50)
    print(f"Ficheiros reparados/otimizados: {alterados}")
    print(f"Ficheiros ignorados ou já corretos: {ignorados}")
    print("="*50)

if __name__ == "__main__":
    main()