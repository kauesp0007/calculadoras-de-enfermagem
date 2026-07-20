import os
import re
import time
import json
import urllib.request

# ==============================================================================
# CONFIGURAÇÕES DO SCRIPT
# ==============================================================================

# Diretório base (como o script roda em /automacoes, a raiz é ../)
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))

# Lista restrita de idiomas para varredura (Blindagem contra pastas indesejadas)
IDIOMAS = [
    'en', 'es', 'fr', 'it', 'de', 'hi', 'zh', 'ja', 'ru', 
    'ko', 'tr', 'nl', 'pl', 'sv', 'id', 'vi', 'uk', 'ar'
]

# Monta a lista exata de pastas que serão scaneadas
PASTAS_PERMITIDAS = [BASE_DIR] + [os.path.join(BASE_DIR, lang) for lang in IDIOMAS]

# Lista de arquivos HTML modulares/sistema que JAMAIS devem ser alterados
ARQUIVOS_PROIBIDOS = [
    'menu-global.html',
    'footer.html',
    '_language_selector.html',
    'global-body-elements.html',
    'offline.html',
    'downloads.html',
    'googlefc0a17cdd552164b.html'
]

# Arquivo de cache onde o script salvará os SVGs que ele aprender sozinho
CACHE_FILE = os.path.join(os.path.dirname(__file__), 'svg_cache.json')

if os.path.exists(CACHE_FILE):
    try:
        with open(CACHE_FILE, 'r', encoding='utf-8') as f:
            MAPA_SVGS = json.load(f)
    except json.JSONDecodeError:
        MAPA_SVGS = {}
else:
    MAPA_SVGS = {}

# ==============================================================================
# FUNÇÕES DE REDE E SVG
# ==============================================================================

def baixar_svg_fontawesome(icon_class, style='solid'):
    icon_name = icon_class.replace('fa-', '', 1)
    # Utiliza CDN pública, imune a erros 403 Forbidden
    url = f"https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6/svgs/{style}/{icon_name}.svg"
    
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (CalculadorasEnfermagem)'})
        with urllib.request.urlopen(req) as response:
            svg_data = response.read().decode('utf-8')
            
            # Injeta atributos garantindo Core Web Vitals (Tamanho 1em e Cor Herdada)
            svg_data = re.sub(
                r'<svg([^>]*)>', 
                r'<svg\1 class="{classes}" fill="currentColor" aria-hidden="true" width="1em" height="1em">', 
                svg_data, 
                count=1
            )
            svg_data = re.sub(r'<!--.*?-->', '', svg_data, flags=re.DOTALL)
            return svg_data.strip()
    except Exception:
        return None

def substituir_lcp_svg(match):
    classes_completas = match.group(1)
    
    # Atua SOMENTE se a tag tiver um tamanho Tailwind especificado de 3xl a 9xl
    if not re.search(r'text-(?:[3-9]xl)', classes_completas):
        return match.group(0)

    style = "solid"
    if "fa-brands" in classes_completas or "fab " in classes_completas:
        style = "brands"
    elif "fa-regular" in classes_completas or "far " in classes_completas:
        style = "regular"
        
    ignore_list = ['fa-solid', 'fas', 'fa-regular', 'far', 'fa-brands', 'fab', 'fa-fw', 'fa-sm', 'fa-lg', 'fa-xs']
    icon_class = None
    for cls in classes_completas.split():
        if cls.startswith('fa-') and cls not in ignore_list:
            icon_class = cls
            break
            
    if not icon_class:
        return match.group(0)
        
    if icon_class not in MAPA_SVGS:
        print(f"  [+] Baixando SVG para o ícone '{icon_class}'...")
        svg_code = baixar_svg_fontawesome(icon_class, style)
        if svg_code:
            MAPA_SVGS[icon_class] = svg_code
            with open(CACHE_FILE, 'w', encoding='utf-8') as f:
                json.dump(MAPA_SVGS, f, ensure_ascii=False, indent=4)
        else:
            return match.group(0)
            
    classes_limpas = classes_completas.replace(icon_class, '')
    for ignore in ignore_list:
        classes_limpas = re.sub(rf'\b{ignore}\b', '', classes_limpas)
        
    classes_limpas = re.sub(r'\s+', ' ', classes_limpas).strip()
    return MAPA_SVGS[icon_class].format(classes=classes_limpas)

