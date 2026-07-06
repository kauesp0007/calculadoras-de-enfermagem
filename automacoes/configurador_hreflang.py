import os
import re

# Configurações de caminhos e alvos
IDIOMAS_PERMITIDOS = [
    'en', 'es', 'de', 'it', 'fr', 'hi', 'zh', 'ar', 'ja', 
    'ru', 'ko', 'tr', 'nl', 'pl', 'sv', 'id', 'vi', 'uk'
]

PASTAS_IGNORADAS = {'downloads', 'biblioteca', 'blog', 'blog-templates', 'locales', 'fonts'}

ARQUIVOS_IGNORADOS = {
    "footer.html", "menu-global.html", "global-body-elements.html", 
    "downloads.html", "menu-lateral.html", "_language_selector.html", 
    "googlefc0a17cdd552164b.html"
}

def obter_arquivos_html_alvo(diretorio_base="."):
    arquivos_validos = []
    
    # 1. Varre apenas os arquivos HTML diretamente na raiz
    for item in os.listdir(diretorio_base):
        caminho = os.path.join(diretorio_base, item)
        if os.path.isfile(caminho) and item.endswith('.html'):
            if item not in ARQUIVOS_IGNORADOS:
                arquivos_validos.append(caminho)
                
    # 2. Varre as pastas específicas dos 18 idiomas
    for idioma in IDIOMAS_PERMITIDOS:
        caminho_idioma = os.path.join(diretorio_base, idioma)
        if os.path.exists(caminho_idioma) and os.path.isdir(caminho_idioma):
            for raiz, pastas, arquivos in os.walk(caminho_idioma):
                # Modifica a lista de pastas 'in-place' para impedir o script de entrar em subpastas proibidas
                pastas[:] = [p for p in pastas if p not in PASTAS_IGNORADAS]
                
                for arquivo in arquivos:
                    if arquivo.endswith('.html') and arquivo not in ARQUIVOS_IGNORADOS:
                        arquivos_validos.append(os.path.join(raiz, arquivo))
                        
    return arquivos_validos

# Teste inicial de mapeamento
if __name__ == "__main__":
    # Executa apenas o mapeamento para conferência
    lista_html = obter_arquivos_html_alvo()
    print(f"Mapeamento concluído. {len(lista_html)} arquivos HTML aptos para análise.")