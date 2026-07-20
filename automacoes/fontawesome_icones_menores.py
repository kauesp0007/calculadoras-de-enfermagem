import os
import re
import time
import json
import urllib.request

# ==============================================================================
# CONFIGURAÇÕES DO SCRIPT
# ==============================================================================

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))

IDIOMAS = [
    'en', 'es', 'fr', 'it', 'de', 'hi', 'zh', 'ja', 'ru', 
    'ko', 'tr', 'nl', 'pl', 'sv', 'id', 'vi', 'uk', 'ar'
]

PASTAS_PERMITIDAS = [BASE_DIR] + [os.path.join(BASE_DIR, lang) for lang in IDIOMAS]

ARQUIVOS_PROIBIDOS = [
    'menu-global.html',
    'footer.html',
    '_language_selector.html',
    'global-body-elements.html',
    'offline.html',
    'downloads.html',
    'googlefc0a17cdd552164b.html'
]

CACHE_FILE = os.path.join(os.path.dirname(__file__), 'svg_cache.json')

if os.path.exists(CACHE_FILE):
    try:
        with open(CACHE_FILE, 'r', encoding='utf-8') as f:
            MAPA_SVGS = json.load(f)
    except json.JSONDecodeError:
        MAPA_SVGS = {}
else:
    MAPA_SVGS = {}

# Dicionário de tradução FA5 -> FA6 para ícones que mudaram de nome no arquivo SVG
TRADUCAO_ICONES = {
    'hospital-alt': 'hospital',
    'users-cog': 'users-gear',
    'tint': 'droplet',
    'balance-scale': 'scale-balanced',
    'weight': 'weight-scale',
    'clock-o': 'clock',
    'calendar-alt': 'calendar-days',
    'file-alt': 'file-lines',
    'file-text': 'file-lines',
    'tachometer-alt': 'gauge',
    'cogs': 'gears',
    'cog': 'gear',
    'vcard': 'address-card',
    'glass': 'glass-water',
    'user-md': 'user-doctor',
    'heartbeat': 'heart-pulse',
    'medkit': 'suitcase-medical',
    'thermometer-half': 'temperature-half',
    'list-alt': 'rectangle-list',
    'plus-square': 'square-plus',
    'minus-square': 'square-minus',
    'info-circle': 'circle-info',
    'question-circle': 'circle-question',
    'exclamation-circle': 'circle-exclamation',
    'exclamation-triangle': 'triangle-exclamation',
    'check-circle': 'circle-check',
    'times-circle': 'circle-xmark',
    'times': 'xmark',
    'sliders-h': 'sliders',
    'sign-out-alt': 'right-from-bracket',
    'sign-in-alt': 'right-to-bracket',
    'edit': 'pen-to-square'
}

# ==============================================================================
# FUNÇÕES DE REDE E SVG
# ==============================================================================

def baixar_svg_fontawesome(icon_class, style='solid'):
    icon_name = icon_class.replace('fa-', '', 1)
    
    # Traduz o nome se for um ícone que mudou na versão 6
    if icon_name in TRADUCAO_ICONES:
        icon_name = TRADUCAO_ICONES[icon_name]

    url = f"https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6/svgs/{style}/{icon_name}.svg"
    
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (CalculadorasEnfermagem)'})
        with urllib.request.urlopen(req) as response:
            svg_data = response.read().decode('utf-8')
            
            svg_data = re.sub(
                r'<svg([^>]*)>', 
                r'<svg\1 {atributos_originais} fill="currentColor" width="1em" height="1em" aria-hidden="true">', 
                svg_data, 
                count=1
            )
            
            # Minificação
            svg_data = re.sub(r'<!--.*?-->', '', svg_data, flags=re.DOTALL)
            svg_data = re.sub(r'[\r\n\t]+', ' ', svg_data)
            svg_data = re.sub(r'>\s+<', '><', svg_data)
            svg_data = re.sub(r'\s+', ' ', svg_data)
            
            return svg_data.strip()
    except Exception as e:
        return None

def substituir_i_por_svg(match):
    atributos_completos = match.group(1)
    
    class_match = re.search(r'class="([^"]*)"', atributos_completos)
    if not class_match:
        return match.group(0)
        
    classes_str = class_match.group(1)
    
    style = "solid"
    if "fa-brands" in classes_str or "fab " in classes_str:
        style = "brands"
    elif "fa-regular" in classes_str or "far " in classes_str:
        style = "regular"
        
    ignore_list = ['fa-solid', 'fas', 'fa-regular', 'far', 'fa-brands', 'fab', 'fa-fw', 'fa-sm', 'fa-lg', 'fa-xs']
    icon_class = None
    
    for cls in classes_str.split():
        if cls.startswith('fa-') and cls not in ignore_list:
            icon_class = cls
            break
            
    if not icon_class:
        return match.group(0)
        
    if icon_class not in MAPA_SVGS:
        print(f"  [+] Baixando SVG para o ícone '{icon_class}' ({style})...")
        svg_code = baixar_svg_fontawesome(icon_class, style)
        if svg_code:
            MAPA_SVGS[icon_class] = svg_code
            with open(CACHE_FILE, 'w', encoding='utf-8') as f:
                json.dump(MAPA_SVGS, f, ensure_ascii=False, indent=4)
        else:
            print(f"  [!] Falha ao baixar o ícone: {icon_class}")
            return match.group(0)
            
    classes_limpas = classes_str.replace(icon_class, '')
    for ignore in ignore_list:
        classes_limpas = re.sub(rf'\b{ignore}\b', '', classes_limpas)
        
    classes_limpas = re.sub(r'\s+', ' ', classes_limpas).strip()
    
    if classes_limpas:
        atributos_finais = atributos_completos.replace(f'class="{classes_str}"', f'class="{classes_limpas}"')
    else:
        atributos_finais = atributos_completos.replace(f' class="{classes_str}"', '').replace(f'class="{classes_str}"', '')
        
    return MAPA_SVGS[icon_class].format(atributos_originais=atributos_finais.strip())

# ==============================================================================
# NÚCLEO DO AUTOMATIZADOR
# ==============================================================================

def processar_arquivos():
    arquivos_scaneados = 0
    arquivos_modificados = 0
    
    print("🚀 Iniciando conversão para buscar ícones pendentes/renomeados...")
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
                    
                    padrao_icone = r'<i\s+([^>]*\bfa-[a-zA-Z0-9-]+\b[^>]*)>\s*</i>'
                    conteudo = re.sub(padrao_icone, substituir_i_por_svg, conteudo, flags=re.IGNORECASE)
                    
                    if conteudo != conteudo_original:
                        with open(caminho_completo, 'w', encoding='utf-8') as f:
                            f.write(conteudo)
                        arquivos_modificados += 1
                        print(f"🔧 Modificado (Ícones Pendentes): {os.path.relpath(caminho_completo, BASE_DIR)}")
                        
                except Exception as e:
                    print(f"❌ Erro ao processar {arquivo}: {e}")

    tempo_total = time.time() - inicio_tempo
    
    print("-" * 60)
    print("✅ Varredura Concluída!")
    print(f"📄 Arquivos Escaneados:   {arquivos_scaneados}")
    print(f"✨ Arquivos Corrigidos:   {arquivos_modificados}")
    print(f"⏱️ Tempo de execução:     {tempo_total:.2f} segundos")

if __name__ == "__main__":
    processar_arquivos()