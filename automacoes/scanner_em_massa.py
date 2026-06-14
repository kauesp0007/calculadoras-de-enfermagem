import os
from bs4 import BeautifulSoup

# Dicionário de mapeamento das pastas para as tags hreflang oficiais (pt-BR padronizado)
mapa_idiomas_tags = {
    ".": "pt-BR", "en": "en", "es": "es", "de": "de", "it": "it", 
    "fr": "fr", "hi": "hi", "zh": "zh", "ar": "ar", "ja": "ja", 
    "ru": "ru", "ko": "ko", "tr": "tr", "nl": "nl", "pl": "pl", 
    "sv": "sv", "id": "id", "vi": "vi", "uk": "uk"
}

pastas_ignoradas = ["downloads", "biblioteca", "blog", "fonts", "css", "js", "img", "docs", "videos", ".github", ".vscode", "automacoes"]

arquivos_ignoradas = [
    "footer.html", 
    "menu-global.html", 
    "global-body-elements.html", 
    "downloads.html", 
    "menu-lateral.html", 
    "_language_selector.html", 
    "googlefc0a17cdd552164b.html"
]

# Estrutura para armazenar o mapa global: { "nome_do_arquivo.html": ["pt-BR", "en", "es"] }
registro_global_paginas = {}

print("Fase 1: Iniciando o mapeamento de idiomas existentes por página...")

raiz_projeto = "."

for raiz, pastas, arquivos in os.walk(raiz_projeto):
    pastas[:] = [p for p in pastas if p not in pastas_ignoradas]
    
    # Identificar qual é a pasta/idioma atual da iteração
    if raiz == ".":
        idioma_atual = "."
    else:
        idioma_atual = os.path.basename(raiz)
        
    if idioma_atual not in mapa_idiomas_tags:
        continue
        
    tag_hreflang_atual = mapa_idiomas_tags[idioma_atual]
    
    for arquivo in arquivos:
        if arquivo.endswith(".html"):
            if arquivo in arquivos_ignoradas:
                continue
            
            # Se a página ainda não foi registrada no mapa global, inicializa a lista dela
            if arquivo not in registro_global_paginas:
                registro_global_paginas[arquivo] = []
                
            # Associa a tag de idioma onde este arquivo fisicamente existe
            registro_global_paginas[arquivo].append(tag_hreflang_atual)

# --- GERAÇÃO DO LOG DETALHADO EM ARQUIVO TEXTO ---
caminho_log = "relatorio_mapeamento.txt"
total_paginas_unicas = len(registro_global_paginas)

with open(caminho_log, "w", encoding="utf-8") as log:
    log.write("======================================================================\n")
    log.write("         RELATÓRIO DETALHADO DE DISPONIBILIDADE DE IDIOMAS           \n")
    log.write("======================================================================\n\n")
    log.write(f"Total de páginas de conteúdo exclusivas mapeadas: {total_paginas_unicas}\n\n")
    log.write("Distribuição detalhada por arquivo:\n")
    log.write("----------------------------------------------------------------------\n")
    
    for arq, idiomas in sorted(registro_global_paginas.items()):
        idiomas_formatados = ", ".join(idiomas)
        log.write(f"Arquivo: {arq:<35} | Disponível em ({len(idiomas)}): [{idiomas_formatados}]\n")

print("\nMapeamento concluído com absoluto sucesso!")
print(f"O relatório analítico detalhado foi salvo em: {os.path.abspath(caminho_log)}")
print(f"Total de páginas únicas catalogadas: {total_paginas_unicas}")