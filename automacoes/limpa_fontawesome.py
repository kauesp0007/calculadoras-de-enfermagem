import os
import re
import time

# ==============================================================================
# CONFIGURAÇÕES DO SCRIPT
# ==============================================================================
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))

# Escopo de Atuação: Raiz e 18 pastas de idiomas
IDIOMAS = [
    'en', 'es', 'fr', 'it', 'de', 'hi', 'zh', 'ja', 'ru', 
    'ko', 'tr', 'nl', 'pl', 'sv', 'id', 'vi', 'uk', 'ar'
]
PASTAS_PERMITIDAS = [BASE_DIR] + [os.path.join(BASE_DIR, lang) for lang in IDIOMAS]

# PROTEÇÃO ESTRITA: Arquivos que JAMAIS devem ser alterados
ARQUIVOS_PROIBIDOS = [
    'footer.html',
    'menu-global.html',
    'global-body-elements.html',
    'downloads.html',
    'menu-lateral.html',
    '_language_selector.html',
    'googlefc0a17cdd552164b.html'
]

# ==============================================================================
# FUNÇÕES DE LIMPEZA CIRÚRGICA
# ==============================================================================

def limpar_html(conteudo):
    conteudo_original = conteudo
    
    # 1. Remove APENAS os @font-face do FontAwesome (protege Arabic, Chinese, Inter, etc)
    padrao_fontface_fa = r'@font-face\s*\{\s*font-family:\s*[\'"]?Font Awesome 6[^}]*\}\s*'
    conteudo = re.sub(padrao_fontface_fa, '', conteudo, flags=re.IGNORECASE)

    # 2. Remove APENAS os <link rel="preload"> dos arquivos fa-solid e fa-brands
    padrao_preload_fa = r'<link[^>]*href=["\'][^"\']*fa-(solid|brands)[^"\']*["\'][^>]*>\s*'
    conteudo = re.sub(padrao_preload_fa, '', conteudo, flags=re.IGNORECASE)

    # 3. Remove eventuais links para o CSS antigo do FontAwesome (se houver)
    padrao_link_css_fa = r'<link[^>]*href=["\'][^"\']*fontawesome[^"\']*\.css["\'][^>]*>\s*'
    conteudo = re.sub(padrao_link_css_fa, '', conteudo, flags=re.IGNORECASE)
    
    # 4. Remove blocos <noscript> que ficaram vazios após remover os links
    conteudo = re.sub(r'<noscript>\s*</noscript>\s*', '', conteudo, flags=re.IGNORECASE)
    
    return conteudo

def limpar_css(caminho_css):
    try:
        with open(caminho_css, 'r', encoding='utf-8') as f:
            conteudo = f.read()
            
        conteudo_original = conteudo
        
        # Remove os blocos @font-face do FontAwesome no CSS global
        padrao_fontface_css = r'@font-face\s*\{\s*font-family:\s*[\'"]Font Awesome 6[^}]*\}\s*'
        conteudo = re.sub(padrao_fontface_css, '', conteudo, flags=re.IGNORECASE)
        
        # Remove comentários do Font Awesome
        padrao_comentario_fa = r'/\*\s*Font Awesome.*?\*/\s*'
        conteudo = re.sub(padrao_comentario_fa, '', conteudo, flags=re.IGNORECASE | re.DOTALL)

        # Remove múltiplas quebras de linha em excesso que podem ter ficado
        conteudo = re.sub(r'\n{3,}', '\n\n', conteudo)

        if conteudo != conteudo_original:
            with open(caminho_css, 'w', encoding='utf-8') as f:
                f.write(conteudo)
            print("🎨 Modificado: global-styles.css")
            return True
            
    except Exception as e:
        print(f"❌ Erro ao processar o CSS: {e}")
    return False

# ==============================================================================
# NÚCLEO DO AUTOMATIZADOR
# ==============================================================================

def executar_faxina():
    arquivos_scaneados = 0
    arquivos_modificados = 0
    
    print("🧹 Iniciando faxina final: Removendo declarações e preloads do FontAwesome...")
    print("-" * 60)
    inicio_tempo = time.time()
    
    # Primeiro: Limpa o CSS Global
    caminho_css = os.path.join(BASE_DIR, "global-styles.css")
    if os.path.exists(caminho_css):
        if limpar_css(caminho_css):
            arquivos_modificados += 1
            
    # Segundo: Varre os HTMLs
    for pasta in PASTAS_PERMITIDAS:
        if not os.path.exists(pasta):
            continue
            
        for arquivo in os.listdir(pasta):
            # AQUI ESTÁ A PROTEÇÃO APLICADA
            if arquivo.endswith(".html") and arquivo not in ARQUIVOS_PROIBIDOS:
                caminho_completo = os.path.join(pasta, arquivo)
                arquivos_scaneados += 1
                
                try:
                    with open(caminho_completo, 'r', encoding='utf-8') as f:
                        conteudo = f.read()
                        
                    novo_conteudo = limpar_html(conteudo)
                    
                    if novo_conteudo != conteudo:
                        with open(caminho_completo, 'w', encoding='utf-8') as f:
                            f.write(novo_conteudo)
                        arquivos_modificados += 1
                        print(f"🧹 Limpo: {os.path.relpath(caminho_completo, BASE_DIR)}")
                        
                except Exception as e:
                    print(f"❌ Erro ao processar {arquivo}: {e}")

    tempo_total = time.time() - inicio_tempo
    
    print("-" * 60)
    print("✅ Faxina Concluída!")
    print(f"📄 HTMLs Escaneados:  {arquivos_scaneados}")
    print(f"✨ Arquivos Limpos:   {arquivos_modificados}")
    print(f"⏱️ Tempo de execução: {tempo_total:.2f} segundos")

if __name__ == "__main__":
    executar_faxina()