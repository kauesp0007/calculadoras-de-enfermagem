import os
import glob
import re  # Adicionado para fazer o recorte cirúrgico
from bs4 import BeautifulSoup, Comment, NavigableString
import concurrent.futures

BASE_DIR = os.getcwd()

# Regras de pastas e ficheiros a analisar e a excluir
PASTAS_IDIOMAS = ['en', 'es', 'de', 'it', 'fr', 'hi', 'zh', 'ar', 'ja', 'ru', 'ko', 'tr', 'nl', 'pl', 'sv', 'id', 'vi', 'uk']
PASTAS_EXCLUIDAS = ['downloads', 'biblioteca', 'blog', 'blog-templates', 'locales', 'fonts', 'node_modules', '.git']
FICHEIROS_EXCLUIDOS = [
    'footer.html', 'menu-global.html', 'global-body-elements.html', 
    'downloads.html', 'menu-lateral.html', '_language_selector.html', 
    'googlefc0a17cdd552164b.html'
]

def obter_ficheiros_html_validos():
    """Recolhe todos os ficheiros HTML válidos respeitando as regras de exclusão."""
    ficheiros_validos = []
    padrao = os.path.join(BASE_DIR, '**', '*.html')
    todos_html = glob.glob(padrao, recursive=True)
    
    for filepath in todos_html:
        nome_ficheiro = os.path.basename(filepath)
        partes_caminho = filepath.replace('\\', '/').split('/')
        
        if nome_ficheiro in FICHEIROS_EXCLUIDOS:
            continue
        if any(pasta in partes_caminho for pasta in PASTAS_EXCLUIDAS):
            continue
            
        ficheiros_validos.append(filepath)
        
    return ficheiros_validos

def get_category(tag):
    """Classifica a tag HTML num dos 16 baldes hierárquicos estabelecidos."""
    if tag.name == 'meta':
        if tag.get('charset') is not None: return 1
        
        name = tag.get('name', '').lower()
        prop = tag.get('property', '').lower()
        
        if name == 'viewport': return 2
        if name == 'theme-color': return 3
        # SEO Básico
        if name in ['description', 'robots', 'keywords', 'author', 'google-adsense-account']: return 4
        # Open Graph e Twitter
        if prop.startswith('og:'): return 7
        if name.startswith('twitter:'): return 8
        
        return 16
        
    elif tag.name == 'title':
        return 4
        
    elif tag.name == 'link':
        rel_attr = tag.get('rel', [])
        rels = [rel_attr.lower()] if isinstance(rel_attr, str) else [r.lower() for r in rel_attr]
            
        if 'canonical' in rels: return 4
        if 'alternate' in rels and tag.get('hreflang'): return 5
        if 'icon' in rels or 'apple-touch-icon' in rels or 'manifest' in rels or 'shortcut icon' in rels: return 6
        if 'dns-prefetch' in rels: return 9
        if 'preconnect' in rels: return 10
        if 'preload' in rels: return 11
        if 'stylesheet' in rels: return 13
        
        return 16
        
    elif tag.name == 'style':
        if tag.get('id') == 'critical-fonts': return 12
        return 13
        
    elif tag.name == 'noscript':
        return 13 # Normalmente contém os links de CSS assíncrono
        
    elif tag.name == 'script':
        tag_type = tag.get('type', '').lower()
        if tag_type == 'application/ld+json': 
            return 14 # 14. Schema.org (sem duplicar no 16)
        return 15 # 15. Scripts defer, asíncronos, etc
        
    return 16 # 16. Qualquer outra coisa não mapeada

def organizar_head(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            html_raw = f.read()
            
        # ISOLAMENTO DE SEGURANÇA EXTREMA: 
        # Encontra EXATAMENTE onde a <head> começa e termina usando Regex
        match = re.search(r'(<head[^>]*>)(.*?)(</head>)', html_raw, flags=re.IGNORECASE | re.DOTALL)
        
        if not match:
            return False # Ignora se não houver tag <head>
            
        head_inteira_original = match.group(0)
            
        # O BeautifulSoup só vai conhecer e processar o bloco da HEAD, ignorando o resto do documento
        soup_head_only = BeautifulSoup(head_inteira_original, 'html.parser')
        head = soup_head_only.head
        
        # Dicionário com os 16 baldes hierárquicos
        buckets = {i: [] for i in range(1, 17)}
        buffer_espaços = []
        
        # Desmonta a <head> iterando elemento por elemento
        for el in head.contents:
            if isinstance(el, (Comment, NavigableString)):
                buffer_espaços.append(el)
            else:
                cat = get_category(el)
                buckets[cat].extend(buffer_espaços) 
                buckets[cat].append(el)
                buffer_espaços = []
                
        # Se sobraram espaços no final da head
        if buffer_espaços:
            buckets[16].extend(buffer_espaços)

        # Reconstrói a head deslocando os baldes na ordem de 1 a 16
        head.clear()
        for i in range(1, 17):
            for el in buckets[i]:
                head.append(el)
                
        nova_head_str = str(head)
        
        # SUBSTITUIÇÃO CIRÚRGICA: 
        # Mantém todo o documento original intocado, trocando APENAS a string da head
        new_html = html_raw[:match.start()] + nova_head_str + html_raw[match.end():]
        
        # Só escreve se realmente houve mudança de ordem
        if new_html != html_raw:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_html)
            return True
            
        return False
        
    except Exception as e:
        print(f"Erro ao processar {filepath}: {e}")
        return False

def main():
    print("⚙️ A iniciar Organizador Hierárquico de <head> (Isolamento Cirúrgico Ativo)...")
    ficheiros = obter_ficheiros_html_validos()
    print(f"📚 Encontrados {len(ficheiros)} ficheiros para análise e ordenação.")
    
    alterados = 0
    ignorados = 0

    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
        resultados = list(executor.map(organizar_head, ficheiros))
        
    for modificado in resultados:
        if modificado:
            alterados += 1
        else:
            ignorados += 1

    print("\n" + "="*50)
    print("🎯 RELATÓRIO DE ORGANIZAÇÃO: HIERARQUIA DA HEAD")
    print("="*50)
    print(f"Ficheiros organizados (Head reordenada sem afetar o Body): {alterados}")
    print(f"Ficheiros ignorados ou já na ordem perfeita: {ignorados}")
    print("="*50)

if __name__ == "__main__":
    main()