def corrigir_contraste(match):
    tag_content = match.group(0)
    if 'text-gray-500' in tag_content:
        return tag_content.replace('text-gray-500', 'text-gray-700')
    return tag_content

# ==============================================================================
# NÚCLEO DO AUTOMATIZADOR
# ==============================================================================

def processar_arquivos():
    arquivos_scaneados = 0
    arquivos_modificados = 0
    arquivos_ignorados = 0
    
    print("🚀 Iniciando Otimizador de HTML (LCP, CLS e Acessibilidade)...")
    print("-" * 60)
    inicio_tempo = time.time()
    
    for pasta in PASTAS_PERMITIDAS:
        if not os.path.exists(pasta):
            continue
            
        for arquivo in os.listdir(pasta):
            if arquivo.endswith(".html") and arquivo not in ARQUIVOS_PROIBIDOS:
                caminho_completo = os.path.join(pasta, arquivo)
                arquivos_scaneados += 1
                
                try:
                    with open(caminho_completo, 'r', encoding='utf-8') as f:
                        conteudo = f.read()
                        
                    conteudo_original = conteudo
                    
                    # 1. CORREÇÃO DE CLS: Realocar Placeholders para o <head>
                    padrao_estilo = r'(<style\s+id="anti-cls-placeholders">.*?</style>)'
                    matches_estilo = re.findall(padrao_estilo, conteudo, flags=re.IGNORECASE | re.DOTALL)
                    
                    if matches_estilo:
                        bloco_estilo = matches_estilo[0]
                        conteudo = re.sub(padrao_estilo, '', conteudo, flags=re.IGNORECASE | re.DOTALL)
                        conteudo = re.sub(r'</head>', f'{bloco_estilo}\n</head>', conteudo, count=1, flags=re.IGNORECASE)

                    # 2. CORREÇÃO DE ACESSIBILIDADE: Contraste
                    conteudo = re.sub(r'<[^>]+id="contador-resultados"[^>]*>', corrigir_contraste, conteudo, flags=re.IGNORECASE)
                    
                    # 3. CORREÇÃO DE LCP: Otimização de FontAwesome para SVG Inline
                    padrao_icone = r'<i\s+(?:[^>]*?\s+)?class="([^"]*?\bfa-[a-zA-Z0-9-]+\b[^"]*?)"[^>]*>\s*</i>'
                    conteudo = re.sub(padrao_icone, substituir_lcp_svg, conteudo, flags=re.IGNORECASE)
                    
                    # 4. SALVAMENTO CONDICIONAL
                    if conteudo != conteudo_original:
                        with open(caminho_completo, 'w', encoding='utf-8') as f:
                            f.write(conteudo)
                        arquivos_modificados += 1
                        print(f"🔧 Modificado: {os.path.relpath(caminho_completo, BASE_DIR)}")
                    else:
                        arquivos_ignorados += 1
                        
                except Exception as e:
                    print(f"❌ Erro ao processar {arquivo}: {e}")

    tempo_total = time.time() - inicio_tempo
    
    print("-" * 60)
    print("✅ Varredura Concluída!")
    print(f"📄 Arquivos Escaneados:   {arquivos_scaneados}")
    print(f"✨ Arquivos Modificados:  {arquivos_modificados}")
    print(f"👍 Já em conformidade:    {arquivos_ignorados}")
    print(f"⏱️  Tempo de execução:     {tempo_total:.2f} segundos")

if __name__ == "__main__":
    processar_arquivos()