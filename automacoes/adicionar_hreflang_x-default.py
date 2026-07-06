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
    
    for item in os.listdir(diretorio_base):
        caminho = os.path.join(diretorio_base, item)
        if os.path.isfile(caminho) and item.endswith('.html'):
            if item not in ARQUIVOS_IGNORADOS:
                arquivos_validos.append(caminho)
                
    for idioma in IDIOMAS_PERMITIDOS:
        caminho_idioma = os.path.join(diretorio_base, idioma)
        if os.path.exists(caminho_idioma) and os.path.isdir(caminho_idioma):
            for raiz, pastas, arquivos in os.walk(caminho_idioma):
                pastas[:] = [p for p in pastas if p not in PASTAS_IGNORADAS]
                for arquivo in arquivos:
                    if arquivo.endswith('.html') and arquivo not in ARQUIVOS_IGNORADOS:
                        arquivos_validos.append(os.path.join(raiz, arquivo))
                        
    return arquivos_validos

def processar_html(caminho):
    try:
        with open(caminho, 'r', encoding='utf-8') as f:
            conteudo = f.read()

        # Verifica se o x-default já existe para não duplicar
        if 'hreflang="x-default"' in conteudo or "hreflang='x-default'" in conteudo:
            return "ignorado"

        # Localiza todas as tags hreflang
        padrao_hreflang = re.compile(r'<link[^>]+hreflang=["\']([a-zA-Z\-]+)["\'][^>]*>', re.IGNORECASE)
        matches = list(padrao_hreflang.finditer(conteudo))

        if not matches:
            return "sem_hreflang" # Pula arquivos que não possuem hreflang estruturado

        ultima_tag = matches[-1]
        fim_ultima_tag = ultima_tag.end()

        # Extrai a URL exata do idioma raiz (pt ou pt-br) para garantir a precisão do x-default
        url_raiz = None
        for match in matches:
            idioma = match.group(1).lower()
            if idioma in ['pt', 'pt-br']:
                tag_completa = match.group(0)
                href_match = re.search(r'href=["\']([^"\']+)["\']', tag_completa, re.IGNORECASE)
                if href_match:
                    url_raiz = href_match.group(1)
                    break
        
        if not url_raiz:
            return "sem_url_raiz" # Pula se não encontrar a URL brasileira de referência

        # Constrói a nova tag com a quebra de linha
        nova_tag = f'\n<link href="{url_raiz}" hreflang="x-default" rel="alternate"/>'
        
        # Injeta a tag
        novo_conteudo = conteudo[:fim_ultima_tag] + nova_tag + conteudo[fim_ultima_tag:]

        # Salva o arquivo modificado
        with open(caminho, 'w', encoding='utf-8') as f:
            f.write(novo_conteudo)
            
        return "modificado"

    except Exception as e:
        return "erro"

def iniciar_automacao():
    print("Iniciando varredura e processamento...")
    arquivos = obter_arquivos_html_alvo()
    
    status_contagem = {
        "modificado": 0,
        "ignorado": 0,       # Já tinham a tag x-default
        "sem_hreflang": 0,   # Arquivos vazios ou sem a estrutura de idiomas
        "sem_url_raiz": 0,   # Falta a tag pt-br para base de url
        "erro": 0
    }
    
    for caminho in arquivos:
        resultado = processar_html(caminho)
        status_contagem[resultado] += 1
        
    print("\n" + "="*40)
    print("LOG DE ATUALIZAÇÃO HREFLANG X-DEFAULT")
    print("="*40)
    print(f"Total de arquivos lidos: {len(arquivos)}")
    print(f"Arquivos modificados (Tag adicionada): {status_contagem['modificado']}")
    print(f"Arquivos ignorados (Já possuíam a tag): {status_contagem['ignorado']}")
    print(f"Arquivos ignorados (Sem tags hreflang): {status_contagem['sem_hreflang']}")
    print(f"Arquivos ignorados (Sem tag pt-br/raiz): {status_contagem['sem_url_raiz']}")
    if status_contagem['erro'] > 0:
        print(f"Erros de leitura/gravação: {status_contagem['erro']}")
    print("="*40)

if __name__ == "__main__":
    iniciar_automacao()